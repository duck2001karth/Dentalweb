"use client"

import React, { useState, useMemo } from "react"
import { 
  Handshake, 
  Plus, 
  Search, 
  RefreshCw, 
  Building2, 
  Percent, 
  DollarSign, 
  Users, 
  FileText, 
  Loader2,
  CheckCircle2,
  XCircle,
  Phone,
  Edit2,
  Trash2,
  AlertTriangle
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { useAgreements } from "@/hooks/use-agreements"
import type { Agreement } from "@/types/agreements"
import { AgreementModal } from "@/components/admin/agreements/agreement-modal"

export default function ConveniosAdminPage() {
  const { 
    agreements, 
    isLoading, 
    isSaving, 
    fetchAgreements, 
    createAgreement, 
    updateAgreement, 
    deleteAgreement, 
    toggleStatus 
  } = useAgreements()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAgreement, setEditingAgreement] = useState<Agreement | null>(null)
  const [itemToDelete, setItemToDelete] = useState<Agreement | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredAgreements = useMemo(() => {
    const q = searchTerm.toLowerCase()
    return agreements.filter(ag => 
      ag.name.toLowerCase().includes(q) || 
      ag.institutionName.toLowerCase().includes(q) ||
      (ag.contactPerson && ag.contactPerson.toLowerCase().includes(q))
    )
  }, [agreements, searchTerm])

  const totalActivos = useMemo(() => agreements.filter(a => a.isActive).length, [agreements])
  const totalPlanesVinculados = useMemo(() => agreements.reduce((acc, a) => acc + (a._count?.treatmentPlans || 0), 0), [agreements])

  const handleOpenCreate = () => {
    setEditingAgreement(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (ag: Agreement) => {
    setEditingAgreement(ag)
    setIsModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    setIsDeleting(true)
    const success = await deleteAgreement(itemToDelete.id)
    setIsDeleting(false)
    if (success) {
      setItemToDelete(null)
    }
  }

  return (
    <div className="w-full space-y-6 font-sans antialiased animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase bg-[#008bcd]/15 text-[#008bcd]">
              Tarifas Corporativas
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight mt-1">
            Convenios y Aseguradoras
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
            Administra los descuentos institucionales y seguros aplicables a los planes de tratamiento.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchAgreements()}
            className="h-10 w-10 rounded-xl border-border bg-card hover:bg-muted shadow-none"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${isLoading ? "animate-spin" : ""}`} />
          </Button>

          <Button
            onClick={handleOpenCreate}
            className="bg-[#008bcd] hover:bg-[#007bb6] text-white font-bold h-10 px-5 rounded-xl shadow-xs text-xs gap-2 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> Nuevo Convenio
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card p-5 rounded-[22px] border border-border shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Convenios</p>
            <h3 className="text-2xl font-black text-foreground">{agreements.length}</h3>
            <p className="text-[10px] text-muted-foreground font-semibold mt-1">Registrados en el sistema</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#008bcd]/10 text-[#008bcd] flex items-center justify-center shrink-0">
            <Handshake className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        <div className="bg-card p-5 rounded-[22px] border border-border shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Convenios Activos</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalActivos}</h3>
            <p className="text-[10px] text-muted-foreground font-semibold mt-1">Disponibles en cotizador</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        <div className="bg-card p-5 rounded-[22px] border border-border shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Planes Beneficiados</p>
            <h3 className="text-2xl font-black text-foreground">{totalPlanesVinculados}</h3>
            <p className="text-[10px] text-muted-foreground font-semibold mt-1">Presupuestos con tarifa especial</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-[24px] border border-border shadow-xs">
        <div className="relative w-full sm:w-[320px]">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por convenio o empresa..."
            className="pl-10 h-10 rounded-xl bg-muted/30 border-transparent focus:border-[#008bcd] text-xs font-medium"
          />
        </div>
        <span className="text-xs font-bold text-muted-foreground pr-2">
          {filteredAgreements.length} {filteredAgreements.length === 1 ? "convenio" : "convenios"}
        </span>
      </div>

      {/* LISTADO EN CARDS */}
      {isLoading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#008bcd] mx-auto mb-3" />
          <p className="text-sm font-bold text-muted-foreground">Cargando catálogo de convenios...</p>
        </div>
      ) : filteredAgreements.length === 0 ? (
        <div className="py-20 text-center bg-card border border-border rounded-[24px]">
          <div className="w-14 h-14 bg-muted/40 rounded-full flex items-center justify-center mx-auto mb-3">
            <FileText className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <h3 className="text-sm font-bold text-foreground">No hay convenios registrados</h3>
          <p className="text-xs text-muted-foreground mt-1">Crea el primer convenio para habilitarlo en la cotización de planes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAgreements.map((ag) => {
            const isPercentage = ag.discountType === "PERCENTAGE"
            
            return (
              <div 
                key={ag.id} 
                className="bg-card border border-border rounded-[22px] p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#008bcd]/40 transition-colors group relative overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-[#008bcd]/10 text-[#008bcd] border border-[#008bcd]/20">
                      {isPercentage ? <Percent className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                      {Number(ag.discountValue)} {isPercentage ? "% DESCUENTO" : "USD FIJO"}
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleStatus(ag.id, ag.isActive)}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase cursor-pointer transition-colors ${
                        ag.isActive 
                          ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" 
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                      title="Haz clic para cambiar estado"
                    >
                      {ag.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {ag.isActive ? "Activo" : "Inactivo"}
                    </button>
                  </div>

                  <div>
                    <h3 className="font-black text-lg text-foreground tracking-tight group-hover:text-[#008bcd] transition-colors">
                      {ag.name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                      {ag.institutionName}
                    </p>
                  </div>

                  {ag.contactPhone && (
                    <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-[#008bcd]" /> {ag.contactPhone}
                    </p>
                  )}
                </div>

                {/* ACCIONES INFERIORES: EDITAR Y ELIMINAR */}
                <div className="border-t border-border/80 pt-4 flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground flex items-center gap-1.5 text-[11px]">
                    <Users className="w-3.5 h-3.5 text-[#008bcd]" /> 
                    {ag._count?.treatmentPlans || 0} presupuestos
                  </span>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(ag)}
                      className="h-8 px-2.5 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted gap-1.5 cursor-pointer"
                      title="Editar convenio"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setItemToDelete(ag)}
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                      title="Eliminar convenio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL CREAR / EDITAR */}
      <AgreementModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingAgreement(null)
        }}
        editingAgreement={editingAgreement}
        isSaving={isSaving}
        onSave={async (data) => {
          if (editingAgreement) {
            return await updateAgreement(editingAgreement.id, data)
          }
          return await createAgreement(data)
        }}
      />

      {/* MODAL DE CONFIRMACIÓN PARA ELIMINAR */}
      <Dialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <DialogContent className="sm:max-w-[420px] bg-card border-border rounded-[24px] p-6 shadow-2xl">
          <DialogHeader className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
            </div>
            <DialogTitle className="text-center text-lg font-black text-foreground">
              ¿Eliminar Convenio?
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground leading-relaxed">
              Estás a punto de eliminar el convenio <strong className="text-foreground">"{itemToDelete?.name}"</strong>. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex gap-2 sm:justify-center">
            <Button
              variant="outline"
              onClick={() => setItemToDelete(null)}
              className="rounded-xl text-xs font-bold h-10 px-5 border-border"
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold h-10 px-6"
            >
              {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />}
              Sí, Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}