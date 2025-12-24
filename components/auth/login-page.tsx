"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import Image from "next/image"
import { Mail, Lock, AlertCircle, EyeOff } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [pupilPosition, setPupilPosition] = useState({ x: 0, y: 0 })
  const eyeButtonRef = useRef<HTMLButtonElement>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Login gagal")
        setLoading(false)
        return
      }

      // Simpan token & user
      localStorage.setItem("token", data.token)
      localStorage.setItem("role", data.user.role)
      localStorage.setItem("user", JSON.stringify(data.user))

      const role = data.user.role.toLowerCase()

      // ✅ Gunakan window.location.href untuk hard redirect
      if (role === "admin") {
        window.location.href = "/admin/dashboard"
      } else if (role === "spg") {
        window.location.href = "/spg/dashboard"
      } else {
        setError("Role tidak valid. Hubungi admin.")
        setLoading(false)
      }

    } catch (err) {
      setError("Terjadi kesalahan saat login.")
      console.error(err)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"></div>

      <Card className="w-full max-w-md border-slate-800/50 bg-slate-900/80 backdrop-blur-xl shadow-2xl relative z-10">
        <CardHeader className="space-y-6 pb-8">
          <div className="flex justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl group-hover:bg-blue-500/30 transition-all duration-300"></div>
              <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-2xl border border-slate-700/50 shadow-xl">
                <Image
                  src="/images/porto.png"
                  alt="Logo Porto"
                  width={64}
                  height={64}
                  priority
                  className="select-none"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-blue-400 via-blue-300 to-purple-400 bg-clip-text text-transparent">
              Porto SPG System
            </CardTitle>
            <CardDescription className="text-center text-slate-400 text-base">
              Masukkan kredensial Anda untuk melanjutkan
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-950/50 border border-red-900/50 rounded-xl backdrop-blur-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-red-200 text-sm">{error}</span>
              </div>
            )}

            {/* Input Email */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <div className="relative group">
                <Input
                  type="email"
                  placeholder="nama@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 h-12 px-4 rounded-xl focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  required
                />
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 rounded-xl opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-300"></div>
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </label>
              <div className="relative group">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 h-12 px-4 pr-12 rounded-xl focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  ref={eyeButtonRef}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-400 transition-colors duration-200 p-1 rounded-lg hover:bg-slate-700/50"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-6 h-6" />
                  ) : (
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 28 28"
                      fill="none"
                      className="relative"
                    >
                      {/* Eye outline - lebih tebal */}
                      <path
                        d="M2.8 14.8C2.6 14.5 2.5 14.3 2.45 14.1C2.42 13.95 2.42 13.75 2.45 13.6C2.5 13.4 2.6 13.2 2.8 12.9C4.2 10.6 8.2 5 14 5C19.8 5 23.8 10.6 25.2 12.9C25.4 13.2 25.5 13.4 25.55 13.6C25.58 13.75 25.58 13.95 25.55 14.1C25.5 14.3 25.4 14.5 25.2 14.8C23.8 17.1 19.8 22.7 14 22.7C8.2 22.7 4.2 17.1 2.8 14.8Z"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Eyeball - bagian putih mata */}
                      <circle
                        cx="14"
                        cy="13.8"
                        r="5.5"
                        fill="white"
                        opacity="0.9"
                      />
                      {/* Iris - bagian berwarna */}
                      <circle
                        cx="14"
                        cy="13.8"
                        r="4"
                        fill="currentColor"
                        opacity="0.7"
                      />
                      {/* Pupil - hitam dengan animasi mengikuti mouse */}
                      <circle
                        cx={14 + pupilPosition.x}
                        cy={13.8 + pupilPosition.y}
                        r="2.2"
                        fill="black"
                      />
                      {/* Highlight - pantulan cahaya */}
                      <circle
                        cx={13 + pupilPosition.x}
                        cy={12.8 + pupilPosition.y}
                        r="1"
                        fill="white"
                        opacity="0.9"
                      />
                      {/* Highlight tambahan kecil */}
                      <circle
                        cx={14.5 + pupilPosition.x}
                        cy={13.2 + pupilPosition.y}
                        r="0.5"
                        fill="white"
                        opacity="0.7"
                      />
                    </svg>
                  )}
                </button>
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 rounded-xl opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-300"></div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
            >
              <span className="relative z-10">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Memproses...
                  </span>
                ) : (
                  "Masuk ke Dashboard"
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </Button>
          </form>

          <div className="mt-6 text-center space-y-1">
            <p className="text-xs text-slate-500">
              © 2025 Porto SPG System. All rights reserved.
            </p>
            <p className="text-xs text-slate-600">
              Developed with by <span className="text-blue-400 font-medium">Fadillahh</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}