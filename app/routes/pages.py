from fastapi import APIRouter, Request, Depends, HTTPException, status, Cookie
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
import os

# Импортируем get_db из database
from app.database import get_db

router = APIRouter()

# Настройка Jinja2
templates_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
templates = Jinja2Templates(directory=templates_dir)

# Импортируем функции для работы с JWT
from jose import jwt, JWTError
from app.auth import SECRET_KEY, ALGORITHM

def get_user_from_token(token: str, db: Session):
    """Получаем пользователя из токена"""
    try:
        if not token:
            return None
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = int(payload.get("sub"))
        if user_id is None:
            return None
        
        from app import models
        user = db.query(models.User).filter(models.User.id == user_id).first()
        return user
    except (JWTError, ValueError, Exception) as e:
        print(f"❌ Ошибка декодирования токена: {e}")
        return None

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
    token: str = Cookie(None),  # Получаем токен из куки
    db: Session = Depends(get_db)  # Теперь get_db определен
):
    print(f"🔑 Токен из куки: {token[:20] + '...' if token else 'None'}")
    
    if not token:
        print("❌ Нет токена в куки, редирект на логин")
        return RedirectResponse(url="/login")
    
    # Получаем пользователя из токена
    current_user = get_user_from_token(token, db)
    
    if not current_user:
        print("❌ Невалидный токен, редирект на логин")
        # Удаляем невалидную куку
        response = RedirectResponse(url="/login")
        response.delete_cookie("token")
        return response
    
    print(f"✅ Пользователь авторизован: {current_user.username}")
    
    # Получаем список всех пользователей кроме текущего
    from app import models
    users = db.query(models.User).filter(models.User.id != current_user.id).all()
    
    return templates.TemplateResponse("chat.html", {
        "request": request,
        "current_user": current_user,
        "users": users
    })

@router.get("/logout")
async def logout():
    response = RedirectResponse(url="/login")
    response.delete_cookie("token")
    return response