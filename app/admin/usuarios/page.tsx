"use client"

import React, { useState, useEffect } from "react"
import { Users, Shield, BriefcaseMedical, Stethoscope, CheckCircle2, XCircle, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input" // <- Asegúrate de importar el Input

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function GestionUsuariosPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/users") // Ajusta esta ruta si es diferente
      if (!res.ok) throw new Error("Error")
      setUsers(await res.json())
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los usuarios.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, role: newRole })
      })
      if (!res.ok) throw new Error()
      toast({ title: "Rol actualizado", description: "Los permisos han sido cambiados." })
      fetchUsers()
    } catch (error) {
      toast({ title: "Error", description: "No se pudo actualizar el rol.", variant: "destructive" })
    }
  }

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, isActive: !currentStatus })
      })
      if (!res.ok) throw new Error()
      toast({ title: !currentStatus ? "Usuario activado" : "Usuario suspendido" })
      fetchUsers()
    } catch (error) {
      toast({ title: "Error", description: "No se pudo actualizar el estado.", variant: "destructive" })
    }
  }

  // NUEVA FUNCIÓN: Para actualizar la especialidad
  const handleUpdateSpecialty = async (userId: string, newSpecialty: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, specialty: newSpecialty })
      })
      if (!res.ok) throw new Error()
      toast({ title: "Especialidad asignada", description: "El perfil del doctor ha sido actualizado." })
      // No hacemos fetchUsers() inmediatamente para no perder el foco del input bruscamente,
      // pero puedes agregarlo si prefieres refrescar toda la tabla.
    } catch (error) {
      toast({ title: "Error", description: "No se pudo asignar la especialidad.", variant: "destructive" })
    }
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto space-y-8">
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-[#008bcd]" /> Gestión de Usuarios
          </h2>
          <p className="text-muted-foreground mt-1 font-medium">Asigna roles, revisa especialidades y controla el acceso del personal.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden min-h-[500px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-bold">
              <tr>
                <th className="px-6 py-5">Profesional / Staff</th>
                <th className="px-6 py-5">Especialidad</th>
                <th className="px-6 py-5">Rol de Acceso</th>
                <th className="px-6 py-5 text-center">Estado (Activo)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#008bcd] mx-auto mb-4" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-muted-foreground font-medium">
                    No hay usuarios registrados.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    
                    {/* USUARIO Y CORREO */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-border">
                          <AvatarImage src={user.image || ""} />
                          <AvatarFallback className="bg-blue-50 text-[#008bcd] font-bold">
                            {user.name?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-foreground text-sm">{user.name || "Usuario sin nombre"}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* CAMPO EDITABLE DE ESPECIALIDAD */}
                    <td className="px-6 py-4">
                      <div className="relative flex items-center">
                        <BriefcaseMedical className="w-3 h-3 text-[#008bcd] absolute left-3" />
                        <Input 
                          defaultValue={user.specialty || ""}
                          placeholder="Ej. Ortodoncia..."
                          className="h-8 pl-8 text-xs font-semibold bg-transparent border-transparent hover:border-border focus:border-[#008bcd] focus:bg-background transition-all w-[160px]"
                          onBlur={(e) => {
                            // Solo actualizamos si el valor realmente cambió
                            if (e.target.value !== (user.specialty || "")) {
                              handleUpdateSpecialty(user.id, e.target.value);
                            }
                          }}
                        />
                      </div>
                    </td>

                    {/* SELECTOR DE ROL */}
                    <td className="px-6 py-4">
                      <Select 
                        defaultValue={user.role} 
                        onValueChange={(value) => handleUpdateRole(user.id, value)}
                      >
                        <SelectTrigger className="w-[180px] h-9 text-xs font-bold border-border bg-background">
                          <SelectValue placeholder="Seleccionar Rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DOCTOR" className="text-xs font-bold"><span className="flex items-center gap-2"><Stethoscope className="w-3 h-3 text-blue-500"/> Especialista Clínico</span></SelectItem>
                          <SelectItem value="RECEPTIONIST" className="text-xs font-bold"><span className="flex items-center gap-2"><Users className="w-3 h-3 text-emerald-500"/> Recepcionista</span></SelectItem>
                          <SelectItem value="ADMIN" className="text-xs font-bold"><span className="flex items-center gap-2"><Shield className="w-3 h-3 text-purple-500"/> Administrador</span></SelectItem>
                        </SelectContent>
                      </Select>
                    </td>

                    {/* ESTADO ACTIVO/INACTIVO */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Switch 
                          checked={user.isActive} 
                          onCheckedChange={() => handleToggleActive(user.id, user.isActive)}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                        {user.isActive ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}