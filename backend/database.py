
import sqlite3

conn = sqlite3.connect("rating.db")
cursor = conn.cursor()

cursor.execute("""
    CREATE TABLE IF NOT EXISTS rating (
        rating_id INTEGER PRIMARY KEY AUTOINCREMENT,
        rating_date DATE,
        restaurant_name TEXT,
        address TEXT,

        j_food_rating REAL CHECK(j_food_rating >= 0 AND j_food_rating <= 10),
        j_vibe_rating REAL CHECK(j_food_rating >= 0 AND j_food_rating <= 10),
        j_ovr_rating REAL GENERATED ALWAYS AS (
            (j_food_rating * 0.8) + (j_vibe_rating * 0.2)
        ) STORED,

        l_food_rating REAL CHECK(j_food_rating >= 0 AND j_food_rating <= 10),
        l_vibe_rating REAL CHECK(j_food_rating >= 0 AND j_food_rating <= 10),
        l_ovr_rating REAL GENERATED ALWAYS AS (
            (l_food_rating * 0.8) + (l_vibe_rating * 0.2)
        ) STORED,

        ovr_food_rating REAL GENERATED ALWAYS AS (
            (j_food_rating + l_food_rating) / 2.0
        ) STORED,

        ovr_vibe_rating REAL GENERATED ALWAYS AS (
            (j_vibe_rating + l_vibe_rating) / 2.0
        ) STORED,

        ovr_rating REAL GENERATED ALWAYS AS (
            (
                (j_food_rating * 0.8) +
                (j_vibe_rating * 0.2) +
                (l_food_rating * 0.8) +
                (l_vibe_rating * 0.2)
            ) / 2.0
        ) STORED,

        note TEXT
    )
""")

cursor.execute("""
    INSERT INTO rating (
        rating_date,
        restaurant_name,
        address,
        j_food_rating,
        j_vibe_rating,
        l_food_rating,
        l_vibe_rating,
        note
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
""", (
    "2026-11-12",
    "Example Restaurant",
    "123 Main St, Seattle, WA",
    4.0,
    7.0,
    8.0,
    9.0,
    "Great food and atmosphere!"
))


conn.commit()
conn.close()