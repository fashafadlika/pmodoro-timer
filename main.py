from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from routes import router
import os

app = FastAPI()

# API routes
app.include_router(router, prefix="/api")

# Serve static files
app.mount("/static", StaticFiles(directory="."), name="static")

# Root path serve index.html
@app.get("/")
async def serve_index():
    return FileResponse("index.html")

# Serve other HTML/CSS/JS files
@app.get("/{filename}")
async def serve_static(filename: str):
    if filename.endswith((".html", ".css", ".js", ".png", ".jpg", ".ico")):
        return FileResponse(filename)
    return {"error": "File not found"}

port = int(os.environ.get("PORT", 8000))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=port)
