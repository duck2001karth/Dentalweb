'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const { sandbox } = require('./hooks-pendientes.helpers.cjs')
function load() {
  return sandbox('hooks/use-toast.ts', { react: { useState: value => [value, () => {}], useEffect: () => {} } })
}
test('Notificaciones: mantiene exports useToast, toast y reducer', () => {
  const hook = load()
  assert.equal(typeof hook.useToast, 'function')
  assert.equal(typeof hook.toast, 'function')
  assert.equal(typeof hook.reducer, 'function')
})
test('Notificaciones: solo muestra una notificación a la vez', () => {
  const { reducer } = load()
  let state = { toasts: [] }
  state = reducer(state, { type: 'ADD_TOAST', toast: { id: '1', title: 'Uno', open: true } })
  state = reducer(state, { type: 'ADD_TOAST', toast: { id: '2', title: 'Dos', open: true } })
  assert.equal(state.toasts.length, 1)
  assert.equal(state.toasts[0].id, '2')
})
test('Notificaciones: UPDATE conserva notificación y actualiza contenido', () => {
  const { reducer } = load()
  const state = reducer({ toasts: [{ id: '1', title: 'Antes' }] },
    { type: 'UPDATE_TOAST', toast: { id: '1', title: 'Después' } })
  assert.equal(state.toasts[0].title, 'Después')
})
test('Notificaciones: REMOVE selectivo conserva otras entradas', () => {
  const { reducer } = load()
  const next = reducer({ toasts: [{ id: '1' }, { id: '2' }] },
    { type: 'REMOVE_TOAST', toastId: '2' })
  assert.deepEqual(next.toasts.map(x => x.id), ['1'])
})
test('Notificaciones: toast devuelve identificador y acciones', () => {
  const { toast } = load()
  const result = toast({ title: 'Prueba sin navegador' })
  assert.equal(typeof result.id, 'string')
  assert.equal(typeof result.update, 'function')
  assert.equal(typeof result.dismiss, 'function')
})
