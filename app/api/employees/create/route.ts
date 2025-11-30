import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// CREATE - POST
export async function POST(req: NextRequest) {
  try {
    const { name, email, role, status, joinDate, createAccount, password } = await req.json()

    if (!name || !email || !role) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    // Create account in users table only if requested
    let userId: number | null = null
    if (createAccount && password) {
      const newUser = await prisma.users.create({
        data: { nama: name, email, password, role: role.toLowerCase() as "admin" | "spg" },
      })
      userId = newUser.id
    }

    const employee = await prisma.employees.create({
      data: {
        nama: name,
        email,
        posisi: role.toLowerCase() as "admin" | "spg",
        status: status || "Aktif",
        join_date: joinDate ? new Date(joinDate) : new Date(),
      },
    })

    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    console.error("[POST /employees] Create employee error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

// UPDATE - PUT
export async function PUT(req: NextRequest) {
  try {
    const { id, name, email, role, status, joinDate } = await req.json()

    if (!id || !name || !email || !role) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    const employee = await prisma.employees.update({
      where: { id: parseInt(id) },
      data: {
        nama: name,
        email,
        posisi: role.toLowerCase() as "admin" | "spg",
        status: status || "Aktif",
        join_date: joinDate ? new Date(joinDate) : undefined,
      },
    })

    return NextResponse.json(employee, { status: 200 })
  } catch (error) {
    console.error("[PUT /employees] Update employee error:", error)
    return NextResponse.json({ error: "Gagal update karyawan" }, { status: 500 })
  }
}

// DELETE
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 })
    }

    await prisma.employees.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ message: "Karyawan berhasil dihapus" }, { status: 200 })
  } catch (error) {
    console.error("[DELETE /employees] Delete employee error:", error)
    return NextResponse.json({ error: "Gagal hapus karyawan" }, { status: 500 })
  }
}