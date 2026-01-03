import { NextRequest, NextResponse } from "next/server"
import { getAllUsers } from "@/lib/db-utils"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validasi input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password harus diisi" },
        { status: 400 }
      )
    }

    // Trim dan lowercase email untuk konsistensi
    const cleanEmail = email.trim().toLowerCase()

    // 🔹 Ambil semua user dari database
    const users = await getAllUsers()

    // 🔹 Cek apakah email dan password cocok
    const user = users.find(
      (u: any) => 
        u.email.toLowerCase() === cleanEmail && 
        u.password === password
    )

    if (!user) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      )
    }

    // 🔹 Buat token sederhana (lebih secure dengan random string)
    const token = `token_${user.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`

    // 🔹 Pastikan role dalam format yang konsisten
    const userRole = user.role.toLowerCase()

    // 🔹 Validasi role
    if (userRole !== "admin" && userRole !== "spg") {
      return NextResponse.json(
        { error: "Role tidak valid. Hubungi administrator." },
        { status: 403 }
      )
    }

    // 🔹 Kirim respons sukses dengan data lengkap
    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: userRole, // lowercase untuk konsistensi
      },
      message: "Login berhasil"
    })

    // ✅ BONUS: Set cookie untuk keamanan tambahan (opsional)
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7 hari
    })

    return response

  } catch (error) {
    console.error("[API] Login error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 }
    )
  }
}

// ✅ BONUS: Tambahkan endpoint untuk verify token
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json(
        { error: "Token tidak ditemukan" },
        { status: 401 }
      )
    }

    // Validasi token sederhana (extract user id dari token)
    const tokenParts = token.split('_')
    const userId = tokenParts[1]

    if (!userId) {
      return NextResponse.json(
        { error: "Token tidak valid" },
        { status: 401 }
      )
    }

    const users = await getAllUsers()
    const user = users.find((u: any) => u.id.toString() === userId)

    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role.toLowerCase(),
      }
    })

  } catch (error) {
    console.error("[API] Verify token error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}