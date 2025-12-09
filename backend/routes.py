from fastapi import APIRouter
from services import timer
from models import PomodoroSettings

router = APIRouter()

@router.post("/start")
def start_pomodoro(settings: PomodoroSettings):
    # Kirim duration hanya jika provided, biarkan None untuk resume
    timer.start(settings.duration)
    return {"status": "started"}

@router.post("/pause")
def pause_pomodoro():
    timer.pause()
    return {"status": "paused"}

@router.post("/reset")
def reset_pomodoro(settings: PomodoroSettings):
    timer.reset(settings.duration)
    return {"status": "reset", "remaining_seconds": timer.get_remaining_time()}

@router.get("/remaining")
def remaining_time():
    return {"remaining_seconds": timer.get_remaining_time()}