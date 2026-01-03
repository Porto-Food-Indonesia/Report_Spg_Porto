"use client"
import { useEffect } from "react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const token = localStorage.getItem("token")
    const role = localStorage.getItem("role")?.toLowerCase()
    
    if (!token || role !== 'admin') {
      window.location.replace("/")
      return
    }

    const isFirstLoad = sessionStorage.getItem('admin_loaded')
    if (!isFirstLoad) {
      window.history.replaceState(null, '', window.location.href)
      sessionStorage.setItem('admin_loaded', 'true')
    }

    const handlePopState = (e: PopStateEvent) => {
      const currentPath = window.location.pathname
      if (currentPath.startsWith('/admin/')) return
      e.preventDefault()
      window.history.pushState(null, '', window.location.href)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return <>{children}</>
}