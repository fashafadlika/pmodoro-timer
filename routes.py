from fastapi import APIRouter
from services import timer

router = APIRouter()

@router.post("/start")
def start_pomodoro(duration: int = None):
    # Kirim duration hanya jika memang ingin set waktu baru
    # Jika duration=None, maka akan resume dari waktu tersisa
    timer.start(duration)
    return {"status": "started"}

@router.post("/pause")
def pause_pomodoro():
    timer.pause()
    return {"status": "paused"}

@router.post("/reset")
def reset_pomodoro(duration: int = None):
    timer.reset(duration)
    return {"status": "reset", "remaining_seconds": timer.get_remaining_time()}

@router.get("/remaining")
def remaining_time():
    return {"remaining_seconds": timer.get_remaining_time()}
