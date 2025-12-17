"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, LogOut, Settings, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserData {
  id: string
  nama: string
  email: string
  role: string
}

export default function AdminHeader() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)

  useEffect(() => {
    // Ambil data user dari localStorage
    const userStr = localStorage.getItem("user")
    if (userStr) {
      try {
        const userData = JSON.parse(userStr)
        setUser(userData)
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = "/"
  }

  const handleProfileClick = () => {
    router.push("/admin/profile")
  }

  const handleSettingsClick = () => {
    router.push("/admin/settings")
  }

  // Ambil nama depan (first name)
  const getFirstName = (fullName: string) => {
    return fullName.split(" ")[0]
  }

  // Ambil inisial untuk avatar
  const getInitials = (fullName: string) => {
    const names = fullName.split(" ")
    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase()
    }
    return (names[0][0] + names[names.length - 1][0]).toUpperCase()
  }

  // Generate random color based on name (konsisten per user)
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-green-500",
      "bg-orange-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo & Welcome */}
        <div className="flex items-center gap-4">
          <img 
            src="/images/porto.png" 
            alt="Logo" 
            className="h-10 w-auto object-contain"
          />
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900">Admin Dashboard</span>
            {user && (
              <span className="text-sm text-slate-500">
                Selamat datang, <span className="font-medium text-blue-600">{getFirstName(user.nama)}</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Notification */}
          <Button variant="ghost" size="icon" className="relative hover:bg-slate-100">
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </Button>

          {/* Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 hover:bg-slate-100">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-medium text-slate-900">
                    {user?.nama || "Admin"}
                  </span>
                  <span className="text-xs text-slate-500 capitalize">
                    {user?.role || "Administrator"}
                  </span>
                </div>
                <div 
                  className={`w-9 h-9 ${user ? getAvatarColor(user.nama) : 'bg-blue-500'} rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md`}
                >
                  {user ? getInitials(user.nama) : "A"}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.nama || "Admin"}</p>
                  <p className="text-xs text-slate-500">{user?.email || ""}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Profil Saya
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSettingsClick} className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Pengaturan
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
              >
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