from fastapi import FastAPI, Request, Depends, HTTPException, status, Form, WebSocket
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from datetime import timedelta
import os
from dotenv import load_dotenv

from . import models, schemas, crud, auth, dependencies
from .database import engine, get_db
from .websocket import websocket_endpoint  # Импортируем конкретную функцию

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

# WebSocket endpoint - ПРАВИЛЬНЫЙ ВЫЗОВ
@app.websocket("/ws/{token}")
async def websocket_connection(websocket: WebSocket, token: str):
    db = next(get_db())
    await websocket_endpoint(websocket, token, db)  # Вызываем функцию напрямую

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
    phone: str = Form(None),
    first_name: str = Form(None),
    last_name: str = Form(None),
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
        password=password,
        phone=phone,
        first_name=first_name,
        last_name=last_name
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
    chats = crud.get_user_chats(db, current_user.id)
    
    return templates.TemplateResponse(
        "chats.html",
        {
            "request": request,
            "current_user": current_user,
            "users": users,
            "chats": chats,
            "access_token": request.cookies.get("access_token", "")
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
    
    # Отмечаем сообщения как прочитанные
    crud.mark_messages_as_read(db, user_id, current_user.id)
    
    return [
        {
            "id": msg.id,
            "sender_id": msg.sender_id,
            "receiver_id": msg.receiver_id,
            "content": msg.content,
            "is_read": msg.is_read,
            "created_at": msg.created_at.isoformat(),
            "sender_username": msg.sender.username,
            "receiver_username": msg.receiver.username
        }
        for msg in messages
    ]

# API для отправки сообщения
@app.post("/api/messages")
async def send_message(
    message: schemas.MessageCreate,
    current_user: models.User = Depends(dependencies.get_current_user),
    db: Session = Depends(get_db)
):
    db_message = crud.create_message(db, message, current_user.id)
    
    return {
        "id": db_message.id,
        "sender_id": db_message.sender_id,
        "receiver_id": db_message.receiver_id,
        "content": db_message.content,
        "is_read": db_message.is_read,
        "created_at": db_message.created_at.isoformat()
    }

# API для получения непрочитанных сообщений
@app.get("/api/unread_count")
async def get_unread_count(
    current_user: models.User = Depends(dependencies.get_current_user),
    db: Session = Depends(get_db)
):
    total = crud.get_unread_messages_count(db, current_user.id)
    return {"total": total}

# API endpoint для получения текущего пользователя
@app.get("/api/me")
async def read_current_user(
    current_user: models.User = Depends(dependencies.get_current_user)
):
    return schemas.UserResponse.from_orm(current_user)