# Telemetria Mega Sumô — front-end

Front-end em Vue 3 + Vite para criar partidas, encerrar partidas e analisar os rounds.

## Como rodar

1. Instale o Node.js (versão 18 ou mais nova): https://nodejs.org
2. Abra um terminal nesta pasta e rode:

```
npm install
npm run dev
```

3. Abra o endereço que aparecer (normalmente http://localhost:5173).

## Modo demonstração

Em `src/services/api.js`, `MODO_DEMO = true` usa os dados reais dos testes de bancada
(rounds 4 e 5, guardados em `src/data/demo.js`). Nada é enviado para a API.

## Ligar na API

1. Suba a API em Go (porta 5000).
2. Em `src/services/api.js`, troque `MODO_DEMO` para `false`.
3. Ajuste as rotas no objeto `ROTAS` conforme os endpoints da API.
4. A API precisa de rotas GET para listar partidas e buscar uma partida por id.

## Estrutura

- `src/App.vue`: tela principal (partidas, comparação, round selecionado)
- `src/components/NovaPartida.vue`: formulário de criar/encerrar partida
- `src/components/GraficoRpm.vue`: gráfico de RPM (Chart.js)
- `src/components/GradeSensores.vue`: grade de estados dos sensores IR e QTR
- `src/utils/metricas.js`: cálculo de pico, média, tempo girando e mudanças de estado
- `src/services/api.js`: acesso aos dados (demonstração ou API)
