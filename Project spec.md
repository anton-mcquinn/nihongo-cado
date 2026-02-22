# 日本語カード (Nihongo Cards) - Project Spec

## Japanese Vocabulary Flashcard App

-----

## Overview

A lightweight multi-user web app for learning Japanese vocabulary using spaced repetition.
Hosted on a personal Digital Ocean droplet. Simple account system for Anton and Jacki
(and potentially other users in the future).

The killer feature: upload Japanese podcast/textbook PDF transcripts and use the
Anthropic API (Claude) to automatically extract vocabulary and generate flashcard decks.

-----

## Tech Stack

- **Frontend:** React (Vite) — responsive design for desktop + mobile
- **Backend:** Python (FastAPI)
- **Database:** SQLite (single file, easy backup)
- **LLM Integration:** Anthropic API (Claude Sonnet) for vocab extraction
- **PDF Parsing:** PyMuPDF (fitz) or pdfplumber
- **Deployment:** Digital Ocean droplet (nginx reverse proxy + uvicorn)

-----

## Data Model

### User

```
id: integer (primary key)
username: text (unique)    -- e.g., "anton", "jacki"
password_hash: text        -- bcrypt hashed password
display_name: text         -- shown in UI (e.g., "Anton", "Jacki")
daily_new_limit: integer   -- default 5, per-user setting
theme: text                -- "dark" or "light"
created_at: datetime
```

### Card

```
id: integer (primary key)
user_id: integer (FK → User)  -- each user has their own deck
japanese: text           -- hiragana/katakana (e.g., たべもの)
romaji: text             -- romanized (e.g., tabemono)
english: text            -- meaning (e.g., "food")
part_of_speech: text     -- noun, verb, adjective, phrase, particle, etc.
notes: text (nullable)   -- extra context, example sentence, memory hint
source: text             -- e.g., "Shun Ep1", "Genki Ch1", "Manual"
tags: text (nullable)    -- comma-separated tags for filtering
audio_url: text (null)   -- future: link to pronunciation audio
created_at: datetime
```

### ReviewLog (spaced repetition state)

```
id: integer (primary key)
card_id: integer (FK → Card)
user_id: integer (FK → User)
ease_factor: float       -- default 2.5 (SM-2 algorithm)
interval: integer        -- days until next review
repetitions: integer     -- consecutive correct answers
next_review: date        -- when to show this card next
last_reviewed: datetime (nullable)
consecutive_correct: int -- default 0, resets on Again/Hard
status: text             -- "new", "learning", "known"
```

### Source (uploaded transcripts)

```
id: integer (primary key)
user_id: integer (FK → User)
name: text               -- e.g., "Japanese with Shun - Episode 1"
source_type: text        -- "pdf", "csv", "manual"
uploaded_at: datetime
processed: boolean       -- whether LLM extraction is complete
raw_text: text (null)    -- extracted text from PDF
```

-----

## Core Features

### 1. Review Mode (Main Screen)

The daily study experience. Shows cards due for review today.

- Display card front: **Japanese (hiragana/katakana)** in large text
- User taps to reveal: **English meaning + romaji + notes**
- Rate recall with buttons: **Again** / **Hard** / **Good** / **Easy**
- SM-2 algorithm updates next review date based on rating
- Show progress: “12 cards remaining today” / “0 cards — you’re done!”
- Daily stats: new cards learned, cards reviewed, accuracy

**SM-2 Algorithm Summary:**

- Quality ratings: Again=0, Hard=3, Good=4, Easy=5
- If quality < 3: reset repetitions to 0, interval = 1 day
- If quality >= 3:
  - rep 0 → interval = 1 day
  - rep 1 → interval = 6 days
  - rep 2+ → interval = previous interval × ease factor
- Ease factor adjusts: EF = EF + (0.1 - (5-q) × (0.08 + (5-q) × 0.02))
- Minimum ease factor: 1.3

### 2. Add Cards Manually

Simple form to add individual cards:

- Japanese (hiragana/katakana input)
- Romaji
- English meaning
- Part of speech (dropdown)
- Source (free text or dropdown of existing sources)
- Tags (optional)
- Notes (optional)

### 3. Import from CSV/Markdown

Upload a CSV or markdown file with vocabulary tables.

Expected CSV format:

