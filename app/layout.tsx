import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { Inter } from "next/font/google";

import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site"; 

import ClientProvider from "@/components/providers/client-provider";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/toaster";
import { NextAuthProvider } from "@/components/providers/session-provider";
import { ClinicSettingsProvider } from "@/config/clinic-settings"; 

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/diente.ico",
  },
};

export const viewport: Viewport = {
  initialScale: 1,
  width: "device-width",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#030712" },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={cn(
          "min-h-screen bg-background text-foreground antialiased font-sans selection:bg-primary/20 selection:text-primary",
          inter.className
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
                <div className="relative flex min-h-screen flex-col bg-background">
                  <div className="flex-1 bg-background">{children}</div>
                  <div className="print:hidden">
                    <Toaster />
                  </div>
                </div>
                <TailwindIndicator />
              </ClinicSettingsProvider>
            </ClientProvider>
          </ThemeProvider>
        </NextAuthProvider>
        <Analytics />
      </body>
    </html>
  );
}