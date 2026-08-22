"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useSession } from "next-auth/react"
import { 
  Search, UserPlus, Edit2, Shield, Stethoscope, Headset, 
  Loader2, RefreshCw, Info, Trash2, Clock 
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

import { UserStats } from "@/components/admin/users/user-stats"
import { RoleFilterChips } from "@/components/admin/users/role-filter"
import { UserModal } from "@/components/admin/users/user-modal"
import { UserDeleteDialog } from "@/components/admin/users/user-delete"

export function UsuariosClient() {
  const { toast } = useToast()
  const { data: session } = useSession() 
  
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("ALL")
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [userToDelete, setUserToDelete] = useState<any | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) setUsers(await res.json())
    } catch (error) {
      toast({ title: "Error al cargar usuarios", variant: "destructive" })
    } finally { setIsLoading(false) }
  }, [toast])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleSave = async (formData: any) => {
    setIsSaving(true)
    try {
      const method = editingUser ? 'PATCH' : 'POST'
      const payload = editingUser ? { id: editingUser.id, ...formData } : formData
      const res = await fetch('/api/admin/users', {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error()
      toast({ title: editingUser ? "Usuario actualizado" : "Usuario creado", variant: "default" })
      setIsModalOpen(false)
      fetchUsers()
    } catch (error) { 
      toast({ title: "Error al guardar", variant: "destructive" }) 
    } finally { setIsSaving(false) }
  }

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH', headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isActive: !currentStatus })
      })
      if (!res.ok) throw new Error()
      fetchUsers()
    } catch (error) { 
      toast({ title: "Error al actualizar estado", variant: "destructive" }) 
    }
  }

  const confirmDelete = async () => {
    if (!userToDelete) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/users?id=${userToDelete.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast({ title: "Usuario eliminado correctamente", variant: "default" })
      fetchUsers()
    } catch (error) {
      toast({ title: "Error al eliminar usuario", variant: "destructive" })
    } finally {
      setIsDeleting(false)
      setUserToDelete(null)
    }
  }

  const getInitials = (name: string) => {
    if (!name) return "U"
    const parts = name.trim().split(" ")
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.substring(0, 2).toUpperCase()
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500/10 text-blue-600 border-blue-500/20",
      "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      "bg-purple-500/10 text-purple-600 border-purple-500/20",
      "bg-rose-500/10 text-rose-600 border-rose-500/20",
      "bg-amber-500/10 text-amber-600 border-amber-500/20",
      "bg-[#008bcd]/10 text-[#008bcd] border-[#008bcd]/20" 
    ]
    const index = name ? name.length % colors.length : 0
    return colors[index]
  }

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: users.length }
    users.forEach(u => {
      counts[u.role] = (counts[u.role] || 0) + 1
    })
    return counts
  }, [users])

  const filteredUsers = useMemo(() => {
    const q = searchTerm.toLowerCase()
    return users.filter(u => {
      const matchSearch = (u.name && u.name.toLowerCase().includes(q)) || (u.email && u.email.toLowerCase().includes(q))
      const matchRole = selectedRole === "ALL" || u.role === selectedRole
      return matchSearch && matchRole
    })
  }, [users, searchTerm, selectedRole])

  const getRoleBadge = (role: string) => {
    if (role === "ADMIN") return <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2.5 py-1 rounded-md text-[10px] font-black uppercase flex items-center gap-1.5 w-max border border-purple-500/20"><Shield size={12} strokeWidth={2.5}/> Administrador</span>
    if (role === "DOCTOR") return <span className="bg-[#008bcd]/10 text-[#008bcd] px-2.5 py-1 rounded-md text-[10px] font-black uppercase flex items-center gap-1.5 w-max border border-[#008bcd]/20"><Stethoscope size={12} strokeWidth={2.5}/> Doctor</span>
    return <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-md text-[10px] font-black uppercase flex items-center gap-1.5 w-max border border-amber-500/20"><Headset size={12} strokeWidth={2.5}/> Recepción</span>
  }

  return (
    <div className="w-full space-y-6 font-sans antialiased animate-in fade-in duration-200">      
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase bg-[#008bcd]/15 text-[#008bcd]">
              Control de Accesos
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight mt-1">Gestión de Usuarios</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">Administra los roles, especialidades y permisos de todo el equipo clínico.</p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="icon" onClick={fetchUsers} className="h-10 w-10 rounded-xl border-border bg-card hover:bg-muted shadow-none">
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => { setEditingUser(null); setIsModalOpen(true) }} className="h-10 px-5 rounded-xl bg-[#008bcd] hover:bg-[#007bb6] text-white font-bold text-xs gap-2 transition-all shadow-xs">
            <UserPlus className="w-4 h-4 stroke-[2.5]" /> Nuevo Usuario
          </Button>
        </div>
      </div>

      <UserStats users={users} />

      <RoleFilterChips selectedRole={selectedRole} onSelectRole={setSelectedRole} counts={roleCounts} />

      <div className="bg-card border border-border rounded-[24px] shadow-xs overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder="Buscar por nombre o correo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-10 bg-background border-border rounded-xl text-xs font-medium focus-visible:ring-[#008bcd]/30" />
          </div>
          <span className="text-xs font-bold text-muted-foreground">
            Mostrando {filteredUsers.length} de {users.length} usuarios
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-muted/30 border-b border-border text-[11px] uppercase text-muted-foreground font-black">
              <tr>
                <th className="px-6 py-3.5">Usuario / Correo</th>
                <th className="px-6 py-3.5">Rol y Conexión</th>
                <th className="px-6 py-3.5">Especialidad</th>
                <th className="px-6 py-3.5 text-center">Acceso Activo</th>
                <th className="px-6 py-3.5 text-right">Configurar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-[#008bcd] mx-auto mb-3 stroke-[2.5]" /><p className="text-xs font-bold text-muted-foreground">Cargando directorio...</p></td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-16 text-center"><Info className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" /><p className="text-xs font-bold text-foreground">No se encontraron usuarios</p></td></tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrentUser = session?.user?.email === user.email;

                  return (
                    <tr key={user.id} className={`hover:bg-muted/30 transition-all ${!user.isActive ? 'opacity-60 bg-muted/10' : ''}`}>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full border flex items-center justify-center font-black text-xs shrink-0 ${getAvatarColor(user.name)}`}>
                            {getInitials(user.name)}
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-xs flex items-center gap-2">
                              {user.name} 
                              {isCurrentUser && <span className="bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">Tú</span>}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex flex-col gap-1.5">
                          {getRoleBadge(user.role)}
                          <p className="text-[9px] font-semibold text-muted-foreground flex items-center gap-1 uppercase tracking-wide">
                            <Clock className="w-3 h-3" />
                            {user.lastLogin ? `Activo hace ${formatDistanceToNow(new Date(user.lastLogin), { locale: es })}` : 'Nunca ha ingresado'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground font-semibold">{user.specialty || "General"}</td>
                      <td className="px-6 py-3 text-center">
                        <Switch 
                          checked={user.isActive} 
                          onCheckedChange={() => toggleStatus(user.id, user.isActive)} 
                          className="data-[state=checked]:bg-emerald-500"
                          disabled={isCurrentUser} 
                          title={isCurrentUser ? "No puedes desactivar tu propia cuenta" : "Cambiar estado"}
                        />
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingUser(user); setIsModalOpen(true) }} className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer" title="Editar permisos">
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          {!isCurrentUser && (
                            <Button variant="ghost" size="icon" onClick={() => setUserToDelete(user)} className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer" title="Eliminar usuario">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UserModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingUser(null) }} editingUser={editingUser} isSaving={isSaving} onSave={handleSave} />
      
      <UserDeleteDialog userToDelete={userToDelete} onClose={() => setUserToDelete(null)} onConfirm={confirmDelete} isDeleting={isDeleting} />
    </div>
  )
}