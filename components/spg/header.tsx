"use client"

import Image from "next/image"
import { Menu, X, Bell, LogOut, Settings, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SPGHeaderProps {
  onToggleSidebar: () => void
  isSidebarOpen: boolean
}

export default function SPGHeader({ onToggleSidebar, isSidebarOpen }: SPGHeaderProps) {
  const handleLogout = () => {
    localStorage.clear()
    window.location.href = "/"
  }

  return (
    <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-40">
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

          {/* Logo */}
          <Image
            src="/images/porto.png"
            alt="SPG Logo"
            width={40}
            height={40}
            className="rounded-full"
            priority
          />
          <span className="font-semibold text-lg hidden sm:inline">SPG Report System</span>
          <span className="font-semibold text-lg sm:hidden">SPG</span>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </Button>

          {/* Dropdown profil */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                  S
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <User className="w-4 h-4 mr-2" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Pengaturan
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 cursor-pointer"
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