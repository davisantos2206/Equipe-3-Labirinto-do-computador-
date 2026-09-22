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
- Botões direcionais em todas as telas: toque para andar uma casa ou segure para movimento contínuo; soltar ou cancelar o toque interrompe o movimento.
- Movimento por passos, nas configurações: cada toque ou pressionamento de seta anda exatamente uma casa, sem exigir que a tecla seja mantida pressionada. Enter ou Espaço também aciona cada botão direcional.
- Tab e Shift+Tab: percorrem os controles. Escape fecha configurações e tutorial, com retorno de foco.

Há três dificuldades padronizadas: Fácil, Médio e Difícil. Os quadrados do labirinto assumem a cor da dificuldade selecionada. O progresso e o recorde são salvos no `localStorage`.

## Pontuação

A pontuação vai diretamente de 0 a 100 e é calculada apenas pelas respostas corretas. A partida tem 12 perguntas no total, então cada acerto vale aproximadamente 8,33 pontos. Não há bônus por conclusão de fase nem penalidade por erro.

Ao concluir o jogo, a função `sendFinalScore({ score, difficulty })` envia uma mensagem `C4A_GAME_SCORE` ao `window.parent`.

Ao finalizar, a tela de vitória mostra a pontuação, o tempo total e um resumo das respostas marcadas pelo jogador.

## Áudio

O jogo prepara uma música ambiente baixa e começa a tocar assim que o navegador permite áudio. Música e efeitos têm botões de ativação e volumes independentes no painel de configurações. O estado é descrito por texto e `aria-pressed`, sem substituir o ícone por um X. Silenciar a música não silencia os efeitos.

## Acessibilidade e UX

A barra `Configurações e acessibilidade` abre um diálogo com alto contraste, texto ampliado em 30%, redução de animações, movimento por passos, música, efeitos, tutorial e opções para iniciar outra partida. Os controles secundários deixam de ocupar a área do labirinto. Configurações e tutorial pausam o movimento e o cronômetro; o tempo continua durante o quiz.

O jogo inclui link para pular ao conteúdo, foco visível, diálogos nomeados e estados selecionados anunciados. A descrição textual do labirinto informa linha, coluna, caminhos livres, destino e colisões em uma região `aria-live`. O modo por passos permite explorar os caminhos usando um dedo e acompanhar cada mudança com um leitor de tela. O canvas possui descrição associada a essa região.

O alto contraste também se aplica ao canvas: paredes brancas sólidas, caminhos pretos, destino identificado e pacote com desenho próprio. Respostas certas e erradas têm rótulos escritos e símbolos, além das cores. Os controles de toque medem 56 × 56 pixels CSS. Os diálogos rolam internamente em telas pequenas e o fechamento das configurações permanece acessível no cabeçalho.

As preferências são validadas e salvas em `localStorage`, na chave `labirinto_acessibilidade_v1`. Sem preferência salva, a redução de movimento respeita `prefers-reduced-motion`. A gravação das preferências pode falhar sem interromper o jogo. Não há API, autenticação ou banco de dados neste projeto estático.

## Visual

A estética representa o interior de um computador com paredes sólidas e componentes eletrônicos. Os quadrados transparentes dos caminhos e suas pulsações foram removidos. O pacote mantém sua animação decorativa, desativável pela opção Reduzir animações.

## Entregas por sprint e validação

Consulta ao Azure DevOps realizada em 22/09/2026, incluindo o backlog, Junho, Agosto, Setembro e as descrições de acessibilidade dos itens 35, 43, 44, 45, 46 e 48. Referência: [backlog do projeto](https://dev.azure.com/Fatec2026TEquipe3/Labirinto%20do%20Computador/_backlogs).

- **Agosto — AB#31 e AB#43:** caminhos sem blocos transparentes pulsantes, paredes sólidas e feedback de resposta independente de cor.
- **Setembro — AB#35, AB#36, AB#45 e AB#46:** menu de configurações, controles móveis, operação por teclado, fonte ampliada, alto contraste, redução de movimento e preferências locais. A navegação textual também complementa o requisito de cegueira AB#44 de Agosto.
- **Pendente fora do front-end — AB#48:** a tarefa descreve APIs e banco de dados para preferências. O armazenamento local não substitui essa entrega de servidor.

O Manual de Padronização de Jogos e a Proposta de Jogo Educativo Interativo fornecidos na pasta de trabalho foram lidos. Foram mantidos os conteúdos externos, as três dificuldades, a pontuação inteira entre 0 e 100 e o envio único de `C4A_GAME_SCORE`.

Validações executadas: sintaxe JavaScript; verificação de espaços no diff; teste da lógica nas 12 combinações de mapa e dificuldade, com colisão, 36 respostas corretas e envio único de pontuação por partida; partida completa no Chrome pelo teclado (4 fases, 12 perguntas, 8 acertos = 67 pontos); persistência de preferências após recarregar; navegação de slider por teclado; foco ao fechar configurações; telas de 320, 390 e 844 pixels, incluindo texto ampliado e alto contraste.

Limites da validação: não foi realizada homologação com NVDA/VoiceOver, Lighthouse, simuladores de daltonismo ou dispositivos físicos. A revisão de semântica e os testes no navegador não equivalem à certificação integral de acessibilidade exigida pelos critérios do Azure. Os itens do Azure não foram alterados para concluídos.

## Tecnologias

- HTML5
- CSS3
- JavaScript sem dependências externas obrigatórias
