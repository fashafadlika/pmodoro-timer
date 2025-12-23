// ================= TIMER VARIABLES =================
let timerInterval = null;
let isRunning = false;
let currentRound = 1;
let totalRounds = 4;
let totalSessions = 1;
let timerHasStarted = false;
let isAutoSwitching = false;

// 🔒 LOCK TASK PER FOCUS
let taskReducedThisFocus = false;

const timerDisplay = document.getElementById("timer");
const startPauseBtn = document.getElementById("startPauseBtn");
const resetBtn = document.getElementById("resetBtn");
const modeButtons = document.querySelectorAll(".mode");

// ================= API =================
const LOCAL_API = "http://127.0.0.1:8000";

// ================= DISPLAY =================
function updateDisplay(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    timerDisplay.textContent =
        `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

// ================= BACKEND =================
async function getRemainingTime() {
    try {
        const r = await fetch(`${LOCAL_API}/api/remaining`);
        const d = await r.json();
        return d.remaining_seconds;
    } catch {
        return 25 * 60;
    }
}

async function startTimerBackend(duration = null) {
    const url = duration !== null
        ? `${LOCAL_API}/api/start?duration=${duration}`
        : `${LOCAL_API}/api/start`;
    await fetch(url, { method: "POST" });
}

async function pauseTimerBackend() {
    await fetch(`${LOCAL_API}/api/pause`, { method: "POST" });
}

async function resetTimerBackend() {
    const active = document.querySelector(".mode.active");
    const d = parseInt(active.dataset.min);
    const r = await fetch(`${LOCAL_API}/api/reset?duration=${d}`, { method: "POST" });
    const j = await r.json();
    return j.remaining_seconds;
}

// ================= TIMER LOOP =================
async function updateTimer() {
    const seconds = await getRemainingTime();
    updateDisplay(seconds);

    if (seconds <= 0 && isRunning && !isAutoSwitching) {
        clearInterval(timerInterval);
        isRunning = false;
        isAutoSwitching = true;
        await handleAutoRound();
        isAutoSwitching = false;
    }
}

// ================= AUTO ROUND =================
async function handleAutoRound() {
    const activeIndex =
        [...modeButtons].findIndex(b => b.classList.contains("active"));
    let next = 0;

    // ================= FOCUS SELESAI =================
    if (activeIndex === 0) {
        reduceTaskRound(); // 🔥 1 focus = -1 ronde

        if (currentRound < totalRounds) {
            next = 1; // short break
            currentRound++;
            alert("Fokus selesai! Istirahat pendek.");
        } else {
            next = 2; // long break
            currentRound = 1;
            alert("Semua ronde selesai! Istirahat panjang.");
        }
    }
    // ================= BREAK SELESAI =================
    else {
        next = 0; // balik ke focus
        totalSessions++;
        document.getElementById("roundDisplay").textContent = `#${totalSessions}`;

        // 🔓 RESET LOCK PAS MASUK FOCUS BARU
        taskReducedThisFocus = false;

        alert("Istirahat selesai! Kembali fokus.");
    }

    modeButtons.forEach(b => b.classList.remove("active"));
    modeButtons[next].classList.add("active");

    const dur = parseInt(modeButtons[next].dataset.min);
    await resetTimerBackend();
    updateDisplay(dur * 60);

    await startTimerBackend(dur);
    isRunning = true;
    startPauseBtn.textContent = "Pause";
    timerInterval = setInterval(updateTimer, 1000);
}

// ================= START / PAUSE =================
startPauseBtn.onclick = async () => {
    if (!isRunning) {
        let d = null;
        if (!timerHasStarted) {
            d = parseInt(document.querySelector(".mode.active").dataset.min);
            timerHasStarted = true;
        }
        await startTimerBackend(d);
        isRunning = true;
        startPauseBtn.textContent = "Pause";
        timerInterval = setInterval(updateTimer, 1000);
    } else {
        await pauseTimerBackend();
        isRunning = false;
        startPauseBtn.textContent = "Start";
        clearInterval(timerInterval);
    }
};

