"use client"

import { useState, useEffect } from "react"
import { BarChart3, FileText, Package, Users, Menu, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AdminSidebarProps {
  currentView: string
  onViewChange: (view: "analytics" | "laporan" | "produk" | "karyawan") => void
  theme?: 'dark' | 'light'
}

export default function AdminSidebar({ currentView, onViewChange, theme = 'dark' }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const isDark = theme === 'dark'

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true)
      } else {
        setIsCollapsed(false)
        setIsMobileOpen(false)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const menuItems = [
    { 
      id: "analytics", 
      label: "Analytics", 
      icon: BarChart3,
      description: "Dashboard & Statistik",
      color: "from-blue-500 to-cyan-500"
    },
    { 
      id: "laporan", 
      label: "Laporan Penjualan", 
      icon: FileText,
      description: "Riwayat & Transaksi",
      color: "from-emerald-500 to-teal-500"
    },
    { 
      id: "produk", 
      label: "Manajemen Produk", 
      icon: Package,
      description: "Kelola Produk",
      color: "from-purple-500 to-pink-500"
    },
    { 
      id: "karyawan", 
      label: "Manajemen Karyawan", 
      icon: Users,
      description: "Kelola Tim",
      color: "from-orange-500 to-red-500"
    },
  ]

  const handleMenuClick = (view: "analytics" | "laporan" | "produk" | "karyawan") => {
    onViewChange(view)
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false)
    }
  }

  // Theme-based classes
  const bgClass = isDark 
    ? 'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900'
    : 'bg-gradient-to-b from-white via-slate-50 to-slate-100'
  
  const borderClass = isDark ? 'border-slate-700/50' : 'border-slate-200'
  const textClass = isDark ? 'text-white' : 'text-slate-900'
  const textSecondaryClass = isDark ? 'text-slate-400' : 'text-slate-600'
  const hoverBgClass = isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-100'
  const cardBgClass = isDark ? 'bg-slate-800' : 'bg-white'

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className={`
          fixed top-4 left-4 z-50 lg:hidden 
          bg-gradient-to-br from-blue-600 to-blue-700 
          text-white shadow-lg hover:shadow-xl
          transition-all duration-300 hover:scale-110
          ${isMobileOpen ? 'rotate-90' : 'rotate-0'}
        `}
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden transition-all duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 h-screen
          ${bgClass}
          transition-all duration-300 ease-in-out
          z-40 shadow-2xl
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${isCollapsed && !isMobileOpen ? "lg:w-20" : "w-72"}
        `}
      >
        {/* Header with logo */}
        <div className={`p-4 border-b ${borderClass} flex items-center justify-between`}>
          <div className={`flex items-center gap-3 transition-all duration-300 ${isCollapsed && !isMobileOpen ? "opacity-0 w-0" : "opacity-100"}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <h2 className={`${textClass} font-bold text-sm`}>Admin Panel</h2>
              <p className={`${textSecondaryClass} text-xs`}>Dashboard</p>
            </div>
          </div>
          
          {/* Toggle Button - Desktop only */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:flex ${hoverBgClass} ${textSecondaryClass} hover:${textClass} transition-colors`}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {/* Menu Items */}
        <div className="p-3 space-y-2 mt-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id
            const isHovered = hoveredItem === item.id
            
            return (
              <div key={item.id} className="relative group">
                <Button
                  onClick={() => handleMenuClick(item.id as "analytics" | "laporan" | "produk" | "karyawan")}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`
                    w-full gap-3 h-auto py-3.5 px-4
                    transition-all duration-300
                    ${isCollapsed && !isMobileOpen ? "justify-center px-0" : "justify-start"}
                    ${isActive 
                      ? `bg-gradient-to-r ${item.color} text-white shadow-lg scale-[1.02]` 
                      : `bg-transparent ${textSecondaryClass} ${hoverBgClass} hover:${textClass}`
                    }
                    ${isHovered && !isActive ? "translate-x-1" : ""}
                    rounded-xl relative overflow-hidden
                  `}
                >
                  {/* Glow effect for active item */}
                  {isActive && (
                    <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-20 blur-xl`} />
                  )}
                  
                  {/* Icon with animation */}
                  <div className={`relative z-10 transition-transform duration-300 ${isHovered ? "scale-110 rotate-6" : ""}`}>
                    <Icon className="w-5 h-5 flex-shrink-0" />
                  </div>
                  
                  {/* Text content */}
                  <div className={`
                    flex flex-col items-start relative z-10
                    ${isCollapsed && !isMobileOpen ? "hidden" : "block"}
                  `}>
                    <span className="text-sm font-semibold truncate">
                      {item.label}
                    </span>
                    <span className={`text-xs opacity-80 truncate ${isActive ? "text-white" : textSecondaryClass}`}>
                      {item.description}
                    </span>
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-l-full" />
                  )}
                </Button>

                {/* Tooltip for collapsed state */}
                {isCollapsed && !isMobileOpen && (
                  <div className={`
                    absolute left-full ml-2 px-3 py-2 
                    ${cardBgClass} ${textClass} text-sm rounded-lg
                    shadow-xl z-50 whitespace-nowrap border ${borderClass}
                    transition-all duration-200
                    ${isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none"}
                  `}>
                    <div className="font-semibold">{item.label}</div>
                    <div className={`text-xs ${textSecondaryClass}`}>{item.description}</div>
                    {/* Arrow */}
                    <div className={`absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent ${
                      isDark ? 'border-r-slate-800' : 'border-r-white'
                    }`} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 border-t ${borderClass}`}>
          <div className={`
            transition-all duration-300
            ${isCollapsed && !isMobileOpen ? "opacity-0" : "opacity-100"}
          `}>
            <div className={`flex items-center gap-2 ${textSecondaryClass} text-xs`}>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>System Active</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}