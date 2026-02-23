from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routers import auth as auth_router
from routers import cards as cards_router
from routers import review as review_router
from routers import sources as sources_router
from routers import extract as extract_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Nihongo Cards API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(cards_router.router)
app.include_router(review_router.router)
app.include_router(sources_router.router)
app.include_router(extract_router.router)
