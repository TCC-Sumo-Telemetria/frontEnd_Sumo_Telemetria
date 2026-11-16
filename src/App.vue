<template>
  <header>
    <h1>Telemetria · Robô Mega Sumô</h1>
    <span v-if="MODO_DEMO" class="selo">Modo demonstração (dados reais dos testes de bancada)</span>
  </header>

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

    <div v-if="partida" class="card cabecalho">
      <div>
        <h2>{{ partida.title }}</h2>
        <span class="nota">{{ partida.opponentName }} · {{ partida.date }} · {{ partida.isClosed ? 'Encerrada' : 'Aberta' }}</span>
      </div>
      <div class="botoes-cabecalho">
        <button class="secundario" :disabled="!partida.rounds.length" @click="exportar">Exportar JSON</button>
        <button class="perigo" :disabled="!partida.isClosed" @click="excluir">Excluir partida</button>
      </div>
    </div>
    <p v-if="erroExcluir" class="erro-msg">{{ erroExcluir }}</p>

    <div v-if="partida && partida.rounds.length === 0" class="card">
      <p class="nota">Esta partida ainda não tem rounds para analisar. Na API, os rounds ficam disponíveis depois que a partida é encerrada.</p>
    </div>

    <template v-if="partida && partida.rounds.length">
      <div class="card">
        <h2>Comparação entre rounds</h2>
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
      </div>

      <div class="card">
        <div class="abas">
          <button
            v-for="r in partida.rounds"
            :key="r.roundNumber"
            :class="{ ativo: roundAtual && roundAtual.roundNumber === r.roundNumber }"
            @click="roundAtual = r"
          >
            Round {{ r.roundNumber }}
          </button>
        </div>

        <template v-if="roundAtual">
          <p v-if="roundAtual.descricao" class="nota">{{ roundAtual.descricao }}</p>

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
      </div>
    </template>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import NovaPartida from './components/NovaPartida.vue'
import GraficoRpm from './components/GraficoRpm.vue'
import GradeSensores from './components/GradeSensores.vue'
import { MODO_DEMO, listarPartidas, buscarPartida, excluirPartida } from './services/api.js'
import { organizarRound, metricasMotor, mudancasDeEstado, duracaoRound } from './utils/metricas.js'

const partidas = ref([])
const partida = ref(null)
const roundAtual = ref(null)
const erroExcluir = ref('')

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
  partidas.value = [...(await listarPartidas())]
  // se já tem uma partida selecionada, busca de novo para atualizar (ex.: de Aberta para Encerrada)
  if (partida.value) await selecionar(partida.value._id)
  else if (partidas.value.length) await selecionar(partidas.value[0]._id)
}

async function selecionar(id) {
  partida.value = await buscarPartida(id)
  roundAtual.value = partida.value.rounds.length ? partida.value.rounds[partida.value.rounds.length - 1] : null
}

const dados = computed(() => organizarRound(roundAtual.value))
const nomesDigitais = computed(() => Object.keys(dados.value.series).filter((n) => !n.startsWith('RPM')))
const motor1 = computed(() => metricasMotor(dados.value.tempos, dados.value.series.RPM1 || [0]))
const motor2 = computed(() => metricasMotor(dados.value.tempos, dados.value.series.RPM2 || [0]))
const duracao = computed(() => duracaoRound(dados.value.tempos))

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