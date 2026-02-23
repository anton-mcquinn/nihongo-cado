from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import UserCreate, UserResponse, Token, UserSettingsUpdate, UserSettingsResponse
from auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=Token)
def register(data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    user = User(username=data.username, hashed_password=hash_password(data.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"access_token": create_access_token(user.id), "token_type": "bearer"}


@router.post("/login", response_model=Token)
def login(data: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"access_token": create_access_token(user.id), "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/settings", response_model=UserSettingsResponse)
def get_settings(current_user: User = Depends(get_current_user)):
    return UserSettingsResponse(
        anthropic_api_key_set=bool(current_user.anthropic_api_key),
        daily_new_limit=current_user.daily_new_limit,
    )


@router.put("/settings", response_model=UserSettingsResponse)
def update_settings(
    data: UserSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.anthropic_api_key is not None:
        current_user.anthropic_api_key = data.anthropic_api_key
    if data.daily_new_limit is not None:
        current_user.daily_new_limit = data.daily_new_limit
    db.commit()
    db.refresh(current_user)
    return UserSettingsResponse(
        anthropic_api_key_set=bool(current_user.anthropic_api_key),
        daily_new_limit=current_user.daily_new_limit,
    )
