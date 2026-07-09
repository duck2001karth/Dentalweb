"use client"

import React, { useState, useEffect } from "react"
import { Stethoscope } from "lucide-react" 
import { useGetPatients } from "@/hooks/patients"

const loadingMessages = [
  "Preparando el entorno clínico...",
  "Cargando expedientes...",
  "Sincronizando seguridad...",
  "Protegiendo datos del paciente..."
]

export const GlobalLoader = () => {
  const { isLoading } = useGetPatients()
  const [messageIndex, setMessageIndex] = useState(0)
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 1500)
    return () => clearInterval(interval)
  }, [isLoading])

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="flex flex-col items-center justify-center gap-8">
        
        {/* Ícono animado Premium */}
        <div className="relative flex items-center justify-center">
          <div className="absolute h-24 w-24 rounded-full border-2 border-[#008bcd]/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
          <div className="absolute h-32 w-32 rounded-full border border-[#008bcd]/10 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite_1s]"></div>
          
          <div className="bg-gradient-to-tr from-[#008bcd] to-blue-400 p-5 rounded-full shadow-xl shadow-blue-500/20 relative z-10 animate-pulse">
             <Stethoscope className="h-10 w-10 text-white" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <h3 className="text-foreground text-2xl font-black tracking-tight">
            Carmo Dental
          </h3>
          <div className="h-6 overflow-hidden">
            <p className="text-muted-foreground font-medium text-sm animate-in slide-in-from-bottom-5 fade-in duration-300" key={messageIndex}>
              {loadingMessages[messageIndex]}
            </p>
          </div>
        </div>
        
      </div>
    </div>
  )
}