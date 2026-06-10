const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const ui = {
  startScreen: document.getElementById("startScreen"),
  gameScreen: document.getElementById("gameScreen"),
  playButton: document.getElementById("playButton"),
  playerNameDisplay: document.getElementById("playerNameDisplay"),
  playerClassDisplay: document.getElementById("playerClassDisplay"),
  phaseNameLabel: document.getElementById("phaseNameLabel"),
  phaseGoalLabel: document.getElementById("phaseGoalLabel"),
  resumeButton: document.getElementById("resumeButton"),
  phaseLabel: document.getElementById("phaseLabel"),
  componentLabel: document.getElementById("componentLabel"),
  score: document.getElementById("score"),
  bestScore: document.getElementById("bestScore"),
  scoreMeter: document.getElementById("scoreMeter"),
  timer: document.getElementById("timer"),
  statusText: document.getElementById("statusText"),
  tutorialButton: document.getElementById("tutorialButton"),
  contrastButton: document.getElementById("contrastButton"),
  fontButton: document.getElementById("fontButton"),
  audioButton: document.getElementById("audioButton"),
  tutorialModal: document.getElementById("tutorialModal"),
  difficultyModal: document.getElementById("difficultyModal"),
  quizModal: document.getElementById("quizModal"),
  quizStep: document.getElementById("quizStep"),
  quizTitle: document.getElementById("quizTitle"),
  quizQuestion: document.getElementById("quizQuestion"),
  quizOptions: document.getElementById("quizOptions"),
  quizFeedback: document.getElementById("quizFeedback"),
  quizSubmit: document.getElementById("quizSubmit"),
  victoryModal: document.getElementById("victoryModal"),
  finalScore: document.getElementById("finalScore"),
  finalTime: document.getElementById("finalTime"),
  finalCorrect: document.getElementById("finalCorrect"),
  answerSummary: document.getElementById("answerSummary"),
  menuButton: document.getElementById("menuButton")
};

const settings = {
  "Fácil": { speed: 180, radius: 17, wall: "#6ee77e", trace: "#6ee77e" },
  "Médio": { speed: 150, radius: 16, wall: "#ffcc66", trace: "#ffcc66" },
  "Difícil": { speed: 126, radius: 15, wall: "#ff6b8a", trace: "#ff6b8a" }
};

let data;
let currentUser = null;
let currentDiff = "Médio";
let currentLevel = 0;
let rawScore = 0;
let bestScore = 0;
let levelStartedAt = 0;
let gameStartedAt = 0;
let finalElapsedMs = 0;
let isPaused = true;
let scoreSent = false;
let selectedOption = null;
let focusedOptionIndex = 0;
let focusedDifficultyIndex = 0;
let quizState = "answer";
let currentQuestion = 0;
let answerLog = [];
let audioEnabled = true;
let audioContext = null;
let ambientNodes = null;
let ambientTimer = null;
let ambientStep = 0;
let saveKey = "labirinto_progresso_pacote_de_dados";
let recordKey = "labirinto_recorde_pacote_de_dados";
let lastFrame = performance.now();

const tileSize = 64;
const boardOffsetY = 64;
const player = {
  x: tileSize * 1.5,
  y: tileSize * 1.5,
  vx: 0,
  vy: 0,
  angle: 0,
  bob: 0,
  moving: false,
  trail: []
};

const keys = new Set();

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizedScore() {
  return clamp(Math.round(rawScore), 0, 100);
}

function totalQuestions() {
  const quizzes = data?.quizzes?.[currentDiff] || [];
  return quizzes.reduce((total, phaseQuestions) => total + phaseQuestions.length, 0);
}

function pointsPerQuestion() {
  const total = totalQuestions();
  return total ? 100 / total : 0;
}

function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function getPlatformDifficulty() {
  return currentDiff;
}

function isHighContrast() {
  return document.body.classList.contains("high-contrast");
}

