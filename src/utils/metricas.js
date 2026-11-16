// Funções que transformam um round (como vem do MongoDB) em dados para a tela.

// Devolve { tempos: [s], series: { RPM1: [...], S1: [...] } }
export function organizarRound(round) {
  const series = {}
  let tempos = []
  for (const sensor of round.sensors) {
    series[sensor.name] = sensor.readings.map((r) => Number(r.value))
    if (tempos.length === 0) {
      tempos = sensor.readings.map((r) => Number(r.timestamp) / 1000)
    }
  }
  return { tempos, series }
}

// Métricas de um motor: pico, média enquanto gira e tempo girando
export function metricasMotor(tempos, valores) {
  const pico = Math.max(...valores)
  const girando = valores.filter((v) => v > 0)
  const media = girando.length ? Math.round(girando.reduce((a, b) => a + b, 0) / girando.length) : 0
  let tempoGirando = 0
  for (let i = 0; i < valores.length - 1; i++) {
    if (valores[i] > 0) tempoGirando += tempos[i + 1] - tempos[i]
  }
  return { pico, media, tempoGirando: Math.round(tempoGirando) }
}

// Quantas vezes o sinal digital mudou de estado no round
export function mudancasDeEstado(valores) {
  let total = 0
  for (let i = 1; i < valores.length; i++) {
    if (valores[i] !== valores[i - 1]) total++
  }
  return total
}

export function duracaoRound(tempos) {
  if (tempos.length < 2) return 0
  return Math.round(tempos[tempos.length - 1] - tempos[0])
}
