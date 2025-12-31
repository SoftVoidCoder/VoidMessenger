import json
from typing import Dict, Set
from fastapi import WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from . import crud, dependencies, database

class ConnectionManager:
    def __init__(self):
        # user_id -> WebSocket
        self.active_connections: Dict[int, WebSocket] = {}
        # user_id -> set of connected clients (for multiple tabs)
        self.user_connections: Dict[int, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        
        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        
        self.user_connections[user_id].add(websocket)
        self.active_connections[user_id] = websocket
        
        print(f"User {user_id} connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.user_connections:
            self.user_connections[user_id].discard(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
                if user_id in self.active_connections:
                    del self.active_connections[user_id]
        
        print(f"User {user_id} disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.user_connections:
            for connection in self.user_connections[user_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass
    
    async def broadcast(self, message: dict):
        for user_id in self.user_connections:
            await self.send_personal_message(message, user_id)

manager = ConnectionManager()

async def websocket_endpoint(
    websocket: WebSocket,
    token: str,
    db: Session = Depends(database.get_db)
):
    # Декодируем токен и получаем пользователя
    from . import auth
    user_id = auth.decode_access_token(token)
    if not user_id:
        await websocket.close(code=1008)
        return
    
    user = crud.get_user_by_id(db, user_id)
    if not user:
        await websocket.close(code=1008)
        return
    
    await manager.connect(websocket, user_id)
    
    try:
        while True:
            # Получаем сообщение от клиента
            data = await websocket.receive_json()
            
            if data["type"] == "message":
                # Создаем сообщение в БД
                message = crud.create_message(
                    db,
                    schemas.MessageCreate(
                        content=data["content"],
                        receiver_id=data["receiver_id"]
                    ),
                    sender_id=user_id
                )
                
                # Получаем данные отправителя и получателя
                sender = crud.get_user_by_id(db, user_id)
                receiver = crud.get_user_by_id(db, data["receiver_id"])
                
                # Формируем ответ
                response = {
                    "type": "new_message",
                    "message": {
                        "id": message.id,
                        "sender_id": user_id,
                        "receiver_id": data["receiver_id"],
                        "content": data["content"],
                        "is_read": False,
                        "created_at": message.created_at.isoformat(),
                        "sender_username": sender.username,
                        "receiver_username": receiver.username if receiver else ""
                    }
                }
                
                # Отправляем отправителю (для синхронизации)
                await manager.send_personal_message(response, user_id)
                
                # Отправляем получателю
                await manager.send_personal_message(response, data["receiver_id"])
            
            elif data["type"] == "read_messages":
                # Отмечаем сообщения как прочитанные
                count = crud.mark_messages_as_read(db, data["sender_id"], user_id)
                
                response = {
                    "type": "messages_read",
                    "sender_id": data["sender_id"],
                    "receiver_id": user_id,
                    "count": count
                }
                
                # Уведомляем отправителя, что его сообщения прочитаны
                await manager.send_personal_message(response, data["sender_id"])
            
            elif data["type"] == "typing":
                # Уведомление о печатании
                response = {
                    "type": "user_typing",
                    "sender_id": user_id,
                    "receiver_id": data["receiver_id"],
                    "is_typing": data["is_typing"]
                }
                
                await manager.send_personal_message(response, data["receiver_id"])
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, user_id)