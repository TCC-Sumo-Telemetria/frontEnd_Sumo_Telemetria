<template>
  <div class="qualidade">
    <h3>{{ titulo }}</h3>

    <ul>
      <li v-for="item in resultado.itens" :key="item.titulo" :class="estado(item)">
        <span class="icone">{{ item.ok ? '✓' : item.aviso ? '!' : '✕' }}</span>
        <div>
          <strong>{{ item.titulo }}</strong>
          <span class="detalhe">{{ item.detalhe }}</span>
        </div>
      </li>
    </ul>

    <div v-if="resultado.amostragem.media" class="amostragem">
      <div><span>Intervalo médio</span><strong>{{ resultado.amostragem.media }} ms</strong></div>
      <div><span>Desvio padrão</span><strong>{{ resultado.amostragem.desvio }} ms</strong></div>
      <div><span>Jitter (máx − mín)</span><strong>{{ resultado.amostragem.jitter }} ms</strong></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { analisarQualidade } from '../utils/qualidade.js'

const props = defineProps({
  titulo: { type: String, default: 'Qualidade dos dados' },
  tempos: { type: Array, required: true },
  series: { type: Object, required: true }
})

const resultado = computed(() => analisarQualidade({ tempos: props.tempos, series: props.series }))

function estado(item) {
  if (item.ok) return 'ok'
  return item.aviso ? 'aviso' : 'erro'
}
</script>

<style scoped>
.qualidade {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid #26314f;
}
.qualidade h3 {
  margin: 0 0 4px;
}
ul {
  list-style: none;
  padding: 0;
  margin: 14px 0 0;
  display: grid;
  gap: 8px;
}
li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #26314f;
  background: #1a2340;
}
li strong {
  display: block;
  font-size: 14px;
}
.detalhe {
  font-size: 12px;
  color: #8f9bb8;
}
.icone {
  flex: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
}
li.ok .icone {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.15);
}
li.aviso .icone {
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.15);
}
li.erro .icone {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.15);
}
li.erro {
  border-color: rgba(239, 68, 68, 0.4);
}
.amostragem {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 12px;
}
.amostragem div {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #26314f;
}
.amostragem span {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #8f9bb8;
}
.amostragem strong {
  font-size: 20px;
}
</style>