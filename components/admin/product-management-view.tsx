import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit2, Package, Weight, CheckCircle2, XCircle, Box, Layers, Search, AlertTriangle, X } from 'lucide-react';

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

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface ProductManagementViewProps {
  theme: 'dark' | 'light';
}

export default function ProductManagementView({ theme }: ProductManagementViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<FormData>({
    nama: "",
    sku: "",
    category: "Pack/Karton",
    pack_per_karton: 1,
    status: "Aktif",
  });
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Theme classes
  const isDark = theme === 'dark';
  const bgClass = isDark 
    ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
    : 'bg-gradient-to-br from-slate-50 via-white to-slate-100';
  
  const cardBgClass = isDark
    ? 'bg-slate-800/50 border-slate-700/50'
    : 'bg-white border-slate-200';
  
  const textClass = isDark ? 'text-white' : 'text-slate-900';
  const textSecondaryClass = isDark ? 'text-slate-400' : 'text-slate-600';
  const inputBgClass = isDark ? 'bg-slate-700/50 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-900';
  const hoverBgClass = isDark ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50';
  const tableHeaderBg = isDark ? 'bg-slate-700/50' : 'bg-slate-100';
  const tableRowBg = isDark ? 'bg-slate-800/30' : 'bg-slate-50/50';
  const borderClass = isDark ? 'border-slate-700/50' : 'border-slate-200';
  const selectBg = isDark ? 'bg-slate-700/50 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-900';
  const modalBg = isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const overlayBg = isDark ? 'bg-black/70' : 'bg-black/50';

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = products.filter(p => 
        p.nama.toLowerCase().includes(query) || 
        p.sku.toLowerCase().includes(query)
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products/list');
      const data = await response.json();
      const productList = Array.isArray(data) ? data : [];
      setProducts(productList);
      setFilteredProducts(productList);
    } catch (err) {
      showToast('Gagal mengambil data produk', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!formData.nama || !formData.sku || !formData.category) {
      showToast('Nama produk, SKU, dan kategori harus diisi', 'error');
      return;
    }

    if (formData.category === "Pack/Karton" && (!formData.pack_per_karton || formData.pack_per_karton < 1)) {
      showToast('Untuk produk Pack/Karton, jumlah pack per karton harus diisi minimal 1', 'error');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirmModal(false);
    
    try {
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

      showToast(editingId ? 'Produk berhasil diperbarui!' : 'Produk berhasil ditambahkan!', 'success');
      handleCloseModal();
      await fetchProducts();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Terjadi kesalahan', 'error');
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
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ nama: '', sku: '', category: 'Pack/Karton', pack_per_karton: 1, status: 'Aktif' });
  };

  const isCurah = formData.category === "Curah";
  const activeProducts = products.filter(p => p.status === 'Aktif').length;
  const inactiveProducts = products.filter(p => p.status === 'Nonaktif').length;

  return (
    <div className={`min-h-screen ${bgClass} p-6 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Toast Container */}
        <div className="fixed top-20 right-6 z-50 space-y-2">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl animate-in slide-in-from-top-5 duration-300 backdrop-blur-sm ${
                toast.type === 'success' 
                  ? 'bg-emerald-500/90 text-white border border-emerald-400/50' 
                  : 'bg-red-500/90 text-white border border-red-400/50'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
          ))}
        </div>

        {/* Modal Form */}
        {showModal && (
          <div 
            className={`fixed inset-0 z-50 flex items-center justify-center ${overlayBg} backdrop-blur-sm animate-in fade-in duration-200 p-4`}
            onClick={handleCloseModal}
          >
            <div 
              className={`${modalBg} rounded-2xl shadow-2xl max-w-2xl w-full border-2 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <Layers className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {editingId ? 'Edit Produk' : 'Tambah Produk Baru'}
                      </h3>
                      <p className="text-sm text-white/80 mt-0.5">
                        Pilih kategori: Pack/Karton atau Curah
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={textClass}>Nama Produk *</Label>
                    <Input
                      placeholder="Contoh: Bartoz Sosis 500 gram"
                      value={formData.nama}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      className={`${inputBgClass} border placeholder:text-slate-500 focus:ring-blue-500`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={textClass}>SKU *</Label>
                    <Input
                      placeholder="Contoh: BRZ-500"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className={`${inputBgClass} border placeholder:text-slate-500 focus:ring-blue-500`}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className={textClass}>Kategori Produk *</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, category: 'Pack/Karton' })}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.category === 'Pack/Karton'
                            ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                            : isDark 
                              ? 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                              : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            formData.category === 'Pack/Karton'
                              ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                              : isDark ? 'bg-slate-700' : 'bg-slate-200'
                          }`}>
                            <Package className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-left">
                            <div className={`font-semibold ${
                              formData.category === 'Pack/Karton' ? textClass : textSecondaryClass
                            }`}>Pack/Karton</div>
                            <div className={`text-xs ${textSecondaryClass}`}>Dijual utuh per pack</div>
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, category: 'Curah' })}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.category === 'Curah'
                            ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                            : isDark
                              ? 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                              : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            formData.category === 'Curah'
                              ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                              : isDark ? 'bg-slate-700' : 'bg-slate-200'
                          }`}>
                            <Weight className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-left">
                            <div className={`font-semibold ${
                              formData.category === 'Curah' ? textClass : textSecondaryClass
                            }`}>Curah</div>
                            <div className={`text-xs ${textSecondaryClass}`}>Dijual per gram</div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                  
                  {!isCurah && (
                    <div className="space-y-2">
                      <Label className={`${textClass} flex items-center gap-2`}>
                        <Package className="w-4 h-4" />
                        Jumlah Pack per Karton *
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="Contoh: 15"
                        value={formData.pack_per_karton}
                        onChange={(e) => setFormData({ ...formData, pack_per_karton: parseInt(e.target.value) || 1 })}
                        className={`${inputBgClass} border placeholder:text-slate-500 focus:ring-blue-500`}
                      />
                      <p className={`text-xs ${textSecondaryClass}`}>1 karton = berapa pack?</p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label className={textClass}>Status</Label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className={`${selectBg} border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Nonaktif">Nonaktif</option>
                    </select>
                  </div>
                </div>

                {!isCurah && formData.pack_per_karton > 1 && (
                  <div className={`p-4 ${isDark ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'} border rounded-xl`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'} flex items-center justify-center flex-shrink-0`}>
                        <Package className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <div className={`font-semibold text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Preview Konversi</div>
                        <div className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-600'} mt-1`}>
                          1 karton = {formData.pack_per_karton} pack
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {isCurah && (
                  <div className={`p-4 ${isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'} border rounded-xl`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'} flex items-center justify-center flex-shrink-0`}>
                        <Weight className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <div className={`font-semibold text-sm ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Info Produk Curah</div>
                        <div className={`text-sm ${isDark ? 'text-emerald-200' : 'text-emerald-600'} mt-1`}>
                          Produk ini dijual per gram. SPG akan input jumlah gram saat membuat laporan.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button 
                    onClick={handleSaveProduct} 
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                  >
                    {editingId ? 'Update' : 'Simpan'} Produk
                  </Button>
                  <Button 
                    onClick={handleCloseModal} 
                    variant="outline"
                    className={`flex-1 ${isDark ? 'bg-slate-700/50 border-slate-600 text-white hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-900 hover:bg-slate-200'}`}
                  >
                    Batal
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Konfirmasi */}
        {showConfirmModal && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center ${overlayBg} backdrop-blur-sm animate-in fade-in duration-200 p-4`}>
            <div className={`${modalBg} rounded-2xl shadow-2xl max-w-md w-full border-2 animate-in zoom-in duration-300`}>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                    <AlertTriangle className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <div className="text-center space-y-2">
                  <h3 className={`text-xl font-bold ${textClass}`}>Konfirmasi {editingId ? 'Update' : 'Simpan'}</h3>
                  <p className={`text-sm ${textSecondaryClass}`}>Pastikan data sudah benar sebelum menyimpan</p>
                </div>

                <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className={textSecondaryClass}>Nama:</span>
                      <span className={`font-semibold ${textClass} text-right`}>{formData.nama}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className={textSecondaryClass}>SKU:</span>
                      <span className={`font-semibold ${textClass}`}>{formData.sku}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className={textSecondaryClass}>Kategori:</span>
                      <span className={`font-semibold ${textClass}`}>{formData.category}</span>
                    </div>
                    {!isCurah && (
                      <div className="flex justify-between gap-2">
                        <span className={textSecondaryClass}>Pack/Karton:</span>
                        <span className={`font-semibold ${textClass}`}>{formData.pack_per_karton} pack</span>
                      </div>
                    )}
                    <div className="flex justify-between gap-2">
                      <span className={textSecondaryClass}>Status:</span>
                      <span className={`font-bold ${formData.status === 'Aktif' ? 'text-green-500' : 'text-red-500'}`}>
                        {formData.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowConfirmModal(false)}
                    variant="outline"
                    className={`flex-1 ${isDark ? 'bg-slate-700 hover:bg-slate-600 border-slate-600' : 'bg-white hover:bg-slate-50'}`}
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleConfirmSave}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    Ya, {editingId ? 'Update' : 'Simpan'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className={`relative overflow-hidden ${cardBgClass} border backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group`}>
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <CardContent className="relative p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className={`text-xs font-medium ${textSecondaryClass} mb-1 uppercase tracking-wide`}>Total Produk</p>
                  <h3 className={`text-2xl font-bold ${textClass}`}>{products.length}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                  <Box className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`relative overflow-hidden ${cardBgClass} border backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group`}>
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <CardContent className="relative p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className={`text-xs font-medium ${textSecondaryClass} mb-1 uppercase tracking-wide`}>Produk Aktif</p>
                  <h3 className={`text-2xl font-bold ${textClass}`}>{activeProducts}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`relative overflow-hidden ${cardBgClass} border backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group`}>
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-orange-500 to-red-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <CardContent className="relative p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className={`text-xs font-medium ${textSecondaryClass} mb-1 uppercase tracking-wide`}>Produk Nonaktif</p>
                  <h3 className={`text-2xl font-bold ${textClass}`}>{inactiveProducts}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Table */}
        <Card className={`${cardBgClass} border backdrop-blur-sm shadow-xl relative overflow-hidden`}>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className={textClass}>Daftar Produk</CardTitle>
                <CardDescription className={`${textSecondaryClass} mt-1`}>Kelola master data produk Pack/Karton dan Curah</CardDescription>
              </div>
            </div>
            <Button 
              onClick={() => setShowModal(true)} 
              className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Tambah Produk
            </Button>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Cari nama produk atau SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 ${inputBgClass} border focus:ring-blue-500`}
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16">
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500 animate-spin" />
                  <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-pink-500 border-l-cyan-500 animate-spin" style={{ animationDirection: 'reverse' }} />
                  <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Box className="w-12 h-12 text-white animate-bounce" />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 blur-2xl opacity-50 animate-pulse" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Memuat Produk
                  </h3>
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${borderClass} ${tableHeaderBg}`}>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondaryClass} uppercase tracking-wider`}>Nama Produk</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondaryClass} uppercase tracking-wider`}>SKU</th>
                      <th className={`px-4 py-3 text-center text-xs font-semibold ${textSecondaryClass} uppercase tracking-wider`}>Kategori</th>
                      <th className={`px-4 py-3 text-center text-xs font-semibold ${textSecondaryClass} uppercase tracking-wider`}>
                        <div className="flex items-center justify-center gap-1">
                          <Package className="w-4 h-4" />
                          Pack/Karton
                        </div>
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondaryClass} uppercase tracking-wider`}>Status</th>
                      <th className={`px-4 py-3 text-center text-xs font-semibold ${textSecondaryClass} uppercase tracking-wider`}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product, index) => (
                        <tr key={product.id} className={`border-b ${borderClass} ${hoverBgClass} transition-colors ${index % 2 === 0 ? tableRowBg : ''}`}>
                          <td className={`px-4 py-3 text-sm ${textClass} font-medium`}>{product.nama}</td>
                          <td className={`px-4 py-3 text-sm ${textSecondaryClass}`}>{product.sku}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              product.category === 'Curah'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}>
                              {product.category === 'Curah' ? <Weight className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                              {product.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {product.category === 'Pack/Karton' ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-sm font-semibold border border-amber-500/30">
                                {product.pcs_per_karton || 1} pack
                              </span>
                            ) : (
                              <span className={`${isDark ? 'text-slate-600' : 'text-slate-400'} text-xs`}>-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                product.status === 'Aktif'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : isDark
                                    ? 'bg-slate-600/50 text-slate-400 border border-slate-600/50'
                                    : 'bg-slate-200 text-slate-600 border border-slate-300'
                              }`}
                            >
                              {product.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              className={`h-9 w-9 p-0 ${isDark ? 'hover:bg-blue-500/20 hover:text-blue-300 text-slate-400' : 'hover:bg-blue-100 hover:text-blue-600 text-slate-600'}`}
                              onClick={() => handleEditProduct(product)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center">
                          <Box className={`w-16 h-16 ${isDark ? 'text-slate-600' : 'text-slate-300'} mx-auto mb-3`} />
                          <p className={textSecondaryClass}>
                            {searchQuery ? 'Produk tidak ditemukan' : 'Belum ada produk. Klik "Tambah Produk" untuk menambahkan.'}
                          </p>
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