"use client"

import { useState } from "react"
import SPGHeader from "@/components/spg/header"
import SPGSidebar from "@/components/spg/sidebar"
import SalesReportForm from "@/components/spg/sales-report-form"
import SalesHistory from "@/components/spg/sales-history"
import PerformanceAlert from "@/components/spg/performance-alert"

type ViewType = "laporan" | "riwayat" | "notifikasi"

export default function SPGDashboard() {
  const [currentView, setCurrentView] = useState<ViewType>("laporan")
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view)
    setSidebarOpen(false) // Tutup sidebar setelah klik menu
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SPGSidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <SPGHeader
          onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />

        <main className="flex-1 p-6">
          {currentView === "laporan" && <SalesReportForm />}
          {currentView === "riwayat" && <SalesHistory />}
          {currentView === "notifikasi" && <PerformanceAlert />}
        </main>
      </div>
    </div>
  )
}
