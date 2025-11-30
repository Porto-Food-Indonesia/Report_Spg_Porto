"use client"

import { FileText, BarChart3, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SPGSidebarProps {
  currentView: string
  onViewChange: (view: "laporan" | "riwayat" | "notifikasi") => void
  isOpen: boolean
  onClose: () => void
}

export default function SPGSidebar({ currentView, onViewChange, isOpen, onClose }: SPGSidebarProps) {
  const menuItems = [
    { id: "laporan", label: "Input Laporan", icon: FileText },
    { id: "riwayat", label: "Riwayat Penjualan", icon: BarChart3 },
    { id: "notifikasi", label: "Notifikasi", icon: Bell },
  ]

  return (
    <>
      {/* Overlay saat sidebar terbuka di mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 h-full w-64 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 ease-in-out 
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="p-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                onClick={() => onViewChange(item.id as "laporan" | "riwayat" | "notifikasi")}
                variant={currentView === item.id ? "default" : "ghost"}
                className="w-full justify-start gap-2"
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Button>
            )
          })}
        </div>
      </aside>
    </>
  )
}
