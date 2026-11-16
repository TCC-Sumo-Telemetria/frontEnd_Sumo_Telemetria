<template>
  <div class="card">
    <h2>Partida</h2>
    <form @submit.prevent="criar">
      <label>Nome da partida <input v-model="title" required /></label>
      <label>Adversário <input v-model="opponentName" required /></label>
      <label>Data <input v-model="date" type="date" required /></label>
      <div class="botoes">
        <button type="submit">Criar partida</button>
        <button type="button" class="secundario" @click="encerrar">Encerrar partida aberta</button>
      </div>
    </form>
    <p v-if="mensagem" :class="erro ? 'erro' : 'ok'">{{ mensagem }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { criarPartida, encerrarPartida } from '../services/api.js'

const emit = defineEmits(['alterou'])
const title = ref('')
const opponentName = ref('')
const date = ref(new Date().toISOString().slice(0, 10))
const mensagem = ref('')
const erro = ref(false)

async function criar() {
  try {
    await criarPartida({ title: title.value, opponentName: opponentName.value, date: date.value })
    mensagem.value = 'Partida criada e aberta. O robô já pode enviar rounds.'
    erro.value = false
    title.value = ''
    opponentName.value = ''
    emit('alterou')
  } catch (e) {
    mensagem.value = e.message
    erro.value = true
  }
}

async function encerrar() {
  try {
    await encerrarPartida()
    mensagem.value = 'Partida encerrada. Os dados já podem ser analisados.'
    erro.value = false
    emit('alterou')
  } catch (e) {
    mensagem.value = e.message
    erro.value = true
  }
}
</script>

<style scoped>
form {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
}
label {
  display: flex;
  flex-direction: column;
  font-size: 13px;
  gap: 4px;
}
input {
  padding: 6px 8px;
  border: 1px solid #c9d3e6;
  border-radius: 6px;
}
.botoes {
  display: flex;
  gap: 8px;
}
.ok {
  color: #1e8e3e;
}
.erro {
  color: #c62828;
}
</style>
