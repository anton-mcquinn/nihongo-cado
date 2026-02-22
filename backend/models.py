from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    daily_new_limit = Column(Integer, default=20)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    cards = relationship("Card", back_populates="owner")


class Source(Base):
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    cards = relationship("Card", back_populates="source")


class Card(Base):
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    source_id = Column(Integer, ForeignKey("sources.id"), nullable=True)
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    owner = relationship("User", back_populates="cards")
    source = relationship("Source", back_populates="cards")
    review_log = relationship("ReviewLog", back_populates="card", uselist=False)


class ReviewLog(Base):
    __tablename__ = "review_logs"

    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(Integer, ForeignKey("cards.id"), nullable=False, unique=True)
    status = Column(String, default="new")  # new, learning, known
    ease_factor = Column(Float, default=2.5)
    interval = Column(Integer, default=0)  # days
    consecutive_correct = Column(Integer, default=0)
    next_review = Column(DateTime, nullable=False)
    last_reviewed = Column(DateTime, nullable=True)

    card = relationship("Card", back_populates="review_log")
