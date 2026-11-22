'use strict'
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const root = process.cwd()
function source(rel) {
  const abs = path.join(root, rel)
  assert.ok(fs.existsSync(abs), `No se encuentra ${rel}; ejecutar desde la raíz de Dentalweb`)
  return fs.readFileSync(abs, 'utf8')
}
function transpile(rel) {
  const result = ts.transpileModule(source(rel), {
    fileName: rel,
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  })
  assert.equal(result.diagnostics.filter(x => x.category === ts.DiagnosticCategory.Error).length, 0,
    `No transpila ${rel}`)
  return result.outputText
}
function sandbox(rel, mods = {}, globals = {}) {
  const module = { exports: {} }
  const context = {
    module, exports: module.exports,
    require: name => {
      if (Object.hasOwn(mods, name)) return mods[name]
      throw new Error(`Dependencia no simulada: ${name} en ${rel}`)
    },
    URL, URLSearchParams, Date, JSON, Math, Number, String, Error, Promise, console,
    setTimeout: (...args) => { const timer = setTimeout(...args); timer.unref?.(); return timer },
    clearTimeout,
    global: { window: { location: { origin: 'http://localhost:3000' } } },
    window: { location: { origin: 'http://localhost:3000' } },
    ...globals,
  }
  vm.runInNewContext(transpile(rel), context, { filename: rel, timeout: 2000 })
  return module.exports
}
function createQueryHarness(responses = []) {
  const calls = [], queries = [], mutations = [], invalidations = [], cache = new Map()
  const key = k => JSON.stringify(k)
  const qc = {
    cancelQueries: async () => {},
    getQueryData: k => cache.get(key(k)),
    setQueryData: (k, fn) => cache.set(key(k), typeof fn === 'function' ? fn(cache.get(key(k))) : fn),
    invalidateQueries: async ({ queryKey }) => { invalidations.push(queryKey) },
  }
  const useQuery = options => {
    queries.push(options)
    return { data: undefined, isLoading: false, refetch: () => options.queryFn() }
  }
  const useMutation = opts => {
    mutations.push(opts)
    const mutate = async input => {
      const ctx = opts.onMutate ? await opts.onMutate(input) : undefined
      try {
        const result = await opts.mutationFn(input)
        if (opts.onSuccess) await opts.onSuccess(result, input, ctx)
        if (opts.onSettled) await opts.onSettled(result, null, input, ctx)
        return result
      } catch (e) {
        if (opts.onError) await opts.onError(e, input, ctx)
        if (opts.onSettled) await opts.onSettled(undefined, e, input, ctx)
        throw e
      }
    }
    return { mutate, mutateAsync: mutate, isPending: false, isSuccess: false, reset: () => {} }
  }
  const fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init })
    if (responses.length) return responses.shift()
    return { ok: true, status: 200, json: async () => ({ patients: [], patient: {}, id: 'test-id' }) }
  }
  return { calls, queries, mutations, invalidations, cache, fetch,
    modules: { '@tanstack/react-query': { useQuery, useMutation, useQueryClient: () => qc } } }
}
const response = (payload, status = 200) => ({ ok: status < 400, status, json: async () => payload })
module.exports = { source, transpile, sandbox, createQueryHarness, response }
