// File: /api/employees/list/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const employees = await prisma.employees.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        nama: true,
        email: true,
        posisi: true,
        status: true,
        join_date: true,
        user_id: true,
        foto_profil: true,
      }
    })

    // Transform to match frontend expectations
    const transformedEmployees = employees.map(emp => ({
      id:  emp.id. toString(),
      name: emp.nama,
      email: emp.email || '',
      role: emp.posisi || '',
      status: emp. status,
      joinDate: emp.join_date ?  emp.join_date.toISOString().split('T')[0] : '',
      userId: emp.user_id ?  emp.user_id.toString() : null,  // ← Pastikan konsisten (convert ke string)
      profilePhoto: emp.foto_profil || null,
    }))

    console.log("📊 Fetched employees:", transformedEmployees.length)
    console.log("📋 Sample employee with userId:", transformedEmployees[0])
    
    return NextResponse.json(transformedEmployees)
  } catch (error) {
    console.error("❌ List employees error:", error)
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    )
  }
}