const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const tileSize = 60; 

const configs = {
    "Fácil":   { speed: 8,  radius: 12 },
    "Médio":   { speed: 4,  radius: 22 }, 
    "Difícil": { speed: 12, radius: 8 }   
};

let gameData = null;
let currentLevel = 0;
let player = { x: 0, y: 0 };
let totalScore = 0;
let levelStartTime = 0;
let currentDiff = "Médio"; 
let mapasAtuais = [];

const faseEl = document.getElementById("fase");
const scoreEl = document.getElementById("score");
const modal = document.getElementById("quizModal");
const quizSubmitBtn = document.getElementById("quizSubmit");

// --- INICIALIZAÇÃO ---
async function init() {
    try {
        const res = await fetch('assets/data/dados.json');
        if (!res.ok) throw new Error("Erro ao carregar dados.json");
        gameData = await res.json();
        startGame("Médio"); // Inicia no Médio por padrão
        draw();
    } catch (e) {
        console.error("Erro:", e);
        alert("Erro ao carregar as fases. Use o Live Server do VS Code!");
    }
}

// --- LOGICA DE JOGO ---
window.startGame = function(diff) {
    if (!gameData) return;
    currentDiff = diff;
    mapasAtuais = gameData.mapas[diff];
    totalScore = 0;
    if (scoreEl) scoreEl.textContent = "0";
    const diffLabel = document.getElementById("diffLabel");
    if (diffLabel) diffLabel.textContent = `Modo: ${diff}`;
    loadLevel(0);
};

function loadLevel(level) {
    currentLevel = level;
    // Posicionamento inicial centralizado no tile [1,1]
    player = { x: tileSize * 1.5, y: tileSize * 1.5 };
    levelStartTime = Date.now();
    if (faseEl) faseEl.textContent = `Fase ${currentLevel + 1}/${mapasAtuais.length}`;
}

function move(dx, dy) {
    if (!gameData || (modal && modal.style.display === "flex")) return;

    // Aumento progressivo de velocidade conforme o nível
    const speedBoost = 1 + (currentLevel * 0.10);
    const finalDx = dx * speedBoost;
    const finalDy = dy * speedBoost;

    const map = mapasAtuais[currentLevel];
    const r = configs[currentDiff].radius;
    const nx = player.x + finalDx;
    const ny = player.y + finalDy;

    // Detecção de colisão baseada nos cantos do personagem (Hitbox)
    const corners = [
        {x: nx - r, y: ny - r},
        {x: nx + r, y: ny - r},
        {x: nx - r, y: ny + r},
        {x: nx + r, y: ny + r}
    ];

    for (const c of corners) {
        const gx = Math.floor(c.x / tileSize);
        const gy = Math.floor(c.y / tileSize);
        
        // Se bater na parede (1) ou sair do mapa, cancela movimento
        if (gx < 0 || gx >= map[0].length || gy < 0 || gy >= map.length || map[gy][gx] === 1) {
            return;
        }
    }

    player.x = nx; 
    player.y = ny;

    // Verifica se alcançou o item (9)
    const centerX = Math.floor(player.x / tileSize);
    const centerY = Math.floor(player.y / tileSize);
    if (map[centerY][centerX] === 9) {
        showQuiz(currentLevel);
    }
}

// --- INTERFACE E QUIZ ---
function showQuiz(level) {
    const q = gameData.quizzes[level.toString()][0];
    if (modal) {
        modal.style.display = "flex";
        document.getElementById("quizQuestion").textContent = q.question;
        const optDiv = document.getElementById("quizOptions");
        optDiv.innerHTML = "";
        
        q.options.forEach((opt, i) => {
            const btn = document.createElement("div");
            btn.className = "option";
            btn.textContent = opt;
            btn.onclick = () => {
                document.querySelectorAll(".option").forEach(o => o.classList.remove("selected"));
                btn.classList.add("selected");
                quizSubmitBtn.disabled = false;
                window.selectedIdx = i;
            };
            optDiv.appendChild(btn);
        });
        
        quizSubmitBtn.style.display = "inline-flex";
        quizSubmitBtn.disabled = true;
        document.getElementById("quizFeedback").style.display = "none";
    }
}

window.validateAnswer = function() {
    const q = gameData.quizzes[currentLevel.toString()][0];
    const isCorrect = window.selectedIdx === q.correct;
    const timeTaken = (Date.now() - levelStartTime) / 1000;
    const bonus = Math.max(0, Math.floor(60 - timeTaken));
    
    if (isCorrect) totalScore += (100 + bonus);

    const fb = document.getElementById("quizFeedback");
    fb.textContent = isCorrect ? `Incrível! +${100 + bonus} pts. ${q.explanation}` : `Ops! ${q.explanation}`;
    fb.style.display = "block";
    fb.className = isCorrect ? "feedback-correct" : "feedback-wrong";
    
    quizSubmitBtn.style.display = "none";
    if (scoreEl) scoreEl.textContent = totalScore;

    setTimeout(() => {
        if (modal) modal.style.display = "none";
        if (currentLevel < mapasAtuais.length - 1) {
            loadLevel(currentLevel + 1);
        } else {
            alert(`Parabéns! Você completou o Labirinto do Computador.\nPontuação Final: ${totalScore}`);
            location.reload();
        }
    }, 2500);
}

// --- RENDERIZAÇÃO ---
function draw() {
    // Limpa o canvas com fundo escuro
    ctx.fillStyle = "#0D0821";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (mapasAtuais.length > 0) {
        const map = mapasAtuais[currentLevel];
        for (let r = 0; r < map.length; r++) {
            for (let c = 0; c < map[r].length; c++) {
                const x = c * tileSize;
                const y = r * tileSize;

                if (map[r][c] === 1) {
                    ctx.fillStyle = "#4CC9F0"; // Cor das paredes (Neon Blue)
                    ctx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
                } else if (map[r][c] === 9) {
                    ctx.font = "30px Arial";
                    ctx.fillText("🌟", x + 15, y + 42); // Item coletável
                }
            }
        }
        
        // Renderiza o Jogador
        ctx.font = "30px Arial";
        ctx.fillText("🧒", player.x - 15, player.y + 10);
    }
    requestAnimationFrame(draw);
}

// --- CONTROLES ---
document.addEventListener("keydown", e => {
    const s = configs[currentDiff].speed;
    switch(e.key) {
        case "ArrowUp":    move(0, -s); break;
        case "ArrowDown":  move(0, s);  break;
        case "ArrowLeft":  move(-s, 0); break;
        case "ArrowRight": move(s, 0);  break;
    }
});

init();