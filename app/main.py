from fastapi import FastAPI, Request, Depends, HTTPException, status, Form, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
import json
import asyncio
from typing import Dict

from . import models, schemas, crud, auth, dependencies
from .database import engine, get_db
import os
from dotenv import load_dotenv

load_dotenv()

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Telegram-like Messenger")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

static_dir = os.path.join(PROJECT_ROOT, "app", "static")
templates_dir = os.path.join(PROJECT_ROOT, "templates")

app.mount("/static", StaticFiles(directory=static_dir), name="static")
templates = Jinja2Templates(directory=templates_dir)

# Хранилище WebSocket соединений
active_connections: Dict[int, WebSocket] = {}

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"✅ User {user_id} connected")
    
    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            print(f"❌ User {user_id} disconnected")
    
    async def send_personal_message(self, message: str, user_id: int):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_text(message)
            except:
                self.disconnect(user_id)
    
    async def broadcast(self, message: str):
        for connection in self.active_connections.values():
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(websocket, user_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data["type"] == "message":
                # Сохраняем сообщение в БД
                db = next(get_db())
                message = schemas.MessageCreate(
                    content=message_data["content"],
                    receiver_id=message_data["receiver_id"]
                )
                db_message = crud.create_message(db, message, user_id)
                
                # Отправляем отправителю подтверждение
                await websocket.send_text(json.dumps({
                    "type": "message_sent",
                    "message_id": db_message.id
                }))
                
                # Отправляем получателю
                await manager.send_personal_message(json.dumps({
                    "type": "new_message",
                    "sender_id": user_id,
                    "content": message_data["content"],
                    "message_id": db_message.id,
                    "timestamp": db_message.created_at.isoformat()
                }), message_data["receiver_id"])
                
                print(f"📨 Message from {user_id} to {message_data['receiver_id']}: {message_data['content'][:50]}...")
    
    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(user_id)

# Остальные маршруты (/, /register, /login, /logout) оставляем как были

@app.get("/chats", response_class=HTMLResponse)
async def chats_page(
    request: Request,
    current_user: models.User = Depends(dependencies.get_current_user_from_cookie),
    db: Session = Depends(get_db)
):
    users = crud.get_all_users(db)
    return templates.TemplateResponse(
        "chats.html",
        {
            "request": request,
            "current_user": current_user,
            "users": users,
            "current_user_id": current_user.id
        }
    )

@app.get("/api/messages/{user_id}")
async def get_messages(
    user_id: int,
    current_user: models.User = Depends(dependencies.get_current_user),
    db: Session = Depends(get_db)
):
    messages = crud.get_messages_between_users(db, current_user.id, user_id)
    
    return [
        {
            "id": msg.id,
            "sender_id": msg.sender_id,
            "content": msg.content,
            "created_at": msg.created_at.isoformat(),
            "is_sent": msg.sender_id == current_user.id
        }
        for msg in messages
    ]