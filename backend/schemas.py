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
    romaji: str = ""
    part_of_speech: str = ""
    tags: str = ""
    audio_url: str = ""
    source_id: Optional[int] = None


class CardUpdate(BaseModel):
    front: Optional[str] = None
    back: Optional[str] = None
    notes: Optional[str] = None
    romaji: Optional[str] = None
    part_of_speech: Optional[str] = None
    tags: Optional[str] = None
    audio_url: Optional[str] = None


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
    romaji: str = ""
    part_of_speech: str = ""
    tags: str = ""
    audio_url: str = ""
    source_id: Optional[int] = None
    created_at: datetime
    review_log: Optional[ReviewLogResponse] = None

    class Config:
        from_attributes = True


class BulkCardCreate(BaseModel):
    cards: list[CardCreate]
    source_name: str = ""
    source_type: str = "manual"


class BulkDeleteRequest(BaseModel):
    card_ids: list[int]


class SourceResponse(BaseModel):
    id: int
    name: str
    source_type: str
    uploaded_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReviewSubmit(BaseModel):
    quality: int  # 0=Again, 3=Hard, 4=Good, 5=Easy


class UserSettingsUpdate(BaseModel):
    anthropic_api_key: Optional[str] = None
    daily_new_limit: Optional[int] = None


class UserSettingsResponse(BaseModel):
    anthropic_api_key_set: bool
    daily_new_limit: int

    class Config:
        from_attributes = True


class ExtractedVocab(BaseModel):
    front: str
    back: str
    romaji: str = ""
    part_of_speech: str = ""
    notes: str = ""
    already_known: bool = False


class ExtractVocabResponse(BaseModel):
    words: list[ExtractedVocab]
    source_text_preview: str = ""
