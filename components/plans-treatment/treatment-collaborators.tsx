"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Users, Check, Loader2, Stethoscope, Search, ShieldAlert } from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

interface AssignCollaboratorsModalProps {
  isOpen: boolean
  setIsOpen: (v: boolean) => void
  planId?: string
  mainDoctorId?: string
  doctorsList?: any[]
  currentCollaborators?: string[]
  currentUser?: any 
  onSaveCollaborators: (selectedIds: string[]) => void
}

export function AssignCollaboratorsModal({
  isOpen,
  setIsOpen,
  planId,
  mainDoctorId,
  doctorsList,
  currentCollaborators = [],
  onSaveCollaborators
}: AssignCollaboratorsModalProps) {
  const { data: session } = useSession()
  const { toast } = useToast()

  const userRole = (session?.user as any)?.role || "DOCTOR"
  const currentUserId = session?.user?.id
  const canAssign = userRole === "ADMIN" || userRole === "RECEPCION"

  const [selectedIds, setSelectedIds] = useState<string[]>(currentCollaborators)
  const [fetchedDoctors, setFetchedDoctors] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>("")

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(currentCollaborators)
      setSearchQuery("")
    }
  }, [isOpen, currentCollaborators])

  useEffect(() => {
    if (!isOpen || !canAssign) return
    if (doctorsList && doctorsList.length > 0) return

    let isMounted = true
    setIsLoading(true)

    fetch("/api/users?role=DOCTOR")
      .then(async (res) => {
        if (!res.ok) {
          const fallback = await fetch("/api/users")
          if (!fallback.ok) throw new Error()
          return fallback.json()
        }
        return res.json()
      })
      .then((data) => {
        if (!isMounted) return
        const list = Array.isArray(data) ? data : (data.users || data.doctors || [])
        setFetchedDoctors(list)
      })
      .catch(() => {
        if (!isMounted) return
        setFetchedDoctors([])
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, canAssign])

  const rawDoctors = (doctorsList && doctorsList.length > 0) ? doctorsList : fetchedDoctors

  const availableDoctors = rawDoctors.filter((doc) => {
    const docId = doc.id || doc._id
    if (mainDoctorId && docId === mainDoctorId) return false
    if (currentUserId && docId === currentUserId) return false

    return true
  })

  const filteredDoctors = availableDoctors.filter((doc) => {
    const name = (doc.name || `${doc.firstName || ''} ${doc.lastName || ''}`).toLowerCase()
    const spec = (doc.specialty || doc.role || "").toLowerCase()
    const query = searchQuery.toLowerCase()
    return name.includes(query) || spec.includes(query)
  })

  const toggleDoctor = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSave = async () => {
  setIsSaving(true)
  try {
    const selectedDoctors = rawDoctors.filter(d => selectedIds.includes(d.id) || selectedIds.includes(d.name))
    const selectedNames = selectedDoctors.map(d => d.name || "Dr. Especialista")

    if (planId) {
      const res = await fetch(`/api/treatments/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collaborators: selectedIds }) 
      })

      if (!res.ok) throw new Error("Error al guardar")
      const data = await res.json()
      onSaveCollaborators(data.plan?.collaborators || selectedNames)
    } else {
      onSaveCollaborators(selectedNames)
    }

    toast({ title: "Colaboradores asignados con éxito", variant: "success" })
    setIsOpen(false)
  } catch (e) {
    toast({ title: "Error al guardar colaboradores", variant: "destructive" })
  } finally {
    setIsSaving(false)
  }
}

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[460px] bg-card text-card-foreground border-border rounded-2xl font-sans antialiased">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <Users className="w-5 h-5 text-[#008bcd]" />
            Asignar Colaboradores al Plan
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Selecciona los especialistas secundarios para este tratamiento.
          </DialogDescription>
        </DialogHeader>

        {!canAssign ? (
          <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 my-2 text-xs">
            <ShieldAlert className="w-6 h-6 text-amber-500 shrink-0" />
            <p className="font-semibold text-amber-700 dark:text-amber-400">
              Solo Administración y Recepción tienen permisos para gestionar la asignación de colaboradores.
            </p>
          </div>
        ) : (
          <>
            <div className="relative mt-2">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <Input 
                placeholder="Buscar especialista..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-xl text-xs bg-background border-border/80 focus:ring-[#008bcd]"
              />
            </div>

            <div className="py-2 space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#008bcd]" />
                  <p className="text-xs font-semibold">Cargando doctores...</p>
                </div>
              ) : filteredDoctors.length > 0 ? (
                filteredDoctors.map((doc) => {
                  const docId = doc.id || doc._id
                  const isSelected = selectedIds.includes(docId) || selectedIds.includes(doc.name)
                  const docName = doc.name || "Dr. Especialista"

                  return (
                    <div 
                      key={docId} 
                      onClick={() => toggleDoctor(docId)}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                        isSelected 
                          ? "border-[#008bcd] bg-[#008bcd]/10 font-bold" 
                          : "border-border/80 bg-background hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#008bcd]/15 text-[#008bcd] flex items-center justify-center text-xs font-extrabold shrink-0">
                          <Stethoscope className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">
                            👨‍⚕️ {docName}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-medium">
                            {doc.specialty || doc.role || "Especialista"}
                          </p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#008bcd] stroke-[2.5]" />}
                    </div>
                  )
                })
              ) : (
                <div className="p-6 text-center text-muted-foreground text-xs font-semibold bg-muted/20 rounded-xl border border-dashed border-border/80">
                  No hay otros doctores disponibles para asignar.
                </div>
              )}
            </div>
          </>
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/60">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl text-xs font-bold h-10">
            Cancelar
          </Button>
          {canAssign && (
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-[#008bcd] hover:bg-[#0070a8] text-white font-bold rounded-xl text-xs h-10 px-5 shadow-xs"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              Guardar Asignación
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}