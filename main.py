from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router

app = FastAPI(title="Pomodoro API")

# CORS untuk izinkan akses dari Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://pomodoro-app.vercel.app",  # Domain Vercel nanti
        "http://localhost:3000",            # Untuk development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)