"use client"

import { useRouter } from "next/navigation"
import { Bell, LogOut, Settings, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function AdminHeader() {
  const router = useRouter()

  const handleLogout = () => {
    // 🔹 Hapus semua data autentikasi agar sesuai dengan AuthContext
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    localStorage.removeItem("role")
    localStorage.clear()

    // 🔹 Redirect ke halaman login
    window.location.href = "/"
  }

  const handleProfileClick = () => {
    console.log("Navigating to admin profile page...")
    // router.push("/admin/profile")
  }

  const handleSettingsClick = () => {
    console.log("Navigating to admin settings page...")
    // router.push("/admin/settings")
  }

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img 
            src="/images/porto.png" 
            alt="Logo" 
            className="h-10 w-auto object-contain"
          />
          <span className="font-semibold text-slate-900">Admin Dashboard</span>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Notification */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </Button>

          {/* Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  A
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSettingsClick} className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Pengaturan
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}