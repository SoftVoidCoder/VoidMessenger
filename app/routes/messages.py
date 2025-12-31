from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas, auth
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(prefix="/messages", tags=["messages"])

@router.get("/", response_model=List[schemas.MessageResponse])
def get_messages(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Получаем сообщения где пользователь является отправителем или получателем
    messages = db.query(models.Message).filter(
        (models.Message.sender_id == current_user.id) | 
        (models.Message.receiver_id == current_user.id)
    ).order_by(models.Message.timestamp.desc()).offset(skip).limit(limit).all()
    
    return messages

@router.post("/", response_model=schemas.MessageResponse)
def create_message(
    message: schemas.MessageCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Проверяем, существует ли получатель
    receiver = db.query(models.User).filter(
        models.User.id == message.receiver_id
    ).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")
    
    # Создаем сообщение
    db_message = models.Message(
        content=message.content,
        sender_id=current_user.id,
        receiver_id=message.receiver_id
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    return db_message

@router.get("/with/{user_id}", response_model=List[schemas.MessageResponse])
def get_conversation(
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Получаем переписку между двумя пользователями
    messages = db.query(models.Message).filter(
        ((models.Message.sender_id == current_user.id) & 
         (models.Message.receiver_id == user_id)) |
        ((models.Message.sender_id == user_id) & 
         (models.Message.receiver_id == current_user.id))
    ).order_by(models.Message.timestamp.asc()).all()
    
    return messages