```
japanese,romaji,english,part_of_speech,source,tags
たべもの,tabemono,food,noun,Shun Ep1,
のみもの,nomimono,beverage,noun,Shun Ep1,
```

Markdown table format (same as the vocab docs already being created):

```
| Japanese | Romaji | Meaning | Status |
|----------|--------|---------|--------|
| たべもの | tabemono | food | 🆕 |
```

Preview imported cards before confirming addition to deck.

### 4. LLM Vocab Extraction (The Killer Feature)

Upload a PDF transcript → Claude extracts vocabulary → preview → add to deck.

**Flow:**

1. User uploads PDF (e.g., Shun Episode 2 transcript)
2. Backend extracts text from PDF using PyMuPDF
3. Send extracted text to Anthropic API with a prompt like:

```
You are a Japanese language teaching assistant. Extract all vocabulary 
from this Japanese transcript. For each word, provide:
- japanese (hiragana/katakana)
- romaji 
- english meaning
- part_of_speech (noun, verb, adjective, adverb, phrase, particle, counter)

Group by part of speech. Skip particles unless uncommon.
Include verb forms in their dictionary form AND the form used in the text.
Flag any words that appear in this known vocabulary list: {user's existing cards}

Return as JSON array:
[{"japanese": "たべもの", "romaji": "tabemono", "english": "food", 
  "part_of_speech": "noun", "already_known": false}]
```

1. Frontend displays extracted vocab in a table
2. User checks/unchecks words they want to add (pre-uncheck “already_known”)
3. User can edit any field before confirming
4. Confirm → cards are created with source = PDF filename

**Learning Plan Generation:**
After vocab extraction, the app calculates and displays a learning plan:

- “This episode has 47 new words. At 4 words/day, you’ll finish in 12 days.”
- User can adjust their daily rate and see the timeline update
- The plan feeds into the daily queue — new cards from this source are
  dripped in at the configured rate alongside review cards
- Multiple sources can be queued up — the app manages the pipeline
  (e.g., “Shun Ep1: 3 days left, Shun Ep2: 12 days, Genki Ch2: 8 days”)

### 5. Browse & Manage Cards

- Searchable/filterable card list
- Filter by: source, tags, part of speech, date added
- Edit any card
- Delete cards
- Bulk actions (delete, re-tag)

### 6. Mastery System

Cards progress through stages based on consecutive correct recalls:

```
NEW → LEARNING → KNOWN
```

- **NEW:** Never reviewed. Introduced at the daily new card rate.
- **LEARNING:** Reviewed but fewer than 3 consecutive “Good” or “Easy” ratings.
- **KNOWN:** 3+ consecutive “Good” or “Easy” ratings. Card is considered mastered.

Tracking:

- Each card has a `consecutive_correct` counter (0 by default)
- Rating “Good” or “Easy” increments the counter
- Rating “Hard” or “Again” resets it to 0
- When counter hits 3 → card status changes to KNOWN
- KNOWN cards still appear for spaced repetition review but at longer intervals
- If a KNOWN card gets rated “Again,” it drops back to LEARNING

**This feeds into the LLM extraction:** when Claude checks your existing deck,
it distinguishes between LEARNING and KNOWN cards. A card you’re still learning
won’t be filtered out of a new transcript’s vocab list — but a KNOWN card will.

Dashboard displays:

- “You know 142 words”
- “Currently learning 23 words”
- “47 words queued from upcoming sources”

### 7. Stats Dashboard

- Total cards in deck
- Cards learned (reviewed at least once)
- Cards due today
- Daily streak (consecutive days with reviews)
- New cards added today / this week
- Accuracy rate (% of reviews rated Good or Easy)
- Simple chart: reviews per day over last 30 days
- Progress toward 4-5 new words/day goal

-----

## UI Design Notes

- **Mobile-first responsive** — primary use is on phone at work and on the go
- **Clean, minimal** — focus on the card content, not chrome
- **Large Japanese text** — at least 48px for card fronts, easy to read
- **Dark mode** — easier on eyes for sneaky work studying
- **Touch-friendly** — big tap targets for review rating buttons
- **Quick access** — review mode is the default landing page

### Suggested Color Palette

- Background: #1a1a2e (dark navy) or clean white for light mode
- Card: #16213e (dark) or #ffffff (light)
- Accent: #e94560 (red, like a torii gate)
- Success: #4ecca3
- Text: #eaeaea (dark mode) or #333333 (light mode)

