"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"

export interface ClinicSettings {
  id: string
  clinicName: string
  ruc: string | null
  slogan?: string
  razonSocial: string | null
  estabCode: string | null
  ptoEmiCode: string | null
  obligadoContab: boolean
  taxRate: number
  currency: string
  address: string | null
  city?: string      
  country?: string
  timezone: string
  timeFormat: "12h" | "24h" | string

  phone: string | null
  whatsappNumber: string | null
  email: string | null
  website: string | null
  availableBoxes: string[]
  footerText: string | null
  logoUrl: string | null
  logoScale?: number 
  watermarkUrl: string | null
  watermarkOpacity?: number
  watermarkScale?: number
  defaultPrintMode?: "color" | "bw" 
}

interface ClinicSettingsContextType {
  settings: ClinicSettings | null
  isLoading: boolean
  refreshSettings: () => Promise<void>
  formatCurrency: (amount: number) => string
}

const ClinicSettingsContext = createContext<ClinicSettingsContextType>({
  settings: null,
  isLoading: true,
  refreshSettings: async () => {},
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`
})

export function ClinicSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ClinicSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/configuration")
      if (res.ok) {
        const data = await res.json()
        setSettings({
          ...data,
          timezone: data.timezone || "America/Guayaquil",
          timeFormat: data.timeFormat || "24h"
        })
      }
    } catch (error) {
      console.error("Error cargando configuración global:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const formatCurrency = useCallback((amount: number) => {
    const symbol = settings?.currency === "BOB" ? "Bs. " : settings?.currency === "COP" ? "COP $" : "$"
    return `${symbol}${Number(amount || 0).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }, [settings?.currency])

  return (
    <ClinicSettingsContext.Provider value={{ settings, isLoading, refreshSettings: fetchSettings, formatCurrency }}>
      {children}
    </ClinicSettingsContext.Provider>
  )
}

export const useClinicSettings = () => useContext(ClinicSettingsContext)