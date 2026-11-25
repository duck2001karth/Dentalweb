"use client"
import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
const subscribe=()=>()=>{}
export function ThemeToggle(){
 const {setTheme,resolvedTheme}=useTheme()
 const mounted=useSyncExternalStore(subscribe,()=>true,()=>false)
 if(!mounted)return <span className="size-10 shrink-0" aria-hidden="true"/>
 const dark=resolvedTheme==="dark"
 const label=dark?"Cambiar a modo claro":"Cambiar a modo oscuro"
 return <button type="button" aria-label={label} title={label} onClick={()=>setTheme(dark?"light":"dark")} className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary transition-colors">{dark?<Moon className="size-5" strokeWidth={2}/>:<Sun className="size-5" strokeWidth={2}/>}</button>
}
