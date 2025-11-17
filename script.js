let timeLeft = 25 * 60; // default mode = 25 menit
let timerInterval = null;
let isRunning = false; // untuk toggle start/pause

const timerDisplay = document.getElementById("timer");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const modeButtons = document.querySelectorAll(".mode");

// --- Sembunyikan tombol pause karena kita gabungkan ke Start ---
pauseBtn.style.display = "none";

// ---------------- TIMER FUNCTIONS ----------------

function updateDisplay() {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    timerDisplay.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function startTimer() {
    timerInterval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateDisplay();
        } else {
            clearInterval(timerInterval);
            isRunning = false;
            startBtn.textContent = "Start";
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval);
}

// ---------------- BUTTON LOGIC ----------------

// Start/Pause digabung menjadi satu
startBtn.addEventListener("click", () => {
    if (!isRunning) {
        // Mode START
        startTimer();
        startBtn.textContent = "Pause";
        isRunning = true;
    } else {
        // Mode PAUSE
        pauseTimer();
        startBtn.textContent = "Start";
        isRunning = false;
    }
});

// Reset
resetBtn.addEventListener("click", () => {
    pauseTimer();
    isRunning = false;
    startBtn.textContent = "Start";

    // Reset berdasarkan mode aktif
    const activeMode = document.querySelector(".mode.active");
    timeLeft = parseInt(activeMode.dataset.min) * 60;

    updateDisplay();
});

// Ganti mode (25, 5, 15 menit)
modeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        modeButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        pauseTimer();
        isRunning = false;
        startBtn.textContent = "Start";

        timeLeft = parseInt(btn.dataset.min) * 60;
        updateDisplay();
    });
});

// Tampilkan waktu awal (25:00)
updateDisplay();
