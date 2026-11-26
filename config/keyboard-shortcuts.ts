export type ShortcutRole = "ADMIN" | "DOCTOR" | "RECEPTIONIST"
export type Shortcut = { id: string; label: string; key: string; group: string; roles: readonly ShortcutRole[]; route?: string; tab?: string; action?: "patient" | "appointment" }
const all = ["ADMIN", "DOCTOR", "RECEPTIONIST"] as const
const clinical = ["ADMIN", "DOCTOR"] as const
const admin = ["ADMIN"] as const
const cash = ["ADMIN", "RECEPTIONIST"] as const
export const shortcuts: readonly Shortcut[] = [
 {id:"workflow",label:"Centro de Atención",key:"Alt+H",group:"Navegación",roles:all,route:"/centro-atencion"},
 {id:"notices",label:"Centro de notificaciones",key:"Alt+M",group:"Sistema",roles:all,route:"/notificaciones"},
 {id:"search",label:"Buscar pacientes o acciones",key:"Ctrl+B / Ctrl+K",group:"Sistema",roles:all},
 {id:"help",label:"Atajos de teclado",key:"Alt+K",group:"Sistema",roles:all},
 {id:"theme",label:"Cambiar tema",key:"Alt+T",group:"Sistema",roles:all},
 {id:"home",label:"Panel clínico",key:"Alt+I",group:"Navegación",roles:all,route:"/"},
 {id:"patients",label:"Directorio de pacientes",key:"Alt+P",group:"Navegación",roles:all,route:"/pacientes"},
 {id:"agenda",label:"Agenda de citas",key:"Alt+A",group:"Navegación",roles:all,route:"/agenda-global"},
 {id:"cash",label:"Caja y arqueo",key:"Alt+F",group:"Navegación",roles:cash,route:"/cajas"},
 {id:"inventory",label:"Inventario",key:"Alt+V",group:"Navegación",roles:cash,route:"/inventario"},
 {id:"new-patient",label:"Registrar paciente",key:"Alt+N",group:"Acciones rápidas",roles:all,route:"/pacientes",action:"patient"},
 {id:"new-appointment",label:"Agendar nueva cita",key:"Alt+C",group:"Acciones rápidas",roles:all,route:"/agenda-global",action:"appointment"},
 {id:"recipes",label:"Recetas",key:"Alt+R",group:"Ficha del paciente",roles:all,tab:"recetas"},
 {id:"documents",label:"Rx y documentos adjuntos",key:"Alt+D",group:"Ficha del paciente",roles:all,tab:"rx"},
 {id:"evolutions",label:"Evoluciones clínicas",key:"Alt+E",group:"Ficha del paciente",roles:clinical,tab:"evoluciones"},
 {id:"odontogram",label:"Odontograma",key:"Alt+O",group:"Ficha del paciente",roles:clinical,tab:"odontograma"},
 {id:"admin",label:"Centro administrativo",key:"Alt+G",group:"Administración",roles:admin,route:"/admin"},
 {id:"users",label:"Gestión de usuarios",key:"Alt+U",group:"Administración",roles:admin,route:"/admin/usuarios"},
 {id:"audit",label:"Auditoría del sistema",key:"Alt+L",group:"Administración",roles:admin,route:"/admin/auditoria"},
]
export function forRole(role: unknown) { return shortcuts.filter(s=>s.roles.some(r=>r===role)) }
export function matchShortcut(event: Pick<KeyboardEvent,"key"|"ctrlKey"|"metaKey"|"altKey"|"shiftKey">,role:unknown) {
 if(event.shiftKey)return undefined
 const k=event.key.toLowerCase()
 if((event.ctrlKey!==event.metaKey)&&!event.altKey&&(k==="b"||k==="k"))return forRole(role).find(s=>s.id==="search")
 if(event.altKey&&!event.ctrlKey&&!event.metaKey)return forRole(role).find(s=>s.key.toLowerCase()===`alt+${k}`)
 return undefined
}
