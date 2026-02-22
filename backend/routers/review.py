from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import Card, ReviewLog, User
from schemas import CardResponse, ReviewSubmit
from auth import get_current_user
from services.sm2 import sm2

router = APIRouter(prefix="/api/cards", tags=["review"])


@router.get("/due", response_model=list[CardResponse])
def get_due_cards(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)

    # Cards due for review (next_review <= now)
    due_cards = (
        db.query(Card)
        .join(ReviewLog)
        .options(joinedload(Card.review_log))
        .filter(
            Card.user_id == current_user.id,
            ReviewLog.next_review <= now,
        )
        .order_by(ReviewLog.next_review)
        .all()
    )

    # Enforce daily new limit: count new cards in result
    result = []
    new_count = 0
    for card in due_cards:
        if card.review_log.status == "new":
            if new_count >= current_user.daily_new_limit:
                continue
            new_count += 1
        result.append(card)

    return result


@router.post("/{card_id}/review", response_model=CardResponse)
def review_card(
    card_id: int,
    data: ReviewSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.quality not in (0, 3, 4, 5):
        raise HTTPException(status_code=400, detail="Quality must be 0, 3, 4, or 5")

    card = (
        db.query(Card)
        .options(joinedload(Card.review_log))
        .filter(Card.id == card_id, Card.user_id == current_user.id)
        .first()
    )
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    rl = card.review_log
    if not rl:
        raise HTTPException(status_code=400, detail="No review log for this card")

    result = sm2(
        quality=data.quality,
        ease_factor=rl.ease_factor,
        interval=rl.interval,
        consecutive_correct=rl.consecutive_correct,
    )

    rl.ease_factor = result.ease_factor
    rl.interval = result.interval
    rl.consecutive_correct = result.consecutive_correct
    rl.status = result.status
    rl.last_reviewed = datetime.now(timezone.utc)
    rl.next_review = datetime.now(timezone.utc) + timedelta(days=result.interval)

    db.commit()
    db.refresh(card)
    return card
