'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const { sandbox } = require('./hooks-pendientes.helpers.cjs')
const file = 'hooks/use-api-resource.ts'
function mount({ result = { rows: [1] }, status = 200, autoFetch = false } = {}) {
  const requests = [], state = [], effects = []
  let stateCount = 0
  const useState = initial => {
    const i = stateCount++
    state[i] = initial
    return [initial, value => { state[i] = typeof value === 'function' ? value(state[i]) : value }]
  }
  const fakeReact = {
    useState, useCallback: fn => fn,
    useEffect: effect => { effects.push(effect) },
    useMemo: factory => factory(), useRef: value => ({ current: value })
  }
  const fetch = async (url, init) => {
    requests.push({ url, init })
    return { ok: status < 400, status, json: async () => status < 400 ? result : { error: 'Rechazado' } }
  }
  const hooks = sandbox(file, { react: fakeReact }, { fetch, queueMicrotask: f => Promise.resolve().then(f) })
  const instance = hooks.useApiResource('/api/test', { params: { page: 2, search: 'ana', skip: null }, autoFetch })
  return { instance, requests, effects, state }
}
test('API Resource: mantiene exportación pública y mutate', () => {
  const sim = mount()
  assert.equal(typeof sim.instance.mutate, 'function')
  assert.equal(typeof sim.instance.setData, 'function')
  assert.equal(sim.instance.data, null)
})
test('API Resource: mutate conserva parámetros y devuelve resultado asincrónico', async () => {
  const sim = mount()
  await sim.instance.mutate()
  assert.equal(sim.requests.length, 1)
  const url = new URL(sim.requests[0].url, 'http://localhost:3000')
  assert.equal(url.pathname, '/api/test')
  assert.equal(url.searchParams.get('page'), '2')
  assert.equal(url.searchParams.get('search'), 'ana')
  assert.equal(url.searchParams.has('skip'), false)
  assert.deepEqual(sim.state[0], { rows: [1] })
})
test('API Resource: no lanza una petición automática si autoFetch=false', async () => {
  const sim = mount({ autoFetch: false })
  for (const effect of sim.effects) { effect() }
  await Promise.resolve()
  assert.equal(sim.requests.length, 0)
})
test('API Resource: informa errores HTTP y restablece carga', async () => {
  const sim = mount({ status: 403 })
  await sim.instance.mutate()
  assert.equal(sim.state[2], 'Rechazado')
  assert.equal(sim.state[1], false)
})
