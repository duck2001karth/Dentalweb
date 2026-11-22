'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const ts = require('typescript')
const { source, transpile } = require('./hooks-pendientes.helpers.cjs')
const file = 'components/plans-treatment/hooks/use-treatment-state.ts'
function getFunctionSource() { return source(file) }
test('Estado clínico: TypeScript transpila y mantiene useTreatmentState', () => {
  transpile(file)
  const ast = ts.createSourceFile(file, getFunctionSource(), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const exp = ast.statements.filter(s => ts.isFunctionDeclaration(s) && s.name?.text === 'useTreatmentState')
  assert.equal(exp.length, 1, 'No se debe eliminar useTreatmentState')
})
test('Estado clínico: conserva validación de descuentos 0–100', () => {
  const code = getFunctionSource()
  assert.match(code, /handleApplyDiscount/)
  assert.match(code, /Number\.isFinite\(val\)/)
  assert.match(code, /val\s*<\s*0\s*\|\|\s*val\s*>\s*100/)
})
test('Estado clínico: conserva las operaciones de evolución y prestaciones', () => {
  const code = getFunctionSource()
  for (const handler of ['handleSaveEvolution', 'handleAddManualProcedure', 'handleUpdateItemDiscount', 'refreshPlanData']) {
    assert.match(code, new RegExp('\\b' + handler + '\\b'), `Falta ${handler}`)
  }
  assert.match(code, /\/api\/treatments\/items\//)
})
test('Estado clínico: no desaparece la consulta de consentimientos', () => {
  assert.match(getFunctionSource(), /\/api\/clinical-documents/)
  assert.match(getFunctionSource(), /patientSignature/)
})
