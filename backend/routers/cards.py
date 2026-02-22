from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Card, ReviewLog, User
from schemas import CardCreate, CardUpdate, CardResponse
from auth import get_current_user

router = APIRouter(prefix="/api/cards", tags=["cards"])


@router.get("", response_model=list[CardResponse])
def list_cards(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return db.query(Card).filter(Card.user_id == current_user.id).all()


@router.post("", response_model=CardResponse, status_code=201)
def create_card(
    data: CardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    card = Card(
        user_id=current_user.id,
        front=data.front,
        back=data.back,
        notes=data.notes,
        source_id=data.source_id,
    )
    db.add(card)
    db.flush()

    # Create ReviewLog so card appears in due queue
    review_log = ReviewLog(
        card_id=card.id,
        status="new",
        next_review=datetime.now(timezone.utc),
    )
    db.add(review_log)
    db.commit()
    db.refresh(card)
    return card


@router.put("/{card_id}", response_model=CardResponse)
def update_card(
    card_id: int,
    data: CardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    card = db.query(Card).filter(Card.id == card_id, Card.user_id == current_user.id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(card, field, value)
    db.commit()
    db.refresh(card)
    return card


@router.delete("/{card_id}", status_code=204)
def delete_card(
    card_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    card = db.query(Card).filter(Card.id == card_id, Card.user_id == current_user.id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    db.delete(card)
    db.commit()
