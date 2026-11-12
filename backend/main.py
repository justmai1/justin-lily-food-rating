
from contextlib import asynccontextmanager
from datetime import date
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from database import get_connection, initialize_database


# Initialize database when FastAPI starts
@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    yield


app = FastAPI(lifespan=lifespan)


# Allow requests from React
# Allow requests from React
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://justin-lily-food-rating-4956.onrender.com"
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


# Expected data from React
class RestaurantCreate(BaseModel):
    restaurant_name: str = Field(min_length=1)
    address: str = Field(min_length=1)
    cuisine: str = Field(min_length=1)

    j_food_rating: float = Field(ge=0, le=10)
    j_vibe_rating: float = Field(ge=0, le=10)

    l_food_rating: float = Field(ge=0, le=10)
    l_vibe_rating: float = Field(ge=0, le=10)

    note: str = ""


# GET: Retrieve restaurants from SQLite
@app.get("/ratings")
def get_ratings():
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT *
            FROM rating
            ORDER BY ovr_rating DESC;
        """).fetchall()

    return [dict(row) for row in rows]


# POST: Save a new restaurant
@app.post("/ratings", status_code=201)
def add_rating(restaurant: RestaurantCreate):

    if not all([
        restaurant.restaurant_name.strip(),
        restaurant.address.strip(),
        restaurant.cuisine.strip()
    ]):
        raise HTTPException(
            status_code=422,
            detail="Name, address, and cuisine are required"
        )

    with get_connection() as conn:

        cursor = conn.execute("""
            INSERT INTO rating (
                rating_date,
                restaurant_name,
                address,
                cuisine,
                j_food_rating,
                j_vibe_rating,
                l_food_rating,
                l_vibe_rating,
                note
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            date.today().isoformat(),
            restaurant.restaurant_name.strip(),
            restaurant.address.strip(),
            restaurant.cuisine.strip(),
            restaurant.j_food_rating,
            restaurant.j_vibe_rating,
            restaurant.l_food_rating,
            restaurant.l_vibe_rating,
            restaurant.note
        ))

        new_id = cursor.lastrowid

        # Retrieve generated ratings from SQLite
        saved = conn.execute("""
            SELECT *
            FROM rating
            WHERE rating_id = ?
        """, (new_id,)).fetchone()

        result = dict(saved)

    return result

@app.delete("/ratings/{rating_id}")
def delete_rating(rating_id: int):
    with get_connection() as conn:
        cursor = conn.execute(
            "DELETE FROM rating WHERE rating_id = ?",
            (rating_id,)
        )

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Restaurant not found"
            )

    return {"message": "Restaurant deleted successfully"}