function canvasTheme() {
  if (isHighContrast()) {
    return {
      background: "#000000",
      grid: "rgba(255,255,255,0.16)",
      floor: "#00ffff",
      floorFill: "#000000",
      wall: "#ffffff",
      wallFill: "#ffffff",
      wallDetail: "#000000",
      component: "#ffff00",
      componentFill: "#000000",
      packet: "#ff66ff",
      packetText: "#000000",
      banner: "rgba(0,0,0,0.92)",
      text: "#ffffff"
    };
  }

  const config = settings[currentDiff] || settings["Médio"];
  return {
    background: "#061113",
    grid: "rgba(95, 245, 221, 0.10)",
    floor: config.trace,
    floorFill: "#061113",
    wall: config.wall,
    wallFill: "#0b2026",
    wallDetail: "rgba(255, 255, 255, 0.13)",
    component: "#b68cff",
    componentFill: "#142930",
    packet: "#8fb3ff",
    packetText: "#061113",
    banner: "rgba(6, 17, 19, 0.78)",
    text: "#edf7f5"
  };
}

function sendFinalScore({ score, difficulty } = {}) {
  if (scoreSent) return;

  try {
    window.parent.postMessage({
      type: "C4A_GAME_SCORE",
      payload: { score, difficulty }
    }, "*");

    scoreSent = true;
  } catch (error) {
    console.log("Falha ao enviar score:", error?.message || error);
  }
}

function ensureAudioContext() {
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

function startAmbientMusic() {
  if (!audioEnabled || ambientNodes) return;

  try {
    const context = ensureAudioContext();
    const master = context.createGain();
    const highpass = context.createBiquadFilter();
    const lowpass = context.createBiquadFilter();
    const now = context.currentTime;

    highpass.type = "highpass";
    highpass.frequency.setValueAtTime(220, now);
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(2400, now);
    master.gain.setValueAtTime(0.42, now);

    master.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(context.destination);
    ambientNodes = { master, highpass, lowpass };
    playAmbientNote();
    ambientTimer = window.setInterval(playAmbientNote, 1650);
  } catch {
    audioEnabled = false;
  }
}

function playAmbientNote() {
  if (!audioEnabled || !audioContext || audioContext.state !== "running" || !ambientNodes) return;

  const pattern = [
    392,
    493.88,
    null,
    587.33,
    659.25,
    null,
    523.25,
    440,
    null,
    587.33,
    493.88,
    null
  ];
  const frequency = pattern[ambientStep % pattern.length];
  ambientStep += 1;
  if (!frequency) return;

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.028, now + 0.035);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
  oscillator.connect(gain);
  gain.connect(ambientNodes.master);
  oscillator.start(now);
  oscillator.stop(now + 0.74);
}

function stopAmbientMusic() {
  if (!ambientNodes) return;

  const nodes = ambientNodes;
  try {
    const now = audioContext.currentTime;
    nodes.master.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  } catch {}

  if (ambientTimer) {
    window.clearInterval(ambientTimer);
    ambientTimer = null;
  }
  ambientNodes = null;

  window.setTimeout(() => {
    try {
      nodes.master.disconnect();
      nodes.highpass.disconnect();
      nodes.lowpass.disconnect();
    } catch {}
  }, 220);
}

function playTone(type) {
  if (!audioEnabled) return;

  try {
    const context = ensureAudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    const map = {
      move: [330, 0.025, 0.025],
      hit: [90, 0.08, 0.06],
      ok: [740, 0.12, 0.08],
      wrong: [170, 0.14, 0.08],
      win: [980, 0.24, 0.1]
    };
    const [frequency, duration, volume] = map[type] || map.move;

    oscillator.frequency.value = frequency;
    oscillator.type = type === "wrong" || type === "hit" ? "sawtooth" : "triangle";
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  } catch {
    audioEnabled = false;
  }
}

function cloneFallbackData() {
  return JSON.parse(JSON.stringify(window.LABIRINTO_DATA));
}

async function loadGameData() {
  if (window.location.protocol === "file:" && window.LABIRINTO_DATA) {
    data = cloneFallbackData();
    return;
  }

  try {
    const response = await fetch("assets/data/dados.json");
    if (!response.ok) {
      throw new Error("Não foi possível carregar assets/data/dados.json");
    }

    data = await response.json();
  } catch (error) {
    if (window.LABIRINTO_DATA) {
      data = cloneFallbackData();
      return;
    }

    throw error;
  }
}

function updateScoreUI() {
  const score = normalizedScore();
  ui.score.textContent = score;
  ui.scoreMeter.style.width = `${score}%`;
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem(recordKey, String(bestScore));
    ui.bestScore.textContent = bestScore;
  }
}

