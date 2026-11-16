<template>
  <header>
    <h1>Telemetria · Robô Mega Sumô</h1>
    <span v-if="MODO_DEMO" class="selo">Modo demonstração (dados reais dos testes de bancada)</span>
    <label class="auto">
      <input type="checkbox" v-model="autoAtualizar" />
      Atualização automática
      <span v-if="autoAtualizar && ultimaAtualizacao" class="nota">· {{ ultimaAtualizacao }}</span>
    </label>
  </header>

  <section class="hero">
    <div class="hero-texto">
      <span class="hero-tag">OMEGABOTZ · Mega Sumô 3 kg</span>
      <h2 class="hero-titulo">Sistema de Telemetria para a Avaliação de Desempenho de um Robô de Mega Sumô Autônomo</h2>
      <p>Dados de cada round coletados no ESP32, enviados por Wi-Fi e armazenados no MongoDB.</p>
      <div class="hero-numeros">
        <div><strong>{{ partidas.length }}</strong><span>partidas</span></div>
        <div><strong>{{ partidas.filter((p) => p.isClosed).length }}</strong><span>encerradas</span></div>
      </div>
    </div>
  </section>

  <main>
    <NovaPartida @alterou="carregar" />

    <div class="card">
      <h2>Partidas</h2>
      <div class="lista">
        <button
          v-for="p in partidas"
          :key="p._id"
          :class="['item', { ativo: partida && partida._id === p._id }]"
          @click="selecionar(p._id)"
        >
          <strong>{{ p.title }}</strong>
          <span>{{ p.opponentName }} · {{ p.date }}</span>
          <span :class="p.isClosed ? 'fechada' : 'aberta'">{{ p.isClosed ? 'Encerrada' : 'Aberta' }}</span>
        </button>
      </div>
    </div>

    <div v-if="carregando" class="card carregando">
      <span class="spinner"></span> Carregando partida…
    </div>

    <div v-if="partida" class="card cabecalho">
      <div>
        <h2>{{ partida.title }}</h2>
        <span class="nota">{{ partida.opponentName }} · {{ partida.date }} · {{ partida.isClosed ? 'Encerrada' : 'Aberta' }}</span>
        <span v-if="partida.createdAt" class="nota"><br />Criada em {{ formatarHora(partida.createdAt) }}</span>
        <span v-if="partida.closedAt" class="nota"> · Encerrada em {{ formatarHora(partida.closedAt) }}</span>
      </div>
      <div class="botoes-cabecalho">
        <button class="secundario" :disabled="!partida.rounds.length" @click="exportar">Exportar JSON</button>
        <button class="secundario" :disabled="!roundAtual" @click="exportarCsv">Exportar CSV do round</button>
        <button class="perigo" :disabled="!partida.isClosed" @click="excluir">Excluir partida</button>
      </div>
      <div v-if="partida.rounds.length" class="abas abas-cabecalho">
        <button :class="{ ativo: modo === 'comparacao' }" @click="modo = 'comparacao'">📊 Comparação</button>
        <button
          v-for="r in partida.rounds"
          :key="r.roundNumber"
          :class="{ ativo: modo === 'round' && roundAtual && roundAtual.roundNumber === r.roundNumber }"
          @click="roundAtual = r; modo = 'round'"
        >
          Round {{ r.roundNumber }}
        </button>
      </div>
    </div>
    <p v-if="erroExcluir" class="erro-msg">{{ erroExcluir }}</p>

    <div v-if="partida && partida.rounds.length === 0" class="card">
      <p class="nota">Esta partida ainda não tem rounds para analisar. Na API, os rounds ficam disponíveis depois que a partida é encerrada.</p>
    </div>

    <template v-if="partida && partida.rounds.length">
      <div v-if="modo === 'comparacao'" class="card">
        <h2>Comparação entre rounds</h2>
        <GraficoEvolucao :resumo="resumoRounds" />
        <table class="tabela">
          <thead>
            <tr>
              <th>Round</th><th>Duração</th>
              <th>Pico RPM1</th><th>Pico RPM2</th>
              <th>Média RPM1*</th><th>Média RPM2*</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in resumoRounds" :key="r.numero">
              <td>{{ r.numero }}</td><td>{{ r.duracao }} s</td>
              <td>{{ r.m1.pico }}</td><td>{{ r.m2.pico }}</td>
              <td>{{ r.m1.media }}</td><td>{{ r.m2.media }}</td>
            </tr>
          </tbody>
        </table>
        <p class="nota">* média apenas das leituras com o motor girando. A queda do pico ao longo das partidas é o indicador de desgaste.</p>
        <SerieSimulada
          :pico-motor1="Math.max(...resumoRounds.map((r) => r.m1.pico))"
          :pico-motor2="Math.max(...resumoRounds.map((r) => r.m2.pico))"
        />
      </div>

      <div v-else class="card">
        <template v-if="roundAtual">
          <div class="alternar">
            <button :class="{ ativo: verQualidade === false }" @click="verQualidade = false">📈 Telemetria</button>
            <button :class="{ ativo: verQualidade === true }" @click="verQualidade = true">✅ Qualidade</button>
          </div>
          <p v-if="roundAtual.descricao" class="nota">{{ roundAtual.descricao }}</p>

          <QualidadeDados
            v-if="verQualidade"
            :titulo="`Qualidade dos dados · Round ${roundAtual.roundNumber}`"
            :tempos="dados.tempos"
            :series="dados.series"
          />

          <template v-else>

          <div class="metricas">
            <div class="metrica"><span>Duração</span><strong>{{ duracao }} s</strong></div>
            <div class="metrica"><span>Pico motor 1</span><strong>{{ motor1.pico }} RPM</strong></div>
            <div class="metrica"><span>Pico motor 2</span><strong>{{ motor2.pico }} RPM</strong></div>
            <div class="metrica"><span>Motor 1 girando</span><strong>{{ motor1.tempoGirando }} s</strong></div>
            <div class="metrica"><span>Motor 2 girando</span><strong>{{ motor2.tempoGirando }} s</strong></div>
          </div>

          <h3>Rotação dos motores (sensor Hall)</h3>
          <GraficoRpm :tempos="dados.tempos" :rpm1="dados.series.RPM1 || []" :rpm2="dados.series.RPM2 || []" />

          <h3>Sensores infravermelhos e de borda</h3>
          <GradeSensores :tempos="dados.tempos" :series="dados.series" :nomes="nomesDigitais" />

          <table class="tabela">
            <thead><tr><th>Sensor</th><th v-for="n in nomesDigitais" :key="n">{{ n }}</th></tr></thead>
            <tbody>
              <tr>
                <td>Mudanças de estado</td>
                <td v-for="n in nomesDigitais" :key="n">{{ mudancasDeEstado(dados.series[n]) }}</td>
              </tr>
            </tbody>
          </table>
          </template>
        </template>
      </div>
    </template>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import NovaPartida from './components/NovaPartida.vue'
