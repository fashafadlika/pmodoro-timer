    let focusMinutes = 25;
    let shortMinutes = 5;
    let longMinutes = 10;

    let timeLeft = 25 * 60;
    let timerInterval = null;
    let isRunning = false;

    const timerDisplay = document.getElementById("timer");
    const startPauseBtn = document.getElementById("startPauseBtn");
    const resetBtn = document.getElementById("resetBtn");
    const pomodoroBtn = document.getElementById("modeFocus");
    const shortBreakBtn = document.getElementById("modeShort");
    const longBreakBtn = document.getElementById("modeLong");
    const modeButtons = [pomodoroBtn, shortBreakBtn, longBreakBtn];

    const focusInput = document.getElementById("focusInput");
    const shortInput = document.getElementById("shortInput");
    const longInput = document.getElementById("longInput");
    const applyBtn = document.getElementById("applyBtn");

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

    // SETTINGS PANEL
    const settingsPanel = document.getElementById("settingsPanel");
    const openSettings = document.querySelector(".nav nav a");
    const closeSettings = document.getElementById("closeSettings");

    openSettings.addEventListener("click", (e) => {
        e.preventDefault();
        settingsPanel.classList.add("open");
    });

    closeSettings.addEventListener("click", () => {
        settingsPanel.classList.remove("open");
    });

    // UNTUK CUSTOM TIMER
    applyBtn.addEventListener("click", () => {
        focusMinutes = parseInt(focusInput.value);
        shortMinutes = parseInt(shortInput.value);
        longMinutes = parseInt(longInput.value);

        // Update data-min pada tombol mode
        document.querySelector('.mode[data-min="25"]').dataset.min = focusMinutes;
        document.querySelector('.mode[data-min="5"]').dataset.min = shortMinutes;
        document.querySelector('.mode[data-min="10"]').dataset.min = longMinutes;

        // Reset timer sesuai mode aktif
        const active = document.querySelector(".mode.active");
        timeLeft = parseInt(active.dataset.min) * 60;

        pauseTimer();
        isRunning = false;
        startPauseBtn.textContent = "Start";
        updateDisplay();

        // Tutup panel setelah apply
        settingsPanel.classList.remove("open");
    });

    updateDisplay();