function updatePhaseUI() {
  const phase = data.metadata.phases[currentLevel];
  ui.phaseLabel.textContent = `Fase: ${currentLevel + 1}/${data.metadata.phases.length}`;
  ui.componentLabel.textContent = `${phase.component} · ${phase.goal}`;
  ui.phaseNameLabel.textContent = `${phase.name}`;
  ui.phaseGoalLabel.textContent = phase.goal;
  ui.playerNameDisplay.textContent = `Componente: ${phase.component}`;
  ui.playerClassDisplay.textContent = `${phase.name}. ${phase.goal}`;
}

function saveProgress() {
  const progress = {
    diff: currentDiff,
    level: currentLevel,
    rawScore,
    answerLog,
    savedAt: Date.now()
  };
  localStorage.setItem(saveKey, JSON.stringify(progress));
}

function clearProgress() {
  localStorage.removeItem(saveKey);
  ui.resumeButton.hidden = true;
}

function updateDifficultyButtons() {
  document.querySelectorAll("[data-diff]").forEach((button) => {
    button.classList.toggle("active", button.dataset.diff === currentDiff && !isPaused);
  });
}

function difficultyModalButtons() {
  return [...ui.difficultyModal.querySelectorAll("[data-diff]")];
}

function selectDifficultyOption(index) {
  const buttons = difficultyModalButtons();
  if (!buttons.length) return;

  focusedDifficultyIndex = (index + buttons.length) % buttons.length;
  buttons.forEach((button, buttonIndex) => {
    button.classList.toggle("keyboard-selected", buttonIndex === focusedDifficultyIndex);
    button.tabIndex = buttonIndex === focusedDifficultyIndex ? 0 : -1;
  });
  buttons[focusedDifficultyIndex].focus({ preventScroll: true });
}

function showDifficultyModal() {
  ui.difficultyModal.showModal();
  window.setTimeout(() => selectDifficultyOption(0), 0);
}

function checkSavedProgress() {
  const saved = localStorage.getItem(saveKey);
  if (!saved) {
    ui.resumeButton.hidden = true;
    return;
  }

  try {
    const progress = JSON.parse(saved);
    ui.resumeButton.textContent = `Continuar ${progress.diff} · fase ${progress.level + 1}`;
    ui.resumeButton.hidden = false;
  } catch {
    clearProgress();
  }
}

function resetPlayer() {
  player.x = tileSize * 1.5;
  player.y = tileSize * 1.5;
  player.vx = 0;
  player.vy = 0;
  player.angle = 0;
  player.bob = 0;
  player.moving = false;
  player.trail = [];
}

function startGame(diff) {
  if (ui.difficultyModal.open) {
    ui.difficultyModal.close();
  }

  currentDiff = diff;
  currentLevel = 0;
  rawScore = 0;
  answerLog = [];
  finalElapsedMs = 0;
  scoreSent = false;
  gameStartedAt = Date.now();
  ui.timer.textContent = "00:00";
  clearProgress();
  loadLevel(0);
  updateScoreUI();
  updateDifficultyButtons();
  ui.statusText.textContent = `Modo ${diff} iniciado. Leve o pacote até o primeiro componente.`;
}

function resumeGame() {
  const saved = localStorage.getItem(saveKey);
  if (!saved) return;

  try {
    const progress = JSON.parse(saved);
    currentDiff = progress.diff;
    currentLevel = progress.level;
    rawScore = progress.rawScore || 0;
    answerLog = Array.isArray(progress.answerLog) ? progress.answerLog : [];
    finalElapsedMs = 0;
    scoreSent = false;
    gameStartedAt = Date.now();
    ui.timer.textContent = "00:00";
    loadLevel(currentLevel);
    updateScoreUI();
    updateDifficultyButtons();
    ui.statusText.textContent = "Progresso restaurado. Continue a transmissão do pacote.";
  } catch {
    clearProgress();
  }
}

function loadLevel(level) {
  currentLevel = level;
  levelStartedAt = Date.now();
  resetPlayer();
  updatePhaseUI();
  isPaused = false;
  const phase = data.metadata.phases[currentLevel];
  ui.statusText.textContent = `Você está em ${phase.name}: ${phase.goal}`;
}

