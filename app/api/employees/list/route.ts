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
      id: emp.id.toString(),
      name: emp.nama,
      email: emp.email || '',
      role: emp.posisi || '',
      status: emp.status,
      joinDate: emp.join_date ? emp.join_date.toISOString().split('T')[0] : '',
      userId: emp.user_id?.toString() || null,
      profilePhoto: emp.foto_profil || null,
    }))

    console.log("📊 Fetched employees:", transformedEmployees.length)
    
    return NextResponse.json(transformedEmployees)
  } catch (error) {
    console.error("❌ List employees error:", error)
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    )
  }
}