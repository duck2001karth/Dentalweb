import test from 'node:test'
import assert from 'node:assert/strict'
import { can } from '../lib/security/permissions.ts'
test('roles desconocidos no obtienen permisos', () => assert.equal(can('HACKER', 'patients.read'), false))
test('recepción no accede a auditoría', () => assert.equal(can('RECEPTIONIST', 'admin.audit'), false))
test('recepción no accede a clínica', () => assert.equal(can('RECEPTIONIST', 'clinical.read'), false))
test('doctor no administra usuarios', () => assert.equal(can('DOCTOR', 'admin.users'), false))
test('administrador puede consultar alertas', () => assert.equal(can('ADMIN', 'security.alerts'), true))
test('sin rol no hay permiso', () => assert.equal(can(undefined, 'patients.read'), false))
