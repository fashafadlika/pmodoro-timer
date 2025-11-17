// ------------------- TIMER VARIABLES -------------------
let timerInterval = null;
let isRunning = false;

const timerDisplay = document.getElementById("timer");
const startPauseBtn = document.getElementById("startPauseBtn");
const resetBtn = document.getElementById("resetBtn");
const modeButtons = document.querySelectorAll(".mode");

// Settings panel
const focusInput = document.getElementById("focusInput");
const shortInput = document.getElementById("shortInput");
const longInput = document.getElementById("longInput");
const applyBtn = document.getElementById("applyBtn");
const settingsPanel = document.getElementById("settingsPanel");
const openSettings = document.querySelector(".nav nav a");
const closeSettings = document.getElementById("closeSettings");

// ------------------- UPDATE DISPLAY -------------------
function updateDisplay(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    timerDisplay.textContent = `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

// ------------------- BACKEND FUNCTIONS -------------------
async function startTimerBackend(mode, duration) {
    await fetch("http://127.0.0.1:8000/api/start", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({mode, duration, rounds: 1})
    });
}

async function pauseTimerBackend() {
    await fetch("http://127.0.0.1:8000/api/pause", { method: "POST" });
}

async function resetTimerBackend(mode, duration) {
    const res = await fetch("http://127.0.0.1:8000/api/reset", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({mode, duration, rounds: 1})
    });
    const data = await res.json();
    return data.remaining_seconds;
}

async function getRemainingTime() {
    try {
        const res = await fetch("http://127.0.0.1:8000/api/remaining");
        const data = await res.json();
        return data.remaining_seconds;
    } catch (err) {
        console.error("Error fetching remaining time:", err);
        return 0;
    }
}

// ------------------- TIMER UPDATE LOOP -------------------
async function updateTimer() {
    const seconds = await getRemainingTime();
    updateDisplay(seconds);

    if (seconds <= 0) {
        clearInterval(timerInterval);
        isRunning = false;
        startPauseBtn.textContent = "Start";
    }
}

// ------------------- START / PAUSE -------------------
startPauseBtn.addEventListener("click", async () => {
    const activeMode = document.querySelector(".mode.active");
    const mode = activeMode.textContent.toLowerCase().replace(" ", "_");
    const duration = parseInt(activeMode.dataset.min);

    if (!isRunning) {
        await startTimerBackend(mode, duration);
        isRunning = true;
        startPauseBtn.textContent = "Pause";

        timerInterval = setInterval(updateTimer, 1000);
        updateTimer();
    } else {
        await pauseTimerBackend();
        isRunning = false;
        startPauseBtn.textContent = "Start";
        clearInterval(timerInterval);
    }
});

// ------------------- RESET -------------------
resetBtn.addEventListener("click", async () => {
    const activeMode = document.querySelector(".mode.active");
    const mode = activeMode.textContent.toLowerCase().replace(" ", "_");
    const duration = parseInt(activeMode.dataset.min);

    const remaining = await resetTimerBackend(mode, duration);

    clearInterval(timerInterval);
    isRunning = false;
    startPauseBtn.textContent = "Start";
    updateDisplay(remaining);
});

// ------------------- MODE BUTTONS -------------------
modeButtons.forEach(btn => {
    btn.addEventListener("click", async () => {
        modeButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        clearInterval(timerInterval);
        isRunning = false;
        startPauseBtn.textContent = "Start";

        const mode = btn.textContent.toLowerCase().replace(" ", "_");
        const duration = parseInt(btn.dataset.min);
        const remaining = await resetTimerBackend(mode, duration);
        updateDisplay(remaining);
    });
});

// ------------------- SETTINGS PANEL -------------------
openSettings.addEventListener("click", e => {
    e.preventDefault();
    settingsPanel.classList.add("open");
});
closeSettings.addEventListener("click", () => {
    settingsPanel.classList.remove("open");
});

// ------------------- CUSTOM TIMER -------------------
applyBtn.addEventListener("click", async () => {
    // Ambil nilai terbaru dari input
    const focusMinutes = parseInt(focusInput.value);
    const shortMinutes = parseInt(shortInput.value);
    const longMinutes = parseInt(longInput.value);

    // Update data-min tombol mode
    document.querySelector('.mode[data-min="25"]').dataset.min = focusMinutes;
    document.querySelector('.mode[data-min="5"]').dataset.min = shortMinutes;
    document.querySelector('.mode[data-min="10"]').dataset.min = longMinutes;

    // Reset timer sesuai mode aktif
    const activeMode = document.querySelector(".mode.active");
    const mode = activeMode.textContent.toLowerCase().replace(" ", "_");
    const duration = parseInt(activeMode.dataset.min);

    // Hentikan timer frontend & backend sebelum update
    clearInterval(timerInterval);
    isRunning = false;
    startPauseBtn.textContent = "Start";

    // Reset backend timer
    try {
        const remaining = await resetTimerBackend(mode, duration);
        updateDisplay(remaining);
    } catch (err) {
        console.error("Gagal reset backend timer:", err);
    }

    // Tutup panel settings
    settingsPanel.classList.remove("open");
});

// ------------------- INITIAL RENDER -------------------
(async () => {
    const remaining = await getRemainingTime();
    updateDisplay(remaining);
})();
