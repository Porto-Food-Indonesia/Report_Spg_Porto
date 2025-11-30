import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const employees = await prisma.employees.findMany({
      orderBy: { created_at: "desc" },
    })

    const mappedEmployees = employees.map((e) => ({
      id: e.id.toString(),
      name: e.nama,
      email: e.email || "",
      role: e.posisi || "spg",
      status: e.status,
      joinDate: e.join_date ? e.join_date.toISOString().split("T")[0] : "",
    }))

    return NextResponse.json(mappedEmployees)
  } catch (error) {
    console.error("[GET /employees] Error:", error)
    return NextResponse.json(
      { error: "Gagal mengambil data karyawan" },
      { status: 500 }
    )
  }
}
