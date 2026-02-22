from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    daily_new_limit: int

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class CardCreate(BaseModel):
    front: str
    back: str
    notes: str = ""
    source_id: Optional[int] = None


class CardUpdate(BaseModel):
    front: Optional[str] = None
    back: Optional[str] = None
    notes: Optional[str] = None


class ReviewLogResponse(BaseModel):
    status: str
    ease_factor: float
    interval: int
    consecutive_correct: int
    next_review: datetime

    class Config:
        from_attributes = True


class CardResponse(BaseModel):
    id: int
    front: str
    back: str
    notes: str
    created_at: datetime
    review_log: Optional[ReviewLogResponse] = None

    class Config:
        from_attributes = True


class ReviewSubmit(BaseModel):
    quality: int  # 0=Again, 3=Hard, 4=Good, 5=Easy
