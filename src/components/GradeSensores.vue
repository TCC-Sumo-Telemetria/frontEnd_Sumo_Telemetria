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
    <p class="legenda">Tempo em segundos · azul = 1 · cinza = 0</p>
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
  color: #5a5a5a;
  font-weight: normal;
}
th.nome {
  text-align: left;
  font-weight: bold;
  color: #1f1f1f;
  padding-right: 6px;
}
td {
  width: 26px;
  height: 16px;
  border-radius: 3px;
}
td.um {
  background: #0b2a7a;
}
td.zero {
  background: #e3e8f2;
}
.legenda {
  font-size: 12px;
  color: #5a5a5a;
}
</style>
