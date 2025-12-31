from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from datetime import datetime
from . import models, schemas, auth
import json

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_id(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_all_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        phone=user.phone,
        first_name=user.first_name,
        last_name=user.last_name,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not auth.verify_password(password, user.hashed_password):
        return None
    return user

def create_message(db: Session, message: schemas.MessageCreate, sender_id: int):
    db_message = models.Message(
        sender_id=sender_id,
        receiver_id=message.receiver_id,
        content=message.content
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

def get_messages_between_users(db: Session, user1_id: int, user2_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Message).filter(
        or_(
            and_(models.Message.sender_id == user1_id, models.Message.receiver_id == user2_id),
            and_(models.Message.sender_id == user2_id, models.Message.receiver_id == user1_id)
        )
    ).order_by(models.Message.created_at.asc()).offset(skip).limit(limit).all()

def get_unread_messages_count(db: Session, user_id: int, sender_id: int = None):
    query = db.query(models.Message).filter(
        models.Message.receiver_id == user_id,
        models.Message.is_read == False
    )
    if sender_id:
        query = query.filter(models.Message.sender_id == sender_id)
    return query.count()

def mark_messages_as_read(db: Session, sender_id: int, receiver_id: int):
    messages = db.query(models.Message).filter(
        models.Message.sender_id == sender_id,
        models.Message.receiver_id == receiver_id,
        models.Message.is_read == False
    ).all()
    
    for message in messages:
        message.is_read = True
    db.commit()
    return len(messages)

def get_user_chats(db: Session, user_id: int):
    # Получаем всех пользователей, с которыми есть переписка
    subquery = db.query(
        models.Message.sender_id,
        models.Message.receiver_id,
        models.Message.content,
        models.Message.created_at,
        models.Message.is_read
    ).filter(
        or_(
            models.Message.sender_id == user_id,
            models.Message.receiver_id == user_id
        )
    ).subquery()
    
    # Получаем последние сообщения для каждого чата
    chats = []
    users = get_all_users(db)
    
    for user in users:
        if user.id == user_id:
            continue
            
        # Получаем последнее сообщение
        last_message = db.query(models.Message).filter(
            or_(
                and_(models.Message.sender_id == user_id, models.Message.receiver_id == user.id),
                and_(models.Message.sender_id == user.id, models.Message.receiver_id == user_id)
            )
        ).order_by(models.Message.created_at.desc()).first()
        
        # Считаем непрочитанные
        unread_count = get_unread_messages_count(db, user_id, user.id)
        
        chats.append({
            "user_id": user.id,
            "username": user.username,
            "full_name": user.get_full_name(),
            "last_message": last_message.content if last_message else None,
            "last_message_time": last_message.created_at if last_message else None,
            "unread_count": unread_count
        })
    
    # Сортируем по времени последнего сообщения
    chats.sort(key=lambda x: x["last_message_time"] or datetime.min, reverse=True)
    return chats