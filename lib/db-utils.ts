import { prisma } from "@/lib/prisma"

// ==========================
// 🧍 USERS CRUD
// ==========================
export async function getAllUsers() {
  return await prisma.users.findMany()
}

export async function getUserByEmail(email: string) {
  return await prisma.users.findUnique({ where: { email } })
}

export async function createUser(data: {
  nama: string
  email: string
  password: string
  role: "admin" | "spg"
}) {
  return await prisma.users.create({ data })
}

// ==========================
// 🏷 PRODUCTS CRUD (Updated)
// ==========================
export async function getAllProducts() {
  return await prisma.produk.findMany()
}

export async function createProduct(data: {
  nama: string
  sku: string
  category: string
  pcs_per_karton: number  // ✅ TAMBAH
  status?: "Aktif" | "Nonaktif"
}) {
  return await prisma.produk.create({ data })
}

export async function updateProduct(id: number, data: Partial<{
  nama: string
  sku: string
  category: string
  pcs_per_karton: number  // ✅ TAMBAH
  status: "Aktif" | "Nonaktif"
}>) {
  return await prisma.produk.update({ where: { id }, data })
}

export async function deleteProduct(id: number) {
  return await prisma.produk.delete({ where: { id } })
}

// ==========================
// 👥 EMPLOYEES CRUD
// ==========================
export async function getAllEmployees() {
  return await prisma.employees.findMany()
}

export async function createEmployee(data: {
  nama: string
  email?: string
  posisi?: string
  kontak?: string
  alamat?: string
  status?: string
  join_date?: Date
}) {
  return await prisma.employees.create({ data })
}

export async function updateEmployee(id: number, data: Partial<{
  nama: string
  email: string
  posisi: string
  kontak: string
  alamat: string
  status: string
  join_date: Date
}>) {
  return await prisma.employees.update({ where: { id }, data })
}

export async function deleteEmployee(id: number) {
  return await prisma.employees.delete({ where: { id } })
}

// ==========================
// 💰 SALES REPORTS CRUD (Updated)
// ==========================
export async function getAllSalesReports() {
  return await prisma.penjualan.findMany({
    include: { produk: true, user: true },
  })
}

/**
 * ✅ CREATE SALES REPORT dengan auto-convert logic
 * Input: total_pcs yang dijual
 * Output: auto-convert ke karton + sisa pcs
 */
export async function createSalesReport(data: {
  spg_id: number
  tanggal: string
  produk_id: number
  total_pcs: number          // ✅ UBAH: dari penjualan_pack
  harga_pcs: number          // ✅ UBAH: dari harga_pack
  harga_karton: number       // ✅ TETAP
  nama_toko_transaksi: string
  notes?: string
}) {
  // 1. Ambil data produk untuk mendapatkan pcs_per_karton
  const produk = await prisma.produk.findUnique({
    where: { id: data.produk_id },
  })

  if (!produk) {
    throw new Error("Produk tidak ditemukan")
  }

  // 2. Auto-convert total_pcs ke karton + sisa pcs
  const penjualan_karton = Math.floor(data.total_pcs / produk.pcs_per_karton)
  const penjualan_pcs = data.total_pcs % produk.pcs_per_karton

  // 3. Hitung total harga
  const total = (penjualan_karton * data.harga_karton) + (penjualan_pcs * data.harga_pcs)

  // 4. Simpan ke database
  return await prisma.penjualan.create({
    data: {
      spg_id: data.spg_id,
      tanggal: new Date(data.tanggal),
      produk_id: data.produk_id,
      penjualan_karton,
      penjualan_pcs,              // ✅ UBAH: dari penjualan_pack
      harga_karton: data.harga_karton,
      harga_pcs: data.harga_pcs,  // ✅ UBAH: dari harga_pack
      nama_toko_transaksi: data.nama_toko_transaksi,
      total: total,
      notes: data.notes || null,
    },
    include: {
      produk: true,
      user: true,
    },
  })
}