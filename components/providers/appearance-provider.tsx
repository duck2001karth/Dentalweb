"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useSession } from "next-auth/react"

type TableDensity = "compact" | "comfortable"

interface AppearanceContextType {
  accentColor: string
  setAccentColor: (color: string) => void
  animationsEnabled: boolean
  setAnimationsEnabled: (enabled: boolean) => void
  tableDensity: TableDensity
  setTableDensity: (density: TableDensity) => void
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined)

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const currentUser = session?.user as any

  const [accentColor, setAccentColorState] = useState<string>("#008bcd")
  const [animationsEnabled, setAnimationsEnabledState] = useState<boolean>(true)
  const [tableDensity, setTableDensityState] = useState<TableDensity>("comfortable")

  useEffect(() => {
    const savedColor = currentUser?.calendarColor || localStorage.getItem("app_accent_color") || "#008bcd"
    const savedAnim = localStorage.getItem("app_animations") !== "false"
    const savedDensity = (localStorage.getItem("app_table_density") as TableDensity) || "comfortable"

    setAccentColorState(savedColor)
    setAnimationsEnabledState(savedAnim)
    setTableDensityState(savedDensity)

    applyDomSettings(savedColor, savedAnim, savedDensity)
  }, [currentUser?.calendarColor])

  const applyDomSettings = (color: string, anim: boolean, density: TableDensity) => {
    const root = document.documentElement

    root.style.setProperty("--primary", color)
    root.style.setProperty("--ring", color)

    if (!anim) {
      root.classList.add("disable-animations")
    } else {
      root.classList.remove("disable-animations")
    }

    root.setAttribute("data-table-density", density)
  }

  const setAccentColor = (color: string) => {
    setAccentColorState(color)
    localStorage.setItem("app_accent_color", color)
    applyDomSettings(color, animationsEnabled, tableDensity)
  }

  const setAnimationsEnabled = (enabled: boolean) => {
    setAnimationsEnabledState(enabled)
    localStorage.setItem("app_animations", String(enabled))
    applyDomSettings(accentColor, enabled, tableDensity)
  }

  const setTableDensity = (density: TableDensity) => {
    setTableDensityState(density)
    localStorage.setItem("app_table_density", density)
    applyDomSettings(accentColor, animationsEnabled, density)
  }

  return (
    <AppearanceContext.Provider
      value={{
        accentColor,
        setAccentColor,
        animationsEnabled,
        setAnimationsEnabled,
        tableDensity,
        setTableDensity,
      }}
    >
      {children}
    </AppearanceContext.Provider>
  )
}

export function useAppearance() {
  const context = useContext(AppearanceContext)
  if (!context) {
    throw new Error("useAppearance debe usarse dentro de un AppearanceProvider")
  }
  return context
}