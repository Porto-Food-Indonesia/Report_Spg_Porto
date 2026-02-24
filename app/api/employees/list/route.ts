// File: /app/api/employees/list/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// ⭐ DISABLE CACHE
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const employees = await prisma.employees.findMany({
      include: {
        user: true,
      },
      orderBy: {
        created_at: "desc",
      },
    })

    const formatted = employees.map(emp => ({
      id: String(emp.id),
      name: emp.nama,
      email: emp.email || "",
      role: emp.posisi || "SPG",
      status: emp.status,
      joinDate: emp.join_date 
        ? emp.join_date.toISOString().split("T")[0] 
        : new Date().toISOString().split("T")[0],
      userId: emp.user_id ? String(emp.user_id) : null,
      profilePhoto: emp.foto_profil || null,
      daftarToko: emp.daftar_toko || [],
    }))

    return NextResponse.json(formatted, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error) {
    console.error("❌ Error fetching employees:", error)
    return NextResponse.json(
      { error: "Gagal mengambil data karyawan" },
      { status: 500 }
    )
  }
}