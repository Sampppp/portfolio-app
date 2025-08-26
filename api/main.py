from fastapi import FastAPI
import psycopg2

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Backend is running"}

@app.get("/photos")
def get_photos():
    # For now, just return a stub list
    return [
        {"id": 1, "title": "Sunset", "file_path": "/photos/sunset.jpg"},
        {"id": 2, "title": "Mountains", "file_path": "/photos/mountains.jpg"},
    ]
