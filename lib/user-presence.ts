export function getPresence(user:{isActive:boolean;lastSeenAt?:string|null;lastLogin?:string|null},now=Date.now()) {
 if(!user.isActive)return {label:"Deshabilitado",kind:"disabled"} as const
 if(!user.lastSeenAt)return {label:user.lastLogin?"Sin señal reciente":"Sin acceso registrado",kind:"offline"} as const
 const elapsed=now-Date.parse(user.lastSeenAt)
 if(!Number.isFinite(elapsed))return {label:"Sin señal reciente",kind:"offline"} as const
 if(elapsed<120000)return {label:"Actividad reciente",kind:"recent"} as const
 if(elapsed<900000)return {label:"Ausente",kind:"away"} as const
 return {label:"Sin actividad",kind:"offline"} as const
}
