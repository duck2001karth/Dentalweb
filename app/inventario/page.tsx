"use client"

import React from "react"
import { AppLayout } from "@/components/layouts/app-layout"
import { InventoryTab } from "@/components/clinic-management/inventory/inventory-tab"

export default function InventarioPage() {
  return (
    <AppLayout>
      <div className="w-full px-4 md:px-6 py-6 lg:py-8 animate-in fade-in duration-500 flex flex-col min-h-[calc(100vh-6rem)]">
        <InventoryTab />
      </div>
    </AppLayout>
  )
}