function returnToMenu() {
  ui.victoryModal.close();
  isPaused = true;
  gameStartedAt = 0;
  finalElapsedMs = 0;
  answerLog = [];
  keys.clear();
  checkSavedProgress();
  ui.phaseLabel.textContent = "Fase: -";
  ui.componentLabel.textContent = "Componente: -";
  ui.playerNameDisplay.textContent = "Componente: -";
  ui.playerClassDisplay.textContent = "Escolha uma dificuldade.";
  ui.phaseNameLabel.textContent = "Aguardando início";
  ui.phaseGoalLabel.textContent = "Escolha uma dificuldade para começar.";
  ui.statusText.textContent = "Escolha uma dificuldade para começar outra partida.";
  updateDifficultyButtons();
}

function openQuiz() {
  isPaused = true;
  keys.clear();
  currentQuestion = 0;
  selectedOption = null;
  focusedOptionIndex = 0;
  quizState = "answer";
  renderQuestion();
  ui.quizModal.showModal();
  window.setTimeout(() => {
    ui.quizOptions.children[focusedOptionIndex]?.focus({ preventScroll: true });
  }, 0);
}

function renderQuestion() {
  const phase = data.metadata.phases[currentLevel];
  const questions = data.quizzes[currentDiff][currentLevel];
  const question = questions[currentQuestion];

  ui.quizStep.textContent = `${question.level} · pergunta ${currentQuestion + 1}/3`;
  ui.quizTitle.textContent = `${phase.icon} ${phase.name}`;
  ui.quizQuestion.textContent = question.question;
  ui.quizFeedback.textContent = "";
  ui.quizFeedback.className = "feedback";
  ui.quizSubmit.textContent = "Responder";
  ui.quizSubmit.disabled = true;
  selectedOption = null;
  focusedOptionIndex = 0;
  quizState = "answer";
  ui.quizOptions.innerHTML = "";

  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = option;
    button.addEventListener("click", () => selectQuizOption(index));
    ui.quizOptions.appendChild(button);
  });

  selectQuizOption(0);
}

function selectQuizOption(index, { keepSubmitDisabled = false } = {}) {
  const options = [...ui.quizOptions.children];
  if (!options.length || quizState !== "answer") return;

  focusedOptionIndex = (index + options.length) % options.length;
  selectedOption = focusedOptionIndex;
  options.forEach((child, childIndex) => {
    child.classList.toggle("selected", childIndex === focusedOptionIndex);
    child.tabIndex = childIndex === focusedOptionIndex ? 0 : -1;
  });
  options[focusedOptionIndex].focus({ preventScroll: true });
  ui.quizSubmit.disabled = keepSubmitDisabled ? true : false;
}

function handleQuizSubmit() {
  if (quizState === "next") {
    advanceQuiz();
    return;
  }

  validateAnswer();
}

function validateAnswer() {
  if (selectedOption === null) return;

  const phase = data.metadata.phases[currentLevel];
  const question = data.quizzes[currentDiff][currentLevel][currentQuestion];
  const correct = selectedOption === question.correct;
  const options = [...ui.quizOptions.children];
  const selectedText = question.options[selectedOption];
  const correctText = question.options[question.correct];

  if (correct) {
    rawScore += pointsPerQuestion();
    ui.quizFeedback.className = "feedback correct";
    ui.quizFeedback.textContent = `Correto. ${question.explanation}`;
    playTone("ok");
  } else {
    ui.quizFeedback.className = "feedback wrong";
    ui.quizFeedback.textContent = `Quase lá. ${question.explanation}`;
    playTone("wrong");
  }

  options.forEach((button, index) => {
    button.disabled = true;
    button.classList.toggle("correct-answer", index === question.correct);
    button.classList.toggle("wrong-answer", index === selectedOption && !correct);
  });

  answerLog.push({
    phase: phase.name,
    component: phase.component,
    level: question.level,
    question: question.question,
    selected: selectedText,
    correctAnswer: correctText,
    correct
  });

  updateScoreUI();
  quizState = "next";
  ui.quizSubmit.disabled = false;
  ui.quizSubmit.textContent = currentQuestion < 2 ? "Próximo" : "Finalizar fase";
  ui.quizSubmit.focus({ preventScroll: true });
}

