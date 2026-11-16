<template>
  <div class="grafico">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import Chart from 'chart.js/auto'

const props = defineProps({
  tempos: { type: Array, required: true },
  rpm1: { type: Array, required: true },
  rpm2: { type: Array, required: true }
})

const canvas = ref(null)
let grafico = null

function desenhar() {
  if (grafico) grafico.destroy()
  grafico = new Chart(canvas.value, {
    type: 'line',
    data: {
      labels: props.tempos.map((t) => t.toFixed(0)),
      datasets: [
        { label: 'RPM1 (motor 1)', data: props.rpm1, borderColor: '#5b8cff', backgroundColor: 'rgba(91, 140, 255, 0.15)', fill: true, tension: 0.25 },
        { label: 'RPM2 (motor 2)', data: props.rpm2, borderColor: '#ff8a00', backgroundColor: 'rgba(255, 138, 0, 0.12)', fill: true, tension: 0.25 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: '#e6ebf5', usePointStyle: true } },
        tooltip: { backgroundColor: '#1a2340', borderColor: '#26314f', borderWidth: 1 }
      },
      elements: { point: { radius: 3, hoverRadius: 6 }, line: { borderWidth: 2.5 } },
      scales: {
        x: {
          title: { display: true, text: 'Tempo (s)', color: '#8f9bb8' },
          ticks: { color: '#8f9bb8' },
          grid: { color: 'rgba(38, 49, 79, 0.5)' }
        },
        y: {
          title: { display: true, text: 'RPM', color: '#8f9bb8' },
          ticks: { color: '#8f9bb8' },
          grid: { color: 'rgba(38, 49, 79, 0.5)' },
          beginAtZero: true
        }
      }
    }
  })
}

onMounted(desenhar)
watch(() => [props.tempos, props.rpm1, props.rpm2], desenhar)
onBeforeUnmount(() => grafico && grafico.destroy())
</script>

<style scoped>
.grafico {
  height: 320px;
}
</style>
