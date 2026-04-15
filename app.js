// ─── DATA ──────────────────────────────────────────────────────────────────
const EXERCISES = [
  { id: "trazioni",     name: "Trazioni",         icon: "↑", color: "#4d9fff" },
  { id: "traz_neg",     name: "Traz. Neg.",        icon: "↓", color: "#4d9fff" },
  { id: "australian",   name: "Australian",        icon: "→", color: "#4d9fff" },
  { id: "dip",          name: "Dip",               icon: "⊕", color: "#ff6b35" },
  { id: "diamond",      name: "Diamond PU",        icon: "◇", color: "#ff6b35" },
  { id: "pushup",       name: "Push-up",           icon: "△", color: "#ff6b35" },
  { id: "hollow",       name: "Hollow Body",       icon: "◌", color: "#a855f7" },
  { id: "affondi",      name: "Affondi",           icon: "›", color: "#a855f7" },
  { id: "altro",        name: "Altro",             icon: "•", color: "#888" },
];

const STORAGE_KEY = "calitracker_v1";

function loadData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch { return []; }
}
function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let sessions = loadData(); // [{id, date, exerciseId, series, reps, note, ts}]
let selectedExercise = EXERCISES[0];
let seriesVal = 3, repsVal = 8;

// ─── UTILS ─────────────────────────────────────────────────────────────────
function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function getEx(id) {
  return EXERCISES.find(e => e.id === id) || EXERCISES[EXERCISES.length - 1];
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ─── RENDER LOG ────────────────────────────────────────────────────────────
function renderLog() {
  const container = document.getElementById("session-list");
  const empty = document.getElementById("empty-log");
  container.innerHTML = "";

  const today = todayStr();
  const todaySessions = sessions.filter(s => s.date === today);
  const pastSessions = sessions.filter(s => s.date !== today);

  if (sessions.length === 0) {
    empty.style.display = "";
    return;
  }
  empty.style.display = "none";

  function renderGroup(list, label) {
    if (list.length === 0) return;
    const lbl = document.createElement("div");
    lbl.className = "date-group-label";
    lbl.textContent = label;
    container.appendChild(lbl);

    // Group by date within past
    const byDate = {};
    list.forEach(s => {
      (byDate[s.date] = byDate[s.date] || []).push(s);
    });

    Object.keys(byDate).sort((a, b) => b.localeCompare(a)).forEach(date => {
      if (label !== "Oggi") {
        const dl = document.createElement("div");
        dl.className = "date-group-label";
        dl.style.color = "#555";
        dl.style.marginTop = "14px";
        dl.textContent = new Date(date + "T12:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
        container.appendChild(dl);
      }
      byDate[date].slice().reverse().forEach(s => {
        const ex = getEx(s.exerciseId);
        const card = document.createElement("div");
        card.className = "session-card";
        card.innerHTML = `
          <div class="session-icon">${ex.icon}</div>
          <div class="session-info">
            <div class="session-name">${ex.name}</div>
            <div class="session-detail">${s.series} serie × ${s.reps} reps</div>
            ${s.note ? `<div class="session-note">💬 ${s.note}</div>` : ""}
          </div>
          <div class="session-badge">${s.series * s.reps}<br/><span style="font-size:10px;color:#555">tot</span></div>
          <button class="session-delete" data-id="${s.id}">✕</button>
        `;
        container.appendChild(card);
      });
    });
  }

  renderGroup(todaySessions, "Oggi");
  renderGroup(pastSessions, "Precedenti");

  container.querySelectorAll(".session-delete").forEach(btn => {
    btn.addEventListener("click", e => {
      const id = e.currentTarget.dataset.id;
      sessions = sessions.filter(s => s.id !== id);
      saveData(sessions);
      renderLog();
      renderStats();
    });
  });
}

// ─── MODAL ─────────────────────────────────────────────────────────────────
function buildExercisePicker() {
  const grid = document.getElementById("exercise-picker");
  grid.innerHTML = "";
  EXERCISES.forEach(ex => {
    const btn = document.createElement("button");
    btn.className = "ex-pick-btn" + (ex.id === selectedExercise.id ? " selected" : "");
    btn.innerHTML = `<span class="pick-icon">${ex.icon}</span><span class="pick-name">${ex.name}</span>`;
    btn.addEventListener("click", () => {
      selectedExercise = ex;
      grid.querySelectorAll(".ex-pick-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
    grid.appendChild(btn);
  });
}

function openModal() {
  buildExercisePicker();
  document.getElementById("series-val").textContent = seriesVal;
  document.getElementById("reps-val").textContent = repsVal;
  document.getElementById("note-input").value = "";
  document.getElementById("session-modal").classList.add("open");
}
function closeModal() {
  document.getElementById("session-modal").classList.remove("open");
}

document.getElementById("add-session-btn").addEventListener("click", openModal);
document.getElementById("modal-backdrop").addEventListener("click", closeModal);

document.querySelectorAll(".cnt-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.target;
    const dir = parseInt(btn.dataset.dir);
    if (target === "series") {
      seriesVal = Math.max(1, seriesVal + dir);
      document.getElementById("series-val").textContent = seriesVal;
    } else {
      repsVal = Math.max(1, repsVal + dir);
      document.getElementById("reps-val").textContent = repsVal;
    }
  });
});

document.getElementById("save-session-btn").addEventListener("click", () => {
  const note = document.getElementById("note-input").value.trim();
  const entry = {
    id: uid(),
    date: todayStr(),
    exerciseId: selectedExercise.id,
    series: seriesVal,
    reps: repsVal,
    note,
    ts: Date.now()
  };
  sessions.unshift(entry);
  saveData(sessions);
  closeModal();
  renderLog();
  renderStats();
});

// ─── STATS ─────────────────────────────────────────────────────────────────
function renderStats() {
  const grid = document.getElementById("stats-grid");
  const chartsContainer = document.getElementById("charts-container");
  const empty = document.getElementById("empty-stats");

  grid.innerHTML = "";
  chartsContainer.innerHTML = "";

  if (sessions.length === 0) {
    empty.style.display = "";
    return;
  }
  empty.style.display = "none";

  // Summary stats
  const totalSessions = sessions.length;
  const totalReps = sessions.reduce((s, e) => s + (e.series * e.reps), 0);

  const days = [...new Set(sessions.map(s => s.date))];
  const streak = calcStreak(days);

  const traz = sessions.filter(s => s.exerciseId === "trazioni");
  const bestTraz = traz.length ? Math.max(...traz.map(s => s.reps)) : 0;

  const statCards = [
    { label: "Sessioni Log", value: totalSessions, sub: "totali" },
    { label: "Rep Totali", value: totalReps, sub: "accumulate" },
    { label: "Giorni Attivi", value: days.length, sub: "con log" },
    { label: "Best Trazioni", value: bestTraz > 0 ? bestTraz : "—", sub: "in una serie" },
  ];

  statCards.forEach(s => {
    const card = document.createElement("div");
    card.className = "stat-card";
    card.innerHTML = `
      <div class="stat-label">${s.label}</div>
      <div class="stat-value">${s.value}</div>
      <div class="stat-sub">${s.sub}</div>
    `;
    grid.appendChild(card);
  });

  // Charts per exercise
  const exerciseIds = [...new Set(sessions.map(s => s.exerciseId))];
  exerciseIds.forEach(exId => {
    const ex = getEx(exId);
    const exSessions = sessions.filter(s => s.exerciseId === exId);
    if (exSessions.length < 2) return;

    // Group by date, take max reps
    const byDate = {};
    exSessions.forEach(s => {
      const prev = byDate[s.date] || 0;
      byDate[s.date] = Math.max(prev, s.reps);
    });

    const chartData = Object.keys(byDate).sort().slice(-14).map(date => ({
      date: new Date(date + "T12:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" }),
      reps: byDate[date]
    }));

    if (chartData.length < 2) return;

    const section = document.createElement("div");
    section.className = "chart-section";
    section.innerHTML = `
      <div class="chart-title">${ex.icon} ${ex.name}</div>
      <div class="chart-sub">Max reps per giorno (ultimi 14 giorni)</div>
      <canvas id="chart-${exId}" height="120"></canvas>
    `;
    chartsContainer.appendChild(section);

    // Draw with Canvas (no external deps)
    requestAnimationFrame(() => drawChart(`chart-${exId}`, chartData, ex.color));
  });
}

function calcStreak(days) {
  const sorted = days.sort((a, b) => b.localeCompare(a));
  if (!sorted.length) return 0;
  let streak = 0;
  let cur = new Date();
  for (let d of sorted) {
    const dd = new Date(d + "T12:00");
    const diff = Math.round((cur - dd) / 86400000);
    if (diff <= 1) { streak++; cur = dd; }
    else break;
  }
  return streak;
}

function drawChart(canvasId, data, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.offsetWidth;
  const H = 120;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  const pad = { top: 10, right: 16, bottom: 30, left: 28 };
  const iW = W - pad.left - pad.right;
  const iH = H - pad.top - pad.bottom;

  const vals = data.map(d => d.reps);
  const minV = Math.max(0, Math.min(...vals) - 1);
  const maxV = Math.max(...vals) + 1;

  const xStep = iW / (data.length - 1);
  const yScale = v => pad.top + iH - ((v - minV) / (maxV - minV)) * iH;
  const xScale = i => pad.left + i * xStep;

  // Grid
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i++) {
    const y = pad.top + (iH / 3) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + iW, y);
    ctx.stroke();
  }

  // Gradient fill
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + iH);
  grad.addColorStop(0, color + "44");
  grad.addColorStop(1, color + "00");

  ctx.beginPath();
  data.forEach((d, i) => {
    const x = xScale(i), y = yScale(d.reps);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.lineTo(xScale(data.length - 1), pad.top + iH);
  ctx.lineTo(xScale(0), pad.top + iH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  data.forEach((d, i) => {
    const x = xScale(i), y = yScale(d.reps);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Dots
  data.forEach((d, i) => {
    const x = xScale(i), y = yScale(d.reps);
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fillStyle = "#111";
    ctx.fill();
  });

  // X labels (only first, middle, last)
  ctx.fillStyle = "#555";
  ctx.font = `${10 * dpr / dpr}px DM Mono, monospace`;
  ctx.textAlign = "center";
  const labelIdx = [0, Math.floor((data.length - 1) / 2), data.length - 1];
  labelIdx.forEach(i => {
    ctx.fillText(data[i].date, xScale(i), H - 8);
  });

  // Y label (max)
  ctx.fillStyle = "#555";
  ctx.textAlign = "right";
  ctx.fillText(maxV, pad.left - 4, pad.top + 4);
  ctx.fillText(minV, pad.left - 4, pad.top + iH + 4);
}

// ─── NAVIGATION ────────────────────────────────────────────────────────────
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${tab}`).classList.add("active");
    if (tab === "stats") renderStats();
  });
});

// ─── CLEAR DATA ────────────────────────────────────────────────────────────
document.getElementById("clear-data-btn").addEventListener("click", () => {
  if (confirm("Eliminare tutti i dati? Non si può annullare.")) {
    sessions = [];
    saveData(sessions);
    renderLog();
    renderStats();
  }
});

// ─── HEADER DATE ───────────────────────────────────────────────────────────
document.getElementById("today-date").textContent = new Date().toLocaleDateString("it-IT", {
  weekday: "long", day: "numeric", month: "long"
});

// ─── INIT ──────────────────────────────────────────────────────────────────
renderLog();
