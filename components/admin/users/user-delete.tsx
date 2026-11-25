"use client"
import { AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
interface UserDeleteDialogProps { userToDelete:any|null; onClose:()=>void; onConfirm:()=>Promise<void>; isDeleting:boolean }
export function UserDeleteDialog({userToDelete,onClose,onConfirm,isDeleting}:UserDeleteDialogProps){
return <Dialog open={!!userToDelete} onOpenChange={open=>{if(!open&&!isDeleting)onClose()}}><DialogContent className="sm:max-w-[440px] bg-card border-border rounded-2xl p-6"><DialogHeader><AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400 mb-2"/><DialogTitle>¿Deshabilitar acceso?</DialogTitle><DialogDescription>La cuenta de {userToDelete?.name||"este usuario"} perderá el permiso de acceso. Su información e historial se conservarán y podrás habilitarla nuevamente.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={onClose} disabled={isDeleting}>Cancelar</Button><Button onClick={onConfirm} disabled={isDeleting} variant="destructive">{isDeleting&&<Loader2 className="w-4 h-4 mr-2 animate-spin"/>}Deshabilitar acceso</Button></DialogFooter></DialogContent></Dialog>
}
