"use client"

import { FileText, BarChart3, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SPGSidebarProps {
  currentView: string
  onViewChange: (view: "laporan" | "riwayat" | "notifikasi") => void
  isOpen: boolean
  onClose: () => void
  theme: "dark" | "light"
}

export default function SPGSidebar({ 
  currentView, 
  onViewChange, 
  isOpen, 
  onClose,
  theme 
}: SPGSidebarProps) {
  const isDark = theme === 'dark'

  const menuItems = [
    { 
      id: "laporan", 
      label: "Input Laporan", 
      icon: FileText,
      description: "Buat laporan penjualan baru"
    },
    { 
      id: "riwayat", 
      label: "Riwayat Penjualan", 
      icon: BarChart3,
      description: "Lihat laporan sebelumnya"
    },
    { 
      id: "notifikasi", 
      label: "Notifikasi", 
      icon: Bell,
      description: "Peringatan & pengingat"
    },
  ]

  // Theme-based classes
  const sidebarBg = isDark 
    ? "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" 
    : "bg-white"
  
  const borderClass = isDark ? "border-slate-700/50" : "border-slate-200"
  const textClass = isDark ? "text-slate-100" : "text-slate-900"
  const textSecondaryClass = isDark ? "text-slate-400" : "text-slate-600"
  const overlayClass = isDark ? "bg-black/60" : "bg-black/40"

  return (
    <>
      {/* Overlay saat sidebar terbuka di mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className={`fixed inset-0 ${overlayClass} z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300`}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static top-0 left-0 h-full w-64 xl:w-72
          ${sidebarBg} border-r ${borderClass}
          z-50 transform transition-all duration-300 ease-in-out
          shadow-2xl lg:shadow-none
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Header Sidebar - Hidden on desktop karena sudah ada di main header */}
        <div className={`lg:hidden p-4 border-b ${borderClass}`}>
          <h2 className={`text-lg font-bold ${textClass}`}>Menu</h2>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id as "laporan" | "riwayat" | "notifikasi")}
                className={`
                  group relative w-full text-left
                  px-4 py-3.5 rounded-xl
                  transition-all duration-300
                  ${isActive 
                    ? isDark
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20"
                      : "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/30"
                    : isDark
                      ? `${textSecondaryClass} hover:bg-slate-700/50 hover:${textClass}`
                      : `${textSecondaryClass} hover:bg-slate-100 hover:${textClass}`
                  }
                  ${!isActive && "hover:scale-[1.02] hover:shadow-md"}
                `}
              >
                {/* Glow effect untuk active state */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
                )}
                
                <div className="relative flex items-center gap-3">
                  <div className={`
                    flex-shrink-0 p-2 rounded-lg transition-all duration-300
                    ${isActive 
                      ? "bg-white/20" 
                      : isDark 
                        ? "bg-slate-700/50 group-hover:bg-slate-600/50" 
                        : "bg-slate-200/50 group-hover:bg-slate-300/50"
                    }
                  `}>
                    <Icon className={`
                      w-5 h-5 transition-all duration-300
                      ${isActive 
                        ? "text-white" 
                        : isDark 
                          ? "text-slate-400 group-hover:text-slate-200" 
                          : "text-slate-600 group-hover:text-slate-900"
                      }
                      ${!isActive && "group-hover:scale-110"}
                    `} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className={`
                      font-semibold text-sm transition-colors
                      ${isActive 
                        ? "text-white" 
                        : isDark 
                          ? "text-slate-300 group-hover:text-white" 
                          : "text-slate-900 group-hover:text-slate-900"
                      }
                    `}>
                      {item.label}
                    </div>
                    <div className={`
                      text-xs mt-0.5 transition-colors truncate
                      ${isActive 
                        ? "text-white/80" 
                        : isDark 
                          ? "text-slate-500 group-hover:text-slate-400" 
                          : "text-slate-500 group-hover:text-slate-600"
                      }
                    `}>
                      {item.description}
                    </div>
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-white animate-pulse" />
                  )}
                </div>
              </button>
            )
          })}
        </nav>

        {/* Footer Info */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 border-t ${borderClass}`}>
          <div className={`
            p-4 rounded-xl text-center
            ${isDark 
              ? "bg-slate-800/50 border border-slate-700/50" 
              : "bg-slate-50 border border-slate-200"
            }
          `}>
            <p className={`text-xs font-medium ${textClass}`}>SPG Report v1.0</p>
            <p className={`text-[10px] ${textSecondaryClass} mt-1`}>
              © 2025 Porto System
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}