"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { differenceInYears, format, parseISO } from "date-fns"
import {
  AlertCircle, AlertTriangle, Calendar, CheckCircle2, ChevronLeft, ChevronRight,
  Droplet, HeartPulse, Home, Loader2, Mail, Map, MapPin, Phone, Plus, Save,
  ShieldAlert, Stethoscope, User, Users, X,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { bloodGroups, documentTypes, patientFields, createPatientFields, validBirthDate, documentTypeError } from "@/lib/patient-registration"

const EMPTY_FORM = {
  firstName: "", lastName: "", tipoIdentificacion: "Cédula De Ciudadanía", ci: "",
  birthDate: "", sexo: "", phone: "", email: "", ciudad: "", departamento: "",
  address: "", eps: "", grupoSanguineo: "", medicalAlerts: "",
  nombreResponsable: "", telefonoResponsable: "", parentescoResponsable: "", cedulaAcudiente: "",
}
type FormData = typeof EMPTY_FORM
type Field = keyof FormData
type FieldErrors = Partial<Record<Field, string>>
type PatientFormProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: (Partial<Record<Field, string | null | Date>> & { id?: string }) | null
}
type Notice = { kind: "error" | "discard"; title: string; description: string }

const STEPS = [
  { num: 1, title: "Principal" },
  { num: 2, title: "Contacto" },
  { num: 3, title: "Médicos" },
] as const
const STEP_FIELDS: Record<number, Field[]> = {
  1: ["firstName", "lastName", "tipoIdentificacion", "ci", "birthDate", "sexo"],
  2: ["phone", "email", "ciudad", "departamento", "address", "nombreResponsable", "telefonoResponsable", "parentescoResponsable", "cedulaAcudiente"],
  3: ["eps", "grupoSanguineo", "medicalAlerts"],
}
const FIELD_STEP = (field: Field) => Number(Object.keys(STEP_FIELDS).find(s => STEP_FIELDS[Number(s)].includes(field)) || 1)
const fieldKeys = Object.keys(EMPTY_FORM) as Field[]
const inputStyle = "h-11 rounded-xl bg-background border-border/80 font-medium text-base sm:text-sm focus-visible:ring-2 focus-visible:ring-primary/40"

function initialForm(data: PatientFormProps["initialData"]): FormData {
  const result = { ...EMPTY_FORM }
  for (const key of fieldKeys) {
    const value = data?.[key]
    if (key === "birthDate") {
      if (value instanceof Date && Number.isFinite(value.getTime())) result.birthDate = value.toISOString().slice(0, 10)
      else if (typeof value === "string") result.birthDate = value.slice(0, 10)
    } else if (typeof value === "string") result[key] = value
  }
  if (data?.grupoSanguineo === "No determinado") result.grupoSanguineo = "DESCONOCIDO"
  return result
}

function extractErrors(fields: unknown): FieldErrors {
  if (!fields || typeof fields !== "object") return {}
  const result: FieldErrors = {}
  for (const key of fieldKeys) {
    const value = (fields as Record<string, unknown>)[key]
    if (Array.isArray(value) && typeof value[0] === "string") result[key] = value[0]
  }
  return result
}

