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
const openSettings = document.querySelector(".nav a");
const closeSettings = document.getElementById("closeSettings");

// ------------------- UPDATE DISPLAY -------------------
function updateDisplay(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    timerDisplay.textContent = `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

// ------------------- BACKEND FUNCTIONS -------------------
async function getRemainingTime() {
    try {
        const res = await fetch("http://127.0.0.1:8000/api/remaining");
        const data = await res.json();
        return data.remaining_seconds;
    } catch (err) {
        console.error("Error fetching remaining time:", err);
        return 25 * 60;
    }
}

async function startTimerBackend(duration = null) {
    try {
        const activeMode = document.querySelector(".mode.active");
        const mode = activeMode.textContent.toLowerCase().replace(" ", "_");
        
        await fetch("http://127.0.0.1:8000/api/start", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                mode: mode, 
                duration: duration, // Kirim null untuk resume
                rounds: 1
            })
        });
        return true;
    } catch (err) {
        console.error("Start failed:", err);
        return false;
    }
}

async function pauseTimerBackend() {
    try {
        await fetch("http://127.0.0.1:8000/api/pause", {
            method: "POST",
            headers: {"Content-Type": "application/json"}
        });
        return true;
    } catch (err) {
        console.error("Pause failed:", err);
        return false;
    }
}

async function resetTimerBackend() {
    try {
        const activeMode = document.querySelector(".mode.active");
        const mode = activeMode.textContent.toLowerCase().replace(" ", "_");
        const duration = parseInt(activeMode.dataset.min);

        const res = await fetch("http://127.0.0.1:8000/api/reset", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                mode: mode, 
                duration: duration,
                rounds: 1
            })
        });
        const data = await res.json();
        return data.remaining_seconds;
    } catch (err) {
        console.error("Reset failed:", err);
        const activeMode = document.querySelector(".mode.active");
        return parseInt(activeMode.dataset.min) * 60;
    }
}

// ------------------- TIMER UPDATE LOOP -------------------
async function updateTimer() {
    const seconds = await getRemainingTime();
    updateDisplay(seconds);

    if (seconds <= 0 && isRunning) {
        clearInterval(timerInterval);
        isRunning = false;
        startPauseBtn.textContent = "Start";
    }
}

// ------------------- START / PAUSE -------------------
startPauseBtn.addEventListener("click", async () => {
    if (!isRunning) {
        // Start baru - kirim duration
        const activeMode = document.querySelector(".mode.active");
        const duration = parseInt(activeMode.dataset.min);
        
        const success = await startTimerBackend(duration);
        if (success) {
            isRunning = true;
            startPauseBtn.textContent = "Pause";
            timerInterval = setInterval(updateTimer, 1000);
            updateTimer();
        }
    } else {
        // Pause - tidak kirim duration
        const success = await pauseTimerBackend();
        if (success) {
            isRunning = false;
            startPauseBtn.textContent = "Start";
            clearInterval(timerInterval);
        }
    }
});

// ------------------- RESET -------------------
resetBtn.addEventListener("click", async () => {
    const remaining = await resetTimerBackend();

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

        const remaining = await resetTimerBackend();
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
    const focusMinutes = parseInt(focusInput.value);
    const shortMinutes = parseInt(shortInput.value);
    const longMinutes = parseInt(longInput.value);

    modeButtons[0].dataset.min = focusMinutes;
    modeButtons[1].dataset.min = shortMinutes;
    modeButtons[2].dataset.min = longMinutes;

    clearInterval(timerInterval);
    isRunning = false;
    startPauseBtn.textContent = "Start";

    const remaining = await resetTimerBackend();
    updateDisplay(remaining);

    settingsPanel.classList.remove("open");
});

// ------------------- INITIAL RENDER -------------------
(async () => {
    const remaining = await getRemainingTime();
    updateDisplay(remaining);
})();
