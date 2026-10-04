"use client"

import React, { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { useTranslations } from "next-intl"
import {
  Home,
  ChevronDown,
  ChevronUp,
  Settings,
  User,
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
  const { theme, resolvedTheme } = useTheme()
  const isDark = (resolvedTheme || theme) === "dark"
  const t = useTranslations("Settings")

  const isGeneralActive = ["language", "appearance", "shortcuts"].includes(activeSubTab)
  const isAccountActive = ["profile", "clinical", "signature", "security"].includes(activeSubTab)

  const [openSection, setOpenSection] = useState<string | null>(
    isAccountActive ? "account" : isGeneralActive ? "general" : null
  )

  useEffect(() => {
    if (isGeneralActive) {
      setOpenSection("general")
    } else if (isAccountActive) {
      setOpenSection("account")
    } else if (activeSubTab === "home") {
      setOpenSection(null)
    }
  }, [activeSubTab, isGeneralActive, isAccountActive])

  const handleToggle = (key: string) => {
    setOpenSection((prev) => (prev === key ? null : key))
  }

  const activeColor = currentColor || "#008bcd"

  return (
    <aside
      className={`w-64 border-r flex flex-col shrink-0 font-sans select-none transition-colors ${
        isDark
          ? "bg-[#070d18] border-[#1e293b] text-slate-200"
          : "bg-slate-50 border-slate-200 text-slate-800"
      }`}
    >
      <div className="p-6 pb-4">
        <h2 className={`text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
          {t("title")}
        </h2>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-1.5 custom-scrollbar pb-6">
        
        {/* INICIO */}
        <button
          type="button"
          onClick={() => {
            setActiveSubTab("home")
            setOpenSection(null)
          }}
          style={
            activeSubTab === "home"
              ? {
                  background: `linear-gradient(90deg, ${activeColor}22 0%, ${activeColor}08 100%)`,
                  color: activeColor,
                }
              : undefined
          }
          className={cn(
            "relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer overflow-hidden border-0 outline-none",
            activeSubTab !== "home" &&
              (isDark
                ? "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900")
          )}
        >
          {activeSubTab === "home" && (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full"
              style={{ backgroundColor: activeColor }}
            />
          )}
          <div className="flex items-center gap-2.5 pl-0.5">
            <Home
              className="w-4 h-4 transition-colors"
              style={{ color: activeSubTab === "home" ? activeColor : undefined }}
            />
            <span style={{ color: activeSubTab === "home" ? activeColor : undefined }}>
              {t("home")}
            </span>
          </div>
        </button>

        {/* 1. GENERAL */}
        <div>
          <button
            type="button"
            onClick={() => handleToggle("general")}
            style={
              isGeneralActive
                ? {
                    background: `linear-gradient(90deg, ${activeColor}22 0%, ${activeColor}08 100%)`,
                    color: activeColor,
                  }
                : undefined
            }
            className={cn(
              "relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer overflow-hidden",
              !isGeneralActive &&
                (isDark
                  ? "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                  : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900")
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
                style={{ color: isGeneralActive ? activeColor : undefined }}
              />
              <span style={{ color: isGeneralActive ? activeColor : undefined }}>
                {t("general")}
              </span>
            </div>
            {openSection === "general" ? (
              <ChevronUp
                className="w-3.5 h-3.5"
                style={{ color: isGeneralActive ? activeColor : undefined }}
              />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {openSection === "general" && (
            <div className="mt-1 space-y-0.5 pl-9 animate-in fade-in slide-in-from-top-1 duration-150">
              <button
                type="button"
                onClick={() => {
                  setActiveSubTab("language")
                  setOpenSection("general")
                }}
                style={{ color: activeSubTab === "language" ? activeColor : undefined }}
                className={cn(
                  "w-full text-left py-2 text-xs transition-colors cursor-pointer block",
                  activeSubTab === "language"
                    ? "font-black"
                    : isDark
                    ? "font-semibold text-slate-400 hover:text-white"
                    : "font-semibold text-slate-500 hover:text-slate-900"
                )}
              >
                {t("language")}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveSubTab("appearance")
                  setOpenSection("general")
                }}
                style={{ color: activeSubTab === "appearance" ? activeColor : undefined }}
                className={cn(
                  "w-full text-left py-2 text-xs transition-colors cursor-pointer block",
                  activeSubTab === "appearance"
                    ? "font-black"
                    : isDark
                    ? "font-semibold text-slate-400 hover:text-white"
                    : "font-semibold text-slate-500 hover:text-slate-900"
                )}
              >
                {t("appearance")}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveSubTab("shortcuts")
                  setOpenSection("general")
                }}
                style={{ color: activeSubTab === "shortcuts" ? activeColor : undefined }}
                className={cn(
                  "w-full text-left py-2 text-xs transition-colors cursor-pointer block",
                  activeSubTab === "shortcuts"
                    ? "font-black"
                    : isDark
                    ? "font-semibold text-slate-400 hover:text-white"
                    : "font-semibold text-slate-500 hover:text-slate-900"
                )}
              >
                {t("shortcuts")}
              </button>
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
                    background: `linear-gradient(90deg, ${activeColor}22 0%, ${activeColor}08 100%)`,
                    color: activeColor,
                  }
                : undefined
            }
            className={cn(
              "relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer overflow-hidden",
              !isAccountActive &&
                (isDark
                  ? "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                  : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900")
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
                style={{ color: isAccountActive ? activeColor : undefined }}
              />
              <span style={{ color: isAccountActive ? activeColor : undefined }}>
                {t("account")}
              </span>
            </div>
            {openSection === "account" ? (
              <ChevronUp
                className="w-3.5 h-3.5"
                style={{ color: isAccountActive ? activeColor : undefined }}
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
                  activeSubTab === "profile"
                    ? "font-black"
                    : isDark
                    ? "font-semibold text-slate-400 hover:text-white"
                    : "font-semibold text-slate-500 hover:text-slate-900"
                )}
              >
                {t("personalInfo")}
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
                      activeSubTab === "clinical"
                        ? "font-black"
                        : isDark
                        ? "font-semibold text-slate-400 hover:text-white"
                        : "font-semibold text-slate-500 hover:text-slate-900"
                    )}
                  >
                    <Stethoscope className="w-3.5 h-3.5" /> {t("clinicalProfile")}
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
                      activeSubTab === "signature"
                        ? "font-black"
                        : isDark
                        ? "font-semibold text-slate-400 hover:text-white"
                        : "font-semibold text-slate-500 hover:text-slate-900"
                    )}
                  >
                    <FileSignature className="w-3.5 h-3.5" /> {t("signature")}
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
                  activeSubTab === "security"
                    ? "font-black"
                    : isDark
                    ? "font-semibold text-slate-400 hover:text-white"
                    : "font-semibold text-slate-500 hover:text-slate-900"
                )}
              >
                {t("security")}
              </button>
            </div>
          )}
        </div>

        {/* 3. PRIVACIDAD */}
        <button
          type="button"
          onClick={() => {
            setActiveSubTab("privacy")
            setOpenSection(null)
          }}
          style={
            activeSubTab === "privacy"
              ? {
                  background: `linear-gradient(90deg, ${activeColor}22 0%, ${activeColor}08 100%)`,
                  color: activeColor,
                }
              : undefined
          }
          className={cn(
            "relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer overflow-hidden",
            activeSubTab !== "privacy" &&
              (isDark
                ? "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900")
          )}
        >
          {activeSubTab === "privacy" && (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full"
              style={{ backgroundColor: activeColor }}
            />
          )}
          <div className="flex items-center gap-2.5 pl-0.5">
            <Shield className="w-4 h-4" style={{ color: activeSubTab === "privacy" ? activeColor : undefined }} />
            <span>{t("privacy")}</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* 4. NOTIFICACIONES */}
        <button
          type="button"
          onClick={() => {
            setActiveSubTab("notifications")
            setOpenSection(null)
          }}
          style={
            activeSubTab === "notifications"
              ? {
                  background: `linear-gradient(90deg, ${activeColor}22 0%, ${activeColor}08 100%)`,
                  color: activeColor,
                }
              : undefined
          }
          className={cn(
            "relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer overflow-hidden",
            activeSubTab !== "notifications" &&
              (isDark
                ? "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900")
          )}
        >
          {activeSubTab === "notifications" && (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full"
              style={{ backgroundColor: activeColor }}
            />
          )}
          <div className="flex items-center gap-2.5 pl-0.5">
            <Bell className="w-4 h-4" style={{ color: activeSubTab === "notifications" ? activeColor : undefined }} />
            <span>{t("notifications")}</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* 5. ACCESIBILIDAD */}
        <button
          type="button"
          onClick={() => {
            setActiveSubTab("accessibility")
            setOpenSection(null)
          }}
          style={
            activeSubTab === "accessibility"
              ? {
                  background: `linear-gradient(90deg, ${activeColor}22 0%, ${activeColor}08 100%)`,
                  color: activeColor,
                }
              : undefined
          }
          className={cn(
            "relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer overflow-hidden",
            activeSubTab !== "accessibility" &&
              (isDark
                ? "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900")
          )}
        >
          {activeSubTab === "accessibility" && (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full"
              style={{ backgroundColor: activeColor }}
            />
          )}
          <div className="flex items-center gap-2.5 pl-0.5">
            <Accessibility className="w-4 h-4" style={{ color: activeSubTab === "accessibility" ? activeColor : undefined }} />
            <span>{t("accessibility")}</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

      </nav>
    </aside>
  )
}