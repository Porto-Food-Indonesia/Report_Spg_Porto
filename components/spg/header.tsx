"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Menu, X, Bell, LogOut, Settings, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SPGHeaderProps {
  onToggleSidebar: () => void
  isSidebarOpen: boolean
}

interface UserData {
  id: string
  nama: string
  email: string
  role: string
}

export default function SPGHeader({ onToggleSidebar, isSidebarOpen }: SPGHeaderProps) {
  const [user, setUser] = useState<UserData | null>(null)

  useEffect(() => {
    // ✅ Ambil data user dari localStorage (data sudah ada dari login)
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

  // Ambil nama depan
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

  // Generate warna avatar konsisten per user
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-600",
      "bg-purple-600",
      "bg-green-600",
      "bg-orange-600",
      "bg-pink-600",
      "bg-indigo-600",
      "bg-teal-600",
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-40 shadow-sm">
      <div className="h-full flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {/* Tombol hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onToggleSidebar}
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>

          {/* Logo & Welcome */}
          <Image
            src="/images/porto.png"
            alt="SPG Logo"
            width={40}
            height={40}
            className="rounded-full"
            priority
          />
          <div className="flex flex-col">
            <span className="font-semibold text-base hidden sm:inline">
              SPG Report System
            </span>
            <span className="font-semibold text-base sm:hidden">SPG</span>
            {user && (
              <span className="text-xs text-slate-500 hidden sm:inline">
                Halo, <span className="font-medium text-blue-600">{getFirstName(user.nama)}</span> 👋
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notification */}
          <Button variant="ghost" size="icon" className="relative hover:bg-slate-100">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </Button>

          {/* Dropdown profil */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 hover:bg-slate-100">
                <span className="text-sm font-medium hidden md:inline text-slate-900">
                  {user?.nama || "SPG"}
                </span>
                <div 
                  className={`w-8 h-8 ${user ? getAvatarColor(user.nama) : 'bg-blue-600'} text-white rounded-full flex items-center justify-center font-semibold shadow-md`}
                >
                  {user ? getInitials(user.nama) : "S"}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.nama || "SPG"}</p>
                  <p className="text-xs text-slate-500">{user?.email || ""}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Profil Saya
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
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