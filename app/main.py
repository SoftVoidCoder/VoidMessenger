from fastapi import FastAPI, Request, Depends, HTTPException, status, Form, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from datetime import timedelta
import os
from dotenv import load_dotenv
import json
from typing import Dict

from . import models, schemas, crud, auth, dependencies
from .database import engine, get_db
import sys

# Загружаем переменные окружения
load_dotenv()

# Создаем таблицы
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Telegram-like Messenger")

# Настройка статических файлов и шаблонов
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

static_dir = os.path.join(PROJECT_ROOT, "app", "static")
templates_dir = os.path.join(PROJECT_ROOT, "templates")

app.mount("/static", StaticFiles(directory=static_dir), name="static")
templates = Jinja2Templates(directory=templates_dir)

security = HTTPBearer()

# WebSocket manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket
    
    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
    
    async def send_personal_message(self, message: str, user_id: int):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_text(message)
            except:
                self.disconnect(user_id)

manager = ConnectionManager()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(websocket, user_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data["type"] == "message":
                db = next(get_db())
                message = schemas.MessageCreate(
                    content=message_data["content"],
                    receiver_id=message_data["receiver_id"]
                )
                db_message = crud.create_message(db, message, user_id)
                
                await websocket.send_text(json.dumps({
                    "type": "message_sent",
                    "message_id": db_message.id
                }))
                
                await manager.send_personal_message(json.dumps({
                    "type": "new_message",
                    "sender_id": user_id,
                    "content": message_data["content"],
                    "timestamp": db_message.created_at.isoformat()
                }), message_data["receiver_id"])
    
    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        manager.disconnect(user_id)

# Главная страница
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# Регистрация
@app.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})

@app.post("/register", response_class=HTMLResponse)
async def register(
    request: Request,
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    db_user = crud.get_user_by_email(db, email)
    if db_user:
        return templates.TemplateResponse(
            "register.html",
            {"request": request, "error": "Email already registered"}
        )
    
    db_user = crud.get_user_by_username(db, username)
    if db_user:
        return templates.TemplateResponse(
            "register.html",
            {"request": request, "error": "Username already taken"}
        )
    
    user_create = schemas.UserCreate(
        username=username,
        email=email,
        password=password
    )
    
    user = crud.create_user(db, user_create)
    
    access_token = auth.create_access_token(data={"sub": str(user.id)})
    response = RedirectResponse(url="/chats", status_code=status.HTTP_303_SEE_OTHER)
    response.set_cookie(key="access_token", value=access_token, httponly=True)
    return response

# Вход
@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.post("/login", response_class=HTMLResponse)
async def login(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    user = crud.authenticate_user(db, email, password)
    if not user:
        return templates.TemplateResponse(
            "login.html",
            {"request": request, "error": "Invalid email or password"}
        )
    
    access_token = auth.create_access_token(data={"sub": str(user.id)})
    response = RedirectResponse(url="/chats", status_code=status.HTTP_303_SEE_OTHER)
    response.set_cookie(key="access_token", value=access_token, httponly=True)
    return response

# Выход
@app.get("/logout")
async def logout():
    response = RedirectResponse(url="/")
    response.delete_cookie(key="access_token")
    return response

# Страница чатов
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
            "users": users
        }
    )

# API для получения сообщений
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

# API endpoint для получения текущего пользователя
@app.get("/api/me")
async def read_current_user(
    current_user: models.User = Depends(dependencies.get_current_user)
):
    return schemas.UserResponse.from_orm(current_user)