export const PatientsForm = ({ isOpen, onClose, onSuccess, initialData = null }: PatientFormProps) => {
  const { toast } = useToast()
  const formId = React.useId()
  const { data: session, status: sessionStatus } = useSession()
  const role = session?.user?.role
  const authorized = sessionStatus === "authenticated" && ["ADMIN", "DOCTOR", "RECEPTIONIST"].includes(String(role))
  const isEditing = !!initialData
  const canWriteAlerts = !isEditing || role === "ADMIN" || role === "DOCTOR"
  const [formData, setFormData] = useState<FormData>(() => initialForm(initialData))
  const baseline = useRef<FormData>(initialForm(initialData))
  const openRecord = useRef<string | null>(null)
  const submitting = useRef(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [notice, setNotice] = useState<Notice | null>(null)
  const [showResponsible, setShowResponsible] = useState(false)
  const focusField = useRef<Field | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) { openRecord.current = null; return }
    const key = initialData?.id || "new"
    if (openRecord.current === key) return
    openRecord.current = key
    const next = initialForm(initialData)
    baseline.current = next
    setFormData(next)
    setStep(1)
    setErrors({})
    setNotice(null)
    setShowResponsible(Boolean(next.nombreResponsable || next.telefonoResponsable || next.parentescoResponsable || next.cedulaAcudiente))
  }, [isOpen, initialData])

  const patientAge = useMemo(() => {
    if (!formData.birthDate || !validBirthDate(formData.birthDate)) return null
    return differenceInYears(new Date(), parseISO(formData.birthDate))
  }, [formData.birthDate])
  const dirty = fieldKeys.some(key => formData[key] !== baseline.current[key])
  const needsResponsible = patientAge !== null && patientAge < 18

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 })
  }, [step])

  useEffect(() => {
    if (!notice && focusField.current && isOpen) {
      const key = focusField.current
      focusField.current = null
      const timer = window.setTimeout(() => document.getElementById(`${formId}-${key}`)?.focus(), 80)
      return () => window.clearTimeout(timer)
    }
  }, [notice, step, isOpen, formId])

  const change = (key: Field, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const makePayload = () => {
    const payload: Partial<Record<Field, string | null>> = {}
    for (const key of fieldKeys) {
      if (key === "medicalAlerts" && !canWriteAlerts) continue
      if (isEditing && formData[key] === baseline.current[key]) continue
      const value = formData[key].trim()
      payload[key] = value === "" || (key === "grupoSanguineo" && value === "DESCONOCIDO") || (key === "sexo" && value === "NO_INFORMADO") ? null : value
    }
    return payload
  }

  const validate = (currentStep?: number): FieldErrors => {
    const payload = makePayload()
    const result = isEditing ? patientFields.safeParse(payload) : createPatientFields.safeParse(payload)
    const found: FieldErrors = result.success ? {} : extractErrors(result.error.flatten().fieldErrors)
    if (!isEditing) {
      for (const key of ["firstName", "lastName", "ci", "birthDate"] as const) {
        if (!formData[key].trim()) found[key] = "Este campo es obligatorio"
      }
    }
    if (!isEditing || payload.ci !== undefined || payload.tipoIdentificacion !== undefined) {
      const message = documentTypeError(formData.tipoIdentificacion, formData.ci)
      if (message && !found.ci) found.ci = message
    }
    if (formData.birthDate && formData.birthDate > format(new Date(), "yyyy-MM-dd") && (!isEditing || payload.birthDate !== undefined)) {
      found.birthDate = "La fecha no puede ser futura"
    }
    if (currentStep === undefined) return found
    return Object.fromEntries(Object.entries(found).filter(([k]) => STEP_FIELDS[currentStep].includes(k as Field))) as FieldErrors
  }

  const showValidation = (found: FieldErrors, description = "Revise los campos marcados antes de continuar.") => {
    setErrors(found)
    const first = fieldKeys.find(key => Boolean(found[key]))
    if (first) {
      setStep(FIELD_STEP(first))
      focusField.current = first
      if (STEP_FIELDS[2].slice(5).includes(first)) setShowResponsible(true)
    }
    setNotice({ kind: "error", title: "Revise la información", description })
  }

  const handleNext = () => {
    const found = validate(step)
    if (Object.keys(found).length) { showValidation(found); return }
    setStep(prev => Math.min(prev + 1, 3))
  }

  const requestClose = () => {
    if (submitting.current || notice) return
    if (dirty) setNotice({ kind: "discard", title: "¿Descartar los cambios?", description: "La información introducida que aún no se ha guardado se perderá. Puede continuar editando o salir del formulario." })
    else onClose()
  }

  const handleSubmit = async () => {
    if (submitting.current) return
    if (!authorized) {
      setNotice({ kind: "error", title: "Acceso no disponible", description: "Inicie sesión con una cuenta autorizada para registrar o editar pacientes." })
      return
    }
    const found = validate()
    if (Object.keys(found).length) { showValidation(found); return }
    const payload = makePayload()
    if (isEditing && !Object.keys(payload).length) { onClose(); return }
    if (isEditing && !initialData?.id) {
      setNotice({ kind: "error", title: "Ficha no disponible", description: "No se encontró el identificador del paciente. Abra nuevamente su ficha." })
      return
    }
    submitting.current = true
    setIsSubmitting(true)
    try {
      const url = isEditing ? `/api/patients/${encodeURIComponent(initialData!.id!)}` : "/api/patients"
      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: payload }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        if (response.status === 409) {
          showValidation({ ci: "Ya existe un paciente con este documento" }, "No se guardó el registro. Busque al paciente existente o corrija el número de identificación.")
          return
        }
        if (response.status === 422) {
          const fields = extractErrors(result.fields)
          showValidation(fields, typeof result.error === "string" ? result.error : "Revise los datos ingresados.")
          return
        }
        const message = response.status === 401 ? "Su sesión ha expirado. Vuelva a iniciar sesión." :
          response.status === 403 ? "Su cuenta no tiene permiso para realizar esta operación." :
          response.status === 404 ? "La ficha del paciente ya no está disponible." :
          response.status >= 500 ? "No se pudo confirmar el guardado. Consulte el directorio antes de volver a intentar para evitar duplicados." :
          typeof result.error === "string" ? result.error : "No se pudo guardar la información."
        setNotice({ kind: "error", title: "No se pudo guardar", description: message })
        return
      }
      if (!result.patient?.id) {
        setNotice({ kind: "error", title: "Registro sin confirmación", description: "El servidor no devolvió la ficha esperada. Consulte el directorio antes de volver a intentar." })
        return
      }
      baseline.current = { ...formData }
      toast({ title: isEditing ? "Paciente actualizado" : "Paciente registrado", description: isEditing ? "Los cambios se guardaron correctamente." : "El paciente se añadió al directorio.", variant: "success" })
      try { onSuccess() } catch {
        toast({ title: "Datos guardados", description: "Actualice el directorio para ver los cambios.", variant: "success" })
      }
      onClose()
    } catch {
      setNotice({ kind: "error", title: "No se pudo confirmar el registro", description: "Revise su conexión y consulte el directorio antes de reintentar. Los datos del formulario se conservarán mientras permanezca abierto." })
    } finally {
      submitting.current = false
      setIsSubmitting(false)
    }
  }

  const label = (key: Field, title: React.ReactNode, required = false) => (
    <Label htmlFor={`${formId}-${key}`} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {title}{required && <span className="text-rose-600 dark:text-rose-400" aria-hidden="true">*</span>}
    </Label>
  )
  const fieldError = (key: Field) => errors[key] ? <p id={`${formId}-${key}-error`} className="text-xs font-medium text-rose-700 dark:text-rose-300" role="alert">{errors[key]}</p> : null
  const renderInput = (key: Field, title: React.ReactNode, opts: { placeholder?: string; type?: string; maxLength?: number; required?: boolean; autoComplete?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; autoFocus?: boolean } = {}) => (
    <div className="min-w-0 space-y-2">
      {label(key, title, opts.required)}
      <Input id={`${formId}-${key}`} name={key} value={formData[key]} onChange={e => change(key, e.target.value)}
        type={opts.type || "text"} placeholder={opts.placeholder} maxLength={opts.maxLength} required={opts.required}
        autoComplete={opts.autoComplete} inputMode={opts.inputMode} autoFocus={opts.autoFocus}
        disabled={isSubmitting} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${formId}-${key}-error` : undefined}
        className={cn(inputStyle, errors[key] && "border-rose-500 focus-visible:ring-rose-500/30")} />
      {fieldError(key)}
    </div>
  )
  const renderSelect = (key: Field, title: React.ReactNode, options: { value: string; text: string }[], placeholder: string) => (
    <div className="min-w-0 space-y-2">
      {label(key, title)}
      <Select value={formData[key]} onValueChange={v => change(key, v)} disabled={isSubmitting}>
        <SelectTrigger id={`${formId}-${key}`} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${formId}-${key}-error` : undefined} className={cn(inputStyle, "w-full", errors[key] && "border-rose-500")}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="rounded-xl border-border">
          {formData[key] && !options.some(o => o.value === formData[key]) && <SelectItem value={formData[key]}>{formData[key]}</SelectItem>}
          {options.map(o => <SelectItem key={o.value} value={o.value}>{o.text}</SelectItem>)}
        </SelectContent>
      </Select>
      {fieldError(key)}
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) requestClose() }}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-[750px] sm:max-w-[750px] max-h-[calc(100dvh-1rem)] sm:max-h-[90dvh] min-h-0 bg-card border-border/60 p-0 overflow-hidden flex flex-col gap-0 rounded-2xl sm:rounded-[24px] shadow-2xl [&>button]:hidden"
        onEscapeKeyDown={e => { e.preventDefault(); requestClose() }}
        onPointerDownOutside={e => e.preventDefault()}>
        <DialogHeader className="px-4 py-4 sm:px-6 lg:px-8 lg:py-6 border-b border-border/60 bg-muted/10 flex flex-row items-start justify-between gap-3 shrink-0 text-left">
          <div>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{isEditing ? "Editar Perfil del Paciente" : "Registrar Nuevo Paciente"}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-2">Complete la información. Los campos con <span className="font-bold text-rose-600 dark:text-rose-400">(*)</span> son obligatorios.</DialogDescription>
          </div>
          <button type="button" aria-label="Cerrar formulario" disabled={isSubmitting} onClick={requestClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"><X size={18} /></button>
        </DialogHeader>

        <div className="px-4 py-4 sm:px-6 lg:px-8 bg-background border-b border-border/60 shrink-0 flex items-center justify-between gap-1" aria-label="Progreso de registro">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex min-w-0 items-center flex-1 last:flex-none" aria-current={step === s.num ? "step" : undefined}>
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
                <div className={cn("h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors", step === s.num ? "bg-primary text-primary-foreground ring-4 ring-primary/10" : step > s.num ? "bg-emerald-700 dark:bg-emerald-400 text-white dark:text-slate-950" : "bg-muted text-muted-foreground border border-border")}>
                  {step > s.num ? <CheckCircle2 className="h-5 w-5" /> : s.num}
                </div>
                <span className={cn("text-xs sm:text-sm font-semibold", step === s.num ? "text-primary" : step > s.num ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground")}>{s.title}</span>
              </div>
              {i < 2 && <div className={cn("flex-1 h-0.5 mx-1 sm:mx-4 rounded-full", step > s.num ? "bg-emerald-500/50" : "bg-border")} />}
            </div>
          ))}
        </div>
        <p className="sr-only" aria-live="polite">Paso {step} de 3</p>

        <div ref={bodyRef} className="overflow-y-auto overscroll-contain px-4 py-5 sm:p-6 lg:p-8 custom-scrollbar bg-card flex-1 min-h-0"
          onKeyDown={e => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing && e.target instanceof HTMLInputElement && step < 3 && !notice && !isSubmitting) {
              e.preventDefault(); handleNext()
            }
          }}>
          {step === 1 && (
            <section className="space-y-5 animate-in fade-in duration-200">
              <h3 className="flex items-center gap-2 border-b border-border/60 pb-3 text-sm font-bold uppercase tracking-wide text-foreground"><User className="h-5 w-5 text-primary" /> Información principal</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {renderInput("firstName", "Nombres", { placeholder: "Ej. Juan Carlos", required: true, maxLength: 120, autoComplete: "given-name", autoFocus: true })}
                {renderInput("lastName", "Apellidos", { placeholder: "Ej. Pérez Gómez", required: true, maxLength: 120, autoComplete: "family-name" })}
                {renderSelect("tipoIdentificacion", "Tipo de documento", documentTypes.map(value => ({ value, text: value })), "Seleccione documento")}
                {renderInput("ci", "Número de documento", { required: true, maxLength: 60, placeholder: "Ingrese la identificación" })}
                <div className="space-y-2 min-w-0">
                  {label("birthDate", "Fecha de nacimiento", !isEditing)}
                  <Input id={`${formId}-birthDate`} name="birthDate" type="date" value={formData.birthDate} onChange={e => change("birthDate", e.target.value)} min="1900-01-01" max={format(new Date(), "yyyy-MM-dd")} required={!isEditing} disabled={isSubmitting} aria-invalid={!!errors.birthDate} aria-describedby={errors.birthDate ? `${formId}-birthDate-error` : undefined} className={cn(inputStyle, errors.birthDate && "border-rose-500")} />
                  {fieldError("birthDate")}
                  {patientAge !== null && <p className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> {patientAge} años</p>}
                </div>
                {renderSelect("sexo", "Sexo", [{ value: "Femenino", text: "Femenino" }, { value: "Masculino", text: "Masculino" }, { value: "NO_INFORMADO", text: "No informado" }], "Seleccione una opción")}
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-5 animate-in fade-in duration-200">
              <h3 className="flex items-center gap-2 border-b border-border/60 pb-3 text-sm font-bold uppercase tracking-wide text-foreground"><MapPin className="h-5 w-5 text-primary" /> Contacto y ubicación</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {renderInput("phone", <><Phone size={13} /> Teléfono móvil</>, { type: "tel", inputMode: "tel", maxLength: 60, autoComplete: "tel", placeholder: "Ej. 0998877665", autoFocus: true })}
                {renderInput("email", <><Mail size={13} /> Correo electrónico</>, { type: "email", maxLength: 254, autoComplete: "email", placeholder: "correo@ejemplo.com" })}
                {renderInput("ciudad", <><Map size={13} /> Ciudad</>, { maxLength: 150, placeholder: "Ingrese la ciudad" })}
                {renderInput("departamento", <><MapPin size={13} /> Provincia / Dpto.</>, { maxLength: 150, placeholder: "Ingrese la provincia" })}
                <div className="sm:col-span-2">{renderInput("address", <><Home size={13} /> Dirección completa</>, { maxLength: 500, autoComplete: "street-address", placeholder: "Calle, número, sector..." })}</div>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground"><Users className="h-4 w-4 text-primary" /> Representante / responsable</h4>
                  {!needsResponsible && <Button type="button" variant="outline" size="sm" disabled={isSubmitting} onClick={() => setShowResponsible(v => !v)}>{showResponsible ? "Ocultar" : "Agregar"}</Button>}
                </div>
                {needsResponsible && <p className="text-xs text-muted-foreground">El paciente es menor de edad. Registre los datos de su representante si están disponibles; la autorización clínica se gestiona por separado.</p>}
                {(showResponsible || needsResponsible) && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {renderInput("nombreResponsable", "Nombre del responsable", { maxLength: 150 })}
                  {renderInput("cedulaAcudiente", "Documento del responsable", { maxLength: 60 })}
                  {renderInput("telefonoResponsable", "Teléfono del responsable", { type: "tel", maxLength: 60 })}
                  {renderInput("parentescoResponsable", "Parentesco", { maxLength: 100, placeholder: "Madre, padre, tutor..." })}
                </div>}
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-5 animate-in fade-in duration-200">
              <h3 className="flex items-center gap-2 border-b border-border/60 pb-3 text-sm font-bold uppercase tracking-wide text-foreground"><HeartPulse className="h-5 w-5 text-primary" /> Información médica inicial</h3>
              <div className="rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/30 p-3 flex gap-2 text-xs leading-relaxed text-sky-900 dark:text-sky-100">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <p>Registre únicamente la información que el paciente o su representante proporciona. El equipo clínico deberá verificarla. Si desconoce el grupo sanguíneo, deje el campo sin determinar.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {renderInput("eps", <><Stethoscope size={13} /> EPS / Seguro médico</>, { maxLength: 150, placeholder: "Ej. Seguro de salud", autoFocus: true })}
                {renderSelect("grupoSanguineo", <><Droplet size={13} /> Grupo sanguíneo</>, [{ value: "DESCONOCIDO", text: "No determinado" }, ...bloodGroups.map(value => ({ value, text: value }))], "No determinado")}
                {canWriteAlerts ? <div className="sm:col-span-2 space-y-2 rounded-xl border border-amber-300/60 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/20 p-4">
                  {label("medicalAlerts", <><ShieldAlert size={15} /> Alertas médicas informadas</>)}
                  <Textarea id={`${formId}-medicalAlerts`} name="medicalAlerts" value={formData.medicalAlerts} onChange={e => change("medicalAlerts", e.target.value)} disabled={isSubmitting} maxLength={10000} aria-invalid={!!errors.medicalAlerts} aria-describedby={errors.medicalAlerts ? `${formId}-medicalAlerts-error` : `${formId}-alerts-help`} placeholder="Alergias, medicamentos, enfermedades o antecedentes comunicados..." className={cn("min-h-[100px] resize-y rounded-xl bg-background text-foreground border-border", errors.medicalAlerts && "border-rose-500")} />
                  <p id={`${formId}-alerts-help`} className="text-xs text-muted-foreground">No constituye un diagnóstico. Deje vacío si no se dispone de información.</p>
                  {fieldError("medicalAlerts")}
                </div> : <div className="sm:col-span-2 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">Las alertas médicas existentes solo pueden ser consultadas o modificadas por el equipo clínico autorizado.</div>}
              </div>
            </section>
          )}
        </div>

        <div className="px-4 py-3 sm:px-6 lg:px-8 lg:py-5 border-t border-border/60 bg-muted/10 flex shrink-0 flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="ghost" disabled={isSubmitting} onClick={step === 1 ? requestClose : () => setStep(s => s - 1)} className="h-11 rounded-xl text-muted-foreground font-semibold px-4">
            {step === 1 ? "Cancelar" : <><ChevronLeft className="w-4 h-4 mr-1.5" /> Volver</>}
          </Button>
          {step < 3 ? <Button type="button" onClick={handleNext} disabled={isSubmitting} className="h-11 rounded-xl px-5 sm:px-8 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
            Siguiente <ChevronRight className="w-4 h-4 ml-1.5" />
          </Button> : <Button type="button" onClick={handleSubmit} disabled={isSubmitting || sessionStatus === "loading"} className="h-11 rounded-xl px-5 sm:px-8 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : <><Save className="mr-2 h-4 w-4" /> {isEditing ? "Guardar cambios" : "Finalizar registro"}</>}
          </Button>}
        </div>

        <AlertDialog open={!!notice} onOpenChange={open => { if (!open) setNotice(null) }}>
          <AlertDialogContent className="sm:max-w-[440px] rounded-2xl bg-card text-foreground border-border shadow-2xl p-5 sm:p-6">
            <AlertDialogHeader className="text-left space-y-3">
              <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl border", notice?.kind === "discard" ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300" : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300")}>
                {notice?.kind === "discard" ? <AlertTriangle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              </div>
              <AlertDialogTitle className="text-lg font-bold text-foreground">{notice?.title}</AlertDialogTitle>
              <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">{notice?.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-0 pt-2">
              {notice?.kind === "discard" ? <>
                <AlertDialogCancel className="rounded-xl font-semibold">Continuar editando</AlertDialogCancel>
                <AlertDialogAction className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold" onClick={() => { setNotice(null); onClose() }}>Descartar</AlertDialogAction>
              </> : <AlertDialogCancel className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">Entendido</AlertDialogCancel>}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  )
}

export const NewPatientModal = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <>
      <Button type="button" onClick={() => setIsOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 sm:px-5 h-11 rounded-xl flex items-center gap-2 shadow-sm">
        <Plus className="w-5 h-5" /> Nuevo Paciente
      </Button>
      <PatientsForm isOpen={isOpen} onClose={() => setIsOpen(false)} onSuccess={() => { onSuccess?.(); setIsOpen(false) }} />
    </>
  )
}
