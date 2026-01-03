"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: "admin" | "spg"
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [authorized, setAuthorized] = useState(false)

  // ✅ FIXED: Pakai window.location.replace() untuk hapus history
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Hard redirect tanpa history
        window.location.replace("/")
      } else if (
        requiredRole &&
        user.role?.toLowerCase() !== requiredRole.toLowerCase()
      ) {
        // Hard redirect tanpa history
        window.location.replace("/")
      } else {
        setAuthorized(true)
      }
    }
  }, [user, isLoading, requiredRole])

  // ✅ BONUS: Prevent browser back button
  useEffect(() => {
    if (authorized) {
      const preventBack = () => {
        window.history.pushState(null, '', window.location.href)
      }
      
      // Push state pertama kali
      preventBack()
      
      // Listen untuk back button
      window.addEventListener('popstate', preventBack)
      
      return () => window.removeEventListener('popstate', preventBack)
    }
  }, [authorized])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
          <p className="mt-4 text-slate-300 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!authorized) {
    return null // tidak render apa pun sebelum lolos auth
  }

  return <>{children}</>
}