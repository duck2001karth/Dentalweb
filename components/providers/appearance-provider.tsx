"use client"

import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react"
import { useSession } from "next-auth/react"

type TableDensity = "compact" | "comfortable"
type UserWithCalendarColor = { calendarColor?: string | null }

interface AppearanceContextType {
  accentColor: string
  setAccentColor: (color: string) => void
  animationsEnabled: boolean
  setAnimationsEnabled: (enabled: boolean) => void
  tableDensity: TableDensity
  setTableDensity: (density: TableDensity) => void
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined)
const PREFERENCES_EVENT = "carmo:appearance-preferences-changed"

function subscribePreferences(callback: () => void): () => void {
  window.addEventListener("storage", callback)
  window.addEventListener(PREFERENCES_EVENT, callback)
  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener(PREFERENCES_EVENT, callback)
  }
}

function readColor(): string {
  return localStorage.getItem("app_accent_color") || "#008bcd"
}
function readAnimations(): string {
  return localStorage.getItem("app_animations") || "true"
}
function readDensity(): string {
  return localStorage.getItem("app_table_density") || "comfortable"
}
function storePreference(key: string, value: string): void {
  localStorage.setItem(key, value)
  window.dispatchEvent(new Event(PREFERENCES_EVENT))
}
function applyDomSettings(color: string, animations: boolean, density: TableDensity): void {
  const root = document.documentElement
  root.style.setProperty("--primary", color)
  root.style.setProperty("--ring", color)
  root.classList.toggle("disable-animations", !animations)
  root.setAttribute("data-table-density", density)
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const currentUser = session?.user as UserWithCalendarColor | undefined
  const userColor = currentUser?.calendarColor || null
  const storedColor = useSyncExternalStore(subscribePreferences, readColor, () => "#008bcd")
  const storedAnimations = useSyncExternalStore(subscribePreferences, readAnimations, () => "true")
  const storedDensity = useSyncExternalStore(subscribePreferences, readDensity, () => "comfortable")
  const [selectedColor, setSelectedColorState] = useState<string | null>(null)
  const accentColor = selectedColor || userColor || storedColor
  const animationsEnabled = storedAnimations !== "false"
  const tableDensity: TableDensity = storedDensity === "compact" ? "compact" : "comfortable"

  useEffect(() => {
    applyDomSettings(accentColor, animationsEnabled, tableDensity)
  }, [accentColor, animationsEnabled, tableDensity])

  const setAccentColor = (color: string) => {
    setSelectedColorState(color)
    storePreference("app_accent_color", color)
  }
  const setAnimationsEnabled = (enabled: boolean) => {
    storePreference("app_animations", String(enabled))
  }
  const setTableDensity = (density: TableDensity) => {
    storePreference("app_table_density", density)
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
