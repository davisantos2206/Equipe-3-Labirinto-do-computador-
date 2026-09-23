const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const ui = {
  startScreen: document.getElementById("startScreen"),
  gameScreen: document.getElementById("gameScreen"),
  playButton: document.getElementById("playButton"),
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

const settingsModal = document.getElementById("settingsModal");
const settingsButton = document.getElementById("settingsButton");
const navigationStatus = document.getElementById("navigationStatus");
const accessibility = window.LabirintoAccessibility;
const guidanceStatus = document.getElementById("guidanceStatus");
let lastGuidanceText = "";
let lastOverlayTrigger = null;
const preferenceKey = "labirinto_acessibilidade_v1";
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const preferences = { contrast: false, largeText: false, reducedMotion: motionQuery.matches,
  stepMode: false, blindMode: false, deafMode: false, narration: false, music: true, effects: true, musicVolume: 50, effectsVolume: 50 };
try {
  const saved = JSON.parse(localStorage.getItem(preferenceKey) || "{}");
  for (const key of Object.keys(preferences)) {
    if (typeof saved[key] === typeof preferences[key]) preferences[key] = saved[key];
  }
  for (const key of ["musicVolume", "effectsVolume"]) {
    preferences[key] = Number.isFinite(preferences[key]) ? Math.max(0, Math.min(100, preferences[key])) : 50;
  }
} catch { /* O jogo continua mesmo se o armazenamento estiver indisponível. */ }
let overlayPausedAt = 0;
let lastNavigationCell = "";
let lastHitAt = 0;
const directions = { up: [0, -1, "cima"], down: [0, 1, "baixo"], left: [-1, 0, "esquerda"], right: [1, 0, "direita"] };
const arrowDirections = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };

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
let audioEnabled = preferences.music;
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

// Composição original: arpejos eletrônicos em Lá menor, 96 BPM.
function musicGain() { return 0.55 * preferences.musicVolume / 100 * (preferences.narration ? 0.2 : 1); }
function startAmbientMusic() {
  if (!audioEnabled || ambientNodes) return;
  try {
    const context = ensureAudioContext();
    const master = context.createGain();
    master.gain.setValueAtTime(musicGain(), context.currentTime);
    master.connect(context.destination);
    ambientNodes = { master, voices: new Set(), next: context.currentTime };
    ambientStep = 0;
    playAmbientNote();
    ambientTimer = window.setInterval(playAmbientNote, 100);
  } catch { audioEnabled = false; }
}
function synthNote(frequency, time, duration, volume, type = "triangle") {
  const nodes = ambientNodes;
  const oscillator = audioContext.createOscillator();
  const envelope = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, time);
  envelope.gain.setValueAtTime(0, time);
  envelope.gain.linearRampToValueAtTime(volume, time + 0.015);
  envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  oscillator.connect(envelope);
  envelope.connect(nodes.master);
  nodes.voices.add(oscillator);
  oscillator.onended = () => { nodes.voices.delete(oscillator); oscillator.disconnect(); envelope.disconnect(); };
  oscillator.start(time);
  oscillator.stop(time + duration + 0.02);
}
function playAmbientNote() {
  if (!audioEnabled || !audioContext || audioContext.state !== "running" || !ambientNodes) return;
  const chords = [[220,261.63,329.63],[174.61,220,261.63],[130.81,164.81,196],[196,246.94,293.66]];
  if (ambientNodes.next < audioContext.currentTime - 0.4) ambientNodes.next = audioContext.currentTime;
  while (ambientNodes.next < audioContext.currentTime + 0.15) {
    const chord = chords[Math.floor(ambientStep / 8) % chords.length];
    const beat = ambientStep % 8;
    const time = ambientNodes.next;
    synthNote(chord[[0,1,2,1,0,2,1,2][beat]] * 2, time, 0.24, 0.13, "sine");
    if (beat % 2 === 0) synthNote(chord[0] / 2, time, 0.48, 0.18);
    if (beat === 0 || beat === 4) synthNote(65.4, time, 0.11, 0.2, "sine");
    ambientStep++;
    ambientNodes.next += 60 / 96 / 2;
  }
}
function stopAmbientMusic() {
  if (ambientTimer) window.clearInterval(ambientTimer);
  ambientTimer = null;
  const nodes = ambientNodes;
  ambientNodes = null;
  if (!nodes) return;
  nodes.master.gain.setValueAtTime(0, audioContext.currentTime);
  for (const voice of nodes.voices) { try { voice.stop(); } catch {} }
  nodes.master.disconnect();
}

