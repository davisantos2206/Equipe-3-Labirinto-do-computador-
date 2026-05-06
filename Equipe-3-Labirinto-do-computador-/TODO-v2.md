# TODO v2: 4 Labirintos Separados + Melhorias (Feedback)

## Novo Plano para 4 Fases/Labirintos Únicos

### Information Gathered
- Feedback: 4 labirintos (1/componente), 4 fases, cores alteradas, labirintos maiores/assimétricos, menos 'IA' (orgânico).
- Atual: 1 labirinto 7x12 (600x400 canvas), quizzes em tiles, cores vivas.

### Plan
1. **script.js**: Array `maps[4]` (maiores ~12x18, únicos assimétricos). `currentLevel = 0`. Win fase1 → level++, novo labirinto com tema (ex. fase1 teclado: muitos 'teclados'). Quiz após sair (end tile). Player reset pos. Cores por fase (fase1 azul-claro teclado, fase2 vermelho CPU, etc.).
2. **jogo labirinto.html**: Fase indicator `<p id=\"level\">Fase 1: Teclado</p>`. Canvas maior (900x600).
3. **style.css**: Cores pastel variadas, texturas parede (patterns), transições fade entre fases, fontes handwritten-like.

### Dependent Files
- script.js (principal)
- jogo labirinto.html
- style.css

### Followup
- Editar arquivos.
- Testar 4 fases sequenciais.
- Demo: Abrir HTML.

<ask_followup_question>Confirma este plano v2 (4 labirintos únicos, maiores, cores por fase)? Algum ajuste antes de TODO.md e implementar?</ask_followup_question>
