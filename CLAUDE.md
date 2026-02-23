# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nihongo Cado is a Japanese vocabulary flashcard app with spaced repetition (SM-2) and AI-powered vocabulary extraction from PDFs via Claude API. Monorepo with a Python/FastAPI backend and React/TypeScript frontend.

## Development Commands

### Backend (Python/FastAPI)
```bash
cd backend
pip install -r requirements.txt
python3 -m uvicorn main:app --reload    # runs on :8000
```

### Frontend (React/Vite)
```bash
cd frontend
npm install
npm run dev       # runs on :5173, proxies /api to :8000
npm run build     # tsc + vite build → dist/
npm run lint      # eslint
npx tsc --noEmit  # type-check without emitting
```

Both servers must run simultaneously. Vite proxies `/api/*` requests to the backend (configured in `vite.config.ts`).

### Database
SQLite at `backend/nihongo.db`. Tables auto-created from SQLAlchemy models on startup. No migration framework — manual migration scripts (e.g. `migrate_phase3.py`) for ALTER TABLE changes.

## Architecture

### Backend (`backend/`)
- **FastAPI** app in `main.py`, routers registered there
- **`auth.py`** — JWT auth (python-jose), bcrypt passwords, `get_current_user` dependency
- **`models.py`** — SQLAlchemy models: User, Card, ReviewLog, Source
- **`schemas.py`** — Pydantic request/response schemas
- **`routers/`** — Endpoint modules, all prefixed `/api/`. Auth, cards, review, sources, extract
- **`services/sm2.py`** — SM-2 spaced repetition algorithm (quality: 0=Again, 3=Hard, 4=Good, 5=Easy)
- **`services/llm_extract.py`** — pdfplumber text extraction + Anthropic API vocab extraction

### Frontend (`frontend/src/`)
- **`App.tsx`** — Routes wrapped in `ProtectedRoute` (redirects to /login if no auth)
- **`api.ts`** — Axios instance with baseURL `/api`, auto-attaches Bearer token from localStorage, redirects to /login on 401
- **`context/AuthContext.tsx`** — Auth state via React Context (login, register, logout, user)
- **`pages/`** — One component per route: Review, AddCard, CardsList, Import, Extract, Settings, Login
- **`types.ts`** — Shared TypeScript interfaces matching backend schemas

### Patterns
- All API calls go through the `api` axios instance (never raw fetch)
- Inline styles throughout (no CSS modules or styled-components), dark theme via CSS variables in `index.css`
- Mobile-first bottom nav bar, touch-friendly targets
- Card review uses flip animation (`ReviewCard.tsx`)
- Bulk operations: cards/bulk endpoint for import and AI extract flows

## Key CSS Variables
```
--bg-primary: #1a1a2e    --accent: #e94560 (torii red)
--bg-secondary: #16213e  --success: #4ecca3
--bg-card: #0f3460       --text-primary: #eee
```
