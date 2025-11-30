"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    direction: "up" | "down"
  }
  className?: string
}

export default function StatCard({ title, value, subtitle, icon, trend, className }: StatCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && <div className="text-2xl opacity-60">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <div className="text-2xl font-bold text-foreground">{value}</div>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <p className={trend.direction === "up" ? "text-green-600 text-xs" : "text-red-600 text-xs"}>
              {trend.direction === "up" ? "↑" : "↓"} {Math.abs(trend.value)}% from last month
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
