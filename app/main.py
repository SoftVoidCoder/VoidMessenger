from fastapi import FastAPI, Request, Depends, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv

from app.database import engine, Base, get_db
from app import auth
from app.routes import users, messages, pages
from app.websocket import websocket_endpoint

load_dotenv()

# Создаем таблицы
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=os.getenv("APP_NAME", "My Messenger"),
    version="1.0.0",
    description="Beautiful messenger with WebSockets",
    debug=os.getenv("DEBUG", "False").lower() == "true"
)

# Middleware: добавляем токен из куки в заголовки Authorization
@app.middleware("http")
async def add_auth_header(request: Request, call_next):
    # Если нет заголовка Authorization, проверяем есть ли токен в localStorage через query параметр
    auth_header = request.headers.get("authorization")
    
    if not auth_header and request.url.path == "/chat":
        # Проверяем query параметр
        token = request.query_params.get("token")
        if token:
            # Добавляем в заголовки
            new_headers = dict(request.headers)
            new_headers["authorization"] = f"Bearer {token}"
            request._headers = new_headers
    
    response = await call_next(request)
    return response


# Статические файлы
static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# CORS - ВАЖНО: allow_credentials=True
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роуты
app.include_router(pages.router)
app.include_router(users.router, prefix="/api")
app.include_router(messages.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to Void Messenger"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "message": "Messenger API is running"}

@app.get("/api/users/me")
async def get_current_user_info(
    current_user: dict = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    from app import models
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }

# WebSocket endpoint
@app.websocket("/ws/{user_id}")
async def websocket_route(user_id: int, websocket: WebSocket):
    db = next(get_db())
    try:
        await websocket_endpoint(websocket, user_id, db)
    finally:
        db.close()

# Обработчик ошибок
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)}
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)