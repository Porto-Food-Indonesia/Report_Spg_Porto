"use client"

import { useState, useEffect, createContext, useContext } from "react"
import SPGHeader from "@/components/spg/header"
import SPGSidebar from "@/components/spg/sidebar"
import SalesReportForm from "@/components/spg/sales-report-form"
import SalesHistory from "@/components/spg/sales-history"
import PerformanceAlert from "@/components/spg/performance-alert"

type ViewType = "laporan" | "riwayat" | "notifikasi"
type Theme = "dark" | "light"

// Theme Context
const ThemeContext = createContext<{
  theme: Theme
  toggleTheme: () => void
}>({
  theme: "dark",
  toggleTheme: () => {}
})

export const useTheme = () => useContext(ThemeContext)

export default function SPGDashboard() {
  const [currentView, setCurrentView] = useState<ViewType>("laporan")
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState<Theme>("dark")

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("spg-theme") as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  // Save theme to localStorage and apply to document
  useEffect(() => {
    localStorage.setItem("spg-theme", theme)
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark")
  }

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view)
    setSidebarOpen(false) // Tutup sidebar setelah klik menu
  }

  const handleLogoClick = () => {
    if (currentView !== "laporan") {
      setCurrentView("laporan")
    } else {
      window.location.reload()
    }
  }

  // Theme classes
  const bgClass = theme === "dark" 
    ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
    : "bg-gradient-to-br from-slate-50 via-white to-slate-100"

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={`flex h-screen ${bgClass} overflow-hidden transition-colors duration-300`}>
        {/* Sidebar */}
        <SPGSidebar
          currentView={currentView}
          onViewChange={handleViewChange}
          isOpen={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
          theme={theme}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Header with Theme Toggle */}
          <SPGHeader
            onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
            isSidebarOpen={isSidebarOpen}
            onLogoClick={handleLogoClick}
            theme={theme}
            onThemeToggle={toggleTheme}
          />

          {/* Main Content - Pass theme to all views */}
          <main className={`flex-1 overflow-auto ${bgClass} p-4 sm:p-5 lg:p-6 transition-colors duration-300`}>
            {currentView === "laporan" && <SalesReportForm theme={theme} />}
            {currentView === "riwayat" && <SalesHistory theme={theme} />}
            {currentView === "notifikasi" && <PerformanceAlert theme={theme} />}
          </main>
        </div>
      </div>
    </ThemeContext.Provider>
  )
}