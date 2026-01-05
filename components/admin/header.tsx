"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, LogOut, Settings, User, Menu, Sun, Moon } from "lucide-react"
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
  role:  string
}

interface AdminHeaderProps {
  onMenuClick?: () => void
  onLogoClick?: () => void
  onNotificationClick?: () => void
  notificationCount?: number
  notifications?:  Notification[]
  theme?: 'dark' | 'light'
  onThemeToggle?: () => void
}

interface Notification {
  id:  string
  type: "laporan" | "info" | "warning"
  nama: string
  message: string
  tanggal: string
  isRead: boolean
}

export default function AdminHeader({ 
  onMenuClick, 
  onLogoClick, 
  onNotificationClick,
  notificationCount = 0,
  notifications = [],
  theme = 'dark', 
  onThemeToggle 
}: AdminHeaderProps) {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  
  // State untuk notifikasi dari API
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([])
  const [localNotificationCount, setLocalNotificationCount] = useState(0)
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  const isDark = theme === 'dark'

  // ✅ Fetch profile photo dari employee profile
  const fetchProfilePhoto = async (userId: string) => {
    try {
      setIsLoadingProfile(true)
      const response = await fetch("/api/employees/list")
      
      if (!response.ok) return
      
      const employees = await response.json()
      const currentEmployee = employees.find((emp: any) => 
        String(emp.userId || emp.id).trim().toLowerCase() === String(userId).trim().toLowerCase()
      )
      
      if (currentEmployee? .  profilePhoto) {
        setProfilePhoto(currentEmployee.profilePhoto)
      }
    } catch (error) {
      console.error("Error fetching profile photo:", error)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  // Fetch notifications dari API sales yang sudah ada
  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true)
      const response = await fetch('/api/sales/list')
      
      if (!response.ok) {
        throw new Error('Gagal mengambil notifikasi')
      }
      
      const data = await response.json()
      
      if (Array.isArray(data)) {
        const tenDaysAgo = new Date()
        tenDaysAgo. setDate(tenDaysAgo.getDate() - 10)
        
        const recentSales = data
          .filter(sale => new Date(sale.created_at) >= tenDaysAgo)
          .slice(0, 20)
        
        const readNotifs = JSON.parse(localStorage.getItem('readNotifications') || '[]')
        
        const formattedNotifications = recentSales.map(sale => {
          let type:  "laporan" | "info" | "warning" = "laporan"
          if (sale.total > 1000000) type = "info"
          else if (sale.total < 50000) type = "warning"
          
          let message = ""
          if (sale.produk?. category === "Curah") {
            message = `Melaporkan penjualan ${sale.penjualan_gram}gr ${sale.produk?.nama || 'produk'} di ${sale.nama_toko_transaksi}`
          } else {
            const parts = []
            if (sale.penjualan_karton > 0) parts.push(`${sale.penjualan_karton} karton`)
            if (sale.penjualan_pcs > 0) parts.push(`${sale.penjualan_pcs} pack`)
            message = `Melaporkan penjualan ${parts.join(' + ')} ${sale.produk?.nama || 'produk'} di ${sale.nama_toko_transaksi}`
          }
          
          return {
            id: sale.id. toString(),
            type,
            nama: sale.user?.nama || 'SPG',
            message,
            tanggal: sale.created_at,
            isRead: readNotifs.includes(sale.id. toString())
          }
        })
        
        setLocalNotifications(formattedNotifications)
        const unreadCount = formattedNotifications.filter(n => !n.isRead).length
        setLocalNotificationCount(unreadCount)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setLocalNotifications([])
      setLocalNotificationCount(0)
    } finally {
      setLoadingNotifications(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      setLocalNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      )
      setLocalNotificationCount(prev => Math.max(0, prev - 1))
      
      const readNotifs = JSON.parse(localStorage.getItem('readNotifications') || '[]')
      if (! readNotifs.includes(notificationId)) {
        readNotifs.push(notificationId)
        localStorage.setItem('readNotifications', JSON.stringify(readNotifs))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const allIds = localNotifications.map(n => n.id)
      setLocalNotifications(prev => prev. map(n => ({ ...n, isRead: true })))
      setLocalNotificationCount(0)
      localStorage.setItem('readNotifications', JSON.stringify(allIds))
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId)
    router.push(`/admin/laporan? id=${notificationId}`)
    setShowNotifications(false)
  }

  const getRelativeTime = (tanggal: string) => {
    const now = new Date()
    const date = new Date(tanggal)
    const diff = Math.floor((now. getTime() - date.getTime()) / 1000)

    if (diff < 60) return "Baru saja"
    if (diff < 3600) return `${Math.floor(diff / 60)} menit yang lalu`
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam yang lalu`
    if (diff < 604800) return `${Math.floor(diff / 86400)} hari yang lalu`
    
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
  }

  const handleLogoClick = () => {
    if (onLogoClick) {
      setIsRefreshing(true)
      setTimeout(() => setIsRefreshing(false), 800)
      fetchNotifications()
      onLogoClick()
    }
  }

  useEffect(() => {
    const userStr = typeof window !== "undefined" ? localStorage?. getItem("user") : null
    if (userStr) {
      try {
        const userData = JSON.parse(userStr)
        setUser(userData)
        
        // ✅ Fetch profile photo
        fetchProfilePhoto(userData.id)
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }

    fetchNotifications()

    const interval = setInterval(() => {
      fetchNotifications()
    }, 60000)

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    
    return () => {
      window.removeEventListener("scroll", handleScroll)
      clearInterval(interval)
    }
  }, [])

  // ✅ FIXED: Logout yang benar dengan API call
  const handleLogout = async () => {
    if (isLoggingOut) return // Prevent double click
    
    setIsLoggingOut(true)

    try {
      // 1. Call API logout untuk hapus cookie di server
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      // 2. Clear semua data dari localStorage
      localStorage.removeItem("token")
      localStorage.removeItem("role")
      localStorage.removeItem("user")
      localStorage.removeItem("admin-theme")
      localStorage.removeItem("readNotifications")
      
      // 3. Hard redirect tanpa history - PASTI GA BISA BACK! 
      window.location.replace("/")
      
    } catch (error) {
      console.error("Logout error:", error)
      
      // Tetap clear localStorage dan redirect meskipun API error
      localStorage.clear()
      window.location.replace("/")
    }
  }

  const handleProfileClick = () => {
    router.push("/admin/profile")
  }

  const handleSettingsClick = () => {
    router.push("/admin/settings")
  }

  const handleViewAllNotifications = () => {
    router.push("/admin/laporan")
    setShowNotifications(false)
  }

  const getFirstName = (fullName: string) => {
    return fullName.split(" ")[0]
  }

  const getInitials = (fullName: string) => {
    const names = fullName.split(" ")
    if (names.length === 1) {
      return names[0].  substring(0, 2).toUpperCase()
    }
    return (names[0][0] + names[names.length - 1][0]).toUpperCase()
  }

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

  // Use props notifications if provided, otherwise use local
  const displayNotifications = notifications.length > 0 ? notifications : localNotifications
  const displayCount = notificationCount > 0 ? notificationCount : localNotificationCount

  // Theme-based classes
  const headerBg = isDark
    ? "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900"
    : "bg-white/80 backdrop-blur-xl"
  
  const borderClass = isDark ? "border-slate-700/50" : "border-slate-200"
  const textClass = isDark ? "text-white" : "text-slate-900"
  const textSecondaryClass = isDark ? "text-slate-400" : "text-slate-600"
  const hoverBgClass = isDark ?  "hover:bg-slate-700/50" : "hover:bg-slate-100"

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
      <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-2. 5 sm:py-3 lg:py-3.5">
        {/* Left Section */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0 flex-1">
          {onMenuClick && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className={`lg:hidden flex-shrink-0 ${hoverBgClass} ${textSecondaryClass} hover:${textClass} h-9 w-9 rounded-xl transition-all duration-300 hover:scale-105`}
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}

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
              alt="Logo Porto" 
              className={`
                relative h-8 sm:h-9 lg:h-10 xl:h-11 w-auto object-contain 
                transition-all duration-300 group-hover:scale-105
                ${isRefreshing ? 'animate-spin' : ''}
              `}
            />
          </button>
          
          <div className="flex flex-col min-w-0 flex-1">
            <h1 className={`font-bold ${textClass} text-sm sm:text-base lg:text-lg xl:text-xl truncate`}>
              Admin Dashboard
            </h1>
            {user && (
              <p className={`text-[10px] sm:text-xs lg:text-sm ${textSecondaryClass} truncate hidden sm:block`}>
                Selamat datang, <span className="font-semibold text-blue-400">{getFirstName(user.nama)}</span> 👋
              </p>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-shrink-0">
          {/* Theme Toggle Button */}
          {onThemeToggle && (
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
          )}
          
          {/* Notification Dropdown */}
          <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`relative ${hoverBgClass} h-9 w-9 lg:h-10 lg:w-10 rounded-xl transition-all duration-300 hover:scale-105 hidden sm:flex group`}
              >
                <Bell className={`w-4 h-4 lg:w-5 lg:h-5 ${textSecondaryClass} group-hover: ${textClass} group-hover:animate-bounce transition-colors`} />
                {displayCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg animate-pulse">
                    {displayCount > 9 ? "9+" : displayCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent 
              align="end" 
              className={`w-80 sm:w-96 mt-2 rounded-xl border ${borderClass} shadow-2xl ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'} max-h-[480px] overflow-hidden`}
              sideOffset={8}
            >
              <DropdownMenuLabel className="pb-2 px-4 pt-3 flex items-center justify-between">
                <div>
                  <h3 className={`text-base font-bold ${textClass}`}>Notifikasi</h3>
                  <p className={`text-xs ${textSecondaryClass} mt-0.5`}>
                    {displayCount > 0 ? `${displayCount} laporan baru` : "Tidak ada notifikasi"}
                  </p>
                </div>
                {displayCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={markAllAsRead}
                    className={`text-xs text-blue-400 hover:text-blue-300 ${hoverBgClass} h-7`}
                  >
                    Tandai semua
                  </Button>
                )}
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator className={isDark ?  'bg-slate-700' : 'bg-slate-200'} />
              
              <div className="max-h-[360px] overflow-y-auto">
                {loadingNotifications ?  (
                  <div className="px-4 py-8 text-center">
                    <div className="w-8 h-8 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                    <p className={`text-sm ${textSecondaryClass}`}>Memuat notifikasi...</p>
                  </div>
                ) : displayNotifications.length > 0 ? (
                  displayNotifications.map((notif) => (
                    <DropdownMenuItem 
                      key={notif. id}
                      onClick={() => handleNotificationClick(notif.id)}
                      className={`
                        cursor-pointer px-4 py-3 ${hoverBgClass}
                        transition-colors mx-1 rounded-lg mb-1
                        ${! notif.isRead ? (isDark ? 'bg-slate-700/30' : 'bg-slate-100') : ''}
                      `}
                    >
                      <div className="flex gap-3 w-full">
                        <div className={`
                          w-10 h-10 rounded-full flex-shrink-0
                          bg-gradient-to-br ${
                            notif.type === "laporan" ? "from-emerald-500 to-teal-500" : 
                            notif.type === "warning" ? "from-orange-500 to-red-500" : 
                            "from-blue-500 to-cyan-500"
                          }
                          flex items-center justify-center text-white font-bold text-sm
                        `}>
                          {notif.nama. charAt(0).toUpperCase()}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className={`text-sm font-semibold ${textClass} truncate`}>
                              {notif.nama}
                            </p>
                            {! notif.isRead && (
                              <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className={`text-xs ${textSecondaryClass} line-clamp-2 mb-1`}>
                            {notif.message}
                          </p>
                          <p className={`text-xs ${textSecondaryClass}`}>
                            {getRelativeTime(notif.tanggal)}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center">
                    <Bell className={`w-12 h-12 ${textSecondaryClass} mx-auto mb-3`} />
                    <p className={`text-sm ${textSecondaryClass}`}>Tidak ada notifikasi</p>
                  </div>
                )}
              </div>
              
              {displayCount > 0 && (
                <>
                  <DropdownMenuSeparator className={isDark ?  'bg-slate-700' : 'bg-slate-200'} />
                  <div className="p-2">
                    <Button 
                      onClick={handleViewAllNotifications}
                      variant="ghost"
                      className={`w-full text-sm text-blue-400 hover:text-blue-300 ${hoverBgClass}`}
                    >
                      Lihat Semua Laporan
                    </Button>
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={`flex items-center gap-2 lg:gap-3 ${hoverBgClass} h-auto px-2 lg:px-3 py-1. 5 lg:py-2 rounded-xl transition-all duration-300 hover:scale-105 group`}
              >
                <div className="hidden xl:flex flex-col items-end min-w-0">
                  <span className={`text-sm font-semibold ${textClass} truncate max-w-[140px] 2xl:max-w-[200px] transition-colors`}>
                    {user?.nama || "Admin"}
                  </span>
                  <span className={`text-xs ${textSecondaryClass} capitalize truncate transition-colors`}>
                    {user?.role || "Administrator"}
                  </span>
                </div>
                
                {/* Avatar dengan foto atau inisial */}
                <div className="relative">
                  <div className={`
                    absolute -inset-1 bg-gradient-to-br ${user ?   getAvatarGradient(user.nama) : 'from-blue-500 to-purple-600'} 
                    rounded-full blur opacity-50 group-hover:opacity-100 transition duration-300
                  `} />
                  {profilePhoto && ! isLoadingProfile ?   (
                    // ✅ Tampilkan foto jika tersedia
                    <img
                      src={profilePhoto}
                      alt={user?. nama || "Profile"}
                      className={`
                        relative
                        w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 xl:w-11 xl:h-11
                        rounded-full object-cover flex-shrink-0
                        ring-2 ${isDark ? 'ring-slate-700' : 'ring-slate-200'} 
                        group-hover:ring-4 transition-all duration-300 shadow-lg
                      `}
                    />
                  ) : (
                    // ✅ Fallback ke inisial jika belum ada foto
                    <div 
                      className={`
                        relative
                        w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 xl:w-11 xl:h-11
                        bg-gradient-to-br ${user ?  getAvatarGradient(user.nama) : 'from-blue-500 to-purple-600'}
                        rounded-full flex items-center justify-center 
                        text-white text-xs lg:text-sm xl:text-base
                        font-bold shadow-lg flex-shrink-0
                        ring-2 ${isDark ? 'ring-slate-700' : 'ring-slate-200'} 
                        group-hover:ring-4 transition-all duration-300
                      `}
                    >
                      {user ?   getInitials(user.nama) : "A"}
                    </div>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent 
              align="end" 
              className={`w-64 sm:w-72 mt-2 rounded-xl border ${borderClass} shadow-2xl ${isDark ? 'bg-slate-800 text-white' :  'bg-white text-slate-900'}`}
              sideOffset={8}
            >
              <DropdownMenuLabel className="pb-3">
                <div className="flex items-center gap-3">
                  {/* Avatar dropdown dengan foto atau inisial */}
                  {profilePhoto && !isLoadingProfile ?   (
                    <img
                      src={profilePhoto}
                      alt={user?.nama || "Profile"}
                      className="w-12 h-12 rounded-xl object-cover shadow-lg flex-shrink-0"
                    />
                  ) : (
                    <div 
                      className={`
                        w-12 h-12 bg-gradient-to-br ${user ?  getAvatarGradient(user.nama) : 'from-blue-500 to-purple-600'}
                        rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0
                      `}
                    >
                      {user ? getInitials(user.nama) : "A"}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <p className={`text-sm font-bold ${textClass} truncate`}>
                      {user?.nama || "Admin"}
                    </p>
                    <p className={`text-xs ${textSecondaryClass} truncate`}>
                      {user?.email || "admin@example.com"}
                    </p>
                    <span className="text-xs font-medium text-blue-400 capitalize mt-0.5">
                      {user?.role || "Administrator"}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator className={isDark ? 'bg-slate-700' : 'bg-slate-200'} />
              
              <DropdownMenuItem 
                onClick={handleProfileClick} 
                className={`cursor-pointer text-sm py-3 px-3 ${hoverBgClass} rounded-lg mx-1 group ${textSecondaryClass} hover:${textClass}`}
              >
                <User className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform" />
                <span>Profil Saya</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={handleSettingsClick} 
                className={`cursor-pointer text-sm py-3 px-3 ${hoverBgClass} rounded-lg mx-1 group ${textSecondaryClass} hover:${textClass}`}
              >
                <Settings className="w-4 h-4 mr-3 group-hover:rotate-90 transition-transform duration-300" />
                <span>Pengaturan</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className={isDark ?  'bg-slate-700' : 'bg-slate-200'} />
              
              <DropdownMenuItem 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`
                  text-red-400 hover:text-red-300 cursor-pointer hover:bg-red-500/10 
                  text-sm py-3 px-3 font-medium rounded-lg mx-1 mb-1 group
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <LogOut className={`w-4 h-4 mr-3 transition-transform ${isLoggingOut ? 'animate-pulse' : 'group-hover:translate-x-1'}`} />
                <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}