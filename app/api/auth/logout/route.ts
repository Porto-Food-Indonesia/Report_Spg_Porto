import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Buat respon sukses logout
    const response = NextResponse.json({ message: "Logout berhasil" })

    // 🔹 Hapus cookie token
    response.cookies.set("token", "", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0), // langsung kadaluarsa
    })

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat logout" },
      { status: 500 }
    )
  }
}
