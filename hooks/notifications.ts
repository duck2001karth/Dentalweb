import { useQuery,useMutation,useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
export function useNotifications(){
 const {data:session,status}=useSession(),qc=useQueryClient(),{toast}=useToast()
 const key=['notifications',session?.user?.id,session?.user?.role]
 const q=useQuery({queryKey:key,enabled:status==='authenticated'&&session?.user?.isActive===true,queryFn:async({signal})=>{const r=await fetch('/api/notifications',{cache:'no-store',signal});if(!r.ok)throw Error('No se pudieron consultar las notificaciones');return r.json() as Promise<any[]>},refetchInterval:15000,refetchIntervalInBackground:false,retry:false})
 const m=useMutation({mutationFn:async(ids:string[])=>{const r=await fetch('/api/notifications',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids})});if(!r.ok)throw Error('No se pudieron marcar los avisos')},onSuccess:()=>void qc.invalidateQueries({queryKey:key}),onError:e=>toast({title:e.message,variant:'destructive'})})
 return {notifications:q.data||[],isLoading:q.isLoading,isError:q.isError,refetch:q.refetch,markAsRead:m.mutate,isMarking:m.isPending}
}
