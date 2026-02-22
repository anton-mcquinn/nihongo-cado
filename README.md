# Nihongo Cards

Japanese flashcard app with SM-2 spaced repetition.

## Dev Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Runs on http://localhost:8000. SQLite database is created automatically.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on http://localhost:5173. API calls are proxied to the backend.

## Usage

1. Register a new account
2. Add cards (front = Japanese, back = meaning)
3. Review due cards daily — rate them Again/Hard/Good/Easy
4. SM-2 algorithm schedules reviews based on your ratings
