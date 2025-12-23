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
const activeTasksEl = document.getElementById("activeTasks");
const taskProgressEl = document.getElementById("taskProgress");

// ================= TASK EDIT VARIABLES =================
let currentEditingIndex = -1;
const editTaskModal = document.getElementById("editTaskModal");
const editTaskName = document.getElementById("editTaskName");
const editTaskRounds = document.getElementById("editTaskRounds");
const saveTaskBtn = document.getElementById("saveTaskBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const closeModalBtn = document.querySelector(".close-modal");

// ================= API =================
const LOCAL_API = "http://127.0.0.1:8000";

// ================= TASK MANAGEMENT =================
const TASK_KEY = "pmodoro_tasks";

// ================= DISPLAY =================
function updateDisplay(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    timerDisplay.textContent =
        `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

// ================= DISPLAY TASKS DI BAWAH TIMER =================
function displayActiveTasks() {
    const tasks = JSON.parse(localStorage.getItem(TASK_KEY)) || [];
    
    if (tasks.length === 0) {
        activeTasksEl.innerHTML = '<div class="no-tasks">No active tasks. Add tasks in the Tasks panel!</div>';
        taskProgressEl.innerHTML = '';
        return;
    }
    
    // Tampilkan maksimal 3 task teratas
    const displayTasks = tasks.slice(0, 3);
    
    activeTasksEl.innerHTML = displayTasks.map((task, index) => `
        <div class="task-item-display" data-index="${index}">
            <div class="task-name">${task.text}</div>
            <div class="task-rounds">
                <span class="rounds-left">${task.left}</span>
                <span class="rounds-total">/${task.total}</span>
                <span class="task-label">rounds</span>
            </div>
            <div class="task-progress-bar">
                <div class="progress-fill" style="width: ${(task.left / task.total) * 100}%"></div>
            </div>
            <div class="task-actions-display">
                <button class="edit-task-btn" title="Edit task">✎</button>
            </div>
        </div>
    `).join('');
    
    // Tambah event listener untuk edit button
    document.querySelectorAll('.edit-task-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const taskIndex = parseInt(this.closest('.task-item-display').getAttribute('data-index'));
            openEditModal(taskIndex);
        });
    });
    
    // Hitung total progress
    const totalRounds = tasks.reduce((sum, task) => sum + task.total, 0);
    const remainingRounds = tasks.reduce((sum, task) => sum + task.left, 0);
    const progressPercent = totalRounds > 0 ? ((totalRounds - remainingRounds) / totalRounds) * 100 : 0;
    
    taskProgressEl.innerHTML = `
        <div class="progress-summary">
            <span>Total Progress:</span>
            <span class="progress-text">${Math.round(progressPercent)}%</span>
        </div>
        <div class="overall-progress-bar">
            <div class="overall-progress-fill" style="width: ${progressPercent}%"></div>
        </div>
        <div class="tasks-count">
            <span>${tasks.length} task${tasks.length > 1 ? 's' : ''} • ${remainingRounds}/${totalRounds} rounds remaining</span>
        </div>
    `;
    
    // Jika ada lebih dari 3 task, tambah indicator
    if (tasks.length > 3) {
        activeTasksEl.innerHTML += `
            <div class="more-tasks">
                +${tasks.length - 3} more tasks...
            </div>
        `;
    }
}

// ================= EDIT TASK FUNCTIONS =================
function openEditModal(taskIndex) {
    const tasks = JSON.parse(localStorage.getItem(TASK_KEY)) || [];
    if (taskIndex < 0 || taskIndex >= tasks.length) return;
    
    const task = tasks[taskIndex];
    currentEditingIndex = taskIndex;
    
    editTaskName.value = task.text;
    editTaskRounds.value = task.total;
    
    editTaskModal.classList.add('open');
}

function closeEditModal() {
    editTaskModal.classList.remove('open');
    currentEditingIndex = -1;
    editTaskName.value = '';
    editTaskRounds.value = 1;
}

function saveTaskChanges() {
    if (currentEditingIndex === -1) return;
    
    const tasks = JSON.parse(localStorage.getItem(TASK_KEY)) || [];
    if (currentEditingIndex >= tasks.length) return;
    
    const newName = editTaskName.value.trim();
    const newTotal = parseInt(editTaskRounds.value);
    
    if (!newName || newTotal < 1) {
        alert("Please fill all fields correctly!");
        return;
    }
    
    // Simpan ronde tersisa yang lama
    const oldLeft = tasks[currentEditingIndex].left;
    
    // Jika total ronde baru lebih kecil dari ronde tersisa, 
    // sesuaikan ronde tersisa dengan total baru
    const newLeft = Math.min(oldLeft, newTotal);
    
    tasks[currentEditingIndex] = {
        text: newName,
        total: newTotal,
        left: newLeft
    };
    
    localStorage.setItem(TASK_KEY, JSON.stringify(tasks));
    loadTasks();
    closeEditModal();
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

openTasksBtn.onclick = e => {
    e.preventDefault();
    taskPanel.classList.add("open");
    loadTasks();
};
closeTasksBtn.onclick = () => taskPanel.classList.remove("open");

function loadTasks() {
    taskList.innerHTML = "";
    const t = JSON.parse(localStorage.getItem(TASK_KEY)) || [];
    t.forEach((x, i) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span class="task-text">${x.text} (${x.left}/${x.total})</span>
            <div class="task-actions">
                <button class="edit-btn" title="Edit task">✎</button>
                <button class="delete-btn">✕</button>
            </div>
        `;
        
        // Edit button
        li.querySelector('.edit-btn').onclick = (e) => {
            e.stopPropagation();
            openEditModal(i);
        };
        
        // Delete button
        li.querySelector('.delete-btn').onclick = (e) => {
            e.stopPropagation();
            deleteTask(i);
        };
        
        // Click on task to edit
        li.querySelector('.task-text').onclick = () => {
            openEditModal(i);
        };
        
        taskList.appendChild(li);
    });
    
    // Update display tasks di bawah timer
    displayActiveTasks();
}

function saveTasks(t) {
    localStorage.setItem(TASK_KEY, JSON.stringify(t));
    loadTasks();
    displayActiveTasks(); // Update display
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
    if (!t || t.length <= i) return;
    
    if (confirm(`Delete task "${t[i].text}"?`)) {
        t.splice(i, 1);
        saveTasks(t);
    }
}

// ================= EDIT MODAL EVENTS =================
saveTaskBtn.onclick = saveTaskChanges;
cancelEditBtn.onclick = closeEditModal;
closeModalBtn.onclick = closeEditModal;

// Close modal when clicking outside
editTaskModal.onclick = (e) => {
    if (e.target === editTaskModal) {
        closeEditModal();
    }
};

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && editTaskModal.classList.contains('open')) {
        closeEditModal();
    }
});

// Round controls
document.querySelectorAll('.round-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const input = this.parentElement.querySelector('input');
        let value = parseInt(input.value) || 0;
        
        if (this.classList.contains('plus')) {
            input.value = value + 1;
        } else if (this.classList.contains('minus') && value > 1) {
            input.value = value - 1;
        }
    });
});

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

// Initial load
loadTasks();

// Update tasks display setiap 5 detik untuk sinkronisasi
setInterval(() => {
    displayActiveTasks();
}, 5000);
