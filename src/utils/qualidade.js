// Verificações automáticas de qualidade dos dados de um round.
// Recebe { tempos: [s], series: { RPM1: [...], S1: [...] } } (saída de organizarRound).

export const LIMITE_RPM = 10000 // acima disso o valor é fisicamente improvável para o motor 775

export function analisarQualidade({ tempos, series }) {
  const nomes = Object.keys(series)
  const n = tempos.length
  const itens = []

  // 1. Integridade: todas as colunas com o mesmo número de leituras e sem valores inválidos
  const tamanhos = nomes.map((k) => series[k].length)
  const colunasIguais = tamanhos.every((t) => t === n)
  const invalidos = nomes.reduce((s, k) => s + series[k].filter((v) => !Number.isFinite(v)).length, 0)
  itens.push({
    titulo: 'Integridade das colunas',
    ok: colunasIguais && invalidos === 0 && n > 0,
    detalhe: colunasIguais
      ? `${nomes.length} colunas com ${n} leituras cada${invalidos ? `, ${invalidos} valores inválidos` : ''}`
      : `colunas com tamanhos diferentes (${[...new Set(tamanhos)].join(', ')} leituras)`
  })

  // 2. Regularidade da amostragem (intervalo entre leituras e jitter)
  const intervalos = []
  for (let i = 1; i < n; i++) intervalos.push(Math.round((tempos[i] - tempos[i - 1]) * 1000))
  const amostragem = { media: 0, min: 0, max: 0, jitter: 0, desvio: 0, faltando: 0 }
  if (intervalos.length) {
    const ordenados = [...intervalos].sort((a, b) => a - b)
    const mediana = ordenados[Math.floor(ordenados.length / 2)]
    amostragem.media = Math.round(intervalos.reduce((a, b) => a + b, 0) / intervalos.length)
    amostragem.min = ordenados[0]
    amostragem.max = ordenados[ordenados.length - 1]
    amostragem.jitter = amostragem.max - amostragem.min
    amostragem.desvio = Math.round(
      Math.sqrt(intervalos.reduce((s, x) => s + (x - amostragem.media) ** 2, 0) / intervalos.length)
    )
    amostragem.faltando = intervalos.filter((x) => x > mediana * 1.5).length
  }
  const jitterPct = amostragem.media ? (amostragem.jitter / amostragem.media) * 100 : 0
  itens.push({
    titulo: 'Regularidade da amostragem',
    ok: intervalos.length > 0 && jitterPct <= 5,
    detalhe: intervalos.length
      ? `intervalo médio ${amostragem.media} ms (de ${amostragem.min} a ${amostragem.max} ms) · jitter ${amostragem.jitter} ms (${jitterPct.toFixed(1)}%)`
      : 'menos de 2 leituras'
  })

  // 3. Leituras faltando (buraco maior que 1,5x o intervalo normal)
  itens.push({
    titulo: 'Leituras faltando',
    ok: amostragem.faltando === 0,
    detalhe: amostragem.faltando ? `${amostragem.faltando} intervalo(s) acima do esperado` : 'nenhum buraco na sequência'
  })

  // 4. Valores fisicamente impossíveis
  const rpm = nomes.filter((k) => k.startsWith('RPM'))
  const digitais = nomes.filter((k) => !k.startsWith('RPM'))
  const rpmFora = rpm.reduce((s, k) => s + series[k].filter((v) => v < 0 || v > LIMITE_RPM).length, 0)
  const digitalFora = digitais.reduce((s, k) => s + series[k].filter((v) => v !== 0 && v !== 1).length, 0)
  itens.push({
    titulo: 'Valores dentro da faixa física',
    ok: rpmFora === 0 && digitalFora === 0,
    detalhe:
      rpmFora || digitalFora
        ? `${rpmFora} RPM fora de 0–${LIMITE_RPM} · ${digitalFora} sensores digitais fora de 0/1`
        : `RPM entre 0 e ${LIMITE_RPM} · sensores digitais só com 0 ou 1`
  })

  // 5. Sensores sem nenhuma mudança (pode ser normal em bancada, ou cabo solto/defeito)
  const parados = digitais.filter((k) => series[k].every((v) => v === series[k][0]))
  itens.push({
    titulo: 'Sensores que mudaram de estado',
    ok: parados.length === 0,
    aviso: true,
    detalhe: parados.length
      ? `sem nenhuma mudança: ${parados.join(', ')} (normal sem oponente; em combate, verificar)`
      : 'todos os sensores mudaram ao menos uma vez'
  })

  return { itens, amostragem }
}