"use client"

import { useState } from "react"
import AdminHeader from "@/components/admin/header"
import AdminSidebar from "@/components/admin/sidebar"
import AnalyticsView from "@/components/admin/analytics-view"
import SalesReportView from "@/components/admin/sales-report-view"
import ProductManagementView from "@/components/admin/product-management-view"
import EmployeeManagementView from "@/components/admin/employee-management-view"

type ViewType = "analytics" | "laporan" | "produk" | "karyawan"

export default function AdminDashboard() {
  const [currentView, setCurrentView] = useState<ViewType>("analytics")

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <AdminSidebar currentView={currentView} onViewChange={setCurrentView} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />

        <main className="flex-1 overflow-auto p-6">
          {currentView === "analytics" && <AnalyticsView />}
          {currentView === "laporan" && <SalesReportView />}
          {currentView === "produk" && <ProductManagementView />}
          {currentView === "karyawan" && <EmployeeManagementView />}
        </main>
      </div>
    </div>
  )
}
