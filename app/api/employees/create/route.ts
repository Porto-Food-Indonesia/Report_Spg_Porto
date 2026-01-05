// File: /api/employees/create/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// ==================== CREATE - POST ====================
export async function POST(req: NextRequest) {
  try {
    const { name, email, role, status, joinDate, createAccount, password } = await req.json()

    console.log("📝 CREATE Employee:", { name, email, role, createAccount })

    if (!name || !email || !role) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    // Create account in users table only if requested
    let userId: number | null = null
    if (createAccount && password) {
      if (password.length < 6) {
        return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 })
      }

      // Check if email already exists in users table
      const existingUser = await prisma.users.findUnique({ where: { email } })
      if (existingUser) {
        return NextResponse.json({ error: "Email sudah digunakan untuk akun lain" }, { status: 400 })
      }

      // Plain text password
      const newUser = await prisma.users.create({
        data: { 
          nama: name, 
          email, 
          password: password,
          role: role  // ✅ FIX: Hapus .toLowerCase()
        },
      })
      userId = newUser.id
      console.log("✅ User account created with ID:", userId)
    }

    // CREATE employee with user_id link
    const employee = await prisma.employees.create({
      data: {
        nama: name,
        email,
        posisi: role,
        status: status || "Aktif",
        join_date: joinDate ? new Date(joinDate) : new Date(),
        user_id: userId,
      },
    })

    console.log("✅ Employee created:", employee.id, "linked to user_id:", userId)

    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    console.error("❌ [POST /employees] Create employee error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

// ==================== UPDATE - PUT (IMPROVED VERSION) ====================
export async function PUT(req: NextRequest) {
  try {
    const { id, name, email, role, status, joinDate, changePassword, newPassword } = await req.json()

    console.log("\n🔄 ===== UPDATE EMPLOYEE START =====")
    console.log("📝 Employee ID:", id)
    console.log("📝 New Data:", { name, email, role, status, changePassword })

    // ===== VALIDASI INPUT =====
    if (!id || !name || !email || !role) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    // ===== STEP 1: Get current employee data =====
    const currentEmployee = await prisma.employees.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        nama: true,
        email: true,
        posisi: true,
        status: true,
        join_date: true,
        user_id: true
      }
    })

    if (!currentEmployee) {
      return NextResponse.json({ error: "Karyawan tidak ditemukan" }, { status: 404 })
    }

    console.log("📊 Current Employee:")
    console.log("  - Nama:", currentEmployee.nama)
    console.log("  - Email:", currentEmployee.email)
    console.log("  - Posisi:", currentEmployee.posisi)
    console.log("  - User ID:", currentEmployee.user_id)
    
    // ===== STEP 2: Validate email uniqueness if changed =====
    if (email !== currentEmployee.email) {
      console.log("🔍 Email changed, checking for duplicates...")
      
      // Check in users table (if employee has account)
      if (currentEmployee.user_id) {
        const emailExistsInUsers = await prisma.users.findFirst({
          where: { 
            email: email,
            id: { not: currentEmployee.user_id } // Exclude current user
          }
        })

        if (emailExistsInUsers) {
          console.log("❌ Email already exists in users table")
          return NextResponse.json({ 
            error: "Email sudah digunakan oleh user lain" 
          }, { status: 400 })
        }
      }

      // Check in employees table
      const emailExistsInEmployees = await prisma.employees.findFirst({
        where: { 
          email: email,
          id: { not: parseInt(id) } // Exclude current employee
        }
      })

      if (emailExistsInEmployees) {
        console.log("❌ Email already exists in employees table")
        return NextResponse.json({ 
          error: "Email sudah digunakan oleh karyawan lain" 
        }, { status: 400 })
      }

      console.log("✅ Email available")
    }

    // ===== STEP 3: Validate password if changing =====
    if (changePassword) {
      if (!currentEmployee.user_id) {
        return NextResponse.json({ 
          error: "Karyawan ini tidak memiliki akun user, tidak bisa ganti password" 
        }, { status: 400 })
      }

      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ 
          error: "Password baru minimal 6 karakter" 
        }, { status: 400 })
      }
    }

    // ===== STEP 4 & 5: Update BOTH tables using TRANSACTION =====
    console.log("\n🔄 Starting transaction to update both tables...")

    const result = await prisma.$transaction(async (tx) => {
      let updatedUser = null

      // Update USERS table first (if employee has account)
      if (currentEmployee.user_id) {
        console.log("📝 Updating USERS table...")
        
        const userUpdateData: {
          nama: string
          email: string
          role: string
          password?: string
        } = {
          nama: name,
          email: email,
          role: role,  // ✅ FIX: Hapus .toLowerCase()
        }

        // Add password if changing
        if (changePassword && newPassword) {
          userUpdateData.password = newPassword
          console.log("🔑 Password will be updated")
        }

        console.log("📝 User update data:", { 
          ...userUpdateData, 
          password: userUpdateData.password ? '***HIDDEN***' : undefined 
        })

        updatedUser = await tx.users.update({
          where: { id: currentEmployee.user_id },
          data: userUpdateData,
        })

        console.log("✅ USERS table updated!")
        console.log("  - User ID:", updatedUser.id)
        console.log("  - Nama:", updatedUser.nama)
        console.log("  - Email:", updatedUser.email)
        console.log("  - Role:", updatedUser.role)
      } else {
        console.log("ℹ️ Employee doesn't have user account (user_id is NULL)")
        console.log("⏭️ Skipping users table update")
      }

      // Update EMPLOYEES table
      console.log("\n📝 Updating EMPLOYEES table...")
      const updatedEmployee = await tx.employees.update({
        where: { id: parseInt(id) },
        data: {
          nama: name,
          email: email,
          posisi: role,
          status: status || "Aktif",
          join_date: joinDate ? new Date(joinDate) : currentEmployee.join_date,
        },
      })
      console.log("✅ EMPLOYEES table updated!")

      return { updatedUser, updatedEmployee }
    })

    console.log("✅ Transaction committed successfully!")
    console.log("🎉 ===== UPDATE COMPLETE =====\n")

    return NextResponse.json({ 
      success: true,
      employee: result.updatedEmployee,
      userUpdated: !!result.updatedUser,
      message: changePassword 
        ? "Data karyawan dan password berhasil diperbarui" 
        : "Data karyawan berhasil diperbarui" 
    }, { status: 200 })

  } catch (error) {
    console.error("\n❌ ===== UPDATE FAILED =====")
    console.error("Error:", error)
    
    if (error instanceof Error) {
      console.error("Message:", error.message)
      console.error("Stack:", error.stack)
    }
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Gagal update karyawan" 
    }, { status: 500 })
  }
}

// ==================== DELETE ====================
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 })
    }

    // Get employee to check if they have user account
    const employee = await prisma.employees.findUnique({
      where: { id: parseInt(id) },
      select: { user_id: true }
    })

    if (!employee) {
      return NextResponse.json({ error: "Karyawan tidak ditemukan" }, { status: 404 })
    }

    // Delete employee (user will remain for data integrity)
    // If you want to delete user too, uncomment below:
    /*
    if (employee.user_id) {
      await prisma.users.delete({
        where: { id: employee.user_id }
      })
      console.log("✅ User deleted:", employee.user_id)
    }
    */

    await prisma.employees.delete({
      where: { id: parseInt(id) },
    })

    console.log("✅ Employee deleted:", id)

    return NextResponse.json({ message: "Karyawan berhasil dihapus" }, { status: 200 })
  } catch (error) {
    console.error("❌ [DELETE /employees] Delete employee error:", error)
    return NextResponse.json({ error: "Gagal hapus karyawan" }, { status: 500 })
  }
}