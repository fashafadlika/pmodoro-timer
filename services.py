import time
from threading import Thread, Lock

class PomodoroTimer:
    def __init__(self):
        self.remaining_seconds = 25 * 60
        self.running = False
        self.lock = Lock()
        self._thread = None
        self.is_paused = True  # Default dalam keadaan paused

    def start(self, duration=None):
        with self.lock:
            # Hanya set duration jika timer belum pernah dimulai atau sedang reset
            if duration is not None and not self._thread:
                self.remaining_seconds = duration * 60
            
            # Jika thread belum ada atau sudah mati, buat baru
            if self._thread is None or not self._thread.is_alive():
                self.running = True
                self.is_paused = False
                self._thread = Thread(target=self._run, daemon=True)
                self._thread.start()
            else:
                # Jika thread masih hidup, resume saja
                self.running = True
                self.is_paused = False

    def pause(self):
        with self.lock:
            self.running = False
            self.is_paused = True

    def reset(self, duration=None):
        with self.lock:
            if duration is not None:
                self.remaining_seconds = duration * 60
            self.running = False
            self.is_paused = True
            # Tidak perlu stop thread, biarkan mati sendiri

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
                    self.is_paused = True

# Instance global
timer = PomodoroTimer()