-----

## API Endpoints

```
# Auth
POST /api/auth/register      -- create account (username, password, display_name)
POST /api/auth/login          -- login, returns JWT token
GET  /api/auth/me             -- get current user info

# Review
GET  /api/cards/due          -- get today's due cards
POST /api/cards/:id/review   -- submit review rating

# Cards CRUD
GET    /api/cards             -- list all cards (with filters)
POST   /api/cards             -- create card
PUT    /api/cards/:id         -- update card
DELETE /api/cards/:id         -- delete card

# Bulk operations
POST /api/cards/bulk          -- create multiple cards
DELETE /api/cards/bulk         -- delete multiple cards

# Import
POST /api/import/csv          -- upload CSV/markdown file
POST /api/import/pdf          -- upload PDF for LLM extraction

# Learning Plan
GET  /api/plan                -- get current learning pipeline/queue
PUT  /api/plan/:source_id     -- adjust daily rate for a source

# Sources
GET  /api/sources             -- list all sources

# Stats
GET  /api/stats               -- get dashboard stats
GET  /api/stats/history       -- get review history for charts

# Settings
GET  /api/settings            -- get app settings
PUT  /api/settings            -- update settings (daily new card limit, etc.)
```

-----

## Authentication

- **Simple JWT-based auth** — login with username/password, get a token
- **Token stored in localStorage** — sent as Bearer token in API headers
- **Registration:** open but simple — no email required, just username + password
- **Sessions:** JWT tokens expire after 30 days (long-lived for convenience)
- **Password hashing:** bcrypt via passlib
- **Dependencies:** python-jose[cryptography] for JWT, passlib[bcrypt] for passwords

Login screen is clean and minimal — just username, password, and a login button.
Registration link below for Jacki or future users.

-----

## Settings

- **Daily new card limit:** default 5 (per user, stored in user profile)
- **Theme:** dark / light (per user)
- **Card front:** Japanese only / Japanese + romaji (per user)
- **Review order:** due date / random / source
- **Anthropic API key:** stored in environment variable on server

-----

## File Structure

```
nihongo-cards/
├── backend/
│   ├── main.py              -- FastAPI app
│   ├── models.py            -- SQLAlchemy models
│   ├── database.py          -- DB setup
│   ├── routers/
│   │   ├── cards.py         -- card CRUD
│   │   ├── review.py        -- review endpoints
│   │   ├── import_cards.py  -- CSV/PDF import
│   │   └── stats.py         -- statistics
│   ├── services/
│   │   ├── sm2.py           -- SM-2 algorithm
│   │   ├── pdf_parser.py    -- PDF text extraction
│   │   └── llm_extract.py   -- Anthropic API vocab extraction
│   ├── requirements.txt
│   └── nihongo.db           -- SQLite database
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── ReviewCard.jsx
│   │   │   ├── CardForm.jsx
│   │   │   ├── CardList.jsx
│   │   │   ├── ImportModal.jsx
│   │   │   ├── PdfUpload.jsx
│   │   │   ├── Stats.jsx
│   │   │   └── Navigation.jsx
│   │   ├── hooks/
│   │   │   └── useApi.js
│   │   └── styles/
│   ├── package.json
│   └── vite.config.js
├── nginx.conf
├── deploy.sh
└── README.md
```

-----

## Deployment (Digital Ocean)

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000

# Frontend  
cd frontend
npm install
npm run build
# Serve dist/ via nginx

# Nginx config
# - Serve frontend static files
# - Proxy /api/* to uvicorn on port 8000
```

-----

## Future Enhancements (v2+)

- **Audio pronunciation** — integrate with Google TTS or similar
- **Example sentences** — have Claude generate example sentences for each word
- **Kanji cards** — separate deck for kanji with stroke order
- **Grammar cards** — for patterns like ～ましょう, ～ている, correct particle, etc
- **Reverse mode** — English front → type Japanese answer
- **Conjugation practice** — given a verb, produce the correct form
- **Episode progress tracker** — track which Shun episodes you’ve worked through
- **PWA support** — installable on phone home screen
- **Export to Obsidian** — generate markdown vocab lists from your deck
- **AI Reading Material** — Use LLM to generate short stories and essays with known vocab

-----

*App name: 日本語カード (Nihongo Kādo) — “Japanese Cards”*