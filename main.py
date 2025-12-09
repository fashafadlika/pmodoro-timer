from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles  # IMPORT BARU
from routes import router
import os

app = FastAPI(title="Pomodoro API")

# === SERVING STATIC FILES (HTML, CSS, JS) ===
# Ini akan otomatis serve file frontend
app.mount("/", StaticFiles(directory=".", html=True), name="static")

# === API ROUTES ===
app.include_router(router, prefix="/api")

# Railway akan memberikan PORT via environment variable
port = int(os.environ.get("PORT", 8000))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=port)