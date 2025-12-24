"use client"

import { useState, useEffect, createContext, useContext } from "react"
import AdminHeader from "@/components/admin/header"
import AdminSidebar from "@/components/admin/sidebar"
import AnalyticsView from "@/components/admin/analytics-view"
import SalesReportView from "@/components/admin/sales-report-view"
import ProductManagementView from "@/components/admin/product-management-view"
import EmployeeManagementView from "@/components/admin/employee-management-view"

type ViewType = "analytics" | "laporan" | "produk" | "karyawan"
type Theme = "dark" | "light"

interface Notification {
  id: string
  type: "laporan" | "info" | "warning"
  nama: string
  message: string
  tanggal: string
  isRead: boolean
}

// Theme Context
const ThemeContext = createContext<{
  theme: Theme
  toggleTheme: () => void
}>({
  theme: "dark",
  toggleTheme: () => {}
})

export const useTheme = () => useContext(ThemeContext)

export default function AdminDashboard() {
  const [currentView, setCurrentView] = useState<ViewType>("analytics")
  const [theme, setTheme] = useState<Theme>("dark")
  const [notifications] = useState<Notification[]>([
    {
      id: "1",
      type: "laporan",
      nama: "Asep Surasep",
      message: "Membuat laporan penjualan untuk tanggal 22 Desember 2025",
      tanggal: "2025-12-22T10:30:00",
      isRead: false
    },
    {
      id: "2",
      type: "laporan",
      nama: "Budi Santoso",
      message: "Membuat laporan penjualan untuk tanggal 21 Desember 2025",
      tanggal: "2025-12-21T15:45:00",
      isRead: false
    },
    {
      id: "3",
      type: "laporan",
      nama: "Siti Nurhaliza",
      message: "Membuat laporan penjualan untuk tanggal 20 Desember 2025",
      tanggal: "2025-12-20T09:15:00",
      isRead: true
    }
  ])

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("admin-theme") as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem("admin-theme", theme)
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark")
  }

  const handleLogoClick = () => {
    if (currentView !== "analytics") {
      setCurrentView("analytics")
    } else {
      window.location.reload()
    }
  }

  const handleNotificationClick = () => {
    setCurrentView("laporan")
  }

  const notificationCount = notifications.filter(n => !n.isRead).length

  // Theme classes
  const bgClass = theme === "dark" 
    ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
    : "bg-gradient-to-br from-slate-50 via-white to-slate-100"

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={`flex h-screen ${bgClass} overflow-hidden transition-colors duration-300`}>
        {/* Sidebar */}
        <AdminSidebar 
          currentView={currentView} 
          onViewChange={setCurrentView}
          theme={theme}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Header with Theme Toggle */}
          <AdminHeader 
            onLogoClick={handleLogoClick}
            onNotificationClick={handleNotificationClick}
            notificationCount={notificationCount}
            notifications={notifications}
            theme={theme}
            onThemeToggle={toggleTheme}
          />

          {/* Main Content - Pass theme to all views */}
          <main className={`flex-1 overflow-auto ${bgClass} p-4 sm:p-5 lg:p-6 transition-colors duration-300`}>
            {currentView === "analytics" && <AnalyticsView theme={theme} />}
            {currentView === "laporan" && <SalesReportView theme={theme} />}
            {currentView === "produk" && <ProductManagementView theme={theme} />}
            {currentView === "karyawan" && <EmployeeManagementView theme={theme} />}
          </main>
        </div>
      </div>
    </ThemeContext.Provider>
  )
}