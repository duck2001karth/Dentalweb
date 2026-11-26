"use client"
import {useEffect,useState} from 'react'
import {useSession} from 'next-auth/react'
import {useQuery,useMutation,useQueryClient} from '@tanstack/react-query'
import {BellRing} from 'lucide-react'
import {useToast} from '@/hooks/use-toast'
type Pref={arrivals:boolean;appointments:boolean;reminders:boolean;waiting:boolean;completed:boolean;stock:boolean;minutes:number}
export function NotificationPreferences(){
 const {data:session}=useSession(),id=session?.user?.id,role=session?.user?.role,qc=useQueryClient(),{toast}=useToast()
 const [draft,setDraft]=useState<Pref|null>(null)
 const q=useQuery({queryKey:['notice-preferences',id],enabled:!!id,queryFn:async()=>{const r=await fetch('/api/notifications/preferences',{cache:'no-store'});if(!r.ok)throw Error('No se pudieron cargar preferencias');return r.json() as Promise<Pref>},retry:false})
 useEffect(()=>{setDraft(null)},[id]);useEffect(()=>{if(q.data)setDraft(q.data)},[q.data])
 const m=useMutation({mutationFn:async(p:Pref)=>{const r=await fetch('/api/notifications/preferences',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});if(!r.ok)throw Error('No se pudieron guardar preferencias')},onSuccess:()=>{void qc.invalidateQueries({queryKey:['notice-preferences',id]});void qc.invalidateQueries({queryKey:['notifications']});toast({title:'Preferencias guardadas'})},onError:e=>toast({title:e.message,variant:'destructive'})})
 const fields=[['arrivals','Llegada de pacientes'],['appointments','Cambios de citas'],['reminders','Recordatorios de citas'],['waiting','Espera prolongada'],['completed','Atención finalizada'],['stock','Stock mínimo']] as const
 return <section className="max-w-xl space-y-4"><h3 className="flex items-center gap-2 text-lg font-bold"><BellRing className="size-5 text-primary"/>Notificaciones inteligentes</h3><p className="text-sm text-muted-foreground">Preferencias individuales. Los avisos generales de seguridad no se desactivan aquí.</p>{q.isError?<p role="alert" className="text-destructive text-sm">No se pudieron cargar las preferencias.</p>:!draft?<p className="text-sm text-muted-foreground">Cargando…</p>:<><div className="rounded-xl border divide-y">{fields.filter(([key])=>role==='DOCTOR'?!['waiting','completed','stock'].includes(key):role==='RECEPTIONIST'?key!=='arrivals':true).map(([key,label])=><label key={key} className="flex items-center justify-between gap-3 p-3 text-sm"><span>{label}</span><input type="checkbox" checked={draft[key]} onChange={e=>setDraft({...draft,[key]:e.target.checked})} className="size-5 accent-sky-600"/></label>)}<label className="flex items-center justify-between gap-3 p-3 text-sm">Anticipación<select value={draft.minutes} onChange={e=>setDraft({...draft,minutes:Number(e.target.value)})} className="rounded-lg border bg-background p-2">{[5,10,15,30].map(n=><option key={n} value={n}>{n} min</option>)}</select></label></div><button disabled={m.isPending} onClick={()=>m.mutate(draft)} className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold disabled:opacity-50">Guardar preferencias</button></>}</section>
}
