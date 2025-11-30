"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Edit2, X, Save, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface SalesData {
  id: string
  tanggal: string
  produk: string
  produkId: number
  produkPcsPerKarton: number
  penjualanKarton: number
  penjualanPcs: number
  hargaKarton: number
  hargaPcs: number
  namaTokoTransaksi: string
  total: number
}

export default function SalesHistory() {
  const { user, isLoading } = useAuth()

  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    totalPcs: "",
    hargaKarton: "",
    hargaPcs: "",
    namaTokoTransaksi: "",
  })
  const [editResult, setEditResult] = useState<{ karton: number; sisaPcs: number; total: number } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user || !user.id || isLoading) return
    fetchSalesHistory()
  }, [user, isLoading])

  const fetchSalesHistory = async () => {
    try {
      setLoading(true)
      setError("")

      const today = new Date()
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(today.getDate() - 30)

      const params = new URLSearchParams({
        startDate: thirtyDaysAgo.toISOString().split("T")[0],
        endDate: today.toISOString().split("T")[0],
        spgId: user!.id.toString(),
      })

      const response = await fetch(`/api/sales/list?${params.toString()}`)
      if (!response.ok) throw new Error("Gagal mengambil data penjualan")

      const data = await response.json()
      if (Array.isArray(data)) {
        const transformed = data.map((item: any) => ({
          id: item.id,
          tanggal: item.tanggal,
          produk: item.produk,
          produkId: item.produkId || 0,
          produkPcsPerKarton: item.produkPcsPerKarton || 1,
          penjualanKarton: item.penjualanKarton || 0,
          penjualanPcs: item.penjualanPcs || 0,
          hargaKarton: item.hargaKarton || 0,
          hargaPcs: item.hargaPcs || 0,
          namaTokoTransaksi: item.toko || "",
          total: item.total || 0,
        }))
        setSalesData(transformed)
      } else {
        setSalesData([])
        setError("Format data tidak valid")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data")
      setSalesData([])
    } finally {
      setLoading(false)
    }
  }

  const canEdit = (tanggal: string): boolean => {
    const salesDate = new Date(tanggal)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    salesDate.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((today.getTime() - salesDate.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 2
  }

  const handleEdit = (row: SalesData) => {
    if (!canEdit(row.tanggal)) {
      setError("Laporan hanya bisa diedit maksimal 2 hari setelah tanggal transaksi")
      return
    }

    const totalPcs = (row.penjualanKarton * row.produkPcsPerKarton) + row.penjualanPcs
    setEditingId(row.id)
    setEditForm({
      totalPcs: String(totalPcs),
      hargaKarton: String(row.hargaKarton),
      hargaPcs: String(row.hargaPcs),
      namaTokoTransaksi: row.namaTokoTransaksi,
    })
    setError("")
  }

  useEffect(() => {
    if (editingId) {
      const row = salesData.find(r => r.id === editingId)
      if (!row) return
      const totalPcs = Number(editForm.totalPcs)
      const hargaKarton = Number(editForm.hargaKarton)
      const hargaPcs = Number(editForm.hargaPcs)
      const pcsPerKarton = row.produkPcsPerKarton

      if (totalPcs > 0 && hargaKarton > 0 && hargaPcs > 0 && pcsPerKarton > 0) {
        const karton = Math.floor(totalPcs / pcsPerKarton)
        const sisaPcs = totalPcs % pcsPerKarton
        const total = (karton * hargaKarton) + (sisaPcs * hargaPcs)
        setEditResult({ karton, sisaPcs, total })
      } else {
        setEditResult(null)
      }
    }
  }, [editForm, editingId, salesData])

  const handleSave = async () => {
    if (!editingId || !editResult) return

    try {
      setSaving(true)
      setError("")

      const response = await fetch(`/api/sales/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          totalPcs: Number(editForm.totalPcs),
          hargaKarton: Number(editForm.hargaKarton),
          hargaPcs: Number(editForm.hargaPcs),
          namaTokoTransaksi: editForm.namaTokoTransaksi,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Gagal mengupdate laporan")
      }

      await fetchSalesHistory()
      setEditingId(null)
      setEditResult(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan perubahan")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditResult(null)
    setError("")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Memuat data pengguna...
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-10 text-slate-500">
        <p>Anda belum login.</p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[clamp(1rem,3vw,1.5rem)]">Riwayat Penjualan</CardTitle>
        <CardDescription className="text-[clamp(0.7rem,2vw,1rem)]">
          Laporan 30 hari terakhir • Edit maksimal H+2
          {salesData.length > 0 && (
            <span className="ml-2 text-sm font-medium text-blue-600">
              ({salesData.length} transaksi)
            </span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            <span className="ml-2 text-slate-500">Memuat data penjualan...</span>
          </div>
        ) : salesData.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>Tidak ada data penjualan dalam 30 hari terakhir.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-slate-50 text-[clamp(0.6rem,1.5vw,0.8rem)] font-medium text-slate-700">
                  <th className="px-3 py-2 text-left">Tanggal</th>
                  <th className="px-3 py-2 text-left">Produk</th>
                  <th className="px-3 py-2 text-center">Karton</th>
                  <th className="px-3 py-2 text-center">Pcs</th>
                  <th className="px-3 py-2 text-right">Harga Karton</th>
                  <th className="px-3 py-2 text-right">Harga Pcs</th>
                  <th className="px-3 py-2 text-left">Toko</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2 text-center">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {salesData.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-slate-50">
                    {editingId === row.id ? (
                      <td colSpan={9} className="px-3 py-2 text-[clamp(0.6rem,1.3vw,0.8rem)] bg-blue-50">
                        <div className="space-y-3 p-2 rounded">
                          <div className="grid grid-cols-4 gap-2">
                            <div>
                              <Label className="text-[clamp(0.55rem,1vw,0.7rem)]">Total Pcs</Label>
                              <Input
                                type="number"
                                value={editForm.totalPcs}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, totalPcs: e.target.value })
                                }
                                className="h-8 text-[clamp(0.55rem,1vw,0.7rem)]"
                              />
                            </div>
                            <div>
                              <Label className="text-[clamp(0.55rem,1vw,0.7rem)]">Harga Karton</Label>
                              <Input
                                type="number"
                                value={editForm.hargaKarton}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, hargaKarton: e.target.value })
                                }
                                className="h-8 text-[clamp(0.55rem,1vw,0.7rem)]"
                              />
                            </div>
                            <div>
                              <Label className="text-[clamp(0.55rem,1vw,0.7rem)]">Harga Pcs</Label>
                              <Input
                                type="number"
                                value={editForm.hargaPcs}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, hargaPcs: e.target.value })
                                }
                                className="h-8 text-[clamp(0.55rem,1vw,0.7rem)]"
                              />
                            </div>
                            <div>
                              <Label className="text-[clamp(0.55rem,1vw,0.7rem)]">Toko</Label>
                              <Input
                                value={editForm.namaTokoTransaksi}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, namaTokoTransaksi: e.target.value })
                                }
                                className="h-8 text-[clamp(0.55rem,1vw,0.7rem)]"
                              />
                            </div>
                          </div>

                          {editResult && (
                            <div className="text-[clamp(0.6rem,1vw,0.75rem)] bg-white p-2 rounded flex justify-between">
                              <span>
                                <strong>Preview:</strong>{" "}
                                {editResult.karton} karton + {editResult.sisaPcs} pcs
                              </span>
                              <strong className="text-green-600">
                                Rp {editResult.total.toLocaleString("id-ID")}
                              </strong>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleSave}
                              disabled={saving || !editResult}
                              className="h-8 bg-green-600 hover:bg-green-700 text-[clamp(0.6rem,1vw,0.75rem)]"
                            >
                              {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                              ) : (
                                <Save className="w-4 h-4 mr-1" />
                              )}
                              Simpan
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancel}
                              disabled={saving}
                              className="h-8 text-[clamp(0.6rem,1vw,0.75rem)]"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Batal
                            </Button>
                          </div>
                        </div>
                      </td>
                    ) : (
                      <>
                        <td className="px-3 py-2 text-[clamp(0.6rem,1vw,0.75rem)] font-medium">
                          {new Date(row.tanggal).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </td>
                        <td className="px-3 py-2 text-[clamp(0.6rem,1vw,0.75rem)]">{row.produk}</td>
                        <td className="px-3 py-2 text-[clamp(0.6rem,1vw,0.75rem)] text-center">{row.penjualanKarton}</td>
                        <td className="px-3 py-2 text-[clamp(0.6rem,1vw,0.75rem)] text-center">{row.penjualanPcs}</td>
                        <td className="px-3 py-2 text-[clamp(0.6rem,1vw,0.75rem)] text-right">
                          Rp {row.hargaKarton.toLocaleString("id-ID")}
                        </td>
                        <td className="px-3 py-2 text-[clamp(0.6rem,1vw,0.75rem)] text-right">
                          Rp {row.hargaPcs.toLocaleString("id-ID")}
                        </td>
                        <td className="px-3 py-2 text-[clamp(0.6rem,1vw,0.75rem)]">{row.namaTokoTransaksi}</td>
                        <td className="px-3 py-2 text-[clamp(0.7rem,1.2vw,0.85rem)] text-right font-semibold text-blue-600">
                          Rp {row.total.toLocaleString("id-ID")}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {canEdit(row.tanggal) ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(row)}
                              className="h-7 w-7 p-0"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-400">🔒</span>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
