import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const spgUsers = await prisma.users.findMany({
      where: { role: "spg" },
      select: {
        id: true,
        nama: true,
        email: true,
        role:  true,
        created_at:  true,
      },
      orderBy: { created_at: 'desc' },
    })

    // Transform to match frontend expectations
    const transformedSPG = spgUsers.map(spg => ({
      id: spg.id. toString(),
      name: spg.nama,
      email: spg.email || '',
      role: spg.role || 'spg',
      status: 'Aktif', // SPG dari users table, assume aktif
      joinDate: spg.created_at ?  spg.created_at.toISOString().split('T')[0] : '',
      userId: spg.id. toString(), // Untuk SPG, userId = id dari users table
      profilePhoto: null, // Users table tidak punya foto, bisa ditambah nanti
    }))

    console.log("📊 Fetched SPG users:", transformedSPG. length)
    console.log("📋 Sample SPG:", transformedSPG[0])
    
    return NextResponse.json(transformedSPG)
  } catch (error) {
    console.error("❌ List SPG error:", error)
    return NextResponse.json(
      { error: "Failed to fetch SPG data" },
      { status: 500 }
    )
  }
}