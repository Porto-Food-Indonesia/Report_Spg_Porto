// File: app/spg/layout.tsx

"use client"

import { useEffect } from "react"

export default function SPGLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  useEffect(() => {
    // 1️⃣ Check authentication
    const token = localStorage.getItem("token")
    const role = localStorage.getItem("role")?.toLowerCase()
    
    if (!token || role !== 'spg') {
      // Kalau ga ada token atau bukan SPG, redirect ke login
      window.location.replace("/")
      return
    }

    // 2️⃣ Prevent back to login page (tapi allow back antar menu)
    const isFirstLoad = sessionStorage.getItem('spg_loaded')
    
    if (!isFirstLoad) {
      // Pertama kali load, clear history sebelumnya (termasuk login page)
      window.history.replaceState(null, '', window.location.href)
      sessionStorage.setItem('spg_loaded', 'true')
    }

    // 3️⃣ Handle back button untuk prevent ke login
    const handlePopState = (e: PopStateEvent) => {
      // Cek kalau user coba back ke luar domain dashboard
      const currentPath = window.location.pathname
      
      // Kalau masih di /spg/, allow navigation
      if (currentPath.startsWith('/spg/')) {
        return // Allow normal back navigation
      }
      
      // Kalau coba keluar dari /spg/, prevent
      e.preventDefault()
      window.history.pushState(null, '', window.location.href)
    }

    window.addEventListener('popstate', handlePopState)
    
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  return <>{children}</>
}