# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router
import os

app = FastAPI(title="Pomodoro API")

# Dapatkan port dari environment variable (Railway akan menyediakan)
port = int(os.environ.get("PORT", 8000))

# Konfigurasi CORS untuk production
origins = [
    "https://your-frontend-app.vercel.app",  # Ganti dengan domain Vercel nanti
    "http://localhost:3000",  # Untuk development lokal
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=port)