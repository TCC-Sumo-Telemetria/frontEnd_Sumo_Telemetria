<template>
  <div class="grafico">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import Chart from 'chart.js/auto'

// resumo: [{ numero, m1: { pico, media }, m2: { pico, media } }, ...]
const props = defineProps({
  resumo: { type: Array, required: true }
})

const canvas = ref(null)
let grafico = null

function desenhar() {
  if (grafico) grafico.destroy()
  grafico = new Chart(canvas.value, {
    type: 'bar',
    data: {
      labels: props.resumo.map((r) => `Round ${r.numero}`),
      datasets: [
        { label: 'Pico RPM1 (motor 1)', data: props.resumo.map((r) => r.m1.pico), backgroundColor: '#5b8cff', borderRadius: 6 },
        { label: 'Pico RPM2 (motor 2)', data: props.resumo.map((r) => r.m2.pico), backgroundColor: '#ff8a00', borderRadius: 6 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#e6ebf5', usePointStyle: true } },
        tooltip: { backgroundColor: '#1a2340', borderColor: '#26314f', borderWidth: 1 }
      },
      scales: {
        x: { ticks: { color: '#8f9bb8' }, grid: { display: false } },
        y: {
          title: { display: true, text: 'Pico de RPM', color: '#8f9bb8' },
          ticks: { color: '#8f9bb8' },
          grid: { color: 'rgba(38, 49, 79, 0.5)' },
          beginAtZero: true
        }
      }
    }
  })
}

onMounted(desenhar)
watch(() => props.resumo, desenhar)
onBeforeUnmount(() => grafico && grafico.destroy())
</script>

<style scoped>
.grafico {
  height: 260px;
  margin-bottom: 8px;
}
</style>