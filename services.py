import time
from threading import Thread, Lock

class PomodoroTimer:
    def __init__(self):
        self.remaining_seconds = 25 * 60
        self.running = False
        self.lock = Lock()
        self._thread = None
        self.is_paused = False

    def start(self, duration=None):
        with self.lock:
            # Hanya set duration jika provided dan timer tidak sedang running
            if duration is not None and not self.running and not self.is_paused:
                self.remaining_seconds = duration * 60
                self.is_paused = False

            # Jika thread sudah mati, buat baru
            if not self._thread or not self._thread.is_alive():
                self.running = True
                self.is_paused = False
                self._thread = Thread(target=self._run, daemon=True)
                self._thread.start()
            else:
                # Jika thread masih hidup, cukup set running ke True (resume)
                self.running = True
                self.is_paused = False

    def pause(self):
        with self.lock:
            self.running = False
            self.is_paused = True

    def reset(self, duration=None):
        with self.lock:
            if duration:
                self.remaining_seconds = duration * 60
            self.running = False
            self.is_paused = False

    def get_remaining_time(self):
        with self.lock:
            return self.remaining_seconds

    def _run(self):
        while True:
            time.sleep(1)
            
            with self.lock:
                if self.running and self.remaining_seconds > 0:
                    self.remaining_seconds -= 1
                elif self.remaining_seconds <= 0:
                    self.running = False
                    self.is_paused = False

# Instance global
timer = PomodoroTimer()