function advanceQuiz() {
  currentQuestion += 1;
  if (currentQuestion < 3) {
    renderQuestion();
    return;
  }

  finishPhase();
}

function finishPhase() {
  updateScoreUI();
  ui.quizModal.close();

  if (currentLevel < data.metadata.phases.length - 1) {
    currentLevel += 1;
    saveProgress();
    loadLevel(currentLevel);
    ui.statusText.textContent = "Fase concluída. O pacote avançou para o próximo componente.";
    return;
  }

  finishGame();
}

function finishGame() {
  isPaused = true;
  clearProgress();
  finalElapsedMs = Date.now() - gameStartedAt;
  const final = normalizedScore();
  const correctCount = answerLog.filter((answer) => answer.correct).length;
  ui.finalScore.textContent = final;
  ui.finalTime.textContent = formatTime(finalElapsedMs);
  ui.finalCorrect.textContent = `${correctCount}/${answerLog.length}`;
  ui.timer.textContent = formatTime(finalElapsedMs);
  renderAnswerSummary();
  sendFinalScore({ score: final, difficulty: getPlatformDifficulty() });
  ui.victoryModal.showModal();
  ui.statusText.textContent = `Jogo concluído com ${final} pontos.`;
  updateDifficultyButtons();
  playTone("win");
}

function renderAnswerSummary() {
  ui.answerSummary.innerHTML = "";

  if (!answerLog.length) {
    const item = document.createElement("li");
    item.textContent = "Nenhuma resposta registrada.";
    ui.answerSummary.appendChild(item);
    return;
  }

  answerLog.forEach((answer) => {
    const item = document.createElement("li");
    item.className = answer.correct ? "correct" : "wrong";

    const title = document.createElement("strong");
    title.textContent = `${answer.phase} · ${answer.level}`;

    const question = document.createElement("span");
    question.textContent = answer.question;

    const selected = document.createElement("span");
    selected.textContent = `Sua resposta: ${answer.selected}`;

    const correct = document.createElement("span");
    correct.textContent = answer.correct
      ? "Resultado: correta"
      : `Resposta correta: ${answer.correctAnswer}`;

    item.append(title, question, selected, correct);
    ui.answerSummary.appendChild(item);
  });
}

function cellAt(x, y) {
  const map = data.maps[currentDiff][currentLevel];
  const gx = Math.floor(x / tileSize);
  const gy = Math.floor(y / tileSize);

  if (gy < 0 || gx < 0 || gy >= map.length || gx >= map[0].length) return 1;
  return map[gy][gx];
}

function canMoveTo(x, y) {
  const radius = settings[currentDiff].radius;
  const points = [
    [x - radius, y - radius],
    [x + radius, y - radius],
    [x - radius, y + radius],
    [x + radius, y + radius]
  ];

  return points.every(([px, py]) => cellAt(px, py) !== 1);
}

function stepMovement(delta) {
  if (isPaused || !data) {
    player.moving = false;
    return;
  }

  let dx = 0;
  let dy = 0;
  if (keys.has("ArrowUp") || keys.has("up")) dy -= 1;
  if (keys.has("ArrowDown") || keys.has("down")) dy += 1;
  if (keys.has("ArrowLeft") || keys.has("left")) dx -= 1;
  if (keys.has("ArrowRight") || keys.has("right")) dx += 1;

  if (dx && dy) {
    dx *= Math.SQRT1_2;
    dy *= Math.SQRT1_2;
  }

  const speed = settings[currentDiff].speed;
  const nextX = player.x + dx * speed * delta;
  const nextY = player.y + dy * speed * delta;
  const wasMoving = player.moving;
  player.moving = dx !== 0 || dy !== 0;

  if (player.moving && canMoveTo(nextX, nextY)) {
    player.x = nextX;
    player.y = nextY;
    player.vx = dx;
    player.vy = dy;
    player.angle = dx * 0.18;
    player.bob += delta * 14;
    player.trail.unshift({ x: player.x, y: player.y, life: 1 });
    if (!wasMoving) playTone("move");
  } else {
    player.vx = 0;
    player.vy = 0;
    player.angle *= 0.82;
    if (player.moving) playTone("hit");
  }

  player.trail = player.trail
    .map((point) => ({ ...point, life: point.life - delta * 2.8 }))
    .filter((point) => point.life > 0)
    .slice(0, 12);

  const tx = Math.floor(player.x / tileSize);
  const ty = Math.floor(player.y / tileSize);
  if (data.maps[currentDiff][currentLevel][ty][tx] === 9) {
    openQuiz();
  }
}

