# Labirinto do Computador

Jogo educativo em HTML5, CSS3 e JavaScript para alunos do 4º e 5º ano. O jogador controla um pacote de dados dentro de um computador e percorre quatro etapas do fluxo da informação: entrada, processamento, armazenamento e saída.

## Estrutura

```text
assets/
  css/style.css
  data/dados.json
  img/
  audio/
  js/script.js
index.html
README.md
```

O arquivo principal é `index.html`. Conteúdos variáveis, mapas, fases e perguntas ficam em `assets/data/dados.json`, seguindo a parametrização externa pedida no manual técnico.

Para abrir por servidor local, use `http://localhost:4173`. Alguns navegadores bloqueiam leitura de JSON quando o jogo é aberto direto pelo arquivo `file://`; por isso o projeto também inclui `assets/data/dados.js` como fallback local gerado a partir do mesmo JSON.

## Mecânica

O jogo começa em uma tela gamificada com o botão `Jogar`, sem login. Ao entrar, um tutorial visual abre automaticamente com cartões, representação das setas do teclado, tecla Enter e o fluxo Entrada → CPU → Memória → Saída. Depois do botão `Entendi`, o jogo abre uma tela de escolha de dificuldade.

Cada fase mostra claramente onde o jogador está, tanto no painel lateral quanto dentro do canvas:

- Entrada de Dados: Teclado.
- Processamento: CPU.
- Armazenamento: Memória.
- Saída de Informação: Monitor.

Cada fase termina em um componente do computador e abre três perguntas progressivas:

- Identificação: reconhecer o componente.
- Compreensão: entender a função.
- Aplicação: usar o conceito em uma situação prática.

Depois que uma resposta é confirmada, o jogo mostra o feedback e espera o botão `Próximo` para avançar. O tempo continua contando durante o quiz.

## Controles

- Setas no labirinto: movimentam o pacote de dados.
- Setas no quiz: navegam entre as alternativas.
- Setas na tela de dificuldade: alternam entre Fácil, Médio e Difícil.
- Enter no quiz: confirma a resposta ou avança no botão `Próximo`.
- Enter na tela de dificuldade: inicia o nível selecionado.
- Botões na tela: permitem jogar também em dispositivos sem teclado.

Há três dificuldades padronizadas: Fácil, Médio e Difícil. Os quadrados do labirinto assumem a cor da dificuldade selecionada. O progresso e o recorde são salvos no `localStorage`.

## Pontuação

A pontuação vai diretamente de 0 a 100 e é calculada apenas pelas respostas corretas. A partida tem 12 perguntas no total, então cada acerto vale aproximadamente 8,33 pontos. Não há bônus por conclusão de fase nem penalidade por erro.

Ao concluir o jogo, a função `sendFinalScore({ score, difficulty })` envia uma mensagem `C4A_GAME_SCORE` ao `window.parent`.

Ao finalizar, a tela de vitória mostra a pontuação, o tempo total e um resumo das respostas marcadas pelo jogador.

## Áudio

O jogo prepara uma música ambiente baixa desde o carregamento da página e começa a tocar assim que o navegador permite áudio. O botão de som permite ligar ou silenciar a música e os efeitos.

## Acessibilidade e UX

O jogo oferece operação por teclado, botões direcionais para telas menores, foco visível, textos com `aria-live`, tutorial acessível durante a partida, ajuste de tamanho de fonte e controle de áudio. O alto contraste também é aplicado ao labirinto no canvas, usando paredes sólidas claras, caminhos em preto com trilhas ciano espessas, componente amarelo e pacote magenta para reforçar diferença por forma, espessura e cor.

## Visual

A estética representa o interior de um computador com placa de circuito, trilhas luminosas, componentes eletrônicos e um personagem "pacote de dados" animado. O pacote pulsa, inclina, mostra bits internos e deixa uma trilha visual enquanto se movimenta.

## Tecnologias

- HTML5
- CSS3
- JavaScript sem dependências externas obrigatórias
