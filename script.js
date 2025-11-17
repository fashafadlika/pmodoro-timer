let timeLeft = 25 * 60;
let timerInterval = null;
let isRunning = false;

const timerDisplay = document.getElementById("timer");
const startPauseBtn = document.getElementById("startPauseBtn");
const resetBtn = document.getElementById("resetBtn");
const modeButtons = document.querySelectorAll(".mode");

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
            startPauseBtn.textContent = "Start";
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval);
}

startPauseBtn.addEventListener("click", () => {
    if (!isRunning) {
        startTimer();
        startPauseBtn.textContent = "Pause";
        isRunning = true;
    } else {
        pauseTimer();
        startPauseBtn.textContent = "Start";
        isRunning = false;
    }
});

resetBtn.addEventListener("click", () => {
    pauseTimer();
    isRunning = false;
    startPauseBtn.textContent = "Start";

    const activeMode = document.querySelector(".mode.active");
    timeLeft = parseInt(activeMode.dataset.min) * 60;

    updateDisplay();
});

modeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        modeButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        pauseTimer();
        isRunning = false;
        startPauseBtn.textContent = "Start";

        timeLeft = parseInt(btn.dataset.min) * 60;
        updateDisplay();
    });
});

updateDisplay();
