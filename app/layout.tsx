import { KeyboardShortcutsProvider } from "@/components/providers/keyboard-shortcuts-provider"
import "@/styles/globals.css"
import "@/styles/dentalweb-mobile-fix.css"

import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/react"
import { Inter } from "next/font/google"

import { cn } from "@/lib/utils"
import { siteConfig } from "@/config/site"

import ClientProvider from "@/components/providers/client-provider"
import { TailwindIndicator } from "@/components/tailwind-indicator"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/toaster"
import { NextAuthProvider } from "@/components/providers/session-provider"
import { ClinicSettingsProvider } from "@/config/clinic-settings"
import { MobileRouteScope } from "@/components/responsive/mobile-route-scope"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/diente.ico",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: "#f5f7fa",
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: "#0b1220",
    },
  ],
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={cn(
          "min-h-dvh bg-background font-sans text-foreground antialiased",
          "selection:bg-primary/20 selection:text-foreground",
          inter.variable
        )}
      >
        <NextAuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <ClientProvider>
              <ClinicSettingsProvider>
                <KeyboardShortcutsProvider>
                <MobileRouteScope />
                <div className="relative flex min-h-dvh min-w-0 flex-col bg-background">
                  <main className="min-w-0 flex-1">
                    {children}
                  </main>
                  <div className="print:hidden"><Toaster /></div>
                </div>
                <TailwindIndicator />
                </KeyboardShortcutsProvider>
              </ClinicSettingsProvider>
            </ClientProvider>
          </ThemeProvider>
        </NextAuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
