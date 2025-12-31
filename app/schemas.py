from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Имя пользователя от 3 до 50 символов")
    email: Optional[str] = Field(None, max_length=100, description="Email (необязательно)")
    password: str = Field(..., min_length=6, max_length=32, description="Пароль от 6 до 32 символов")
    
    @validator('password')
    def password_length(cls, v):
        if len(v) > 32:
            raise ValueError('Пароль не должен превышать 32 символа')
        if len(v) < 6:
            raise ValueError('Пароль должен быть не менее 6 символов')
        return v
    
    @validator('username')
    def username_length(cls, v):
        if len(v) < 3:
            raise ValueError('Имя пользователя должно быть не менее 3 символов')
        if len(v) > 50:
            raise ValueError('Имя пользователя не должно превышать 50 символов')
        return v

class UserResponse(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class MessageCreate(BaseModel):
    receiver_id: int
    content: str = Field(..., min_length=1, max_length=1000, description="Сообщение от 1 до 1000 символов")

class MessageResponse(BaseModel):
    id: int
    content: str
    sender_id: int
    receiver_id: int
    timestamp: datetime
    is_read: bool
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[int] = None