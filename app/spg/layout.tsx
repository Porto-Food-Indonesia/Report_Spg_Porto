import type React from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function SPGLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedRoute requiredRole="spg">{children}</ProtectedRoute>
}