function drawBoard(now) {
  const map = data?.maps?.[currentDiff]?.[currentLevel];
  const theme = canvasTheme();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawCircuitBackground(now, theme);

  if (!map) {
    drawBootScreen(theme);
    return;
  }

  const config = settings[currentDiff];

  for (let row = 0; row < map.length; row += 1) {
    for (let col = 0; col < map[row].length; col += 1) {
      const x = col * tileSize;
      const y = row * tileSize + boardOffsetY;

      if (map[row][col] === 1) {
        drawWall(x, y, config.wall, theme);
      } else {
        drawTraceTile(x, y, config.trace, now, row, col, theme);
      }

      if (map[row][col] === 9) {
        drawComponent(x, y, data.metadata.phases[currentLevel], now, theme);
      }
    }
  }

  drawPhaseBanner(now, theme);
  drawDataPacket(now, theme);
}

function drawBootScreen(theme = canvasTheme()) {
  ctx.fillStyle = theme.floor;
  ctx.font = "700 28px Space Grotesk, Arial";
  ctx.fillText("Aguardando partida", 310, 250);
  ctx.fillStyle = theme.text;
  ctx.font = "18px Atkinson Hyperlegible, Arial";
  ctx.fillText("Escolha uma dificuldade no painel.", 310, 284);
}

