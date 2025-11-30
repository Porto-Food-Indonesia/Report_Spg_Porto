import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { employeeId, photoUrl } = await req.json()
    if (!employeeId || !photoUrl) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    const updatedEmployee = await prisma.employees.update({
      where: { id: Number(employeeId) },
      data: { profilePhoto: photoUrl },
    })

    return NextResponse.json({
      message: "Foto profil berhasil diperbarui",
      employee: updatedEmployee,
    })
  } catch (error) {
    console.error("[v0] Upload photo error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
