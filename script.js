// ------------------- TIMER VARIABLES -------------------
let timerInterval = null;
let isRunning = false;
let currentRound = 1;
let totalRounds = 4;
let totalSessions = 1;
let timerHasStarted = false;
let isAutoSwitching = false;

const timerDisplay = document.getElementById("timer");
const startPauseBtn = document.getElementById("startPauseBtn");
const resetBtn = document.getElementById("resetBtn");
const modeButtons = document.querySelectorAll(".mode");

// ------------------- API URL LOKAL -------------------
const LOCAL_API = "http://127.0.0.1:8000";

// ------------------- UPDATE DISPLAY -------------------
function updateDisplay(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    timerDisplay.textContent = `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

// ------------------- BACKEND FUNCTIONS -------------------
async function getRemainingTime() {
    try {
        const res = await fetch(`${LOCAL_API}/api/remaining`);
        const data = await res.json();
        return data.remaining_seconds;
    } catch (err) {
        console.error("Error:", err);
        return 25 * 60;
    }
}

async function startTimerBackend(duration = null) {
    try {
        const url = duration !== null 
            ? `${LOCAL_API}/api/start?duration=${duration}`
            : `${LOCAL_API}/api/start`;
        
        await fetch(url, {
            method: "POST",
            headers: {"Content-Type": "application/json"}
        });
        return true;
    } catch (err) {
        console.error("Start failed:", err);
        return false;
    }
}

async function pauseTimerBackend() {
    try {
        await fetch(`${LOCAL_API}/api/pause`, {
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
        const duration = parseInt(activeMode.dataset.min);

        const res = await fetch(`${LOCAL_API}/api/reset?duration=${duration}`, {
            method: "POST",
            headers: {"Content-Type": "application/json"}
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

    if (seconds <= 0 && isRunning && !isAutoSwitching) {
        clearInterval(timerInterval);
        isRunning = false;
        startPauseBtn.textContent = "Start";
        isAutoSwitching = true;
        
        // Langsung panggil handleAutoRound tanpa setTimeout
        await handleAutoRound();
        isAutoSwitching = false;
    }
}

// ------------------- AUTO ROUND -------------------
async function handleAutoRound() {
    const activeIndex = Array.from(modeButtons).findIndex(btn => btn.classList.contains("active"));
    let nextModeIndex = 0;
    let message = "";

    if (activeIndex === 0) { // Focus mode selesai
        if (currentRound < totalRounds) {
            nextModeIndex = 1; // Short break
            currentRound++;
            message = "Fokus selesai! Waktunya istirahat pendek.";
        } else {
            nextModeIndex = 2; // Long break
            currentRound = 1;
            message = "Selamat! Semua ronde selesai. Istirahat panjang!";
        }
    } else { // Break mode selesai
        nextModeIndex = 0; // Kembali ke focus
        totalSessions++;
        document.getElementById("roundDisplay").textContent = `#${totalSessions}`;
        message = "Istirahat selesai! Kembali fokus.";
    }

    // Tampilkan alert
    if (message) {
        alert(message);
    }

    // Ganti mode
    modeButtons.forEach(b => b.classList.remove("active"));
    modeButtons[nextModeIndex].classList.add("active");

    // Reset timer dengan mode baru
    const newDuration = parseInt(modeButtons[nextModeIndex].dataset.min);
    await resetTimerBackend();
    
    // Update display dengan waktu baru
    updateDisplay(newDuration * 60);
    
    // LANGSUNG START TIMER BARU OTOMATIS
    const success = await startTimerBackend(newDuration);
    if (success) {
        isRunning = true;
        startPauseBtn.textContent = "Pause";
        timerHasStarted = true;
        timerInterval = setInterval(updateTimer, 1000);
        updateTimer(); // Panggil sekali untuk update display
    }
}

// ------------------- START / PAUSE -------------------
startPauseBtn.addEventListener("click", async () => {
    if (!isRunning) {
        // START atau RESUME
        let sendDuration = null;
        
        // Hanya kirim duration jika belum pernah start
        if (!timerHasStarted) {
            const activeMode = document.querySelector(".mode.active");
            sendDuration = parseInt(activeMode.dataset.min);
            timerHasStarted = true;
        }
        
        const success = await startTimerBackend(sendDuration);
        if (success) {
            isRunning = true;
            startPauseBtn.textContent = "Pause";
            timerInterval = setInterval(updateTimer, 1000);
            updateTimer();
        }
    } else {
        // PAUSE
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
    timerHasStarted = false;
    updateDisplay(remaining);
    
    // Reset round counter
    currentRound = 1;
    totalSessions = 1;
    document.getElementById("roundDisplay").textContent = "#1";
});

// ------------------- MODE BUTTONS -------------------
modeButtons.forEach(btn => {
    btn.addEventListener("click", async () => {
        modeButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        clearInterval(timerInterval);
        isRunning = false;
        startPauseBtn.textContent = "Start";
        timerHasStarted = false;

        const remaining = await resetTimerBackend();
        updateDisplay(remaining);
        
        // Reset round counter saat ganti mode manual
        currentRound = 1;
        totalSessions = 1;
        document.getElementById("roundDisplay").textContent = "#1";
    });
});

// ------------------- SETTINGS PANEL -------------------
const focusInput = document.getElementById("focusInput");
const shortInput = document.getElementById("shortInput");
const longInput = document.getElementById("longInput");
const applyBtn = document.getElementById("applyBtn");
const settingsPanel = document.getElementById("settingsPanel");
const openSettings = document.querySelector(".nav a");
const closeSettings = document.getElementById("closeSettings");

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
    timerHasStarted = false;

    const remaining = await resetTimerBackend();
    updateDisplay(remaining);
    
    // Reset round counter
    currentRound = 1;
    totalSessions = 1;
    document.getElementById("roundDisplay").textContent = "#1";

    settingsPanel.classList.remove("open");
});

// ------------------- INITIAL RENDER -------------------
(async () => {
    const remaining = await getRemainingTime();
    updateDisplay(remaining);
})();
