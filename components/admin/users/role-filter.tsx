"use client"

import React from "react"

interface RoleFilterChipsProps {
  selectedRole: string
  onSelectRole: (role: string) => void
  counts: Record<string, number>
}

export function RoleFilterChips({ selectedRole, onSelectRole, counts }: RoleFilterChipsProps) {
  const roles = [
    { id: "ALL", label: "Todos" },
    { id: "ADMIN", label: "Administradores" },
    { id: "DOCTOR", label: "Doctores" },
    { id: "RECEPTIONIST", label: "Recepción" }
  ]

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {roles.map((role) => {
        const isSelected = selectedRole === role.id
        const count = counts[role.id] || 0

        return (
          <button
            key={role.id}
            type="button"
            onClick={() => onSelectRole(role.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              isSelected
                ? "bg-[#008bcd] text-white shadow-md shadow-[#008bcd]/20"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <span>{role.label}</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}