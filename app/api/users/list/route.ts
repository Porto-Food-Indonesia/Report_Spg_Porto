import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const users = await prisma.users.findMany({
      orderBy: { nama: "asc" },
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
      }
    })

    const mappedUsers = users.map((u) => ({
      id: u.id.toString(),
      nama: u.nama,
      email: u.email,
      role: u.role,
    }))

    console.log("✅ Found", mappedUsers.length, "users")
    return NextResponse.json(mappedUsers)
    
  } catch (error) {
    console.error("[GET /api/users/list] Error:", error)
    return NextResponse.json(
      { error: "Gagal mengambil data users" },
      { status: 500 }
    )
  }
}