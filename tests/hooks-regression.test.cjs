/**
 * Dentalweb: pruebas de regresión de hooks sin base de datos ni red.
 * Ejecutar desde raíz: node --test tests/hooks-regression.test.cjs
 * Usa el TypeScript ya instalado por el proyecto; no añade dependencias.
 * Estas pruebas simulan useMutation/useQuery y fetch. NO reemplazan pruebas E2E.
 */
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const root = process.cwd()
const hooksDir = path.join(root, 'hooks')

function fakeResponse(body = { ok: true }, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

function loadHook(file, options = {}) {
  const absolute = path.join(hooksDir, file)
  if (!fs.existsSync(absolute)) throw new Error(`Falta ${absolute}. Ejecutar desde la raíz de Dentalweb.`)
  const source = fs.readFileSync(absolute, 'utf8')
  const compiled = ts.transpileModule(source, {
    fileName: absolute,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    reportDiagnostics: true,
  })
  const diagnostics = compiled.diagnostics || []
  assert.equal(diagnostics.filter(x => x.category === ts.DiagnosticCategory.Error).length, 0,
    `Error de transpilación ${file}: ${diagnostics.map(x => ts.flattenDiagnosticMessageText(x.messageText, '\n')).join('; ')}`)
  const calls = []
  const mutations = []
  const queries = []
  const invalidations = []
  const toasts = []
  const cache = new Map()
  const keyOf = key => JSON.stringify(key)
  const qc = {
    invalidateQueries: async ({ queryKey }) => { invalidations.push(queryKey) },
    cancelQueries: async () => {},
    getQueryData: key => cache.get(keyOf(key)),
    setQueryData: (key, next) => {
      const k = keyOf(key)
      cache.set(k, typeof next === 'function' ? next(cache.get(k)) : next)
    },
  }
  const useMutation = cfg => {
    mutations.push(cfg)
    async function execute(value) {
      const context = cfg.onMutate ? await cfg.onMutate(value) : undefined
      try {
        const result = await cfg.mutationFn(value)
        if (cfg.onSuccess) await cfg.onSuccess(result, value, context)
        if (cfg.onSettled) await cfg.onSettled(result, null, value, context)
        return result
      } catch (error) {
        if (cfg.onError) await cfg.onError(error, value, context)
        if (cfg.onSettled) await cfg.onSettled(undefined, error, value, context)
        throw error
      }
    }
    return { mutate: execute, mutateAsync: execute, isPending: false, isSuccess: false, reset: () => {} }
  }
  const useQuery = cfg => {
    queries.push(cfg)
    return { data: options.queryData, isLoading: false, isError: false, error: null, refetch: async () => cfg.queryFn() }
  }
  const reactQuery = { useMutation, useQuery, useQueryClient: () => qc }
  const fetchStub = async (url, init = {}) => {
    calls.push({ url: String(url), init })
    if (options.responses?.length) return options.responses.shift()
    return fakeResponse(options.responseBody)
  }
  const requires = spec => {
    if (spec === '@tanstack/react-query') return reactQuery
    if (spec === '@/hooks/use-toast') return { useToast: () => ({ toast: data => toasts.push(data) }) }
    if (spec === 'react') return { useState: value => [value, () => {}] }
    if (spec === 'date-fns') return { format: value => new Date(value).toISOString().slice(0, 10) }
    throw new Error(`Dependencia inesperada en ${file}: ${spec}. Revisar el contrato del test.`)
  }
  const module = { exports: {} }
  const context = { module, exports: module.exports, require: requires, fetch: fetchStub,
    console: { log: () => {}, error: () => {} }, URL, URLSearchParams, Date, Math, String, Number, Error, Promise,
    setTimeout, clearTimeout, global: { window: { location: { origin: 'http://localhost:3000' } } },
    window: { location: { origin: 'http://localhost:3000' } },
  }
  vm.runInNewContext(compiled.outputText, context, { filename: file, timeout: 1500 })
  return { exports: module.exports, calls, mutations, queries, invalidations, toasts, cache, qc }
}

const body = call => JSON.parse(call.init.body)
const keysInclude = (keys, key) => keys.some(item => JSON.stringify(item) === JSON.stringify(key))

test('Citas: GET conserva filtros y endpoint', async () => {
  const s = loadHook('appointments.ts')
  s.exports.useGetAppointments({ fecha: '2026-11-22', doctorId: 'doc-1', statuses: ['CONFIRMED'] })
  await s.queries[0].queryFn()
  const url = new URL(s.calls[0].url)
  assert.equal(url.pathname, '/api/citas')
  assert.equal(url.searchParams.get('doctorId'), 'doc-1')
  assert.equal(url.searchParams.get('fecha'), '2026-11-22')
  assert.equal(url.searchParams.get('statuses'), 'CONFIRMED')
})

test('Citas: POST crea y actualiza caché de listas', async () => {
  const s = loadHook('appointments.ts')
  const hook = s.exports.useCreateAppointment()
  const input = { patientId: 'pac-1', doctorId: 'doc-1', date: '2026-11-22' }
  await hook.createAppointment(input)
  assert.equal(s.calls[0].url, '/api/citas')
  assert.equal(s.calls[0].init.method, 'POST')
  assert.deepEqual(body(s.calls[0]), { input })
  assert.ok(keysInclude(s.invalidations, ['appointments']))
  assert.ok(keysInclude(s.invalidations, ['citas']))
})

test('Citas: reprogramar mantiene datos y usa PATCH', async () => {
  const s = loadHook('appointments.ts')
  const hook = s.exports.useRescheduleAppointment()
  await hook.rescheduleAppointment({ appointmentId: 'c-1', newDate: '2026-11-23', newTime: '10:00', endTime: '11:00', box: 'B1', reason: 'Cambio', sendWhatsapp: true })
  assert.equal(s.calls[0].url, '/api/citas/c-1/reschedule')
  assert.equal(s.calls[0].init.method, 'PATCH')
  assert.equal(body(s.calls[0]).sendWhatsapp, true)
  assert.equal(body(s.calls[0]).newTime, '10:00')
})

test('Tratamientos: POST conserva input e invalida listado', async () => {
  const s = loadHook('treatments.ts')
  const input = { patientId: 'pac-1', name: 'Ortodoncia', doctorId: 'doc-2' }
  await s.exports.useCreateTreatmentPlan().createTreatmentPlan(input)
  assert.equal(s.calls[0].url, '/api/treatments')
  assert.deepEqual(body(s.calls[0]), { input })
  assert.ok(keysInclude(s.invalidations, ['treatments']))
})

test('Tratamientos: PATCH conserva ID e invalida detalle', async () => {
  const s = loadHook('treatments.ts')
  await s.exports.useUpdateTreatmentPlan().updateTreatmentPlan({ id: 't-1', input: { name: 'Nuevo nombre' } })
  assert.equal(s.calls[0].url, '/api/treatments/t-1')
  assert.equal(s.calls[0].init.method, 'PATCH')
  assert.ok(keysInclude(s.invalidations, ['treatment', 't-1']))
})

test('Notas clínicas: POST preserva el contenido y el paciente', async () => {
  const s = loadHook('clinical-notes.ts')
  const input = { patientId: 'pac-1', authorId: 'doc-1', type: 'EVOLUTION', content: 'Control clínico', status: 'DRAFT' }
  await s.exports.useCreateClinicalNote().createClinicalNote(input)
  assert.equal(s.calls[0].url, '/api/clinical-notes')
  assert.deepEqual(body(s.calls[0]), { input })
  assert.ok(keysInclude(s.invalidations, ['clinical-notes']))
})

test('Plantillas: GET conserva filtros y URL', async () => {
  const s = loadHook('use-document-templates.ts')
  s.exports.useDocumentTemplates({ type: 'CONSENT', onlyActive: true })
  await s.queries[0].queryFn()
  const url = new URL(s.calls[0].url, 'http://localhost:3000')
  assert.equal(url.pathname, '/api/configuration/templates')
  assert.equal(url.searchParams.get('type'), 'CONSENT')
  assert.equal(url.searchParams.get('onlyActive'), 'true')
})

test('Plantillas: interpolación conserva marcadores previstos', () => {
  const s = loadHook('use-document-templates.ts')
  const t = s.exports.useDocumentTemplates()
  const result = t.interpolateTemplate('Paciente: {{paciente_nombre}} / Doctor: {{doctor_nombre}} / Clínica: {{clinica_nombre}}',
    { patient: { name: 'Ana' }, doctor: { name: 'Dr. X' }, clinic: { name: 'Dentalweb' } })
  assert.equal(result, 'Paciente: Ana / Doctor: Dr. X / Clínica: Dentalweb')
})

test('Plantillas: alta, edición y baja conservan rutas y métodos', async () => {
  const s = loadHook('use-document-templates.ts')
  const h = s.exports.useDocumentTemplates()
  assert.equal(await h.createTemplate({ title: 'Consentimiento', type: 'CONSENT' }), true)
  assert.equal(await h.updateTemplate('pl-1', { title: 'Editado' }), true)
  assert.equal(await h.deleteTemplate('pl-1'), true)
  assert.deepEqual(s.calls.map(x => [x.url, x.init.method]), [
    ['/api/configuration/templates', 'POST'],
    ['/api/configuration/templates/pl-1', 'PATCH'],
    ['/api/configuration/templates/pl-1', 'DELETE'],
  ])
})

test('Pagos: alta conserva payload y anulación motivo explícito', async () => {
  const s = loadHook('use-payments.ts')
  const h = s.exports.usePayments()
  assert.equal(await h.createPayment({ amount: 120, method: 'CASH' }), true)
  assert.equal(await h.deletePayment('p-1', 'Pago duplicado', false), true)
  assert.equal(s.calls[0].url, '/api/payments')
  assert.equal(s.calls[0].init.method, 'POST')
  assert.equal(body(s.calls[0]).amount, 120)
  assert.equal(s.calls[1].url, '/api/payments/p-1')
  assert.equal(s.calls[1].init.method, 'DELETE')
  assert.equal(body(s.calls[1]).reason, 'Pago duplicado')
  assert.equal(body(s.calls[1]).permanent, false)
})

test('Pagos: fallo de servidor no reporta éxito', async () => {
  const s = loadHook('use-payments.ts', { responses: [fakeResponse({ error: 'Operación denegada' }, 403)] })
  const ok = await s.exports.usePayments().createPayment({ amount: 99, method: 'CASH' })
  assert.equal(ok, false)
})