function drawPhaseBanner(now, theme = canvasTheme()) {
  const phase = data.metadata.phases[currentLevel];
  const glow = 0.45 + (Math.sin(now / 260) + 1) * 0.18;

  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = theme.banner;
  ctx.strokeStyle = isHighContrast() ? "#ffffff" : `rgba(255, 204, 102, ${glow})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(18, 10, 420, 44, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = theme.component;
  ctx.font = "700 12px Space Grotesk, Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`FASE ${currentLevel + 1}: ${phase.name.toUpperCase()}`, 34, 17);

  ctx.fillStyle = theme.text;
  ctx.font = "700 16px Atkinson Hyperlegible, Arial";
  ctx.fillText(`Você está em: ${phase.component}`, 34, 34);
  ctx.restore();
}

function drawCircuitBackground(now, theme = canvasTheme()) {
  ctx.save();
  ctx.strokeStyle = theme.grid;
  ctx.lineWidth = 1;
  for (let x = 30; x < canvas.width; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + Math.sin(now / 900 + x) * 8, canvas.height);
    ctx.stroke();
  }
  for (let y = 30; y < canvas.height; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y + Math.cos(now / 1100 + y) * 8);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTraceTile(x, y, color, now, row, col, theme = canvasTheme()) {
  ctx.save();
  ctx.fillStyle = theme.floorFill;
  ctx.fillRect(x + 3, y + 3, tileSize - 6, tileSize - 6);
  ctx.strokeStyle = isHighContrast() ? "rgba(255,255,255,0.34)" : "rgba(168, 194, 189, 0.20)";
  ctx.lineWidth = isHighContrast() ? 3 : 2;
  ctx.strokeRect(x + 12, y + 12, tileSize - 24, tileSize - 24);

  const pulse = (Math.sin(now / 240 + row + col) + 1) / 2;
  ctx.strokeStyle = isHighContrast() ? theme.floor : color;
  ctx.globalAlpha = isHighContrast() ? 0.92 : 0.18 + pulse * 0.22;
  ctx.lineWidth = isHighContrast() ? 3.5 : 2;
  ctx.beginPath();
  ctx.moveTo(x + 8, y + tileSize / 2);
  ctx.lineTo(x + tileSize - 8, y + tileSize / 2);
  ctx.moveTo(x + tileSize / 2, y + 8);
  ctx.lineTo(x + tileSize / 2, y + tileSize - 8);
  ctx.stroke();
  ctx.restore();
}

function drawWall(x, y, color, theme = canvasTheme()) {
  ctx.save();
  ctx.fillStyle = isHighContrast() ? theme.wallFill : color;
  ctx.globalAlpha = isHighContrast() ? 1 : 0.2;
  ctx.fillRect(x + 6, y + 6, tileSize - 12, tileSize - 12);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = isHighContrast() ? theme.wall : color;
  ctx.shadowColor = isHighContrast() ? theme.wall : color;
  ctx.shadowBlur = isHighContrast() ? 0 : 10;
  ctx.lineWidth = isHighContrast() ? 4 : 2;
  ctx.strokeRect(x + 6, y + 6, tileSize - 12, tileSize - 12);
  ctx.shadowBlur = 0;
  ctx.fillStyle = theme.wallDetail;
  for (let i = 0; i < 4; i += 1) {
    ctx.fillRect(x + 14 + i * 9, y + 14, 5, 10);
    ctx.fillRect(x + 14 + i * 9, y + tileSize - 24, 5, 10);
  }
  ctx.restore();
}

function drawComponent(x, y, phase, now, theme = canvasTheme()) {
  const pulse = 0.75 + Math.sin(now / 180) * 0.25;
  ctx.save();
  ctx.translate(x + tileSize / 2, y + tileSize / 2);
  ctx.shadowColor = theme.component;
  ctx.shadowBlur = isHighContrast() ? 0 : 20 * pulse;
  ctx.fillStyle = theme.componentFill;
  ctx.strokeStyle = theme.component;
  ctx.lineWidth = isHighContrast() ? 5 : 3;
  ctx.beginPath();
  ctx.roundRect(-24, -24, 48, 48, 8);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = theme.component;
  ctx.font = phase.icon.length > 2 ? "700 15px Space Grotesk, Arial" : "700 24px Space Grotesk, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(phase.icon, 0, 1);
  ctx.restore();
}

function drawDataPacket(now, theme = canvasTheme()) {
  const bob = Math.sin(player.bob) * (player.moving ? 3 : 1);

  player.trail.forEach((point, index) => {
    ctx.save();
    ctx.globalAlpha = point.life * 0.35;
    ctx.fillStyle = isHighContrast() ? (index % 2 ? "#00ffff" : "#ffff00") : (index % 2 ? "#5ff5dd" : "#ffcc66");
    ctx.beginPath();
    ctx.arc(point.x, point.y + boardOffsetY, 16 * point.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  ctx.save();
  ctx.translate(player.x, player.y + boardOffsetY + bob);
  ctx.rotate(player.angle);
  ctx.shadowColor = isHighContrast() ? "#ffffff" : "#5ff5dd";
  ctx.shadowBlur = isHighContrast() ? 0 : (player.moving ? 22 : 12);

  ctx.fillStyle = theme.packet;
  ctx.beginPath();
  ctx.roundRect(-20, -16, 40, 32, 8);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = theme.packetText;
  ctx.lineWidth = isHighContrast() ? 4 : 3;
  ctx.strokeRect(-13, -9, 26, 18);

  ctx.fillStyle = theme.packetText;
  ctx.font = "700 9px Space Grotesk, Arial";
  ctx.textAlign = "center";
  const bitFrame = Math.floor(now / 150) % 4;
  ctx.fillText(bitFrame % 2 ? "101" : "010", 0, 2);

  ctx.strokeStyle = theme.packetText;
  ctx.lineWidth = 2;
  const direction = player.vx < 0 ? -1 : 1;
  ctx.beginPath();
  ctx.moveTo(-5 * direction, -18);
  ctx.lineTo(10 * direction, 0);
  ctx.lineTo(-5 * direction, 18);
  ctx.stroke();
  ctx.restore();
}

function loop(now) {
  const delta = Math.min((now - lastFrame) / 1000, 0.05);
  lastFrame = now;

  stepMovement(delta);
  drawBoard(now);

  if (gameStartedAt && !ui.victoryModal.open) {
    ui.timer.textContent = formatTime(Date.now() - gameStartedAt);
  }

  requestAnimationFrame(loop);
}

function handleQuizKeyboard(event) {
  if (!ui.quizModal.open) return false;

  if (["ArrowDown", "ArrowRight"].includes(event.key)) {
    event.preventDefault();
    selectQuizOption(focusedOptionIndex + 1);
    return true;
  }

  if (["ArrowUp", "ArrowLeft"].includes(event.key)) {
    event.preventDefault();
    selectQuizOption(focusedOptionIndex - 1);
    return true;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    handleQuizSubmit();
    return true;
  }

  return false;
}

function handleDifficultyKeyboard(event) {
  if (!ui.difficultyModal.open) return false;

  if (["ArrowRight", "ArrowDown"].includes(event.key)) {
    event.preventDefault();
    selectDifficultyOption(focusedDifficultyIndex + 1);
    return true;
  }

  if (["ArrowLeft", "ArrowUp"].includes(event.key)) {
    event.preventDefault();
    selectDifficultyOption(focusedDifficultyIndex - 1);
    return true;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    difficultyModalButtons()[focusedDifficultyIndex]?.click();
    return true;
  }

  return false;
}

function attachEvents() {
  const unlockAudio = () => {
    if (!audioEnabled) return;
    ensureAudioContext();
    startAmbientMusic();
  };

  document.addEventListener("pointerdown", unlockAudio);
  document.addEventListener("keydown", unlockAudio);

  ui.playButton.addEventListener("click", () => {
    currentUser = { ra: "PACOTE DE DADOS", turma: "Fluxo da informação", idade: null };
    bestScore = Number(localStorage.getItem(recordKey) || 0);
    ui.bestScore.textContent = bestScore;
    ui.playerNameDisplay.textContent = "Componente: -";
    ui.playerClassDisplay.textContent = "Escolha uma dificuldade.";
    ui.startScreen.hidden = true;
    ui.gameScreen.hidden = false;
    ensureAudioContext();
    startAmbientMusic();
    checkSavedProgress();
    ui.statusText.textContent = "Leia o tutorial e escolha uma dificuldade para começar.";
    window.setTimeout(() => ui.tutorialModal.showModal(), 0);
  });

  document.querySelectorAll("[data-diff]").forEach((button) => {
    button.addEventListener("click", () => startGame(button.dataset.diff));
  });

  ui.resumeButton.addEventListener("click", resumeGame);
  ui.quizSubmit.addEventListener("click", handleQuizSubmit);
  ui.menuButton.addEventListener("click", returnToMenu);
  ui.tutorialButton.addEventListener("click", () => {
    isPaused = true;
    keys.clear();
    ui.tutorialModal.showModal();
  });

  document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", () => {
      document.getElementById(button.dataset.close).close();
      if (button.dataset.close === "tutorialModal") {
        if (gameStartedAt && data?.maps?.[currentDiff]?.[currentLevel]) {
          isPaused = false;
        } else {
          showDifficultyModal();
        }
      }
    });
  });

  ui.contrastButton.addEventListener("click", () => document.body.classList.toggle("high-contrast"));
  ui.fontButton.addEventListener("click", () => document.body.classList.toggle("large-text"));
  ui.audioButton.addEventListener("click", () => {
    audioEnabled = !audioEnabled;
    ui.audioButton.textContent = audioEnabled ? "♪" : "×";
    if (audioEnabled) {
      startAmbientMusic();
    } else {
      stopAmbientMusic();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (handleQuizKeyboard(event)) return;
    if (handleDifficultyKeyboard(event)) return;

    if (event.key === "Enter" && !ui.startScreen.hidden) {
      event.preventDefault();
      ui.playButton.click();
      return;
    }

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      keys.add(event.key);
    }
  });

  document.addEventListener("keyup", (event) => {
    keys.delete(event.key);
  });

  document.querySelectorAll(".mobile-pad button").forEach((button) => {
    const dir = button.dataset.dir;
    const press = (event) => {
      event.preventDefault();
      keys.add(dir);
    };
    const release = (event) => {
      event.preventDefault();
      keys.delete(dir);
    };

    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointerleave", release);
    button.addEventListener("pointercancel", release);
  });
}

async function init() {
  attachEvents();
  try {
    await loadGameData();
    ui.statusText.textContent = "Sistema carregado. Escolha uma dificuldade para começar.";
    startAmbientMusic();
  } catch (error) {
    ui.statusText.textContent = error.message;
    console.error(error);
  }

  requestAnimationFrame(loop);
}

init();
