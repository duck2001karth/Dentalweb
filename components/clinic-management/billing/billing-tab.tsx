"use client"

import React, { useEffect, useState, useRef } from "react"
import { 
  Plus, FileText, ArrowUpRight, Clock, DollarSign, 
  Loader2, Edit2, Trash2, AlertTriangle, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight 
} from "lucide-react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

import { usePayments } from "@/hooks/use-payments"
import { useGetPatients } from "@/hooks/patients" // IMPORTANTE: Hook nativo de pacientes agregado
import type { PaymentFormData, PaymentState, PaymentMethod, PaymentRecord } from "@/types/billing"

export default function BillingTab({ searchTerm }: { searchTerm: string }) {
  const { data: session } = useSession()
  const currentUserId = (session?.user as any)?.id

  const { payments, isLoading, isSaving, fetchPayments, createPayment, updatePayment, deletePayment } = usePayments()
  const { patients: apiPatients } = useGetPatients({}) 
  
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8 
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [patientSearchQuery, setPatientSearchQuery] = useState("")
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState<PaymentFormData>({
    patientId: "", amount: "", method: "CASH", status: "COMPLETED", receiptNumber: "", notes: ""
  })

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPatientDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const openModal = (payment?: PaymentRecord) => {
    if (payment) {
      setEditingId(payment.id)
      setFormData({
        patientId: payment.patient.id,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        receiptNumber: payment.receiptNumber || "",
        notes: payment.notes || ""
      })
      setPatientSearchQuery(`${payment.patient.firstName} ${payment.patient.lastName} - ${payment.patient.ci}`)
    } else {
      setEditingId(null)
      setFormData({ patientId: "", amount: "", method: "CASH", status: "COMPLETED", receiptNumber: "", notes: "" })
      setPatientSearchQuery("")
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    let success = false
    if (editingId) {
      success = await updatePayment(editingId, formData)
    } else {
      success = await createPayment(formData, currentUserId)
    }
    if (success) setIsModalOpen(false)
  }

  const confirmDelete = async () => {
    if (itemToDelete) {
      await deletePayment(itemToDelete)
      setItemToDelete(null)
    }
  }

  const filteredPatientsForModal = (apiPatients || []).filter((pt: any) => 
    `${pt.firstName} ${pt.lastName} ${pt.ci}`.toLowerCase().includes(patientSearchQuery.toLowerCase())
  ).slice(0, 5)

  const filteredPayments = payments.filter(p => 
    p.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${p.patient.firstName} ${p.patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patient.ci.includes(searchTerm)
  )

  const totalItems = filteredPayments.length
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPayments = filteredPayments.slice(startIndex, endIndex)

  const totalIngresos = payments.filter(p => p.status === 'COMPLETED').reduce((acc, curr) => acc + curr.amount, 0)
  const totalPendientes = payments.filter(p => p.status === 'PENDING').reduce((acc, curr) => acc + curr.amount, 0)

  const getStatusBadge = (status: PaymentState) => {
    const styles = {
      COMPLETED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      PENDING: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      FAILED: "bg-red-500/10 text-red-500 border-red-500/20",
      REFUNDED: "bg-slate-500/10 text-slate-500 border-slate-500/20"
    }
    const labels = { COMPLETED: "Completado", PENDING: "Pendiente", FAILED: "Fallido", REFUNDED: "Reembolsado" }
    return <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${styles[status]}`}>{labels[status]}</span>
  }

  const getMethodLabel = (method: PaymentMethod) => {
    const labels = { CASH: "Efectivo", CREDIT_CARD: "T. Crédito", DEBIT_CARD: "T. Débito", TRANSFER: "Transferencia", INSURANCE: "Seguro", OTHER: "Otro" }
    return labels[method]
  }

  return (
    <div className="flex-1 flex flex-col">
      
      {/* BOTÓN SUPERIOR Y MÉTRICAS */}
      <div className="flex justify-end mb-6">
        <Button onClick={() => openModal()} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-11 px-6 rounded-xl shadow-sm">
          <Plus className="w-5 h-5 mr-2" /> Nuevo Cobro
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-center">
          <p className="text-sm font-bold text-muted-foreground mb-3 flex items-center justify-between">
            Ingresos Completados <DollarSign className="w-4 h-4 text-emerald-500"/>
          </p>
          <h3 className="text-3xl font-black text-foreground">${totalIngresos.toLocaleString('en-US', {minimumFractionDigits: 2})}</h3>
        </div>
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-center">
          <p className="text-sm font-bold text-muted-foreground mb-3 flex items-center justify-between">
            Cuentas por Cobrar <Clock className="w-4 h-4 text-amber-500"/>
          </p>
          <h3 className="text-3xl font-black text-foreground">${totalPendientes.toLocaleString('en-US', {minimumFractionDigits: 2})}</h3>
        </div>
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-center">
          <p className="text-sm font-bold text-muted-foreground mb-3 flex items-center justify-between">
            Total Transacciones <ArrowUpRight className="w-4 h-4 text-primary"/>
          </p>
          <h3 className="text-3xl font-black text-foreground">{payments.length}</h3>
        </div>
      </div>

      {/* ÁREA DE TABLA */}
      <div className="flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center flex-1 py-20 text-emerald-500">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="font-medium animate-pulse text-muted-foreground">Cargando transacciones...</p>
          </div>
        ) : currentPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-20 bg-card rounded-2xl border border-dashed border-border shadow-sm">
            <FileText className="w-16 h-16 text-muted-foreground opacity-20 mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-1">No se encontraron pagos</h3>
            <p className="text-muted-foreground text-sm max-w-sm text-center">
              {searchTerm ? `No hay resultados para "${searchTerm}".` : "Aún no hay transacciones registradas."}
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1">
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-muted/30 border-b border-border text-xs uppercase text-muted-foreground font-black">
                  <tr>
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">Nro. Recibo</th>
                    <th className="px-6 py-4">Paciente</th>
                    <th className="px-6 py-4">Método</th>
                    <th className="px-6 py-4 text-right">Monto</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {currentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-accent/40 transition-colors">
                      <td className="px-6 py-4 text-muted-foreground font-medium text-xs">
                        {format(new Date(p.createdAt), "dd MMM yyyy, HH:mm", { locale: es })}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-bold text-muted-foreground">
                        {p.receiptNumber || '---'}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-foreground text-sm">{p.patient.firstName} {p.patient.lastName}</p>
                        <p className="text-xs text-muted-foreground">CI: {p.patient.ci}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-muted-foreground text-xs">
                        {getMethodLabel(p.method)}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-foreground text-base">
                        ${p.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(p.status)}
                      </td>
                      <td className="px-6 py-4 text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openModal(p)} className="text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setItemToDelete(p.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINACIÓN */}
            {totalItems > 0 && (
              <div className="mt-auto border-t border-border bg-muted/10 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground font-medium">
                  Mostrando del <span className="text-foreground">{startIndex + 1}</span> al <span className="text-foreground">{Math.min(endIndex, totalItems)}</span> de <span className="text-foreground">{totalItems}</span> registros
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-sm text-foreground font-medium">
                    Página {currentPage} de {totalPages}
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="icon" className="h-8 w-8 bg-background border-border"
                      onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 bg-background border-border"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 bg-background border-border"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 bg-background border-border"
                      onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL REGISTRO / EDICIÓN (Con búsqueda funcional) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border rounded-[24px] p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="px-8 py-6 border-b border-border bg-muted/40">
            <DialogTitle className="text-2xl font-black text-foreground flex items-center gap-2">
              <DollarSign className="text-emerald-500" /> {editingId ? "Editar Cobro" : "Registrar Nuevo Cobro"}
            </DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6">
            
            <div className="space-y-2 relative" ref={dropdownRef}>
              <Label className="text-xs font-bold text-muted-foreground uppercase">Buscar Paciente *</Label>
              <Input 
                value={patientSearchQuery} 
                onChange={e => {
                  setPatientSearchQuery(e.target.value)
                  setShowPatientDropdown(true)
                  if(formData.patientId) setFormData({...formData, patientId: ""})
                }}
                onFocus={() => setShowPatientDropdown(true)}
                placeholder="Escribe nombre, apellido o CI..." 
                className="bg-background border-border h-12 rounded-xl focus-visible:ring-emerald-500/20" 
                disabled={!!editingId}
              />
              {showPatientDropdown && !editingId && patientSearchQuery.length > 1 && (
                <div className="absolute top-full left-0 w-full mt-1 bg-card border border-border rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                  {filteredPatientsForModal.length > 0 ? filteredPatientsForModal.map((pt: any) => (
                    <button 
                      key={pt.id}
                      onClick={() => {
                        setFormData({...formData, patientId: pt.id})
                        setPatientSearchQuery(`${pt.firstName} ${pt.lastName} - ${pt.ci}`)
                        setShowPatientDropdown(false)
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-accent border-b border-border/50 last:border-0 text-sm font-bold text-foreground"
                    >
                      {pt.firstName} {pt.lastName} <span className="text-muted-foreground text-xs font-normal ml-2">CI: {pt.ci}</span>
                    </button>
                  )) : (
                    <div className="px-4 py-3 text-sm text-muted-foreground text-center">No se encontraron pacientes.</div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Monto a Cobrar ($) *</Label>
                <Input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" className="h-12 bg-background border-border font-mono text-lg font-black text-emerald-500 rounded-xl focus-visible:ring-emerald-500/20" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Método de Pago *</Label>
                <select value={formData.method} onChange={e => setFormData({...formData, method: e.target.value as PaymentMethod})} className="w-full h-12 px-4 rounded-xl border border-border bg-background text-foreground outline-none text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 transition-all">
                  <option value="CASH">Efectivo</option>
                  <option value="TRANSFER">Transferencia / QR</option>
                  <option value="CREDIT_CARD">Tarjeta de Crédito</option>
                  <option value="DEBIT_CARD">Tarjeta de Débito</option>
                  <option value="INSURANCE">Seguro Médico</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Nro. Recibo</Label>
                <Input value={formData.receiptNumber} onChange={e => setFormData({...formData, receiptNumber: e.target.value})} placeholder="Ej: FAC-00123" className="h-12 bg-background border-border font-mono text-sm rounded-xl focus-visible:ring-emerald-500/20" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Estado del Pago</Label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as PaymentState})} className="w-full h-12 px-4 rounded-xl border border-border bg-background text-foreground outline-none text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 transition-all">
                  <option value="COMPLETED">Completado</option>
                  <option value="PENDING">Pendiente</option>
                  <option value="REFUNDED">Reembolsado</option>
                  <option value="FAILED">Fallido</option>
                </select>
              </div>
            </div>

          </div>
          <DialogFooter className="px-8 py-5 border-t border-border bg-muted/20 flex gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-border hover:bg-accent text-foreground font-bold h-11 rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving || !formData.patientId || !formData.amount} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-11 px-8 rounded-xl shadow-sm">
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : (editingId ? "Actualizar" : "Confirmar Pago")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ALERT DELETE */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent className="bg-card border-border rounded-[24px] shadow-2xl sm:max-w-[450px]">
          <AlertDialogHeader className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center"><AlertTriangle className="w-8 h-8" /></div>
            <AlertDialogTitle className="text-2xl font-black text-foreground">¿Eliminar Registro?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">Esta acción borrará permanentemente este pago de la base de datos financiera.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="w-full flex sm:justify-center gap-3 mt-4">
            <AlertDialogCancel className="border-border hover:bg-accent text-foreground font-bold rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold rounded-xl">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}