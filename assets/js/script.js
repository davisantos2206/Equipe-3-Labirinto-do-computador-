/**
 * LABIRINTO DO COMPUTADOR - Script Core 100% Completo (Versão Portátil)
 * Inclui: Login, Save Game, Recordes e JSON Embutido
 */

// --- 1. BANCO DE DADOS EMBUTIDO ---
const gameData = {
    "mapas": {
      "Fácil": [
        [
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
          [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
          [1,0,1,1,1,1,1,0,1,1,1,1,1,0,1],
          [1,0,1,0,0,0,1,0,1,0,0,0,1,0,1],
          [1,0,1,0,9,0,0,0,1,0,1,0,1,0,1],
          [1,0,1,0,0,0,1,0,0,0,1,0,0,0,1],
          [1,0,1,1,1,1,1,0,1,1,1,1,1,0,1],
          [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ],
        [
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
          [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
          [1,0,1,1,1,0,1,0,1,1,1,1,1,0,1],
          [1,0,1,0,0,0,1,0,0,0,0,0,1,0,1],
          [1,0,1,0,1,1,1,1,1,1,1,0,1,0,1],
          [1,0,1,0,0,0,0,0,0,0,1,0,1,0,1],
          [1,0,1,1,1,1,1,1,1,0,1,0,1,0,1],
          [1,0,0,0,0,0,0,0,9,0,1,0,0,0,1],
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ],
        [
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
          [1,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
          [1,0,1,0,1,0,1,1,1,1,1,1,1,0,1],
          [1,0,1,0,1,0,0,0,0,0,0,0,1,0,1],
          [1,0,1,0,1,1,1,1,1,1,1,0,1,0,1],
          [1,0,1,0,0,0,0,0,9,0,1,0,1,0,1],
          [1,0,1,1,1,1,1,1,1,1,1,0,1,0,1],
          [1,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ]
      ],
      "Médio": [
        [
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
          [1,0,0,0,0,0,1,0,0,0,0,0,1,0,1],
          [1,0,1,1,1,0,1,0,1,1,1,0,1,0,1],
          [1,0,1,0,0,0,0,0,1,0,1,0,1,0,1],
          [1,0,1,1,1,1,1,0,1,0,1,1,1,0,1],
          [1,0,1,0,9,0,1,0,0,0,1,0,0,0,1],
          [1,0,1,0,0,0,1,0,1,1,1,0,1,1,1],
          [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ],
        [
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
          [1,0,1,0,0,0,1,0,0,0,0,0,1,0,1],
          [1,0,1,0,1,0,1,0,1,1,1,0,1,0,1],
          [1,0,0,0,1,0,0,0,1,0,0,0,1,0,1],
          [1,1,1,1,1,1,1,0,1,0,1,1,1,0,1],
          [1,0,0,0,0,0,1,0,1,0,0,0,0,0,1],
          [1,0,1,1,1,0,1,0,1,1,1,1,1,1,1],
          [1,0,0,0,1,0,0,0,0,0,0,0,9,0,1],
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ],
        [
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
          [1,0,0,0,1,0,0,0,1,0,0,0,1,0,1],
          [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
          [1,0,1,0,0,0,1,0,0,0,1,0,0,0,1],
          [1,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
          [1,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
          [1,0,1,1,1,1,1,1,1,1,1,0,1,0,1],
          [1,9,0,0,0,0,0,0,0,0,0,0,0,0,1],
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ]
      ],
      "Difícil": [
        [
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
          [1,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
          [1,1,1,0,1,0,1,1,1,1,1,1,1,0,1],
          [1,0,0,0,1,0,1,0,0,0,1,0,0,0,1],
          [1,0,1,1,1,0,1,0,9,0,1,0,1,1,1],
          [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
          [1,0,1,0,1,1,1,1,1,1,1,0,1,0,1],
          [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ],
        [
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
          [1,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
          [1,1,1,0,1,0,1,0,1,0,1,1,1,0,1],
          [1,0,0,0,0,0,1,0,0,0,1,0,0,0,1],
          [1,1,1,1,1,1,1,0,1,1,1,0,1,1,1],
          [1,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
          [1,0,1,1,1,1,1,1,1,0,1,1,1,1,1],
          [1,9,0,0,0,0,0,0,1,0,0,0,0,0,1],
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ],
        [
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
          [1,0,0,0,1,0,0,0,0,0,0,0,1,9,1],
          [1,0,1,0,1,0,1,1,1,1,1,0,1,0,1],
          [1,0,1,0,1,0,1,0,0,0,1,0,1,0,1],
          [1,0,1,0,1,0,1,0,1,1,1,0,1,0,1],
          [1,0,1,0,0,0,1,0,1,0,0,0,1,0,1],
          [1,0,1,1,1,1,1,0,1,0,1,1,1,0,1],
          [1,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ]
      ]
    },
    "quizzes": {
      "Fácil": [
        {
          "question": "Qual peça é considerada o 'cérebro' do computador?",
          "options": ["Monitor", "Processador (CPU)", "Teclado", "Mouse"],
          "correct": 1,
          "explanation": "A CPU (Processador) pensa e processa todos os comandos do computador! 🧠"
        },
        {
          "question": "Onde seus arquivos, fotos e jogos ficam guardados para não sumirem?",
          "options": ["Memória RAM", "Placa de Vídeo", "HD ou SSD", "Fonte"],
          "correct": 2,
          "explanation": "O HD e o SSD são como 'baús' que guardam tudo, mesmo sem energia na tomada! 💾"
        },
        {
          "question": "Como o computador mostra as imagens e vídeos para você?",
          "options": ["Pelo Mouse", "Pelo Monitor (Tela)", "Pelo HD", "Pela Placa-Mãe"],
          "correct": 1,
          "explanation": "O monitor é a tela que exibe todos os resultados visuais do que a CPU processa! 📺"
        }
      ],
      "Médio": [
        {
          "question": "O que a Memória RAM faz no computador?",
          "options": ["Guarda fotos para sempre", "Resfria as peças", "Guarda os dados dos programas que estão abertos agora", "Liga a tela"],
          "correct": 2,
          "explanation": "A RAM é a memória de 'curto prazo', super rápida, mas apaga tudo se o PC desligar! ⚡"
        },
        {
          "question": "Qual componente puxa energia da tomada e distribui para as outras peças?",
          "options": ["Placa-Mãe", "Fonte de Alimentação", "Cooler", "Disco Rígido"],
          "correct": 1,
          "explanation": "A Fonte de Alimentação envia a energia na medida certa para não queimar o PC! 🔌"
        },
        {
          "question": "Qual placa é responsável por conectar TODAS as peças do computador?",
          "options": ["Placa de Vídeo", "Placa de Som", "Placa de Rede", "Placa-Mãe"],
          "correct": 3,
          "explanation": "A Placa-Mãe é a grande 'cidade' onde o Processador, a Memória e o HD se conectam! 🏙️"
        }
      ],
      "Difícil": [
        {
          "question": "Por que um SSD é considerado muito melhor que um HD tradicional?",
          "options": ["Porque é mais pesado", "Porque não tem peças móveis (mecânicas) e é muito mais rápido", "Porque tem mais gigabytes", "Porque brilha no escuro"],
          "correct": 1,
          "explanation": "O SSD usa memória flash (como um pendrive gigante), lendo arquivos quase instantaneamente! 🚀"
        },
        {
          "question": "O que acontece com os dados da Memória RAM quando a luz acaba?",
          "options": ["Ficam salvos", "Vão para o HD", "São apagados imediatamente (memória volátil)", "Vão para a nuvem"],
          "correct": 2,
          "explanation": "A RAM é a memória de curto prazo e volátil. Sem energia elétrica, ela esquece tudo o que estava fazendo! 💨"
        },
        {
          "question": "A velocidade de um Processador (CPU) geralmente é medida em quê?",
          "options": ["Megabytes (MB)", "Gigahertz (GHz)", "Volts (V)", "Watts (W)"],
          "correct": 1,
          "explanation": "O 'Clock' do processador é medido em GHz, o que indica bilhões de operações por segundo! ⏱️"
        }
      ]
    }
  };
  
  // --- 2. CONFIGURAÇÕES DO MOTOR ---
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
  
  let currentLevel = 0;
  let player = { x: 0, y: 0 };
  let totalScore = 0;
  let levelStartTime = 0;
  let currentDiff = "Médio";
  let mapasAtuais = [];
  let isPaused = true; 
  
  // --- VARIÁVEIS DE SISTEMA/SAVE ---
  let currentUser = null; 
  let recordKey = "labirinto_bestScore_default"; 
  let saveKey = "labirinto_save_default";
  let bestScore = 0;
  
  const bestScoreEl = document.getElementById("bestScore");
  const faseEl = document.getElementById("fase");
  const scoreEl = document.getElementById("score");
  const modal = document.getElementById("quizModal");
  const victoryModal = document.getElementById("victoryModal");
  const quizSubmitBtn = document.getElementById("quizSubmit");
  
  // --- 3. LÓGICA DE LOGIN E SAVE ---
  window.handleLogin = function(e) {
      e.preventDefault(); 
      
      const ra = document.getElementById("playerRA").value.trim().toUpperCase();
      const turma = document.getElementById("playerClass").value.trim();
      const idade = parseInt(document.getElementById("playerAge").value);
  
      if (idade < 6) {
          alert("Aviso: O labirinto pode ser muito difícil. Peça ajuda ao professor(a) se precisar!");
      }
  
      currentUser = { ra: ra, turma: turma, idade: idade };
      const cleanRA = ra.replace(/\s+/g, '');
      
      // Define as chaves exclusivas do aluno
      recordKey = `labirinto_recorde_${cleanRA}`; 
      saveKey = `labirinto_progresso_${cleanRA}`;
      
      // Carrega o recorde
      bestScore = localStorage.getItem(recordKey) || 0;
      if (bestScoreEl) bestScoreEl.textContent = bestScore;
  
      // VERIFICA SE EXISTE PROGRESSO SALVO (Save Game)
      const savedData = localStorage.getItem(saveKey);
      if (savedData) {
          const savedState = JSON.parse(savedData);
          document.getElementById("btnResume").style.display = "block";
          document.getElementById("resumeLine").style.display = "block";
          document.getElementById("btnResume").textContent = `▶️ Continuar (${savedState.diff} - Fase ${savedState.level + 1})`;
      }
  
      // Atualiza Tela
      document.getElementById("playerNameDisplay").textContent = ra;
      document.getElementById("playerClassDisplay").textContent = `Turma: ${turma}`;
  
      document.getElementById("loginScreen").style.display = "none";
      document.getElementById("container").style.display = "flex";
  };
  
  function init() {
      console.log("✅ Sistema Inicializado e Pronto!");
      requestAnimationFrame(draw);
  }
  
  // Inicia um Jogo NOVO (Deleta o save anterior se houver)
  window.startGame = function(diff) {
      if (!gameData) return;
      
      // Apaga o progresso, pois está iniciando um novo
      localStorage.removeItem(saveKey);
      document.getElementById("btnResume").style.display = "none";
      document.getElementById("resumeLine").style.display = "none";
  
      currentDiff = diff;
      mapasAtuais = gameData.mapas[diff];
      totalScore = 0;
      if (scoreEl) scoreEl.textContent = "0";
      
      document.getElementById("diffLabel").textContent = `Modo: ${diff}`;
      document.getElementById("challengeMenu").style.opacity = "0.5"; 
      document.getElementById("challengeMenu").style.pointerEvents = "none";
      
      loadLevel(0); 
  };
  
  // Carrega o jogo salvo a partir do clique no botão "Continuar"
  window.resumeGame = function() {
      const savedData = localStorage.getItem(saveKey);
      if (!savedData || !gameData) return;
      
      const savedState = JSON.parse(savedData);
      
      currentDiff = savedState.diff;
      mapasAtuais = gameData.mapas[currentDiff];
      totalScore = savedState.score;
      if (scoreEl) scoreEl.textContent = totalScore;
      
      document.getElementById("diffLabel").textContent = `Modo: ${currentDiff}`;
      document.getElementById("challengeMenu").style.opacity = "0.5"; 
      document.getElementById("challengeMenu").style.pointerEvents = "none";
      
      loadLevel(savedState.level); 
  };
  
  function loadLevel(level) {
      currentLevel = level;
      player = { x: tileSize * 1.5, y: tileSize * 1.5 };
      levelStartTime = Date.now();
      isPaused = false; 
      
      if (faseEl) faseEl.textContent = `Fase: ${currentLevel + 1}/${mapasAtuais.length}`;
  }
  
  window.returnToMenu = function() {
      victoryModal.style.display = "none";
      isPaused = true;
      
      // Re-verifica se tem save para mostrar o botão de continuar (se ele desistiu no meio)
      const savedData = localStorage.getItem(saveKey);
      if (savedData) {
          const savedState = JSON.parse(savedData);
          document.getElementById("btnResume").style.display = "block";
          document.getElementById("resumeLine").style.display = "block";
          document.getElementById("btnResume").textContent = `▶️ Continuar (${savedState.diff} - Fase ${savedState.level + 1})`;
      } else {
          document.getElementById("btnResume").style.display = "none";
          document.getElementById("resumeLine").style.display = "none";
      }
      
      const menu = document.getElementById("challengeMenu");
      menu.style.opacity = "1";
      menu.style.pointerEvents = "auto";
      
      document.getElementById("diffLabel").textContent = "Modo: -";
      if (faseEl) faseEl.textContent = "Fase: -";
      if (scoreEl) scoreEl.textContent = "0";
      
      ctx.fillStyle = "#0D0821";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  };
  
  // --- 4. MOTOR E LOOP DO JOGO ---
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
  
  function showQuiz(level) {
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
              localStorage.setItem(recordKey, bestScore);
              if (bestScoreEl) bestScoreEl.textContent = bestScore;
          }
      } else {
          sfx.wrong.play().catch(() => {});
      }
  
      // Gerencia o Salto de Fase e o SAVE STATE
      setTimeout(() => {
          modal.style.display = "none";
          
          if (currentLevel < mapasAtuais.length - 1) {
              const nextLevel = currentLevel + 1;
              
              // --- SALVA O PROGRESSO NO NAVEGADOR ---
              const progress = { diff: currentDiff, level: nextLevel, score: totalScore };
              localStorage.setItem(saveKey, JSON.stringify(progress));
              
              loadLevel(nextLevel);
          } else {
              // --- VENCEU O JOGO: APAGA O SAVE ---
              localStorage.removeItem(saveKey);
              
              document.getElementById("finalScore").textContent = totalScore;
              victoryModal.style.display = "flex";
          }
      }, 3000);
  };
  
  function draw() {
      if (document.getElementById("container").style.display !== "none") {
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
      }
      requestAnimationFrame(draw);
  }
  
  document.addEventListener("keydown", e => {
      if (isPaused) return; 
      
      if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
          e.preventDefault();
      }
      
      const s = configs[currentDiff].speed;
      if (e.key === "ArrowUp") move(0, -s);
      if (e.key === "ArrowDown") move(0, s);
      if (e.key === "ArrowLeft") move(-s, 0);
      if (e.key === "ArrowRight") move(s, 0);
  });
  
  init();