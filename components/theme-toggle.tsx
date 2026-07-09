"use client"

import * as React from "react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="relative h-12 w-12">
      <Icons.sun className="!h-7 !w-7 rotate-0 scale-0 transition-all dark:-rotate-90 dark:scale-100" />
      <Icons.moon className="!h-7 !w-7 absolute rotate-90 scale-100 transition-all dark:rotate-0 dark:scale-0" />
      <span className="sr-only">Tema</span>
    </Button>
  )
}