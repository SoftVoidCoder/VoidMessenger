from fastapi import FastAPI, Request, Depends, HTTPException, status, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from datetime import timedelta
import os
from dotenv import load_dotenv

from . import models, schemas, crud, auth, dependencies
from .database import engine, get_db
import sys

# Добавляем текущую директорию в путь для импортов
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Загружаем переменные окружения
load_dotenv()

# Создаем таблицы
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Telegram-like Messenger")

# Получаем абсолютный путь к директории проекта
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

# Настройка статических файлов и шаблонов
static_dir = os.path.join(PROJECT_ROOT, "app", "static")
templates_dir = os.path.join(PROJECT_ROOT, "templates")

print(f"Static directory: {static_dir}")
print(f"Templates directory: {templates_dir}")

# Проверяем существование директорий
print(f"Static dir exists: {os.path.exists(static_dir)}")
print(f"Templates dir exists: {os.path.exists(templates_dir)}")

app.mount("/static", StaticFiles(directory=static_dir), name="static")
templates = Jinja2Templates(directory=templates_dir)

security = HTTPBearer()

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
    # Проверяем, существует ли пользователь
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
    
    # Создаем пользователя
    user_create = schemas.UserCreate(
        username=username,
        email=email,
        password=password,
        phone=phone,
        first_name=first_name,
        last_name=last_name
    )
    
    user = crud.create_user(db, user_create)
    
    # Создаем токен и перенаправляем на страницу чатов
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

# Страница чатов (требует аутентификации)
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

# API endpoint для получения текущего пользователя
@app.get("/api/me")
async def read_current_user(
    current_user: models.User = Depends(dependencies.get_current_user)
):
    return schemas.UserResponse.from_orm(current_user)