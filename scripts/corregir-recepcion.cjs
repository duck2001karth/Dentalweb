const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const changes = new Map();
function edit(file, fn) {
  const p = path.join(root, file);
  const original = fs.readFileSync(p, 'utf8');
  const next = fn(original.replace(/\r\n/g, '\n'));
  changes.set(p, { original, next });
}
function replace(s, a, b) {
  if (s.includes(b)) return s;
  if (s.split(a).length !== 2) throw new Error('No se encontró un bloque único: ' + a.slice(0, 100));
  return s.replace(a,b);
}
edit('components/agenda-comp/new-appointment.tsx', s => {
  s = replace(s, 'import { useState, useEffect, useMemo } from "react"', 'import { useState, useEffect, useMemo, useRef } from "react"');
  s = replace(s, 'const [isLoadingDoctors, setIsLoadingDoctors] = useState(false)', 'const [isLoadingDoctors, setIsLoadingDoctors] = useState(false)\n  const [doctorsError, setDoctorsError] = useState("")\n  const [doctorsRetry, setDoctorsRetry] = useState(0)\n  const submitting = useRef(false)');
  s = replace(s, 'const { createAppointment, isLoading: isSaving } = useCreateAppointment()', 'const { createAppointmentAsync, isLoading: isSaving } = useCreateAppointment()');
  s = replace(s, 'await createAppointment({', 'await createAppointmentAsync({');
  s = replace(s, '  const validInitialStatuses = [', '  const validInitialStatuses = [');
  if (!s.includes('const controller = new AbortController()')) {
    const start = s.indexOf('      if (isAdminOrStaff && doctorsList.length === 0) {');
    const end = s.indexOf('\n    }\n  }, [', start);
    if(start < 0 || end < 0) throw new Error('Bloque de especialistas incompatible');
    s = s.slice(0,start) + s.slice(end);
    s = replace(s, '    doctorsList.length,\n    toast,\n  ])', '    toast,\n  ])\n\n  useEffect(() => {\n    if (!open || !isAdminOrStaff) return\n    const controller = new AbortController()\n    setDoctorsList([])\n    setDoctorsError("")\n    setIsLoadingDoctors(true)\n    fetch("/api/doctors", { cache: "no-store", signal: controller.signal })\n      .then(async res => {\n        if (!res.ok) throw new Error(res.status === 401 ? "Inicia sesión nuevamente." : res.status === 403 ? "No tienes permisos para consultar especialistas." : "No se pudo consultar la lista de especialistas.")\n        const data = await res.json()\n        if (!Array.isArray(data)) throw new Error("Respuesta de especialistas inválida.")\n        if (!controller.signal.aborted) setDoctorsList(data)\n      })\n      .catch(error => { if (!controller.signal.aborted) setDoctorsError(error.message || "Error de conexión.") })\n      .finally(() => { if (!controller.signal.aborted) setIsLoadingDoctors(false) })\n    return () => controller.abort()\n  }, [open, isAdminOrStaff, currentUser?.id, doctorsRetry])');
  }
  s = replace(s, '    e.preventDefault()\n', '    e.preventDefault()\n    if (submitting.current || isSaving) return\n    if (isAdminOrStaff && (isLoadingDoctors || doctorsError || !doctorsList.some(d => d.id === formData.doctorId))) {\n      toast({ title: "Selecciona un especialista activo", variant: "destructive" })\n      return\n    }\n');
  s = replace(s, '    try {\n      await createAppointmentAsync', '    submitting.current = true\n    try {\n      await createAppointmentAsync');
  s = replace(s, '        description: error.message || "Problema de conexión o cruce de horarios.",\n        variant: "destructive",\n      })\n    }', '        description: error.message || "Problema de conexión o cruce de horarios.",\n        variant: "destructive",\n      })\n    } finally { submitting.current = false }');
  s = replace(s, '                isLoadingDoctors={isLoadingDoctors}', '                isLoadingDoctors={isLoadingDoctors}\n                doctorsError={doctorsError}\n                onRetryDoctors={() => setDoctorsRetry(n => n + 1)}');
  s = replace(s, 'disabled={isSaving || hasAnyConflict || !isFormValid}', 'disabled={isSaving || hasAnyConflict || !isFormValid || (isAdminOrStaff && (isLoadingDoctors || !!doctorsError || !doctorsList.some(d => d.id === formData.doctorId)))}');
  s = replace(s, '<Dialog open={open} onOpenChange={setOpen}>', '<Dialog open={open} onOpenChange={value => { if (!submitting.current && !isSaving) setOpen(value) }}>');
  // API solo acepta SCHEDULED; no ofrecer otros estados al crear.
  if (!s.includes('validInitialStatuses.filter')) s = replace(s, 'validInitialStatuses={validInitialStatuses}', 'validInitialStatuses={validInitialStatuses.filter(status => status.value === "SCHEDULED")}');
  return s;
});
edit('components/agenda-comp/appointment-form.tsx', s => {
 s = replace(s, '  isLoadingDoctors: boolean', '  isLoadingDoctors: boolean\n  doctorsError?: string\n  onRetryDoctors?: () => void');
 s = replace(s, '  isLoadingDoctors,\n  isAdminOrStaff,', '  isLoadingDoctors,\n  doctorsError,\n  onRetryDoctors,\n  isAdminOrStaff,');
 s = replace(s, 'disabled={isLoadingDoctors}', 'disabled={isAdminOrStaff && (isLoadingDoctors || !!doctorsError)}');
 s = replace(s, 'No hay especialistas registrados', 'No hay especialistas activos');
 s = replace(s, '          </Select>\n        </div>\n\n        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">', '          </Select>\n          {isAdminOrStaff && doctorsError && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-foreground"><p>{doctorsError}</p><Button type="button" variant="outline" size="sm" className="mt-2" onClick={onRetryDoctors}>Reintentar</Button></div>}\n        </div>\n\n        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">');
 return s;
});
edit('hooks/appointments.ts', s => {
 s = replace(s, 'mutate: createAppointment, isPending', 'mutate: createAppointment, mutateAsync: createAppointmentAsync, isPending');
 return replace(s, 'return { createAppointment, isLoading, isSuccess }', 'return { createAppointment, createAppointmentAsync, isLoading, isSuccess }');
});
// Bloqueo visual de la ficha clínica, incluso si se accede por URL.
edit('components/patients/patient-detail-view.tsx', s => {
 s = replace(s, '  const initialTab = tabFromUrl === "ficha" ? "historial" : (tabFromUrl || "datos")', '  const canViewClinical = normalizedRole === "ADMIN" || normalizedRole === "DOCTOR"\n  const initialTab = !canViewClinical && FICHA_CLINICA_TABS.includes(tabFromUrl || "") ? "datos" : tabFromUrl === "ficha" ? "historial" : (tabFromUrl || "datos")');
 s = replace(s, '      setActiveTab(tabFromUrl === "ficha" ? "historial" : tabFromUrl)', '      setActiveTab(!canViewClinical && FICHA_CLINICA_TABS.includes(tabFromUrl) ? "datos" : tabFromUrl === "ficha" ? "historial" : tabFromUrl)');
 s = replace(s, '  }, [tabFromUrl])', '  }, [tabFromUrl, canViewClinical])');
 s = replace(s, '            <button \n              onClick={() => handleMainMenuClick("historial")}', '            {canViewClinical && <button \n              onClick={() => handleMainMenuClick("historial")}');
 s = replace(s, '              Ficha clínica\n            </button>', '              Ficha clínica\n            </button>}');
 s = replace(s, '{FICHA_CLINICA_TABS.includes(activeTab) && (', '{canViewClinical && FICHA_CLINICA_TABS.includes(activeTab) && (');
 return s;
});
edit('app/paciente/[id]/page.tsx', s => replace(s, 'const userRole = (session?.user as any)?.role || "DOCTOR"', 'const userRole = session?.user?.role || ""'));
// Todas las transformaciones se comprueban antes de escribir.
const backup = path.join(root, '.recepcion-backup-' + Date.now());
for (const [p, {original}] of changes) { const dest=path.join(backup,path.relative(root,p)); fs.mkdirSync(path.dirname(dest),{recursive:true}); fs.writeFileSync(dest,original); }
for (const [p, {next}] of changes) fs.writeFileSync(p,next);
console.log('Archivos actualizados:', changes.size, '\nCopia de seguridad:', backup);
