/**
 * LABIRINTO DO COMPUTADOR - Script Core Final
 */

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const tileSize = 60;

const configs = {
    "Fácil":   { speed: 8,  radius: 12, wallColor: "#4361EE" },
    "Médio":   { speed: 5,  radius: 18, wallColor: "#4CC9F0" },
    "Difícil": { speed: 10, radius: 10, wallColor: "#F72585" }
};

const sfx = {
    hit: new Audio('assets/audio/hit.mp3'),
    win: new Audio('assets/audio/win.mp3'),
    wrong: new Audio('assets/audio/wrong.mp3')
};
Object.values(sfx).forEach(som => som.volume = 0.3);

let gameData = null;
let currentLevel = 0;
let player = { x: 0, y: 0 };
let totalScore = 0;
let levelStartTime = 0;
let currentDiff = "Médio";
let mapasAtuais = [];
let isPaused = true; 

let bestScore = localStorage.getItem("labirinto_bestScore") || 0;
const bestScoreEl = document.getElementById("bestScore");
if (bestScoreEl) bestScoreEl.textContent = bestScore;

const faseEl = document.getElementById("fase");
const scoreEl = document.getElementById("score");
const modal = document.getElementById("quizModal");
const quizSubmitBtn = document.getElementById("quizSubmit");

/**
 * Inicialização
 */
async function init() {
    try {
        const res = await fetch('assets/data/dados.json');
        if (!res.ok) throw new Error("Erro de rede.");
        gameData = await res.json();
        console.log("✅ JSON Carregado! Pronto para jogar.");
        requestAnimationFrame(draw);
    } catch (e) {
        console.error("❌ Erro ao carregar:", e);
        alert("Erro ao carregar o JSON. Tem certeza que está usando o Live Server?");
    }
}

/**
 * Inicia ou reinicia a dificuldade
 */
window.startGame = function(diff) {
    if (!gameData) {
        alert("Aguarde, os dados ainda estão carregando...");
        return;
    }
    
    currentDiff = diff;
    mapasAtuais = gameData.mapas[diff];
    totalScore = 0;
    if (scoreEl) scoreEl.textContent = "0";
    
    document.getElementById("diffLabel").textContent = `Modo: ${diff}`;
    document.getElementById("challengeMenu").style.opacity = "0.5"; 
    
    loadLevel(0); 
};

function loadLevel(level) {
    currentLevel = level;
    player = { x: tileSize * 1.5, y: tileSize * 1.5 };
    levelStartTime = Date.now();
    isPaused = false; 
    
    if (faseEl) faseEl.textContent = `Fase: ${currentLevel + 1}/${mapasAtuais.length}`;
}

/**
 * Lógica de Movimento
 */
function move(dx, dy) {
    if (isPaused || !mapasAtuais || !mapasAtuais[currentLevel]) return;

    const config = configs[currentDiff];
    const map = mapasAtuais[currentLevel];
    const nx = player.x + dx;
    const ny = player.y + dy;
    const r = config.radius;

    const corners = [{x:nx-r,y:ny-r},{x:nx+r,y:ny-r},{x:nx-r,y:ny+r},{x:nx+r,y:ny+r}];
    
    let canMove = true;
    for (const c of corners) {
        const gx = Math.floor(c.x / tileSize);
        const gy = Math.floor(c.y / tileSize);
        if (gx < 0 || gy < 0 || gy >= map.length || gx >= map[0].length || map[gy][gx] === 1) {
            canMove = false;
            break;
        }
    }

    if (canMove) {
        player.x = nx;
        player.y = ny;
        
        const tx = Math.floor(player.x/tileSize);
        const ty = Math.floor(player.y/tileSize);
        if (map[ty][tx] === 9) {
            isPaused = true;
            showQuiz(currentLevel);
        }
    } else {
        sfx.hit.play().catch(() => {});
    }
}

/**
 * Lógica de Quiz
 */
function showQuiz(level) {
    // Agora busca pelas chaves "Fácil", "Médio", "Difícil" e depois pelo index da fase
    const q = gameData.quizzes[currentDiff][level]; 
    
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
            window.selectedIdx = i;
            quizSubmitBtn.disabled = false;
        };
        optDiv.appendChild(btn);
    });
    quizSubmitBtn.disabled = true;
    document.getElementById("quizFeedback").style.display = "none";
}

window.validateAnswer = function() {
    const q = gameData.quizzes[currentDiff][currentLevel]; 
    const isCorrect = window.selectedIdx === q.correct;
    
    const fb = document.getElementById("quizFeedback");
    fb.style.display = "block";
    fb.className = isCorrect ? "feedback-correct" : "feedback-wrong";
    fb.innerHTML = isCorrect ? `✨ <strong>Correto!</strong> +100 pts<br>${q.explanation}` : `❌ <strong>Quase lá!</strong><br>${q.explanation}`;

    quizSubmitBtn.disabled = true;

    if (isCorrect) {
        sfx.win.play().catch(() => {});
        totalScore += 100;
        if (scoreEl) scoreEl.textContent = totalScore;
        
        if (totalScore > bestScore) {
            bestScore = totalScore;
            localStorage.setItem("labirinto_bestScore", bestScore);
            if (bestScoreEl) bestScoreEl.textContent = bestScore;
        }
    } else {
        sfx.wrong.play().catch(() => {});
    }

    setTimeout(() => {
        modal.style.display = "none";
        if (currentLevel < mapasAtuais.length - 1) {
            loadLevel(currentLevel + 1);
        } else {
            alert(`🏆 Parabéns! Você completou o Labirinto!\nPontuação: ${totalScore}`);
            location.reload();
        }
    }, 3000);
};

/**
 * Motor de Renderização Gráfica
 */
function draw() {
    ctx.fillStyle = "#0D0821";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!isPaused && mapasAtuais && mapasAtuais[currentLevel]) {
        const map = mapasAtuais[currentLevel];
        const config = configs[currentDiff];

        for (let r = 0; r < map.length; r++) {
            for (let c = 0; c < map[r].length; c++) {
                const x = c * tileSize;
                const y = r * tileSize;

                if (map[r][c] === 1) {
                    ctx.fillStyle = config.wallColor;
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = config.wallColor;
                    ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
                    ctx.shadowBlur = 0;
                } else if (map[r][c] === 9) {
                    const pulse = Math.sin(Date.now() / 200) * 5;
                    ctx.font = `${30 + pulse}px Arial`;
                    ctx.fillText("💾", x + 12, y + 42);
                }
            }
        }
        
        ctx.font = "35px Arial";
        ctx.fillText("🧒", player.x - 17, player.y + 12);
    }
    
    requestAnimationFrame(draw);
}

/**
 * Teclado
 */
document.addEventListener("keydown", e => {
    if (isPaused) return; 
    
    const s = configs[currentDiff].speed;
    if (e.key === "ArrowUp") move(0, -s);
    if (e.key === "ArrowDown") move(0, s);
    if (e.key === "ArrowLeft") move(-s, 0);
    if (e.key === "ArrowRight") move(s, 0);
});

init();