// ================= RESET =================
resetBtn.onclick = async () => {
    const r = await resetTimerBackend();
    clearInterval(timerInterval);
    isRunning = false;
    timerHasStarted = false;
    taskReducedThisFocus = false;

    currentRound = 1;
    totalSessions = 1;
    document.getElementById("roundDisplay").textContent = "#1";
    startPauseBtn.textContent = "Start";
    updateDisplay(r);
};

// ================= MODE BUTTON =================
modeButtons.forEach(btn => {
    btn.onclick = async () => {
        modeButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        clearInterval(timerInterval);
        isRunning = false;
        timerHasStarted = false;
        taskReducedThisFocus = false;

        const r = await resetTimerBackend();
        updateDisplay(r);

        currentRound = 1;
        totalSessions = 1;
        document.getElementById("roundDisplay").textContent = "#1";
        startPauseBtn.textContent = "Start";
    };
});

// ================= SETTINGS PANEL =================
const openSettings = document.getElementById("openSettings");
const closeSettings = document.getElementById("closeSettings");
const settingsPanel = document.getElementById("settingsPanel");
const focusInput = document.getElementById("focusInput");
const shortInput = document.getElementById("shortInput");
const longInput = document.getElementById("longInput");
const applyBtn = document.getElementById("applyBtn");

openSettings.onclick = e => {
    e.preventDefault();
    settingsPanel.classList.add("open");
};
closeSettings.onclick = () => settingsPanel.classList.remove("open");

applyBtn.onclick = async () => {
    modeButtons[0].dataset.min = parseInt(focusInput.value);
    modeButtons[1].dataset.min = parseInt(shortInput.value);
    modeButtons[2].dataset.min = parseInt(longInput.value);

    clearInterval(timerInterval);
    isRunning = false;
    timerHasStarted = false;
    taskReducedThisFocus = false;

    const r = await resetTimerBackend();
    updateDisplay(r);

    currentRound = 1;
    totalSessions = 1;
    document.getElementById("roundDisplay").textContent = "#1";

    settingsPanel.classList.remove("open");
};

// ================= TASK FEATURE =================
const taskPanel = document.getElementById("taskPanel");
const openTasksBtn = document.getElementById("openTasks");
const closeTasksBtn = document.getElementById("closeTasks");
const taskInput = document.getElementById("taskInput");
const taskRoundInput = document.getElementById("taskRoundInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");

const TASK_KEY = "pmodoro_tasks";

openTasksBtn.onclick = e => {
    e.preventDefault();
    taskPanel.classList.add("open");
};
closeTasksBtn.onclick = () => taskPanel.classList.remove("open");

function loadTasks() {
    taskList.innerHTML = "";
    const t = JSON.parse(localStorage.getItem(TASK_KEY)) || [];
    t.forEach((x, i) => {
        const li = document.createElement("li");
        li.innerHTML =
            `<span>${x.text} (${x.left}/${x.total})</span><button>✕</button>`;
        li.querySelector("button").onclick = () => deleteTask(i);
        taskList.appendChild(li);
    });
}

function saveTasks(t) {
    localStorage.setItem(TASK_KEY, JSON.stringify(t));
    loadTasks();
}

addTaskBtn.onclick = () => {
    if (!taskInput.value.trim()) return;
    const ronde = parseInt(taskRoundInput.value);
    if (!ronde || ronde < 1) return;

    const t = JSON.parse(localStorage.getItem(TASK_KEY)) || [];
    t.push({ text: taskInput.value, total: ronde, left: ronde });

    taskInput.value = "";
    taskRoundInput.value = 1;
    saveTasks(t);
};

function deleteTask(i) {
    const t = JSON.parse(localStorage.getItem(TASK_KEY));
    t.splice(i, 1);
    saveTasks(t);
}

// 🔥 FIX BENAR: 1 FOCUS = -1
function reduceTaskRound() {
    if (taskReducedThisFocus) return;

    const t = JSON.parse(localStorage.getItem(TASK_KEY)) || [];
    if (!t.length) return;

    t[0].left -= 1;
    if (t[0].left <= 0) t.shift();

    saveTasks(t);
    taskReducedThisFocus = true;
}

loadTasks();
