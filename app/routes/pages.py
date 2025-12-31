from fastapi import APIRouter, Request, Depends, HTTPException, status
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from app.auth import get_current_user
from app.database import get_db
from app import models
from sqlalchemy.orm import Session
import os

router = APIRouter()

# Настройка Jinja2
templates_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
templates = Jinja2Templates(directory=templates_dir)

@router.get("/", response_class=HTMLResponse)
async def home_page(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@router.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})

@router.get("/chat", response_class=HTMLResponse)
async def chat_page(
    request: Request,
    db: Session = Depends(get_db)
):
    # Сначала пробуем получить токен из куки
    token = request.cookies.get("token")
    
    if not token:
        # Если нет токена в куки, редирект на логин
        return RedirectResponse(url="/login")
    
    # Проверяем токен
    try:
        from app.auth import SECRET_KEY, ALGORITHM
        from jose import jwt
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
        
        # Получаем текущего пользователя
        current_user = db.query(models.User).filter(models.User.id == user_id).first()
        
        if not current_user:
            return RedirectResponse(url="/login")
        
        # Получаем список всех пользователей кроме текущего
        users = db.query(models.User).filter(models.User.id != current_user.id).all()
        
        return templates.TemplateResponse("chat.html", {
            "request": request,
            "current_user": current_user,
            "users": users
        })
        
    except Exception as e:
        print(f"❌ Ошибка аутентификации: {e}")
        return RedirectResponse(url="/login")

@router.get("/logout")
async def logout():
    response = RedirectResponse(url="/login")
    response.delete_cookie("token")
    return response