import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit2, Trash2, Package, Weight } from 'lucide-react';

// ✅ Type Definition
interface Product {
  id: number;
  nama: string;
  sku: string;
  category: string;
  pcs_per_karton: number;
  gram_per_pcs: number | null;
  status: string;
  created_at?: Date;
}

interface FormData {
  nama: string;
  sku: string;
  category: string;
  pack_per_karton: number;
  status: string;
}

export default function ProductManagementView() {
  const [showForm, setShowForm] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    nama: "",
    sku: "",
    category: "Pack/Karton",
    pack_per_karton: 1,
    status: "Aktif",
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products/list');
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Gagal mengambil data produk');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!formData.nama || !formData.sku || !formData.category) {
      setError('Nama produk, SKU, dan kategori harus diisi');
      return;
    }

    // Validasi untuk produk Pack/Karton
    if (formData.category === "Pack/Karton" && (!formData.pack_per_karton || formData.pack_per_karton < 1)) {
      setError('Untuk produk Pack/Karton, jumlah pack per karton harus diisi minimal 1');
      return;
    }

    try {
      setError('');
      setSuccess('');

      const method = editingId ? 'PUT' : 'POST';
      const url = '/api/products/create';

      const dataToSend = {
        ...formData,
        pack_per_karton: formData.category === "Pack/Karton" ? formData.pack_per_karton : null
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...dataToSend } : dataToSend),
      });

      if (!response.ok) throw new Error('Gagal menyimpan produk');

      setSuccess(editingId ? 'Produk berhasil diperbarui!' : 'Produk berhasil ditambahkan!');
      setFormData({ nama: '', sku: '', category: 'Pack/Karton', pack_per_karton: 1, status: 'Aktif' });
      setEditingId(null);
      setShowForm(false);
      await fetchProducts();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
      setError(errorMessage);
      console.error(err);
    }
  };

  const handleEditProduct = (product: Product) => {
    setFormData({
      nama: product.nama,
      sku: product.sku,
      category: product.category,
      pack_per_karton: product.pcs_per_karton || 1,
      status: product.status,
    });
    setEditingId(product.id);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Nonaktifkan produk ini?')) return;
    try {
      const response = await fetch(`/api/products/create`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'Nonaktif' }),
      });

      if (!response.ok) throw new Error('Gagal menonaktifkan produk');
      setSuccess('Produk berhasil dinonaktifkan!');
      await fetchProducts();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
      setError(errorMessage);
      console.error(err);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ nama: '', sku: '', category: 'Pack/Karton', pack_per_karton: 1, status: 'Aktif' });
    setError('');
    setSuccess('');
  };

  const isCurah = formData.category === "Curah";

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {success && !showForm && (
          <div className="p-4 bg-green-100 border border-green-300 rounded text-green-700">
            {success}
          </div>
        )}

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Produk' : 'Tambah Produk Baru'}</CardTitle>
              <CardDescription>
                Pilih kategori: Pack/Karton untuk produk standar dengan konversi karton, atau Curah untuk produk yang dijual per gram
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">{error}</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Produk *</Label>
                  <Input
                    id="nama"
                    placeholder="Contoh: Bartoz Sosis 500 gram"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="bg-white border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    placeholder="Contoh: BRZ-500"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="bg-white border-slate-200"
                  />
                </div>

                {/* ✅ KATEGORI CURAH / PACK */}
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori Produk *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, category: 'Pack/Karton' })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.category === 'Pack/Karton'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Package className={`w-5 h-5 ${
                          formData.category === 'Pack/Karton' ? 'text-blue-600' : 'text-slate-400'
                        }`} />
                        <div className="text-left">
                          <div className="font-semibold text-sm">Pack/Karton</div>
                          <div className="text-xs text-slate-500">Dijual utuh</div>
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, category: 'Curah' })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.category === 'Curah'
                          ? 'border-green-500 bg-green-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Weight className={`w-5 h-5 ${
                          formData.category === 'Curah' ? 'text-green-600' : 'text-slate-400'
                        }`} />
                        <div className="text-left">
                          <div className="font-semibold text-sm">Curah</div>
                          <div className="text-xs text-slate-500">Per gram</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
                
                {/* ✅ INPUT PACK PER KARTON (hanya untuk Pack/Karton) */}
                {!isCurah && (
                  <div className="space-y-2">
                    <Label htmlFor="pack_per_karton" className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Jumlah Pack per Karton *
                    </Label>
                    <Input
                      id="pack_per_karton"
                      type="number"
                      min="1"
                      placeholder="Contoh: 15"
                      value={formData.pack_per_karton}
                      onChange={(e) => setFormData({ ...formData, pack_per_karton: parseInt(e.target.value) || 1 })}
                      className="bg-white border-slate-200"
                    />
                    <p className="text-xs text-slate-500">1 karton = berapa pack?</p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="bg-white border-slate-200 border rounded px-3 py-2 w-full"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              {/* Preview Konversi */}
              {!isCurah && formData.pack_per_karton > 1 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                  <div className="font-semibold text-blue-900 text-sm">Preview Konversi:</div>
                  <div className="text-sm text-blue-800 mt-1">
                    1 karton = {formData.pack_per_karton} pack
                  </div>
                </div>
              )}

              {/* Info Kategori Curah */}
              {isCurah && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                  <strong>Info Produk Curah:</strong> Produk ini akan dijual per gram. SPG akan input jumlah gram saat membuat laporan penjualan.
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSaveProduct} className="bg-blue-600 hover:bg-blue-700">
                  {editingId ? 'Update' : 'Simpan'} Produk
                </Button>
                <Button onClick={handleCancel} variant="outline">
                  Batal
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ✅ Tabel Produk dengan kolom Kategori dan Gram */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Daftar Produk</CardTitle>
              <CardDescription>Kelola master data produk dengan kategori Pack/Karton dan Curah</CardDescription>
            </div>
            {!showForm && (
              <Button onClick={() => setShowForm(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                Tambah Produk
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="px-4 py-3 text-left text-sm font-medium">Nama Produk</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">SKU</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Kategori</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">
                        <div className="flex items-center justify-center gap-1">
                          <Package className="w-4 h-4" />
                          Pack/Karton
                        </div>
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium">
                        <div className="flex items-center justify-center gap-1">
                          <Weight className="w-4 h-4" />
                          Gram/Pack
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(products) && products.length > 0 ? (
                      products.map((product) => (
                        <tr key={product.id} className="border-b hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm font-medium">{product.nama}</td>
                          <td className="px-4 py-3 text-sm">{product.sku}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                              product.category === 'Curah' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {product.category === 'Curah' ? (
                                <Weight className="w-3 h-3" />
                              ) : (
                                <Package className="w-3 h-3" />
                              )}
                              {product.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {product.category === 'Pack/Karton' ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-sm font-semibold">
                                {product.pcs_per_karton || 1} pack
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {product.category === 'Curah' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">
                                <Weight className="w-3 h-3" />
                                Per gram
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                product.status === 'Aktif'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {product.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditProduct(product)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                          Belum ada produk. Klik tombol "Tambah Produk" untuk menambahkan produk baru.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}