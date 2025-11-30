// ------------------- TIMER VARIABLES -------------------
let timerInterval = null;
let isRunning = false;
let currentRound = 1;
let totalRounds = 4;
let totalSessions = 1;
let isFocusMode = true;

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
const roundsDisplay = document.getElementById("roundsDisplay");

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

    const roundsInput = document.getElementById("rounds");
    if(roundsInput) {
        totalRounds = parseInt(roundsInput.value);
    }

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

async function handleAutoRound() {
    clearInterval(timerInterval);

    const activeIndex = Array.from(modeButtons).findIndex(btn => btn.classList.contains("active"));

    // pindah mode
    let nextModeIndex = 0; 

    if (activeIndex === 0) { 
        console.log(`Ronde ${currentRound} selesai.`);
        
        if (currentRound < totalRounds) {
            nextModeIndex = 1;
            updateRoundDisplay();
            alert("Fokus selesai! Waktunya istirahat pendek.");
        } else {
            nextModeIndex = 2;
            currentRound = 0;
            updateRoundDisplay();
            alert("Selamat! Semua ronde selesai. Istirahat panjang!");
        }
    } else {
        nextModeIndex = 0;
        if (currentRound === 0) currentRound = 1; 
        else currentRound++;
        totalSessions++;
        document.getElementById("totalDisplay").textContent = `#${totalSessions}`;
        updateRoundDisplay();
        alert("Istirahat selesai! Kembali fokus.");
        
    }

    // --- EKSEKUSI PERPINDAHAN ---
    modeButtons.forEach(b => b.classList.remove("active"));
    modeButtons[nextModeIndex].classList.add("active");

    const newDuration = parseInt(modeButtons[nextModeIndex].dataset.min);


    const success = await startTimerBackend(newDuration);
    
    if (success) {
        isRunning = true;
        startPauseBtn.textContent = "Pause";
        timerInterval = setInterval(updateTimer, 1000);
        updateTimer();
    }
}

// ------------------- TIMER UPDATE LOOP -------------------
async function updateTimer() {
    const seconds = await getRemainingTime();
    updateDisplay(seconds);

    // --- pindah ronde ---
    if (seconds <= 0 && isRunning) {
        isRunning = false; 
        clearInterval(timerInterval);
        await handleAutoRound();
    }
}

//------------ ROUND DISPLAY -------------
function updateRoundDisplay() {
    const roundDisplay = document.getElementById("roundDisplay");
    const totalDisplay = document.getElementById("totalDisplay");

    if (roundDisplay) {
        if (currentRound === 0) {
            roundDisplay.textContent = "-";
        } else {
            roundDisplay.textContent = `#${currentRound}`; 
        }
    }
    if (totalDisplay) {
        totalDisplay.textContent = `#${totalSessions}`;
    }

}