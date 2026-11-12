import sqlite3
from pathlib import Path

# Always use the database inside the backend folder
DB_PATH = Path(__file__).resolve().parent / "rating.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def initialize_database():
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS rating (
                rating_id INTEGER PRIMARY KEY AUTOINCREMENT,

                rating_date TEXT NOT NULL
                    DEFAULT (date('now')),

                restaurant_name TEXT NOT NULL,
                address TEXT NOT NULL,
                cuisine TEXT NOT NULL,

                j_food_rating REAL NOT NULL
                    CHECK (j_food_rating BETWEEN 0 AND 10),

                j_vibe_rating REAL NOT NULL
                    CHECK (j_vibe_rating BETWEEN 0 AND 10),

                j_ovr_rating REAL GENERATED ALWAYS AS (
                    j_food_rating * 0.8 +
                    j_vibe_rating * 0.2
                ) STORED,

                l_food_rating REAL NOT NULL
                    CHECK (l_food_rating BETWEEN 0 AND 10),

                l_vibe_rating REAL NOT NULL
                    CHECK (l_vibe_rating BETWEEN 0 AND 10),

                l_ovr_rating REAL GENERATED ALWAYS AS (
                    l_food_rating * 0.8 +
                    l_vibe_rating * 0.2
                ) STORED,

                ovr_food_rating REAL GENERATED ALWAYS AS (
                    (j_food_rating + l_food_rating) / 2.0
                ) STORED,

                ovr_vibe_rating REAL GENERATED ALWAYS AS (
                    (j_vibe_rating + l_vibe_rating) / 2.0
                ) STORED,

                ovr_rating REAL GENERATED ALWAYS AS (
                    (
                        j_food_rating * 0.8 +
                        j_vibe_rating * 0.2 +
                        l_food_rating * 0.8 +
                        l_vibe_rating * 0.2
                    ) / 2.0
                ) STORED,

                note TEXT
            )
        """)


if __name__ == "__main__":
    initialize_database()
    print("Database initialized successfully!")
