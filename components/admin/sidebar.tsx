"use client"

import { BarChart3, FileText, Package, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AdminSidebarProps {
  currentView: string
  onViewChange: (view: "analytics" | "laporan" | "produk" | "karyawan") => void
}

export default function AdminSidebar({ currentView, onViewChange }: AdminSidebarProps) {
  const menuItems = [
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "laporan", label: "Laporan Penjualan", icon: FileText },
    { id: "produk", label: "Manajemen Produk", icon: Package },
    { id: "karyawan", label: "Manajemen Karyawan", icon: Users },
  ]

  return (
    <aside className="w-64 border-r border-slate-200 bg-white">
      <div className="p-6 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              onClick={() => onViewChange(item.id as "analytics" | "laporan" | "produk" | "karyawan")}
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
  )
}