function playTone(type) {
  const captions = { move: "→ Pacote em movimento.", hit: "Parede: escolha outro caminho.", ok: "Resposta correta!", wrong: "Resposta incorreta. Leia a explicação para aprender.", win: "Percurso concluído! Confira seu resultado." };
  document.getElementById("eventCaption").textContent = captions[type] || "";
  if (!preferences.effects || !preferences.effectsVolume) return;

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
    gain.gain.setValueAtTime(Math.max(0.0001, volume * preferences.effectsVolume / 50), now);
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
  if (!data) return;
  settingsModal.close();
  overlayPausedAt = 0;
  keys.clear();
  if (ui.difficultyModal.open) {
    ui.difficultyModal.close();
  }

  ui.startScreen.hidden = true;
  ui.gameScreen.hidden = false;
  document.body.classList.add("is-playing");
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
  settingsModal.close();
  ui.difficultyModal.close();
  overlayPausedAt = 0;
  keys.clear();
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
  guidanceStatus.textContent = "";
  announcePosition(true);
  isPaused = false;
  document.querySelector(".mobile-pad button").focus({ preventScroll: true });
  const phase = data.metadata.phases[currentLevel];
  document.getElementById("phaseDescription").textContent = phaseDescription();
  document.getElementById("eventCaption").textContent = "Fase " + (currentLevel + 1) + " iniciada: " + phase.component + ".";
  narrate(phaseDescription() + " " + navigationStatus.textContent);
  ui.statusText.textContent = `Você está em ${phase.name}: ${phase.goal}`;
}

function returnToMenu() {
  ui.victoryModal.close();
  ui.startScreen.hidden = false;
  ui.gameScreen.hidden = true;
  document.body.classList.remove("is-playing");
  document.getElementById("settingsGameControls").hidden = true;
  ui.playButton.focus();
  isPaused = true;
  gameStartedAt = 0;
  finalElapsedMs = 0;
  answerLog = [];
  keys.clear();
  checkSavedProgress();
  ui.phaseLabel.textContent = "Fase: -";
  ui.componentLabel.textContent = "Componente: -";
  ui.statusText.textContent = "Escolha uma dificuldade para começar outra partida.";
  updateDifficultyButtons();
}

