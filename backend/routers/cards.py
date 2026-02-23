from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models import Card, ReviewLog, Source, User
from schemas import CardCreate, CardUpdate, CardResponse, BulkCardCreate, BulkDeleteRequest
from auth import get_current_user

router = APIRouter(prefix="/api/cards", tags=["cards"])


@router.get("", response_model=list[CardResponse])
def list_cards(
    search: Optional[str] = Query(None),
    source_id: Optional[int] = Query(None),
    tags: Optional[str] = Query(None),
    part_of_speech: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Card).filter(Card.user_id == current_user.id)
    if search:
        like = f"%{search}%"
        q = q.filter(
            (Card.front.ilike(like)) | (Card.back.ilike(like)) | (Card.romaji.ilike(like))
        )
    if source_id is not None:
        q = q.filter(Card.source_id == source_id)
    if tags:
        q = q.filter(Card.tags.ilike(f"%{tags}%"))
    if part_of_speech:
        q = q.filter(Card.part_of_speech == part_of_speech)
    return q.order_by(Card.created_at.desc()).all()


@router.post("", response_model=CardResponse, status_code=201)
def create_card(
    data: CardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(Card).filter(Card.user_id == current_user.id, Card.front == data.front).first()
    if existing:
        raise HTTPException(status_code=409, detail="A card with this front already exists")

    card = Card(
        user_id=current_user.id,
        front=data.front,
        back=data.back,
        notes=data.notes,
        romaji=data.romaji,
        part_of_speech=data.part_of_speech,
        tags=data.tags,
        audio_url=data.audio_url,
        source_id=data.source_id,
    )
    db.add(card)
    db.flush()

    review_log = ReviewLog(
        card_id=card.id,
        status="new",
        next_review=datetime.now(timezone.utc),
    )
    db.add(review_log)
    db.commit()
    db.refresh(card)
    return card


@router.post("/bulk", response_model=list[CardResponse], status_code=201)
def bulk_create_cards(
    data: BulkCardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    source = None
    if data.source_name:
        source = Source(
            name=data.source_name,
            user_id=current_user.id,
            source_type=data.source_type,
        )
        db.add(source)
        db.flush()

    # Get existing fronts to skip duplicates
    existing_fronts = set(
        row[0] for row in db.query(Card.front).filter(Card.user_id == current_user.id).all()
    )

    created = []
    now = datetime.now(timezone.utc)
    for item in data.cards:
        if item.front in existing_fronts:
            continue
        existing_fronts.add(item.front)
        card = Card(
            user_id=current_user.id,
            front=item.front,
            back=item.back,
            notes=item.notes,
            romaji=item.romaji,
            part_of_speech=item.part_of_speech,
            tags=item.tags,
            audio_url=item.audio_url,
            source_id=source.id if source else item.source_id,
        )
        db.add(card)
        db.flush()

        review_log = ReviewLog(
            card_id=card.id,
            status="new",
            next_review=now,
        )
        db.add(review_log)
        created.append(card)

    db.commit()
    for c in created:
        db.refresh(c)
    return created


@router.delete("/bulk", status_code=204)
def bulk_delete_cards(
    data: BulkDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cards = db.query(Card).filter(
        Card.id.in_(data.card_ids), Card.user_id == current_user.id
    ).all()
    for card in cards:
        db.delete(card)
    db.commit()


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
