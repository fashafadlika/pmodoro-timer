import subprocess
import webbrowser
import time

# 1. Jalankan backend FastAPI
backend = subprocess.Popen(
    ["uvicorn", "main:app", "--reload"],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

print("Backend FastAPI running at http://127.0.0.1:8000")

# 2. Tunggu sebentar supaya server siap
time.sleep(2)

# 3. Jalankan simple HTTP server untuk frontend
frontend = subprocess.Popen(
    ["python", "-m", "http.server", "5500"],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

print("Frontend running at http://127.0.0.1:5500")

# 4. Buka browser otomatis ke frontend
webbrowser.open("http://127.0.0.1:5500/index.html")

# 5. Tunggu sampai user tekan CTRL+C untuk berhenti
try:
    backend.wait()
    frontend.wait()
except KeyboardInterrupt:
    print("Stopping servers...")
    backend.terminate()
    frontend.terminate()