function openQuiz() {
  document.getElementById("eventCaption").textContent = "Componente alcançado. Responda às perguntas para continuar.";
  isPaused = true;
  keys.clear();
  currentQuestion = 0;
  selectedOption = null;
  focusedOptionIndex = 0;
  quizState = "answer";
  renderQuestion();
  ui.quizModal.showModal();
  window.setTimeout(() => {
    ui.quizQuestion.focus({ preventScroll: true });
    speakQuestion();
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
  ui.quizQuestion.tabIndex = -1;
  ui.quizQuestion.focus({ preventScroll: true });
  speakQuestion();
}

function selectQuizOption(index, { keepSubmitDisabled = false } = {}) {
  const options = [...ui.quizOptions.children];
  if (!options.length || quizState !== "answer") return;

  focusedOptionIndex = (index + options.length) % options.length;
  selectedOption = focusedOptionIndex;
  options.forEach((child, childIndex) => {
    child.classList.toggle("selected", childIndex === focusedOptionIndex);
    child.setAttribute("aria-pressed", String(childIndex === focusedOptionIndex));
    child.tabIndex = childIndex === focusedOptionIndex ? 0 : -1;
  });
  options[focusedOptionIndex].focus({ preventScroll: true });
  narrate("Alternativa " + (focusedOptionIndex + 1) + ": " + options[focusedOptionIndex].textContent);
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
    ui.quizFeedback.textContent = `✓ Correto. ${question.explanation}`;
    playTone("ok");
  } else {
    ui.quizFeedback.className = "feedback wrong";
    ui.quizFeedback.textContent = `⚠ Resposta incorreta. ${question.explanation}`;
    playTone("wrong");
  }

  options.forEach((button, index) => {
    button.disabled = true;
    if (index === question.correct) button.textContent += " — Resposta correta";
    else if (index === selectedOption) button.textContent += " — Sua resposta (incorreta)";
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
  narrate(ui.quizFeedback.textContent + " Selecione " + ui.quizSubmit.textContent + " para continuar.");
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
  narrate("Pacote entregue. " + final + " pontos. " + correctCount + " respostas corretas em " + answerLog.length + ". Tempo " + ui.finalTime.textContent);
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
  if (isPaused || !data || document.querySelector("dialog[open]")) {
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

  if (usesStepMovement()) { player.moving = false; return; }
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
    if (player.moving && performance.now() - lastHitAt > 650) {
      lastHitAt = performance.now();
      playTone("hit");
      announcePosition(true, "Parede. ");
    }
  }

  player.trail = player.trail
    .map((point) => ({ ...point, life: point.life - delta * 2.8 }))
    .filter((point) => point.life > 0)
    .slice(0, 12);

  announcePosition();
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

  drawCircuitBackground(0, theme);

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
  const glow = 0.7;

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
  // Caminhos livres sem quadrados transparentes ou pulsação.
  ctx.fillStyle = theme.floorFill;
  ctx.fillRect(x, y, tileSize, tileSize);
}

function drawWall(x, y, color, theme = canvasTheme()) {
  ctx.save();
  ctx.fillStyle = isHighContrast() ? theme.wallFill : color;
  ctx.globalAlpha = 1;
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
  const pulse = 1;
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
  const bob = preferences.reducedMotion ? 0 : Math.sin(player.bob) * (player.moving ? 3 : 1);

  (preferences.reducedMotion ? [] : player.trail).forEach((point, index) => {
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
  ctx.rotate(preferences.reducedMotion ? 0 : player.angle);
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
  drawBoard(preferences.reducedMotion ? 0 : now);

  if (gameStartedAt && !ui.victoryModal.open) {
    ui.timer.textContent = formatTime((overlayPausedAt || Date.now()) - gameStartedAt);
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

  if (event.key === "Enter" && event.target !== ui.resumeButton) {
    event.preventDefault();
    difficultyModalButtons()[focusedDifficultyIndex]?.click();
    return true;
  }

  return false;
}

function attachEvents() {
  const unlockAudio = () => {
    if (!audioEnabled) return;
    startAmbientMusic();
  };

  document.addEventListener("pointerdown", unlockAudio);
  document.addEventListener("keydown", unlockAudio);

  ui.playButton.addEventListener("click", () => {
    currentUser = { ra: "PACOTE DE DADOS", turma: "Fluxo da informação", idade: null };
    bestScore = Number(localStorage.getItem(recordKey) || 0);
    ui.bestScore.textContent = bestScore;
    ui.startScreen.hidden = true;
    ui.gameScreen.hidden = false;
    document.body.classList.add("is-playing");
    document.getElementById("settingsGameControls").hidden = false;
    startAmbientMusic();
    checkSavedProgress();
    ui.statusText.textContent = "Leia o tutorial e escolha uma dificuldade para começar.";
    window.setTimeout(() => openOverlay(ui.tutorialModal), 0);
  });

  document.querySelectorAll("[data-diff]").forEach((button) => {
    button.addEventListener("click", () => startGame(button.dataset.diff));
  });

  ui.resumeButton.addEventListener("click", resumeGame);
  ui.quizSubmit.addEventListener("click", handleQuizSubmit);
  ui.menuButton.addEventListener("click", returnToMenu);
  ui.tutorialButton.addEventListener("click", () => {
    settingsModal.close();
    openOverlay(ui.tutorialModal);
  });
  settingsButton.addEventListener("click", () => openOverlay(settingsModal));
  document.getElementById("startSettingsButton").addEventListener("click", () => openOverlay(settingsModal));
  document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", () => document.getElementById(button.dataset.close).close());
  });
  for (const dialog of [settingsModal, ui.tutorialModal]) {
    dialog.addEventListener("close", () => {
      settingsButton.setAttribute("aria-expanded", String(settingsModal.open));
      if (document.querySelector("dialog[open]")) return;
      if (overlayPausedAt && gameStartedAt) gameStartedAt += Date.now() - overlayPausedAt;
      overlayPausedAt = 0;
      keys.clear();
      isPaused = !gameStartedAt;
      if (dialog === ui.tutorialModal && !gameStartedAt && !ui.gameScreen.hidden) showDifficultyModal();
      else (lastOverlayTrigger?.isConnected && !lastOverlayTrigger.closest("dialog:not([open])") ? lastOverlayTrigger : settingsButton).focus();
    });
  }
  // Impede Escape de fechar um desafio e deixar a partida sem continuação.
  for (const dialog of [ui.quizModal, ui.difficultyModal, ui.victoryModal]) {
    dialog.addEventListener("cancel", event => event.preventDefault());
  }
  const toggles = { contrastButton: "contrast", fontButton: "largeText", motionButton: "reducedMotion",
    stepButton: "stepMode", blindButton: "blindMode", deafButton: "deafMode", narrationButton: "narration", audioButton: "music", effectsButton: "effects" };
  for (const [id, key] of Object.entries(toggles)) {
    document.getElementById(id).addEventListener("click", () => {
      preferences[key] = !preferences[key];
      if (key === "stepMode" || key === "blindMode") {
        player.x = (Math.floor(player.x / tileSize) + 0.5) * tileSize;
        player.y = (Math.floor(player.y / tileSize) + 0.5) * tileSize;
        keys.clear();
      }
      if (key === "deafMode" && preferences.deafMode) {
        preferences.music = false;
        preferences.effects = false;
        preferences.narration = false;
      }
      if (key === "blindMode" && preferences.blindMode) {
        preferences.narration = accessibility.speechSupported();
        preferences.music = false;
      }
      applyPreferences();
      savePreferences();
      if (key === "blindMode" && preferences.blindMode) narrate("Navegação para pessoas cegas ativada. Cada seta move uma casa. Feche as configurações e use Orientar próximo passo para ouvir o caminho. Se usa leitor de tela, pode desligar a voz do jogo.");
      if (key === "narration" && preferences.narration) narrate("Leitura em voz alta ativada. Use Tab para navegar e Enter para acionar os controles.");
    });
  }
  for (const key of ["musicVolume", "effectsVolume"]) {
    document.getElementById(key).addEventListener("input", event => {
      preferences[key] = Number(event.target.value);
      applyPreferences();
      savePreferences();
    });
  }
  window.addEventListener("blur", () => keys.clear());
  document.addEventListener("visibilitychange", () => keys.clear());

  document.getElementById("readPhaseButton").addEventListener("click", () => {
    const text = phaseDescription();
    publishGuidance(text);
    if (!preferences.narration) accessibility.speak(text);
  });
  document.getElementById("positionButton").addEventListener("click", () => { announcePosition(true); publishGuidance(navigationStatus.textContent); });
  document.getElementById("guideButton").addEventListener("click", () => publishGuidance(routeGuidance()));
  document.getElementById("readQuestionButton").addEventListener("click", () => {
    ui.quizQuestion.tabIndex = -1;
    ui.quizQuestion.focus();
    speakQuestion();
  });
  document.addEventListener("focusin", event => {
    if (!preferences.narration || event.target.closest("#quizModal")) return;
    if (event.target.matches("button")) narrate(event.target.getAttribute("aria-label") || event.target.textContent);
  });
  document.addEventListener("keydown", (event) => {
    if (event.target.closest("#quizModal") && event.target.id === "readQuestionButton" && ["Enter", " "].includes(event.key)) return;
    if (handleQuizKeyboard(event)) return;
    if (handleDifficultyKeyboard(event)) return;

    if (document.querySelector("dialog[open]")) return;
    if (event.target.closest("input, select, a")) return;
    if (event.target.closest("button") && !arrowDirections[event.key]) return;
    if (event.key === "Enter" && !ui.startScreen.hidden) {
      event.preventDefault();
      ui.playButton.click();
      return;
    }

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      if (isPaused) return;
      if (usesStepMovement()) {
        if (!event.repeat) moveOneCell(arrowDirections[event.key]);
      } else keys.add(event.key);
    }
  });

  document.addEventListener("keyup", (event) => {
    keys.delete(event.key);
  });

  document.querySelectorAll(".mobile-pad button").forEach((button) => {
    const dir = button.dataset.dir;
    let pressStartedAt = 0;
    let pressCell = "";
    button.addEventListener("pointerdown", event => {
      if (event.button !== 0 || isPaused) return;
      pressStartedAt = performance.now();
      pressCell = Math.floor(player.x / tileSize) + ":" + Math.floor(player.y / tileSize);
      button.setPointerCapture(event.pointerId);
      if (!usesStepMovement()) keys.add(dir);
    });
    const release = () => keys.delete(dir);
    for (const name of ["pointerup", "pointercancel", "lostpointercapture"]) button.addEventListener(name, release);
    button.addEventListener("click", event => {
      const sameCell = pressCell === Math.floor(player.x / tileSize) + ":" + Math.floor(player.y / tileSize);
      const quickTap = performance.now() - pressStartedAt < 200 && sameCell;
      if (usesStepMovement() || event.detail === 0 || quickTap) moveOneCell(dir);
    });
    button.addEventListener("keydown", event => {
      if (arrowDirections[event.key]) {
        event.preventDefault();
        event.stopPropagation();
        if (usesStepMovement()) {
          if (!event.repeat) moveOneCell(arrowDirections[event.key]);
        } else if (!isPaused) keys.add(event.key);
      }
    });
  });
}

function savePreferences() {
  try { localStorage.setItem(preferenceKey, JSON.stringify(preferences)); } catch {}
}

function applyPreferences() {
  document.body.classList.toggle("high-contrast", preferences.contrast);
  document.body.classList.toggle("large-text", preferences.largeText);
  document.body.classList.toggle("reduced-motion", preferences.reducedMotion);
  const labels = {
    deafButton: ["Avisos visuais para pessoas surdas", preferences.deafMode],
    blindButton: ["Navegação para pessoas cegas", preferences.blindMode], narrationButton: ["Leitura em voz alta", preferences.narration],
    contrastButton: ["Alto contraste", preferences.contrast], fontButton: ["Texto ampliado", preferences.largeText],
    motionButton: ["Reduzir animações", preferences.reducedMotion], stepButton: ["Movimento por passos", preferences.stepMode],
    audioButton: ["Música", preferences.music], effectsButton: ["Efeitos sonoros", preferences.effects]
  };
  for (const [id, [label, enabled]] of Object.entries(labels)) {
    const button = document.getElementById(id);
    button.textContent = label + ": " + (enabled ? "ativado" : "desativado");
    button.setAttribute("aria-pressed", String(enabled));
  }
  document.getElementById("eventCaption").hidden = !preferences.deafMode;
  if (!preferences.narration) accessibility.stopSpeech();
  navigationStatus.setAttribute("aria-live", preferences.narration ? "off" : "polite");
  guidanceStatus.setAttribute("aria-live", preferences.narration ? "off" : "polite");
  audioEnabled = preferences.music;
  if (!audioEnabled) stopAmbientMusic();
  else startAmbientMusic();
  if (ambientNodes) ambientNodes.master.gain.setValueAtTime(musicGain(), audioContext.currentTime);
  for (const key of ["musicVolume", "effectsVolume"]) {
    document.getElementById(key).value = preferences[key];
    document.getElementById(key).setAttribute("aria-valuetext", preferences[key] + "%");
  }
}

function openOverlay(dialog) {
  lastOverlayTrigger = document.activeElement;
  keys.clear();
  isPaused = true;
  if (gameStartedAt && !overlayPausedAt) overlayPausedAt = Date.now();
  dialog.showModal();
  if (dialog === settingsModal) document.getElementById("settingsTitle").focus();
  settingsButton.setAttribute("aria-expanded", String(settingsModal.open));
}

function announcePosition(force = false, prefix = "") {
  const map = data?.maps?.[currentDiff]?.[currentLevel];
  if (!map) return;
  const col = Math.floor(player.x / tileSize), row = Math.floor(player.y / tileSize);
  const id = currentLevel + ":" + row + ":" + col;
  if (!force && lastNavigationCell === id) return;
  lastNavigationCell = id;
  const free = Object.values(directions).filter(([dx, dy]) => map[row + dy]?.[col + dx] !== undefined && map[row + dy][col + dx] !== 1).map(([, , label]) => label);
  const goalRow = map.findIndex(line => line.includes(9));
  const goalCol = map[goalRow].indexOf(9);
  navigationStatus.textContent = prefix + "Pacote: linha " + (row + 1) + ", coluna " + (col + 1) +
    ". Caminhos livres: " + free.join(", ") + ". Destino: " + data.metadata.phases[currentLevel].component +
    ", linha " + (goalRow + 1) + ", coluna " + (goalCol + 1) + "." + (preferences.blindMode ? " " + routeGuidance() : "");
  if (guidanceStatus.textContent) {
    lastGuidanceText = routeGuidance();
    guidanceStatus.textContent = lastGuidanceText;
  }
  narrate(navigationStatus.textContent);
}

function moveOneCell(dir) {
  if (isPaused || !data || document.querySelector("dialog[open]")) return;
  const [dx, dy] = directions[dir];
  const x = (Math.floor(player.x / tileSize) + dx + 0.5) * tileSize;
  const y = (Math.floor(player.y / tileSize) + dy + 0.5) * tileSize;
  if (!canMoveTo(x, y)) {
    playTone("hit");
    announcePosition(true, "Parede. ");
    return;
  }
  player.x = x; player.y = y; player.vx = dx; player.vy = dy;
  player.trail = [];
  playTone("move");
  announcePosition(true);
  if (cellAt(x, y) === 9) openQuiz();
}

function phaseDescription() {
  if (!gameStartedAt) return "Escolha uma dificuldade para iniciar a partida.";
  const phase = data.metadata.phases[currentLevel];
  return "Fase " + (currentLevel + 1) + ": " + phase.name + ". Você está em: " + phase.component + ". " + phase.goal;
}

function usesStepMovement() { return preferences.stepMode || preferences.blindMode; }
function narrate(text) { if (preferences.narration) accessibility.speak(text); }
function routeGuidance() {
  if (!gameStartedAt) return "Inicie uma partida para receber orientação.";
  return accessibility.guide(data?.maps?.[currentDiff]?.[currentLevel], Math.floor(player.x / tileSize), Math.floor(player.y / tileSize));
}
function publishGuidance(text) {
  lastGuidanceText = text;
  guidanceStatus.textContent = "";
  requestAnimationFrame(() => { guidanceStatus.textContent = lastGuidanceText; });
  narrate(text);
}
function speakQuestion() {
  const question = data?.quizzes?.[currentDiff]?.[currentLevel]?.[currentQuestion];
  if (!question) return;
  narrate(ui.quizStep.textContent + ". " + question.question + ". " + question.options.map((option, index) => "Alternativa " + (index + 1) + ": " + option).join(". ") + ". Use as setas para escolher e Enter para responder.");
}

function fitBoardToStage() {
  const stage = document.querySelector(".board-stage");
  const width = stage.clientWidth;
  const height = stage.clientHeight;
  if (!width || !height) return;
  const scale = Math.min(width / canvas.width, height / canvas.height);
  canvas.style.width = Math.floor(canvas.width * scale) + "px";
  canvas.style.height = Math.floor(canvas.height * scale) + "px";
}

async function init() {
  new ResizeObserver(fitBoardToStage).observe(document.querySelector(".board-stage"));
  document.getElementById("settingsGameControls").appendChild(document.getElementById("difficultyControls"));
  document.getElementById("settingsGameControls").hidden = ui.gameScreen.hidden;
  attachEvents();
  if (!accessibility.speechSupported()) {
    preferences.narration = false;
    document.getElementById("narrationButton").disabled = true;
    document.getElementById("readPhaseButton").textContent = "Ler descrição da fase";
    document.getElementById("narrationHelp").textContent = "Este navegador não oferece leitura em voz alta. As descrições permanecem disponíveis para leitores de tela.";
  }
  applyPreferences();
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
