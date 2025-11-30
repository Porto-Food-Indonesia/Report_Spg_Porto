import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { userId, newPassword } = await req.json()

    console.log("🔑 Admin reset password for userId:", userId)

    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      )
    }

    // Update password langsung tanpa cek password lama (admin privilege)
    const updatedUser = await prisma.users.update({
      where: { id: parseInt(userId) },
      data: { password: newPassword },
    })

    console.log("✅ Password reset successfully for:", updatedUser.email)

    return NextResponse.json(
      { message: "Password berhasil direset" },
      { status: 200 }
    )
  } catch (error) {
    console.error("[POST /auth/reset-password] Error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}