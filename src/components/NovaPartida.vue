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
/* estilos no style.css */
</style>
