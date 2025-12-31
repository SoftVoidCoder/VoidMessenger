from fastapi import WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app import models
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"User {user_id} connected. Active connections: {len(self.active_connections)}")
    
    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            print(f"User {user_id} disconnected. Active connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except Exception as e:
                print(f"Error sending message to user {user_id}: {e}")
    
    async def broadcast(self, message: dict):
        for user_id, connection in self.active_connections.items():
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error broadcasting to user {user_id}: {e}")

manager = ConnectionManager()

async def websocket_endpoint(websocket: WebSocket, user_id: int, db: Session):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Проверяем обязательные поля
            if "receiver_id" not in message_data or "content" not in message_data:
                await websocket.send_json({"error": "Missing required fields"})
                continue
            
            # Проверяем, существует ли получатель
            receiver = db.query(models.User).filter(
                models.User.id == message_data["receiver_id"]
            ).first()
            if not receiver:
                await websocket.send_json({"error": "Receiver not found"})
                continue
            
            # Сохраняем сообщение в БД
            db_message = models.Message(
                sender_id=user_id,
                receiver_id=message_data["receiver_id"],
                content=message_data["content"]
            )
            db.add(db_message)
            db.commit()
            db.refresh(db_message)
            
            # Подготавливаем ответ
            response_message = {
                "type": "message",
                "id": db_message.id,
                "content": message_data["content"],
                "sender_id": user_id,
                "receiver_id": message_data["receiver_id"],
                "timestamp": db_message.timestamp.isoformat(),
                "is_read": False
            }
            
            # Отправляем отправителю подтверждение
            await manager.send_personal_message({
                **response_message,
                "status": "sent"
            }, user_id)
            
            # Отправляем получателю
            await manager.send_personal_message({
                **response_message,
                "status": "received"
            }, message_data["receiver_id"])
            
    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        print(f"WebSocket error for user {user_id}: {e}")
        manager.disconnect(user_id)