// File: /app/api/employees/create/route.ts
// UPDATE: Tambahkan handling untuk daftarToko

import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// POST - Create Employee
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      name, 
      email, 
      role, 
      status, 
      joinDate, 
      createAccount, 
      password,
      daftarToko // ← TAMBAHAN
    } = body

    // Validasi
    if (!name || !email) {
      return NextResponse.json(
        { error: "Nama dan email wajib diisi" },
        { status: 400 }
      )
    }

    if (createAccount && !password) {
      return NextResponse.json(
        { error: "Password wajib diisi jika membuat akun" },
        { status: 400 }
      )
    }

    // Buat employee
    const employee = await prisma.employees.create({
      data: {
        nama: name,
        email: email,
        posisi: role,
        status: status,
        join_date: joinDate ? new Date(joinDate) : null,
        daftar_toko: daftarToko || [], // ← TAMBAHAN: Simpan array toko
      },
    })

    // Buat user jika diminta
    if (createAccount && password) {
      const hashedPassword = await bcrypt.hash(password, 10)
      
      const user = await prisma.users.create({
        data: {
          nama: name,
          email: email,
          password: hashedPassword,
          role: role.toLowerCase(),
        },
      })

      // Link employee dengan user
      await prisma.employees.update({
        where: { id: employee.id },
        data: { user_id: user.id },
      })
    }

    return NextResponse.json(
      { success: true, employee },
      { status: 201 }
    )
  } catch (error) {
    console.error("❌ Error creating employee:", error)
    return NextResponse.json(
      { error: "Gagal menambahkan karyawan" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - Update Employee
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { 
      id, 
      name, 
      email, 
      role, 
      status, 
      joinDate, 
      changePassword, 
      newPassword,
      daftarToko // ← TAMBAHAN
    } = body

    // Validasi
    if (!id) {
      return NextResponse.json(
        { error: "ID karyawan wajib diisi" },
        { status: 400 }
      )
    }

    if (!name || !email) {
      return NextResponse.json(
        { error: "Nama dan email wajib diisi" },
        { status: 400 }
      )
    }

    // Update employee
    const employee = await prisma.employees.update({
      where: { id: parseInt(id) },
      data: {
        nama: name,
        email: email,
        posisi: role,
        status: status,
        join_date: joinDate ? new Date(joinDate) : null,
        daftar_toko: daftarToko || [], // ← TAMBAHAN: Update array toko
      },
    })

    // Reset password jika diminta (admin reset)
    if (changePassword && newPassword && employee.user_id) {
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      
      await prisma.users.update({
        where: { id: employee.user_id },
        data: {
          password: hashedPassword,
          nama: name,
          email: email,
          role: role.toLowerCase(),
        },
      })
    } else if (employee.user_id) {
      // Update user data tanpa password
      await prisma.users.update({
        where: { id: employee.user_id },
        data: {
          nama: name,
          email: email,
          role: role.toLowerCase(),
        },
      })
    }

    return NextResponse.json(
      { success: true, employee },
      { status: 200 }
    )
  } catch (error) {
    console.error("❌ Error updating employee:", error)
    return NextResponse.json(
      { error: "Gagal memperbarui karyawan" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}