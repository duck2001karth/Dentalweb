"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Users, Search, UserPlus, Edit, Shield, Stethoscope, UserCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

export function UsuariosClient() {
  const { toast } = useToast()
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: "", email: "", role: "DOCTOR", specialty: "", isActive: true
  })

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

  const openModal = (user?: any) => {
    if (user) {
      setEditingId(user.id)
      setFormData({ name: user.name || "", email: user.email || "", role: user.role || "DOCTOR", specialty: user.specialty || "", isActive: user.isActive ?? true })
    } else {
      setEditingId(null)
      setFormData({ name: "", email: "", role: "DOCTOR", specialty: "", isActive: true })
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.email) return toast({ title: "Faltan datos", variant: "destructive" })
    setIsSaving(true)
    try {
      const method = editingId ? 'PATCH' : 'POST'
      const payload = editingId ? { id: editingId, ...formData } : formData
      const res = await fetch('/api/admin/users', {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error()
      toast({ title: editingId ? "Usuario actualizado" : "Usuario creado", variant: "success" })
      setIsModalOpen(false)
      fetchUsers()
    } catch (error) { toast({ title: "Error al guardar", variant: "destructive" }) } 
    finally { setIsSaving(false) }
  }

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH', headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isActive: !currentStatus })
      })
      toast({ title: "Estado actualizado", variant: "success" })
      fetchUsers()
    } catch (error) { toast({ title: "Error al actualizar", variant: "destructive" }) }
  }

  const filteredUsers = users.filter(u => 
    (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getRoleBadge = (role: string) => {
    if (role === "ADMIN") return <span className="bg-purple-500/10 text-purple-500 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-max"><Shield size={12}/> Admin</span>
    if (role === "DOCTOR") return <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-max"><Stethoscope size={12}/> Doctor</span>
    return <span className="bg-muted text-muted-foreground px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-max"><UserCircle size={12}/> Recepción</span>
  }

  return (
    <div className="animate-in fade-in duration-300 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-1 font-medium">Administra los accesos y roles del equipo de Carmo Dental.</p>
        </div>
        <Button onClick={() => openModal()} className="bg-primary text-primary-foreground font-bold h-11 px-6 rounded-xl shadow-sm">
          <UserPlus className="w-5 h-5 mr-2" /> Nuevo Usuario
        </Button>
      </div>

      <div className="bg-card p-4 rounded-2xl border border-border relative">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input placeholder="Buscar por nombre o correo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 h-11 bg-background border-border rounded-xl text-base focus-visible:ring-primary" />
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-muted/30 border-b border-border text-muted-foreground">
            <tr>
              <th className="p-4 font-black uppercase text-xs">Usuario / Correo</th>
              <th className="p-4 font-black uppercase text-xs">Rol</th>
              <th className="p-4 font-black uppercase text-xs">Especialidad</th>
              <th className="p-4 font-black uppercase text-xs text-center">Acceso Activo</th>
              <th className="p-4 font-black uppercase text-xs text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {isLoading ? (
              <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">No hay usuarios registrados.</td></tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className={`hover:bg-accent/40 transition-colors ${!user.isActive ? 'opacity-50 bg-muted/10' : ''}`}>
                  <td className="p-4">
                    <p className="font-bold text-foreground text-base">{user.name}</p>
                    <p className="text-muted-foreground text-xs">{user.email}</p>
                  </td>
                  <td className="p-4">{getRoleBadge(user.role)}</td>
                  <td className="p-4 text-muted-foreground font-medium">{user.specialty || "---"}</td>
                  <td className="p-4 text-center">
                    <Switch checked={user.isActive} onCheckedChange={() => toggleStatus(user.id, user.isActive)} className="data-[state=checked]:bg-emerald-500" />
                  </td>
                  <td className="p-4 text-center">
                    <Button variant="ghost" size="sm" onClick={() => openModal(user)} className="text-muted-foreground hover:text-primary hover:bg-accent rounded-xl">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL CONFIG */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border rounded-2xl text-foreground">
          <DialogHeader><DialogTitle className="text-2xl font-black">Registro de Usuario</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Nombre Completo *</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-background border-border"/></div>
            <div className="space-y-2"><Label>Correo Electrónico *</Label><Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="bg-background border-border"/></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Rol del Sistema *</Label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full h-10 px-3 rounded-md border border-border bg-background outline-none text-sm font-bold">
                  <option value="DOCTOR">Doctor</option><option value="RECEPTIONIST">Recepcionista</option><option value="ADMIN">Administrador</option>
                </select>
              </div>
              <div className="space-y-2"><Label>Especialidad</Label><Input value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})} placeholder="Ej: Ortodoncia" className="bg-background border-border"/></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-border hover:bg-accent text-foreground">Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-primary text-primary-foreground font-bold">{isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}