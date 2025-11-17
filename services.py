import time
from threading import Thread, Lock

class PomodoroTimer:
    def __init__(self):
        self.remaining_seconds = 25 * 60
        self.running = False
        self.lock = Lock()

    def start(self, duration=None):
        with self.lock:
            if duration:
                self.remaining_seconds = duration * 60
            if not self.running:
                self.running = True
                Thread(target=self._run).start()

    def pause(self):
        with self.lock:
            self.running = False

    def reset(self, duration=None):
        with self.lock:
            if duration:
                self.remaining_seconds = duration * 60
            self.running = False

    def get_remaining_time(self):
        with self.lock:
            return self.remaining_seconds

    def _run(self):
        while self.running and self.remaining_seconds > 0:
            time.sleep(1)
            with self.lock:
                if self.running:
                    self.remaining_seconds -= 1

# Instance global
timer = PomodoroTimer()
