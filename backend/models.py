from typing import Optional
from pydantic import BaseModel

class PomodoroSettings(BaseModel):
    mode: str
    duration: Optional[int] = None  # Bisa None untuk resume
    rounds: int