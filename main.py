from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from routes import router
import os

app = FastAPI(title="Pomodoro Timer")

# ===== FIX: Serve index.html secara manual =====
@app.get("/", response_class=HTMLResponse)
async def read_root():
    try:
        with open("index.html", "r", encoding="utf-8") as f:
            html_content = f.read()
        return HTMLResponse(content=html_content)
    except FileNotFoundError:
        return HTMLResponse(content="<h1>index.html not found</h1>", status_code=404)

# Serve CSS, JS, dll sebagai static files
app.mount("/static", StaticFiles(directory="."), name="static")

# API routes
app.include_router(router, prefix="/api")

# ===== Handle CSS dan JS files =====
@app.get("/style.css", response_class=HTMLResponse)
async def serve_css():
    with open("style.css", "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read(), media_type="text/css")

@app.get("/script.js", response_class=HTMLResponse)
async def serve_js():
    with open("script.js", "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read(), media_type="application/javascript")

port = int(os.environ.get("PORT", 8000))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=port)

