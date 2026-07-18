import "@/styles/globals.css";
import { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { GeistSans } from "geist/font/sans";

import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site"; 

import ClientProvider from "@/components/user-login/client-provider";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/toaster";

import { NextAuthProvider } from "@/components/providers/session-provider";

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

export const viewport = {
  initialScale: 1,
  width: "device-width",
  height: "device-height",
  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: "white",
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: "black",
    },
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
          "min-h-screen bg-background antialiased font-sans",
          GeistSans.className
        )}
      >
        <NextAuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
          >
            <ClientProvider>
              <div className="relative flex min-h-screen flex-col">
                <div className="flex-1">
                  {children}
                </div>
                <div className="print:hidden">
                  <Toaster />
                </div>
              </div>
              <TailwindIndicator />
            </ClientProvider>
          </ThemeProvider>
        </NextAuthProvider>
        <Analytics />
      </body>
    </html>
  );
}