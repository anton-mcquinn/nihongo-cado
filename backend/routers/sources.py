from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Source, User
from schemas import SourceResponse
from auth import get_current_user

router = APIRouter(prefix="/api/sources", tags=["sources"])


@router.get("", response_model=list[SourceResponse])
def list_sources(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Source).filter(Source.user_id == current_user.id).order_by(Source.uploaded_at.desc()).all()
