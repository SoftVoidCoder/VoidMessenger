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
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Получаем список всех пользователей кроме текущего
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