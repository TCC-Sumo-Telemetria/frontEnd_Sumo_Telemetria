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
        { label: 'RPM1 (motor 1)', data: props.rpm1, borderColor: '#2667FF', backgroundColor: '#2667FF', tension: 0 },
        { label: 'RPM2 (motor 2)', data: props.rpm2, borderColor: '#FF8A00', backgroundColor: '#FF8A00', tension: 0 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: { title: { display: true, text: 'Tempo (s)' } },
        y: { title: { display: true, text: 'RPM' }, beginAtZero: true }
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
  height: 280px;
}
</style>
