"use client"

import { useEffect, useState } from "react"
import { Menu, X, Bell, LogOut, Settings, User, Sun, Moon } from "lucide-react"
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
  onLogoClick?: () => void
  theme: "dark" | "light"
  onThemeToggle: () => void
}

interface UserData {
  id: string
  nama: string
  email: string
  role: string
}

export default function SPGHeader({ 
  onToggleSidebar, 
  isSidebarOpen,
  onLogoClick,
  theme,
  onThemeToggle
}: SPGHeaderProps) {
  const [user, setUser] = useState<UserData | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const isDark = theme === 'dark'

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

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = "/"
  }

  const handleLogoClick = () => {
    if (onLogoClick) {
      setIsRefreshing(true)
      setTimeout(() => setIsRefreshing(false), 800)
      onLogoClick()
    }
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

  // Generate warna avatar gradient konsisten per user
  const getAvatarGradient = (name: string) => {
    const gradients = [
      "from-blue-500 to-cyan-500",
      "from-purple-500 to-pink-500",
      "from-emerald-500 to-teal-500",
      "from-orange-500 to-red-500",
      "from-indigo-500 to-purple-500",
      "from-rose-500 to-pink-500",
      "from-amber-500 to-orange-500",
    ]
    const index = name.charCodeAt(0) % gradients.length
    return gradients[index]
  }

  // Theme-based classes
  const headerBg = isDark
    ? "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900"
    : "bg-white/80 backdrop-blur-xl"
  
  const borderClass = isDark ? "border-slate-700/50" : "border-slate-200"
  const textClass = isDark ? "text-white" : "text-slate-900"
  const textSecondaryClass = isDark ? "text-slate-400" : "text-slate-600"
  const hoverBgClass = isDark ? "hover:bg-slate-700/50" : "hover:bg-slate-100"

  return (
    <header 
      className={`
        sticky top-0 z-40 
        transition-all duration-300
        ${isScrolled 
          ? `${headerBg} shadow-2xl border-b ${borderClass}` 
          : `${headerBg} border-b ${borderClass}`
        }
      `}
    >
      <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-3.5">
        {/* Left Section */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0 flex-1">
          {/* Tombol hamburger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className={`lg:hidden flex-shrink-0 ${hoverBgClass} ${textSecondaryClass} hover:${textClass} h-9 w-9 rounded-xl transition-all duration-300 hover:scale-105`}
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>

          {/* Logo & Welcome */}
          <button 
            onClick={handleLogoClick}
            className="relative group focus:outline-none"
          >
            <div className={`
              absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur 
              opacity-30 group-hover:opacity-60 transition duration-300
              ${isRefreshing ? 'opacity-100 animate-pulse' : ''}
            `} />
            <img 
              src="/images/porto.png" 
              alt="SPG Logo" 
              className={`
                relative h-8 sm:h-9 lg:h-10 xl:h-11 w-auto object-contain 
                transition-all duration-300 group-hover:scale-105
                ${isRefreshing ? 'animate-spin' : ''}
              `}
            />
          </button>
          
          <div className="flex flex-col min-w-0 flex-1">
            <h1 className={`font-bold ${textClass} text-sm sm:text-base lg:text-lg xl:text-xl truncate`}>
              SPG Report System
            </h1>
            {user && (
              <p className={`text-[10px] sm:text-xs lg:text-sm ${textSecondaryClass} truncate hidden sm:block`}>
                Halo, <span className="font-semibold text-blue-400">{getFirstName(user.nama)}</span> 👋
              </p>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-shrink-0">
          {/* Theme Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onThemeToggle}
            className={`relative h-9 w-9 lg:h-10 lg:w-10 rounded-xl transition-all duration-300 hover:scale-105 hidden sm:flex group ${hoverBgClass}`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? (
              <Sun className="w-4 h-4 lg:w-5 lg:h-5 text-slate-300 group-hover:text-yellow-400 transition-colors" />
            ) : (
              <Moon className="w-4 h-4 lg:w-5 lg:h-5 text-slate-600 group-hover:text-blue-500 transition-colors" />
            )}
          </Button>

          {/* Notification */}
          <Button 
            variant="ghost" 
            size="icon" 
            className={`relative ${hoverBgClass} h-9 w-9 lg:h-10 lg:w-10 rounded-xl transition-all duration-300 hover:scale-105 hidden sm:flex group`}
          >
            <Bell className={`w-4 h-4 lg:w-5 lg:h-5 ${textSecondaryClass} group-hover:${textClass} group-hover:animate-bounce transition-colors`} />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg animate-pulse">
              3
            </span>
          </Button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={`flex items-center gap-2 lg:gap-3 ${hoverBgClass} h-auto px-2 lg:px-3 py-1.5 lg:py-2 rounded-xl transition-all duration-300 hover:scale-105 group`}
              >
                <div className="hidden xl:flex flex-col items-end min-w-0">
                  <span className={`text-sm font-semibold ${textClass} truncate max-w-[140px] 2xl:max-w-[200px] transition-colors`}>
                    {user?.nama || "SPG"}
                  </span>
                  <span className={`text-xs ${textSecondaryClass} capitalize truncate transition-colors`}>
                    {user?.role || "Sales Promotion Girl"}
                  </span>
                </div>
                
                <div className="relative">
                  <div className={`
                    absolute -inset-1 bg-gradient-to-br ${user ? getAvatarGradient(user.nama) : 'from-blue-500 to-purple-600'} 
                    rounded-full blur opacity-50 group-hover:opacity-100 transition duration-300
                  `} />
                  <div 
                    className={`
                      relative
                      w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 xl:w-11 xl:h-11
                      bg-gradient-to-br ${user ? getAvatarGradient(user.nama) : 'from-blue-500 to-purple-600'}
                      rounded-full flex items-center justify-center 
                      text-white text-xs lg:text-sm xl:text-base
                      font-bold shadow-lg flex-shrink-0
                      ring-2 ${isDark ? 'ring-slate-700' : 'ring-slate-200'} group-hover:ring-4 transition-all duration-300
                    `}
                  >
                    {user ? getInitials(user.nama) : "S"}
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent 
              align="end" 
              className={`w-64 sm:w-72 mt-2 rounded-xl border ${borderClass} shadow-2xl ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}
              sideOffset={8}
            >
              <DropdownMenuLabel className="pb-3">
                <div className="flex items-center gap-3">
                  <div 
                    className={`
                      w-12 h-12 bg-gradient-to-br ${user ? getAvatarGradient(user.nama) : 'from-blue-500 to-purple-600'}
                      rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg
                    `}
                  >
                    {user ? getInitials(user.nama) : "S"}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className={`text-sm font-bold ${textClass} truncate`}>
                      {user?.nama || "SPG"}
                    </p>
                    <p className={`text-xs ${textSecondaryClass} truncate`}>
                      {user?.email || "spg@example.com"}
                    </p>
                    <span className="text-xs font-medium text-blue-400 capitalize mt-0.5">
                      {user?.role || "Sales Promotion"}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator className={isDark ? 'bg-slate-700' : 'bg-slate-200'} />
              
              <DropdownMenuItem 
                className={`cursor-pointer text-sm py-3 px-3 ${hoverBgClass} rounded-lg mx-1 group ${textSecondaryClass} hover:${textClass}`}
              >
                <User className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform" />
                <span>Profil Saya</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                className={`cursor-pointer text-sm py-3 px-3 ${hoverBgClass} rounded-lg mx-1 group ${textSecondaryClass} hover:${textClass}`}
              >
                <Settings className="w-4 h-4 mr-3 group-hover:rotate-90 transition-transform duration-300" />
                <span>Pengaturan</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className={isDark ? 'bg-slate-700' : 'bg-slate-200'} />
              
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="text-red-400 hover:text-red-300 cursor-pointer hover:bg-red-500/10 text-sm py-3 px-3 font-medium rounded-lg mx-1 mb-1 group"
              >
                <LogOut className="w-4 h-4 mr-3 group-hover:translate-x-1 transition-transform" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}