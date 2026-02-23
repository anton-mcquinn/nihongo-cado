from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from database import get_db
from models import Card, User
from schemas import ExtractVocabResponse, ExtractedVocab
from auth import get_current_user
from services.llm_extract import extract_text_from_pdf, extract_vocab_with_llm

router = APIRouter(prefix="/api/extract", tags=["extract"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
TEXT_EXTENSIONS = (".md", ".txt", ".markdown")


@router.post("/vocab", response_model=ExtractVocabResponse)
async def extract_vocab(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.anthropic_api_key:
        raise HTTPException(
            status_code=400,
            detail="Anthropic API key not set. Go to Settings to add your key.",
        )

    filename = (file.filename or "").lower()
    is_pdf = filename.endswith(".pdf")
    is_text = any(filename.endswith(ext) for ext in TEXT_EXTENSIONS)

    if not is_pdf and not is_text:
        raise HTTPException(status_code=400, detail="Supported formats: PDF, Markdown (.md), Text (.txt)")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max 10MB.")

    if is_pdf:
        try:
            text = extract_text_from_pdf(contents)
        except Exception:
            raise HTTPException(status_code=400, detail="Failed to read PDF. Is it a valid PDF file?")
    else:
        text = contents.decode("utf-8", errors="replace")

    if not text.strip():
        raise HTTPException(status_code=400, detail="No text found in file.")

    # Get user's existing card fronts to flag already_known
    existing_fronts = [
        card.front
        for card in db.query(Card.front).filter(Card.user_id == current_user.id).all()
    ]

    # Call LLM
    try:
        words = extract_vocab_with_llm(text, current_user.anthropic_api_key, existing_fronts)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM extraction failed: {str(e)}")

    return ExtractVocabResponse(
        words=[ExtractedVocab(**w) for w in words],
        source_text_preview=text[:200],
    )
