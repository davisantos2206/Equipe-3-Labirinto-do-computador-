/* Orientação independente da interface: funciona também sem síntese de voz. */
(() => {
  const directions = [
    { dx: 0, dy: -1, name: "cima" }, { dx: 1, dy: 0, name: "direita" },
    { dx: 0, dy: 1, name: "baixo" }, { dx: -1, dy: 0, name: "esquerda" }
  ];

  function guide(map, column, row) {
    if (!Array.isArray(map) || map[row]?.[column] === undefined || map[row][column] === 1) {
      return "Inicie uma partida para receber orientação.";
    }
    const queue = [{ column, row, first: null, distance: 0 }];
    const visited = new Set([`${column},${row}`]);
    for (let i = 0; i < queue.length; i += 1) {
      const current = queue[i];
      if (map[current.row][current.column] === 9) {
        return current.distance === 0 ? "Você chegou ao componente. Responda ao desafio." :
          `Próximo passo: ${current.first}. Faltam ${current.distance} casas pelo caminho mais curto até o componente.`;
      }
      for (const direction of directions) {
        const nextColumn = current.column + direction.dx;
        const nextRow = current.row + direction.dy;
        const key = `${nextColumn},${nextRow}`;
        if (visited.has(key) || map[nextRow]?.[nextColumn] === undefined || map[nextRow][nextColumn] === 1) continue;
        visited.add(key);
        queue.push({ column: nextColumn, row: nextRow, first: current.first || direction.name, distance: current.distance + 1 });
      }
    }
    return "Não há caminho livre até o componente nesta posição.";
  }

  function speechSupported() {
    return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  }

  function stopSpeech() {
    if (speechSupported()) window.speechSynthesis.cancel();
  }

  function speak(text) {
    if (!speechSupported() || !text) return false;
    stopSpeech();
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(item => item.localService && /^pt(-|_)/i.test(item.lang)) ||
      voices.find(item => /^pt(-|_)/i.test(item.lang));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
    return true;
  }

  window.LabirintoAccessibility = Object.freeze({ guide, speak, stopSpeech, speechSupported });
})();
