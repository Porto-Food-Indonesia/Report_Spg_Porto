import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';

// ✅ Type Definition
interface Product {
  id: number;
  nama: string;
  sku: string;
  category: string;
  pcs_per_karton: number;
  status: string;
  created_at?: Date;
}

interface FormData {
  nama: string;
  sku: string;
  category: string;
  pcs_per_karton: number;
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
    category: "",
    pcs_per_karton: 1,
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

    if (!formData.pcs_per_karton || formData.pcs_per_karton < 1) {
      setError('Jumlah pcs per karton harus diisi minimal 1');
      return;
    }

    try {
      setError('');
      setSuccess('');

      const method = editingId ? 'PUT' : 'POST';
      const url = '/api/products/create';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...formData } : formData),
      });

      if (!response.ok) throw new Error('Gagal menyimpan produk');

      setSuccess(editingId ? 'Produk berhasil diperbarui!' : 'Produk berhasil ditambahkan!');
      setFormData({ nama: '', sku: '', category: '', pcs_per_karton: 1, status: 'Aktif' });
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
      pcs_per_karton: product.pcs_per_karton || 1,
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
    setFormData({ nama: '', sku: '', category: '', pcs_per_karton: 1, status: 'Aktif' });
    setError('');
    setSuccess('');
  };

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
                Input data produk dan tentukan berapa pcs dalam 1 karton. Harga akan diinput oleh SPG saat membuat laporan.
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
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori *</Label>
                  <Input
                    id="category"
                    placeholder="Contoh: Frozen Food"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="bg-white border-slate-200"
                  />
                </div>
                
                {/* ✅ INPUT PCS PER KARTON */}
                <div className="space-y-2">
                  <Label htmlFor="pcs_per_karton" className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Jumlah Pcs per Karton *
                  </Label>
                  <Input
                    id="pcs_per_karton"
                    type="number"
                    min="1"
                    placeholder="Contoh: 15"
                    value={formData.pcs_per_karton}
                    onChange={(e) => setFormData({ ...formData, pcs_per_karton: parseInt(e.target.value) || 1 })}
                    className="bg-white border-slate-200"
                  />
                  <p className="text-xs text-slate-500">1 karton = berapa pcs?</p>
                </div>
                
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

              {/* Preview Karton */}
              {formData.pcs_per_karton > 1 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                  <strong>Preview:</strong> 1 karton {formData.nama || 'produk ini'} = {formData.pcs_per_karton} pcs
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

        {/* ✅ Tabel Produk dengan kolom Pcs/Karton */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Daftar Produk</CardTitle>
              <CardDescription>Kelola master data produk dan konversi karton</CardDescription>
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
                      <th className="px-4 py-3 text-left text-sm font-medium">Kategori</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">
                        <div className="flex items-center justify-center gap-1">
                          <Package className="w-4 h-4" />
                          Pcs/Karton
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
                          <td className="px-4 py-3 text-sm">{product.category}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-sm font-semibold">
                              <Package className="w-3 h-3" />
                              {product.pcs_per_karton || 1} pcs
                            </span>
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
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
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