"use client"

import React, { useState, useEffect } from "react"
import {
  ChevronDown,
  ChevronUp,
  Settings,
  User,
  CreditCard,
  Shield,
  Bell,
  Accessibility,
  Stethoscope,
  FileSignature,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SettingsSidebarProps {
  activeSubTab: string
  setActiveSubTab: (id: string) => void
  isDoctor: boolean
  currentColor?: string
}

export function SettingsSidebar({
  activeSubTab,
  setActiveSubTab,
  isDoctor,
  currentColor = "#008bcd",
}: SettingsSidebarProps) {
  const isGeneralActive = ["language", "appearance", "datetime", "shortcuts"].includes(activeSubTab)
  const isAccountActive = ["profile", "clinical", "signature", "security"].includes(activeSubTab)
  const [openSection, setOpenSection] = useState<string | null>(
    isAccountActive ? "account" : "general"
  )
  useEffect(() => {
    if (isGeneralActive) {
      setOpenSection("general")
    } else if (isAccountActive) {
      setOpenSection("account")
    } else {
      setOpenSection(null)
    }
  }, [activeSubTab, isGeneralActive, isAccountActive])
  const handleToggle = (key: string) => {
    setOpenSection((prev) => (prev === key ? null : key))
  }

  const activeColor = currentColor || "#008bcd"

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col shrink-0 font-sans select-none text-slate-800">
      <div className="p-6 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Ajustes</h2>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-1.5 custom-scrollbar pb-6">
        {/* 1. GENERAL */}
        <div>
          <button
            type="button"
            onClick={() => handleToggle("general")}
            style={
              isGeneralActive
                ? {
                    background: `linear-gradient(90deg, ${activeColor}1A 0%, ${activeColor}08 100%)`,
                    color: activeColor,
                  }
                : undefined
            }
            className={cn(
              "relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer overflow-hidden",
              !isGeneralActive && "text-slate-700 hover:bg-slate-50"
            )}
          >
            {isGeneralActive && (
              <span
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full"
                style={{ backgroundColor: activeColor }}
              />
            )}

            <div className="flex items-center gap-2.5 pl-0.5">
              <Settings
                className="w-4 h-4 transition-colors"
                style={{ color: isGeneralActive ? activeColor : "#64748b" }}
              />
              <span style={{ color: isGeneralActive ? activeColor : undefined }}>General</span>
            </div>
            {openSection === "general" ? (
              <ChevronUp
                className="w-3.5 h-3.5"
                style={{ color: isGeneralActive ? activeColor : "#94a3b8" }}
              />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {openSection === "general" && (
            <div className="mt-1 space-y-0.5 pl-9 animate-in fade-in slide-in-from-top-1 duration-150">
              {[
                { id: "language", label: "Idioma y Región" },
                { id: "appearance", label: "Apariencia" },
                { id: "datetime", label: "Fecha y Hora" },
                { id: "shortcuts", label: "Atajos de Teclado" },
              ].map((sub) => {
                const isActive = activeSubTab === sub.id
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      setActiveSubTab(sub.id)
                      setOpenSection("general")
                    }}
                    style={{ color: isActive ? activeColor : undefined }}
                    className={cn(
                      "w-full text-left py-2 text-xs transition-colors cursor-pointer block",
                      isActive ? "font-black" : "font-semibold text-slate-500 hover:text-slate-900"
                    )}
                  >
                    {sub.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* 2. CUENTA */}
        <div>
          <button
            type="button"
            onClick={() => handleToggle("account")}
            style={
              isAccountActive
                ? {
                    background: `linear-gradient(90deg, ${activeColor}1A 0%, ${activeColor}08 100%)`,
                    color: activeColor,
                  }
                : undefined
            }
            className={cn(
              "relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer overflow-hidden",
              !isAccountActive && "text-slate-700 hover:bg-slate-50"
            )}
          >
            {isAccountActive && (
              <span
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full"
                style={{ backgroundColor: activeColor }}
              />
            )}

            <div className="flex items-center gap-2.5 pl-0.5">
              <User
                className="w-4 h-4 transition-colors"
                style={{ color: isAccountActive ? activeColor : "#64748b" }}
              />
              <span style={{ color: isAccountActive ? activeColor : undefined }}>Cuenta</span>
            </div>
            {openSection === "account" ? (
              <ChevronUp
                className="w-3.5 h-3.5"
                style={{ color: isAccountActive ? activeColor : "#94a3b8" }}
              />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {openSection === "account" && (
            <div className="mt-1 space-y-0.5 pl-9 animate-in fade-in slide-in-from-top-1 duration-150">
              <button
                type="button"
                onClick={() => {
                  setActiveSubTab("profile")
                  setOpenSection("account")
                }}
                style={{ color: activeSubTab === "profile" ? activeColor : undefined }}
                className={cn(
                  "w-full text-left py-2 text-xs transition-colors cursor-pointer",
                  activeSubTab === "profile" ? "font-black" : "font-semibold text-slate-500 hover:text-slate-900"
                )}
              >
                Información Personal
              </button>
              {isDoctor && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubTab("clinical")
                      setOpenSection("account")
                    }}
                    style={{ color: activeSubTab === "clinical" ? activeColor : undefined }}
                    className={cn(
                      "w-full text-left py-2 text-xs transition-colors cursor-pointer flex items-center gap-1.5",
                      activeSubTab === "clinical" ? "font-black" : "font-semibold text-slate-500 hover:text-slate-900"
                    )}
                  >
                    <Stethoscope className="w-3.5 h-3.5" /> Perfil Clínico
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubTab("signature")
                      setOpenSection("account")
                    }}
                    style={{ color: activeSubTab === "signature" ? activeColor : undefined }}
                    className={cn(
                      "w-full text-left py-2 text-xs transition-colors cursor-pointer flex items-center gap-1.5",
                      activeSubTab === "signature" ? "font-black" : "font-semibold text-slate-500 hover:text-slate-900"
                    )}
                  >
                    <FileSignature className="w-3.5 h-3.5" /> Firma y Sello
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  setActiveSubTab("security")
                  setOpenSection("account")
                }}
                style={{ color: activeSubTab === "security" ? activeColor : undefined }}
                className={cn(
                  "w-full text-left py-2 text-xs transition-colors cursor-pointer",
                  activeSubTab === "security" ? "font-black" : "font-semibold text-slate-500 hover:text-slate-900"
                )}
              >
                Contraseña y Seguridad
              </button>
            </div>
          )}
        </div>

        {/* 3. PLANES */}
        <button
          type="button"
          onClick={() => {
            setActiveSubTab("plans")
            setOpenSection(null)
          }}
          style={
            activeSubTab === "plans"
              ? {
                  background: `linear-gradient(90deg, ${activeColor}1A 0%, ${activeColor}08 100%)`,
                  color: activeColor,
                }
              : undefined
          }
          className={cn(
            "relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer overflow-hidden",
            activeSubTab !== "plans" && "text-slate-700 hover:bg-slate-50"
          )}
        >
          {activeSubTab === "plans" && (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full"
              style={{ backgroundColor: activeColor }}
            />
          )}
          <div className="flex items-center gap-2.5 pl-0.5">
            <CreditCard className="w-4 h-4" style={{ color: activeSubTab === "plans" ? activeColor : "#64748b" }} />
            <span>Planes y mejoras</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* 4. PRIVACIDAD */}
        <button
          type="button"
          onClick={() => {
            setActiveSubTab("privacy")
            setOpenSection(null)
          }}
          style={
            activeSubTab === "privacy"
              ? {
                  background: `linear-gradient(90deg, ${activeColor}1A 0%, ${activeColor}08 100%)`,
                  color: activeColor,
                }
              : undefined
          }
          className={cn(
            "relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer overflow-hidden",
            activeSubTab !== "privacy" && "text-slate-700 hover:bg-slate-50"
          )}
        >
          {activeSubTab === "privacy" && (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full"
              style={{ backgroundColor: activeColor }}
            />
          )}
          <div className="flex items-center gap-2.5 pl-0.5">
            <Shield className="w-4 h-4" style={{ color: activeSubTab === "privacy" ? activeColor : "#64748b" }} />
            <span>Privacidad</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* 5. NOTIFICACIONES */}
        <button
          type="button"
          onClick={() => {
            setActiveSubTab("notifications")
            setOpenSection(null)
          }}
          style={
            activeSubTab === "notifications"
              ? {
                  background: `linear-gradient(90deg, ${activeColor}1A 0%, ${activeColor}08 100%)`,
                  color: activeColor,
                }
              : undefined
          }
          className={cn(
            "relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer overflow-hidden",
            activeSubTab !== "notifications" && "text-slate-700 hover:bg-slate-50"
          )}
        >
          {activeSubTab === "notifications" && (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full"
              style={{ backgroundColor: activeColor }}
            />
          )}
          <div className="flex items-center gap-2.5 pl-0.5">
            <Bell className="w-4 h-4" style={{ color: activeSubTab === "notifications" ? activeColor : "#64748b" }} />
            <span>Notificación</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* 6. ACCESIBILIDAD */}
        <button
          type="button"
          onClick={() => {
            setActiveSubTab("accessibility")
            setOpenSection(null)
          }}
          style={
            activeSubTab === "accessibility"
              ? {
                  background: `linear-gradient(90deg, ${activeColor}1A 0%, ${activeColor}08 100%)`,
                  color: activeColor,
                }
              : undefined
          }
          className={cn(
            "relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer overflow-hidden",
            activeSubTab !== "accessibility" && "text-slate-700 hover:bg-slate-50"
          )}
        >
          {activeSubTab === "accessibility" && (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full"
              style={{ backgroundColor: activeColor }}
            />
          )}
          <div className="flex items-center gap-2.5 pl-0.5">
            <Accessibility className="w-4 h-4" style={{ color: activeSubTab === "accessibility" ? activeColor : "#64748b" }} />
            <span>Accesibilidad</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </nav>
    </aside>
  )
}