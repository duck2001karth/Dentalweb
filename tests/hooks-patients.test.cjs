'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const { sandbox, createQueryHarness, response } = require('./hooks-pendientes.helpers.cjs')
const file = 'hooks/patients.ts'
function load(responses) {
  const sim = createQueryHarness(responses)
  const hooks = sandbox(file, sim.modules, { fetch: sim.fetch })
  return { ...sim, hooks }
}
const body = call => JSON.parse(call.init.body)
const keyIncluded = (sim, key) => sim.invalidations.some(x => JSON.stringify(x) === JSON.stringify(key))

test('Pacientes: los hooks públicos de expediente, comentarios, tareas y recetas se mantienen', () => {
  const { hooks } = load()
  for (const name of ['useGetPatients', 'useGetPatient', 'useCreatePatient', 'useUpdatePatient',
    'useDeletePatient', 'useGetPatientComments', 'useCreatePatientComment', 'useGetPatientTasks',
    'useCreatePatientTask', 'useUpdateTaskStatus', 'useGetPrescriptions', 'useCreatePrescription',
    'useUpdatePrescription', 'useDeletePrescription']) {
    assert.equal(typeof hooks[name], 'function', `No debe eliminarse ${name}`)
  }
})
test('Pacientes: búsqueda mantiene parámetros y endpoint', async () => {
  const sim = load()
  sim.hooks.useGetPatients({ search: 'Ana', ci: '123' })
  await sim.queries[0].queryFn()
  const url = new URL(sim.calls[0].url)
  assert.equal(url.pathname, '/api/patients')
  assert.equal(url.searchParams.get('search'), 'Ana')
  assert.equal(url.searchParams.get('ci'), '123')
})
test('Pacientes: alta envía payload y refresca cache', async () => {
  const sim = load()
  const input = { firstName: 'Prueba', lastName: 'Simulada' }
  await sim.hooks.useCreatePatient().createPatient(input)
  assert.equal(sim.calls[0].url, '/api/patients')
  assert.equal(sim.calls[0].init.method, 'POST')
  assert.deepEqual(body(sim.calls[0]), { input })
  assert.ok(keyIncluded(sim, ['patients']))
})
test('Pacientes: alta rechazada no simula éxito', async () => {
  const sim = load([response({ error: 'Acceso denegado' }, 403)])
  await assert.rejects(sim.hooks.useCreatePatient().createPatient({ firstName: 'Prueba' }), /Acceso denegado/)
})
test('Pacientes: edición conserva ID y PATCH', async () => {
  const sim = load()
  await sim.hooks.useUpdatePatient().updatePatient({ id: 'pac-1', input: { firstName: 'Editado' } })
  assert.equal(sim.calls[0].url, '/api/patients/pac-1')
  assert.equal(sim.calls[0].init.method, 'PATCH')
  assert.deepEqual(body(sim.calls[0]), { input: { firstName: 'Editado' } })
})
test('Pacientes: baja conserva DELETE en ID explícito', async () => {
  const sim = load()
  await sim.hooks.useDeletePatient().deletePatient('pac-1')
  assert.equal(sim.calls[0].url, '/api/patients/pac-1')
  assert.equal(sim.calls[0].init.method, 'DELETE')
  assert.ok(keyIncluded(sim, ['patients']))
})
test('Pacientes: comentarios y tareas preservan paciente asignado', async () => {
  const sim = load()
  await sim.hooks.useCreatePatientComment().createComment({ patientId: 'pac-1', text: 'Control', authorId: 'doc-1' })
  await sim.hooks.useCreatePatientTask().createTask({ patientId: 'pac-1', title: 'Llamar', creatorId: 'doc-1' })
  assert.equal(sim.calls[0].url, '/api/patients/pac-1/comments')
  assert.deepEqual(body(sim.calls[0]), { text: 'Control', authorId: 'doc-1' })
  assert.equal(sim.calls[1].url, '/api/patients/pac-1/tasks')
  assert.equal(body(sim.calls[1]).title, 'Llamar')
  assert.ok(keyIncluded(sim, ['patient-comments', 'pac-1']))
  assert.ok(keyIncluded(sim, ['patient-tasks', 'pac-1']))
})
test('Pacientes: cambiar estado de tarea mantiene PATCH y booleano', async () => {
  const sim = load()
  await sim.hooks.useUpdateTaskStatus().toggleTask({ patientId: 'pac-1', taskId: 'task-2', isCompleted: true })
  assert.equal(sim.calls[0].url, '/api/patients/pac-1/tasks/task-2')
  assert.equal(sim.calls[0].init.method, 'PATCH')
  assert.equal(body(sim.calls[0]).isCompleted, true)
})
test('Recetas: alta, edición y eliminación conservan contratos', async () => {
  const sim = load()
  await sim.hooks.useCreatePrescription().createPrescription({ patientId: 'pac-1', medications: 'Simulado', indications: 'Simulado' })
  await sim.hooks.useUpdatePrescription().updatePrescription({ id: 'r-1', patientId: 'pac-1', medications: 'Cambio' })
  await sim.hooks.useDeletePrescription().deletePrescription({ id: 'r-1', patientId: 'pac-1' })
  assert.deepEqual(sim.calls.map(x => [x.url, x.init.method]), [
    ['/api/prescriptions', 'POST'], ['/api/prescriptions/r-1', 'PUT'], ['/api/prescriptions/r-1', 'DELETE']
  ])
  assert.equal(body(sim.calls[1]).medications, 'Cambio')
  assert.equal(Object.hasOwn(body(sim.calls[1]), 'patientId'), false)
  assert.ok(keyIncluded(sim, ['prescriptions', 'pac-1']))
})