import GraficoRpm from './components/GraficoRpm.vue'
import GradeSensores from './components/GradeSensores.vue'
import GraficoEvolucao from './components/GraficoEvolucao.vue'
import SerieSimulada from './components/SerieSimulada.vue'
import QualidadeDados from './components/QualidadeDados.vue'
import { MODO_DEMO, listarPartidas, buscarPartida, excluirPartida } from './services/api.js'
import { organizarRound, metricasMotor, mudancasDeEstado, duracaoRound } from './utils/metricas.js'

const partidas = ref([])
const partida = ref(null)
const roundAtual = ref(null)
const erroExcluir = ref('')
const modo = ref('round') // 'round' ou 'comparacao'
const verQualidade = ref(false)

// "2026-11-16T16:14:00-03:00" -> "16/11/2026 às 16:14"
function formatarHora(texto) {
  const d = new Date(texto)
  if (isNaN(d)) return texto
  return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

// Gera um arquivo .json com a partida e todos os rounds, usando os dados que já vieram da API
function exportar() {
  const conteudo = JSON.stringify(partida.value, null, 2)
  const arquivo = new Blob([conteudo], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(arquivo)
  const nome = `${partida.value.title}_${partida.value.date}`.replace(/[^a-zA-Z0-9_-]+/g, '_')
  link.download = `partida_${nome}.json`
  link.click()
  URL.revokeObjectURL(link.href)
}

// Gera um .csv do round selecionado, no mesmo formato que o robô grava (Timestamp,RPM1,...)
function exportarCsv() {
  const sensores = roundAtual.value.sensors
  const cabecalho = ['Timestamp', ...sensores.map((s) => s.name)]
  const linhas = sensores[0].readings.map((leitura, i) =>
    [leitura.timestamp, ...sensores.map((s) => s.readings[i].value)].join(',')
  )
  const conteudo = [cabecalho.join(','), ...linhas].join('\n')
  const arquivo = new Blob([conteudo], { type: 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(arquivo)
  const nome = `${partida.value.title}_round${roundAtual.value.roundNumber}`.replace(/[^a-zA-Z0-9_-]+/g, '_')
  link.download = `${nome}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

// Atualização automática: a cada 5 s confere se surgiu partida nova,
// se a partida selecionada mudou de estado ou ganhou rounds
const autoAtualizar = ref(true)
const ultimaAtualizacao = ref('')
let timer = null

async function atualizar() {
  if (!autoAtualizar.value) return
  try {
    const nova = await listarPartidas()
    partidas.value = ordenar(nova)
    if (partida.value) {
      const p = nova.find((x) => x._id === partida.value._id)
      if (p && (p.isClosed !== partida.value.isClosed || (p.roundCount || 0) > partida.value.rounds.length)) {
        const modoAtual = modo.value
        await selecionar(p._id)
        modo.value = modoAtual
      }
    }
    ultimaAtualizacao.value = new Date().toLocaleTimeString('pt-BR')
  } catch {
    // API fora do ar: tenta de novo no próximo ciclo
  }
}

onMounted(() => {
  timer = setInterval(atualizar, 5000)
})
onBeforeUnmount(() => clearInterval(timer))

async function excluir() {
  const ok = window.confirm(`Excluir a partida "${partida.value.title}" e todos os seus rounds? Essa ação não pode ser desfeita.`)
  if (!ok) return
  try {
    await excluirPartida(partida.value._id)
    erroExcluir.value = ''
    partida.value = null
    roundAtual.value = null
    await carregar()
  } catch (e) {
    erroExcluir.value = e.message
  }
}

async function carregar() {
  partidas.value = ordenar(await listarPartidas())
  // se já tem uma partida selecionada, busca de novo para atualizar (ex.: de Aberta para Encerrada)
  if (partida.value) await selecionar(partida.value._id)
  else if (partidas.value.length) await selecionar(partidas.value[0]._id)
}

const carregando = ref(false)

async function selecionar(id) {
  if (!partida.value || partida.value._id !== id) modo.value = 'round'
  carregando.value = true
  try {
    partida.value = await buscarPartida(id)
  } finally {
    carregando.value = false
  }
  roundAtual.value = partida.value.rounds.length ? partida.value.rounds[partida.value.rounds.length - 1] : null
}

const dados = computed(() => organizarRound(roundAtual.value))
const nomesDigitais = computed(() => Object.keys(dados.value.series).filter((n) => !n.startsWith('RPM')))
const motor1 = computed(() => metricasMotor(dados.value.tempos, dados.value.series.RPM1 || [0]))
const motor2 = computed(() => metricasMotor(dados.value.tempos, dados.value.series.RPM2 || [0]))
const duracao = computed(() => duracaoRound(dados.value.tempos))

// mais recentes primeiro: pela data e, no mesmo dia, pelo id
function ordenar(lista) {
  return [...lista].sort((a, b) => (b.date || '').localeCompare(a.date || '') || b._id - a._id)
}

const resumoRounds = computed(() =>
  partida.value.rounds.map((r) => {
    const d = organizarRound(r)
    return {
      numero: r.roundNumber,
      duracao: duracaoRound(d.tempos),
      m1: metricasMotor(d.tempos, d.series.RPM1 || [0]),
      m2: metricasMotor(d.tempos, d.series.RPM2 || [0])
    }
  })
)

onMounted(carregar)
</script>