"""Add anthropic_api_key column to users table."""
import sqlite3

DB_PATH = "nihongo.db"


def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check if column already exists
    cursor.execute("PRAGMA table_info(users)")
    columns = [row[1] for row in cursor.fetchall()]

    if "anthropic_api_key" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN anthropic_api_key TEXT DEFAULT ''")
        print("Added anthropic_api_key column to users table.")
    else:
        print("Column anthropic_api_key already exists.")

    conn.commit()
    conn.close()


if __name__ == "__main__":
    migrate()
