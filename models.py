from pydantic import BaseModel

class PomodoroSettings(BaseModel):
    mode: str
    duration: int
    rounds: int
