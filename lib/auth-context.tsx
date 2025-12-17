"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  nama: string // ✅ Sesuaikan dengan response API Anda
  email: string
  role: "admin" | "spg"
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem("user")
    const token = localStorage.getItem("token")
    
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error("Error parsing user data:", error)
        localStorage.clear()
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Login gagal")
    }

    const data = await response.json()
    
    // ✅ Simpan ke localStorage
    localStorage.setItem("token", data.token)
    localStorage.setItem("role", data.user.role)
    localStorage.setItem("user", JSON.stringify(data.user))
    
    // ✅ Update state (tapi ini tidak cukup untuk trigger redirect)
    setUser(data.user)
    
    // ✅ PENTING: Hard redirect agar page reload dan protected route bisa cek auth
    const role = data.user.role.toLowerCase()
    if (role === "admin") {
      window.location.href = "/admin/dashboard"
    } else if (role === "spg") {
      window.location.href = "/spg/dashboard"
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      localStorage.clear()
      setUser(null)
      window.location.href = "/"
    }
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated: !!user, 
        isLoading, 
        login, 
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}