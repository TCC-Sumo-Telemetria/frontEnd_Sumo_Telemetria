// Camada de acesso aos dados.
// MODO_DEMO = true  -> usa os dados reais dos testes de bancada (src/data/demo.js)
// MODO_DEMO = false -> chama a API em Go (api-telemetria-robo, porta 5000, via proxy /api do Vite)
import { partidasDemo } from '../data/demo.js'

export const MODO_DEMO = false

// Rotas da API (controller/matchController.go)
const ROTAS = {
  criarPartida: '/api/post-match', //                POST {title, date, opponentName}
  encerrarPartida: '/api/close-current-match', //    POST
  partidaAtual: '/api/get-current-match', //         GET  -> {id, title, date, opponentName, closed}
  partidasEncerradas: '/api/get-closed-matches', //  GET  -> [{..., roundCount}]
  partidaEncerrada: (id) => `/api/get-closed-match-id/${id}`, //       GET -> {..., roundCount}
  round: (id, numero) => `/api/get-match-round/${id}/${numero}`, //    GET -> {roundNumeber, sensors}
  excluirPartida: '/api/delete-match' //                               POST {id} (só partidas encerradas)
}

async function chamar(url, opcoes = {}) {
  const resp = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opcoes
  })
  let dados = await resp.json()
  // a resposta de sucesso da API vem com o JSON codificado duas vezes (texto dentro de texto)
  if (typeof dados === 'string') dados = JSON.parse(dados)
  if (!resp.ok) throw new Error(dados.error || `Erro ${resp.status} em ${url}`)
  return dados
}

// Converte o formato da API para o formato usado nas telas
function normalizarPartida(p, rounds = []) {
  return {
    _id: p.id,
    title: p.title,
    date: p.date,
    opponentName: p.opponentName,
    isClosed: p.closed,
    roundCount: p.roundCount || 0,
    rounds
  }
}

// última lista recebida, para saber se a partida está aberta antes de buscar
let ultimaLista = []
// ---------------- modo demonstração ----------------
let demo = JSON.parse(JSON.stringify(partidasDemo))

// ---------------- funções usadas pelas telas ----------------
export async function listarPartidas() {
  if (MODO_DEMO) return demo

  const encerradas = (await chamar(ROTAS.partidasEncerradas)) || []
  const lista = encerradas.map((p) => normalizarPartida(p))
  try {
    const atual = await chamar(ROTAS.partidaAtual)
    if (atual && atual.closed === false) lista.push(normalizarPartida(atual))
  } catch {
    // sem partida aberta: a API responde com erro, e isso é normal
  }
  ultimaLista = lista
  return lista
}

export async function buscarPartida(id) {
  if (MODO_DEMO) return demo.find((p) => p._id === id)

    // partida aberta: a API só libera os rounds depois de encerrar
  const daLista = ultimaLista.find((p) => p._id === id)
  if (daLista && daLista.isClosed === false) return daLista

  const info = await chamar(ROTAS.partidaEncerrada(id))
  const rounds = []
  for (let n = 1; n <= info.roundCount; n++) {
    const r = await chamar(ROTAS.round(id, n))
    rounds.push({ roundNumber: r.roundNumeber ?? n, sensors: r.sensors })
  }
  return normalizarPartida(info, rounds)
}

export async function criarPartida({ title, opponentName, date }) {
  if (MODO_DEMO) {
    if (demo.some((p) => p.isClosed === false)) {
      throw new Error('Já existe uma partida aberta. Encerre-a antes de criar outra.')
    }
    const nova = { _id: demo.length + 1, title, opponentName, date, isClosed: false, rounds: [] }
    demo.push(nova)
    return nova
  }
  return chamar(ROTAS.criarPartida, {
    method: 'POST',
    body: JSON.stringify({ title, date, opponentName })
  })
}

export async function encerrarPartida() {
  if (MODO_DEMO) {
    const aberta = demo.find((p) => p.isClosed === false)
    if (!aberta) throw new Error('Não há partida aberta.')
    aberta.isClosed = true
    return aberta
  }
  return chamar(ROTAS.encerrarPartida, { method: 'POST' })
}

export async function excluirPartida(id) {
  if (MODO_DEMO) {
    demo = demo.filter((p) => p._id !== id)
    return
  }
  return chamar(ROTAS.excluirPartida, { method: 'POST', body: JSON.stringify({ id }) })
}