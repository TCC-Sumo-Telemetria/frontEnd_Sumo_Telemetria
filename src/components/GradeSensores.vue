<template>
  <div class="grade">
    <table>
      <thead>
        <tr>
          <th></th>
          <th v-for="(t, i) in tempos" :key="i">{{ t.toFixed(0) }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="nome in nomes" :key="nome">
          <th class="nome">{{ nome }}</th>
          <td
            v-for="(v, i) in series[nome]"
            :key="i"
            :class="v === 1 ? 'um' : 'zero'"
            :title="`${nome} em ${tempos[i].toFixed(1)} s = ${v}`"
          ></td>
        </tr>
      </tbody>
    </table>
    <div class="legenda">
      <span><i class="quad um"></i> 1 · sem detecção</span>
      <span><i class="quad zero"></i> 0 · sensor detectou (mudou de estado)</span>
      <span>Colunas = tempo em segundos</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  tempos: { type: Array, required: true },
  series: { type: Object, required: true },
  nomes: { type: Array, required: true }
})
</script>

<style scoped>
.grade {
  overflow-x: auto;
}
table {
  border-collapse: separate;
  border-spacing: 2px;
  font-size: 11px;
}
th {
  color: #8f9bb8;
  font-weight: normal;
}
th.nome {
  text-align: left;
  font-weight: bold;
  color: #e6ebf5;
  padding-right: 6px;
}
td {
  width: 26px;
  height: 16px;
  border-radius: 3px;
}
td.um {
  background: #5b8cff;
  box-shadow: 0 0 6px rgba(91, 140, 255, 0.5);
}
td.zero {
  background: #ef4444;
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.6);
}
.legenda {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin-top: 10px;
  font-size: 12px;
  color: #8f9bb8;
}
.legenda span {
  display: flex;
  align-items: center;
  gap: 6px;
}
.quad {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 3px;
}
.quad.um {
  background: #5b8cff;
}
.quad.zero {
  background: #ef4444;
}
</style>