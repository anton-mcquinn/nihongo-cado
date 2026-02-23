"""Phase 2 migration: add new columns to cards and sources tables."""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "nihongo.db")


def migrate():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Get existing columns for cards table
    cur.execute("PRAGMA table_info(cards)")
    card_cols = {row[1] for row in cur.fetchall()}

    new_card_cols = {
        "romaji": "TEXT DEFAULT ''",
        "part_of_speech": "TEXT DEFAULT ''",
        "tags": "TEXT DEFAULT ''",
        "audio_url": "TEXT DEFAULT ''",
    }
    for col, typedef in new_card_cols.items():
        if col not in card_cols:
            cur.execute(f"ALTER TABLE cards ADD COLUMN {col} {typedef}")
            print(f"  Added cards.{col}")

    # Get existing columns for sources table
    cur.execute("PRAGMA table_info(sources)")
    source_cols = {row[1] for row in cur.fetchall()}

    new_source_cols = {
        "source_type": "TEXT DEFAULT 'manual'",
        "uploaded_at": "DATETIME",
        "processed": "INTEGER DEFAULT 1",
        "raw_text": "TEXT DEFAULT ''",
    }
    for col, typedef in new_source_cols.items():
        if col not in source_cols:
            cur.execute(f"ALTER TABLE sources ADD COLUMN {col} {typedef}")
            print(f"  Added sources.{col}")

    conn.commit()
    conn.close()
    print("Phase 2 migration complete.")


if __name__ == "__main__":
    migrate()
