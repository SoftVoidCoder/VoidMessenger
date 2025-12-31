from fastapi import FastAPI, WebSocket, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import engine, Base, get_db
from app.routes import users, messages
from app.websocket import websocket_endpoint
import os

# Создаем таблицы
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="My Messenger API",
    version="1.0.0",
    description="Simple messenger with FastAPI and WebSockets"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В production укажите конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роуты
app.include_router(users.router)
app.include_router(messages.router)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to My Messenger API",
        "docs": "/docs",
        "endpoints": {
            "register": "POST /users/register",
            "login": "POST /users/token",
            "get_messages": "GET /messages/",
            "send_message": "POST /messages/",
            "websocket": "WS /ws/{user_id}"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# WebSocket endpoint
@app.websocket("/ws/{user_id}")
async def websocket_route(websocket: WebSocket, user_id: int):
    db = next(get_db())
    try:
        await websocket_endpoint(websocket, user_id, db)
    finally:
        db.close()

# Для TimeWeb нужно запускать через gunicorn
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)