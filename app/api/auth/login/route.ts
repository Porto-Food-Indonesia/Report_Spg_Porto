  import { NextRequest, NextResponse } from "next/server"
  import { getAllUsers } from "@/lib/db-utils"

  export async function POST(request: NextRequest) {
    try {
      const { email, password } = await request.json()

      if (!email || !password) {
        return NextResponse.json(
          { error: "Email dan password harus diisi" },
          { status: 400 }
        )
      }

      // 🔹 Ambil semua user dari database (pakai await!)
      const users = await getAllUsers()

      // 🔹 Cek apakah email dan password cocok
      const user = users.find(
        (u: any) => u.email === email && u.password === password
      )

      if (!user) {
        return NextResponse.json(
          { error: "Email atau password salah" },
          { status: 401 }
        )
      }

      // 🔹 Buat token sederhana
      const token = `token_${user.id}_${Date.now()}`

      // 🔹 Kirim respons sukses
      return NextResponse.json({
        token,
        user: {
          id: user.id,
          nama: user.nama,
          email: user.email,
          role: user.role,
        },
      })
    } catch (error) {
      console.error("[v0] Login error:", error)
      return NextResponse.json(
        { error: "Terjadi kesalahan server" },
        { status: 500 }
      )
    }
  }
