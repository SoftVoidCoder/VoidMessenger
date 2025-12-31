from fastapi import FastAPI, Request, Depends, HTTPException, status, Form, WebSocket
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from datetime import datetime
import os
from dotenv import load_dotenv

from . import models, schemas, crud, auth, dependencies
from .database import engine, get_db

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

# WebSocket соединения
connected_clients = {}

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await websocket.accept()
    connected_clients[user_id] = websocket
    print(f"User {user_id} connected")
    
    try:
        while True:
            data = await websocket.receive_json()
            
            # Отправляем сообщение
            if data["type"] == "message":
                receiver_id = data["receiver_id"]
                message_text = data["content"]
                
                # Сохраняем в базу
                db = next(get_db())
                message = schemas.MessageCreate(
                    content=message_text,
                    receiver_id=receiver_id
                )
                db_message = crud.create_message(db, message, user_id)
                
                # Отправляем получателю
                if receiver_id in connected_clients:
                    await connected_clients[receiver_id].send_json({
                        "type": "new_message",
                        "sender_id": user_id,
                        "content": message_text,
                        "created_at": datetime.now().isoformat()
                    })
                
                # Подтверждаем отправителю
                await websocket.send_json({
                    "type": "message_sent",
                    "message_id": db_message.id
                })
    
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        if user_id in connected_clients:
            del connected_clients[user_id]
        print(f"User {user_id} disconnected")

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
            "users": users,
            "current_user_id": current_user.id
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
            "receiver_id": msg.receiver_id,
            "content": msg.content,
            "created_at": msg.created_at.isoformat(),
            "is_sent": msg.sender_id == current_user.id
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
    return {"id": db_message.id, "status": "sent"}