from fastapi import APIRouter, Request, Depends, HTTPException, status
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
import os

from app.database import get_db
from app.auth import get_current_user

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
    # Пробуем получить токен из заголовка Authorization
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        # Если нет заголовка, просто отдаем шаблон - проверка будет на клиенте
        return templates.TemplateResponse("chat.html", {
            "request": request,
            "current_user": None,
            "users": []
        })
    
    # Если есть заголовок, пробуем авторизовать
    try:
        token = auth_header.replace("Bearer ", "")
        from jose import jwt, JWTError
        from app.auth import SECRET_KEY, ALGORITHM
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
        
        from app import models
        current_user = db.query(models.User).filter(models.User.id == user_id).first()
        
        if current_user:
            users = db.query(models.User).filter(models.User.id != current_user.id).all()
            
            return templates.TemplateResponse("chat.html", {
                "request": request,
                "current_user": current_user,
                "users": users
            })
    
    except Exception as e:
        print(f"Ошибка авторизации: {e}")
    
    # Если что-то пошло не так - отдаем пустой шаблон
    return templates.TemplateResponse("chat.html", {
        "request": request,
        "current_user": None,
        "users": []
    })

@router.get("/logout")
async def logout():
    response = RedirectResponse(url="/login")
    response.delete_cookie("token")
    return response