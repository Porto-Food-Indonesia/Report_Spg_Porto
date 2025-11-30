"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: "success" | "pending" | "failed" | "warning" | "info"
  label: string
  size?: "sm" | "md" | "lg"
}

export default function StatusBadge({ status, label, size = "md" }: StatusBadgeProps) {
  const statusConfig = {
    success: {
      color: "bg-green-100 text-green-800 border-green-200",
      icon: "✓",
    },
    pending: {
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      icon: "⏳",
    },
    failed: {
      color: "bg-red-100 text-red-800 border-red-200",
      icon: "✕",
    },
    warning: {
      color: "bg-orange-100 text-orange-800 border-orange-200",
      icon: "⚠",
    },
    info: {
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: "ℹ",
    },
  }

  const sizeClass = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  }

  const config = statusConfig[status]

  return (
    <Badge
      variant="outline"
      className={cn("flex items-center gap-1 font-medium border", config.color, sizeClass[size])}
    >
      <span>{config.icon}</span>
      <span>{label}</span>
    </Badge>
  )
}
