# 🧠 Labirinto do Computador - Documentação Técnica

## 📋 Sobre o Projeto
O **Labirinto do Computador** é um jogo educativo gamificado desenvolvido para alunos do Ensino Fundamental. O objetivo é ensinar os componentes de hardware (Teclado, Placa-Mãe, CPU) através de desafios de navegação e quizzes de conhecimento.

## 🛠️ Mecânica Principal
O jogo baseia-se em três pilares fundamentais:

1.  **Exploração Espacial**: O jogador controla um personagem em um ambiente de grade (grid), onde cada célula (tile) possui propriedades de colisão (Parede vs. Caminho).
2.  **Sistema de Dificuldade Escalável**: A mecânica ajusta dinamicamente a velocidade do jogador, o raio de colisão e o conjunto de mapas carregados conforme a escolha inicial (*Fácil, Médio ou Difícil*).
3.  **Validação de Conhecimento**: Ao alcançar a saída de cada nível (marcada com 🌟), um modal de Quiz é disparado. O progresso para a fase seguinte depende da interação com este desafio.

## ⚙️ Implementação Técnica

### 1. Parametrização Externa (JSON)
O jogo utiliza **desacoplamento de dados**. Todo o conteúdo variável (perguntas, opções, feedbacks e estruturas dos mapas) é armazenado em `assets/data/dados.json`.
-   A aplicação utiliza a API `fetch` para carregar esses dados de forma assíncrona durante a inicialização (`init()`).
-   Isso permite que novos níveis ou idiomas sejam adicionados sem alterar o código-fonte (`script.js`).

### 2. Lógica de Colisão
A detecção de colisão não é feita apenas por ponto central, mas por **checagem de vértices**. Verificamos os quatro cantos do personagem (baseado no seu raio) contra a matriz do mapa para garantir que o jogador nunca "atravesse" as bordas das paredes, independentemente da velocidade.

### 3. Comunicação com a Plataforma (C4A_GAME_SCORE)
O jogo implementa o padrão de comunicação via `postMessage`.
-   **Função**: `sendFinalScore({ score, difficulty })`
-   **Regra**: O score é normalizado de **0 a 100**.
-   **Segurança**: Uma variável de controle `scoreSent` impede múltiplos envios na mesma partida.

## 📚 Dependências
Para manter o projeto leve, performático e compatível com as regras de desenvolvimento:
-   **Vanilla JavaScript (ES6+)**: Nenhuma biblioteca externa (como jQuery ou React) foi utilizada no motor do jogo.
-   **HTML5 Canvas API**: Utilizada para a renderização gráfica de alta performance.
-   **CSS Flexbox/Grid**: Utilizados para garantir o layout horizontal e a responsividade da UI.
-   **Google Fonts**: Fontes *Nunito* e *Fredoka One* para fins estéticos e de legibilidade educativa.

## 🚀 Como Executar
1. Certifique-se de que todos os arquivos estão em suas respectivas pastas (`assets/js`, `assets/css`, `assets/data`).
2. Por utilizar carregamento de arquivos JSON externos, o projeto deve ser aberto através de um servidor local (ex: *Live Server* do VS Code) para evitar erros de política de CORS do navegador.

---
**Desenvolvido como parte do ecossistema educativo para suporte à Interação Homem-Computador (IHC).**