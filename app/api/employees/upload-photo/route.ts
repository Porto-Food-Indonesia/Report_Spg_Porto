// File: /api/employees/upload-photo/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { employeeId, photoUrl } = body

    if (!employeeId || !photoUrl) {
      return NextResponse.json(
        { error: "Employee ID dan foto harus diisi" },
        { status: 400 }
      )
    }

    // Update foto_profil di tabel employees
    await prisma.employees.update({
      where: { id: parseInt(employeeId) },
      data: { foto_profil: photoUrl }
    })

    console.log("✅ Profile photo updated for employee:", employeeId)

    return NextResponse.json({ 
      success: true, 
      message: "Photo uploaded successfully" 
    })
  } catch (error) {
    console.error("❌ Upload photo error:", error)
    return NextResponse.json(
      { error: "Failed to upload photo" },
      { status: 500 }
    )
  }
}