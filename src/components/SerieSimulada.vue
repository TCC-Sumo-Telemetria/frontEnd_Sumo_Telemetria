<template>
  <div class="simulada">
    <div class="topo">
      <div>
        <h3>Evolução entre partidas <span class="selo-sim">SIMULADO</span></h3>
        <p class="nota">
          Série gerada a partir do pico real desta partida, com desgaste simulado no motor 2
          (−3% por partida a partir da 4ª). Os dados não vão para o banco.
        </p>
      </div>
      <button class="secundario" @click="mostrar = !mostrar">
        {{ mostrar ? 'Esconder série simulada' : 'Ver série simulada' }}
      </button>
    </div>

    <template v-if="mostrar">
      <div class="grafico"><canvas ref="canvas"></canvas></div>
      <p v-if="alerta" class="alerta">⚠️ {{ alerta }}</p>
    </template>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onBeforeUnmount, computed } from 'vue'
import Chart from 'chart.js/auto'

// pico real usado como ponto de partida (vem da partida selecionada)
const props = defineProps({
  picoMotor1: { type: Number, required: true },
  picoMotor2: { type: Number, required: true }
})

const mostrar = ref(false)
const canvas = ref(null)
let grafico = null

// variação "natural" fixa (sem sorteio), para o gráfico ser sempre igual
const variacao = [0, -0.007, 0.006, -0.004, 0.002, -0.01, -0.001, -0.005]

const serie = computed(() =>
  variacao.map((v, i) => {
    const partida = i + 1
    const desgaste = partida >= 4 ? 1 - 0.03 * (partida - 3) : 1
    return {
      nome: `P${partida}`,
      m1: Math.round(props.picoMotor1 * (1 + v)),
      m2: Math.round(props.picoMotor2 * (1 + v) * desgaste)
    }
  })
)

// alerta quando o motor 2 cai mais de 10% em relação às 3 primeiras partidas
const alerta = computed(() => {
  const s = serie.value
  const base = (s[0].m2 + s[1].m2 + s[2].m2) / 3
  const ultima = s[s.length - 1].m2
  const queda = Math.round((1 - ultima / base) * 100)
  return queda > 10 ? `Motor 2 com queda de ${queda}% no pico em relação às primeiras partidas: verificar motor.` : ''
})

function desenhar() {
  if (grafico) grafico.destroy()
  if (!canvas.value) return
  grafico = new Chart(canvas.value, {
    type: 'line',
    data: {
      labels: serie.value.map((p) => p.nome),
      datasets: [
        { label: 'Pico motor 1 (simulado)', data: serie.value.map((p) => p.m1), borderColor: '#5b8cff', backgroundColor: '#5b8cff', borderDash: [6, 4], tension: 0.2 },
        { label: 'Pico motor 2 (simulado)', data: serie.value.map((p) => p.m2), borderColor: '#ff8a00', backgroundColor: '#ff8a00', borderDash: [6, 4], tension: 0.2 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#e6ebf5', usePointStyle: true } },
        title: { display: true, text: 'DADOS SIMULADOS · pico de RPM por partida', color: '#ff8a00' }
      },
      scales: {
        x: { title: { display: true, text: 'Partida (simulada)', color: '#8f9bb8' }, ticks: { color: '#8f9bb8' }, grid: { display: false } },
        y: { title: { display: true, text: 'Pico de RPM', color: '#8f9bb8' }, ticks: { color: '#8f9bb8' }, grid: { color: 'rgba(38, 49, 79, 0.5)' } }
      }
    }
  })
}

watch([mostrar, serie], async () => {
  if (!mostrar.value) return
  await nextTick()
  desenhar()
})
onBeforeUnmount(() => grafico && grafico.destroy())
</script>

<style scoped>
.simulada {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px dashed #26314f;
}
.topo {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}
.topo h3 {
  margin: 0 0 6px;
}
.selo-sim {
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: #ff8a00;
  background: rgba(255, 138, 0, 0.15);
  border: 1px solid rgba(255, 138, 0, 0.4);
}
.grafico {
  height: 280px;
  margin-top: 14px;
}
.alerta {
  margin: 12px 0 0;
  padding: 10px 14px;
  border-radius: 10px;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.35);
  font-size: 13px;
}
</style>