// File: /api/auth/change-password/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, currentPassword, newPassword } = body

    console.log("🔑 Change password request for userId:", userId)

    // 1. Validasi input
    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "User ID, password lama, dan password baru harus diisi" },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password baru minimal 6 karakter" },
        { status: 400 }
      )
    }

    // 2. Ambil data user dari database
    const user = await prisma.users.findUnique({
      where: { id: parseInt(userId) },
      select: { id: true, password: true }
    })

    if (!user) {
      console.log("❌ User not found")
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      )
    }

    // 3. Verifikasi password lama (plain text comparison)
    if (currentPassword !== user.password) {
      console.log("❌ Current password incorrect")
      return NextResponse.json(
        { error: "Password saat ini salah" },
        { status: 401 }
      )
    }

    // 4. Update password baru (plain text)
    await prisma.users.update({
      where: { id: user.id },
      data: { password: newPassword }
    })

    console.log("✅ Password changed successfully for userId:", userId)

    return NextResponse.json({ 
      success: true, 
      message: "Password berhasil diubah" 
    })
  } catch (error) {
    console.error("❌ Change password error:", error)
    return NextResponse.json(
      { error: "Gagal mengubah password" },
      { status: 500 }
    )
  }
}