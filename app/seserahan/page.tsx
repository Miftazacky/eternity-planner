'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, Gift, ChevronDown, ChevronUp, CheckCircle2, ExternalLink, Edit2, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SeserahanPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [openCardIds, setOpenCardIds] = useState<string[]>([]);

  // Form State
  const [categoryName, setCategoryName] = useState('');
  
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({
    category_id: '',
    item_name: '',
    brand: '',
    status: 'Pending',
    budget_amount: '',
    actual_amount: '',
    purchase_link: '',
  });

  const fetchData = async () => {
    const { data: catData } = await supabase.from('seserahan_categories').select('*').order('created_at', { ascending: true });
    const { data: itemData } = await supabase.from('seserahan_items').select('*').order('created_at', { ascending: true });

    if (catData) {
      setCategories(catData);
      // Buka semua kartu secara default jika belum terbuka
      setOpenCardIds(catData.map((c) => c.id));
    }
    if (itemData) setItems(itemData);

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleCard = (id: string) => {
    setOpenCardIds((prev) =>
      prev.includes(id) ? prev.filter((cardId) => cardId !== id) : [...prev, id]
    );
  };

  // Handler Kategori (Kartu Besar)
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName) return;

    const { error } = await supabase.from('seserahan_categories').insert([{ name: categoryName }]);
    if (!error) {
      setCategoryName('');
      setIsCategoryModalOpen(false);
      fetchData();
    } else {
      alert('Gagal menambah kategori.');
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Hapus kartu kategori "${name}" beserta seluruh item di dalamnya?`)) return;
    const { error } = await supabase.from('seserahan_categories').delete().eq('id', id);
    if (!error) fetchData();
    else alert('Gagal menghapus kategori.');
  };

  // Handler Item Detail
  const openAddItemModal = (catId?: string) => {
    setEditingItemId(null);
    setItemForm({
      category_id: catId || (categories[0]?.id || ''),
      item_name: '',
      brand: '',
      status: 'Pending',
      budget_amount: '',
      actual_amount: '',
      purchase_link: '',
    });
    setIsItemModalOpen(true);
  };

  const openEditItemModal = (item: any) => {
    setEditingItemId(item.id);
    setItemForm({
      category_id: item.category_id,
      item_name: item.item_name,
      brand: item.brand || '',
      status: item.status || 'Pending',
      budget_amount: item.budget_amount || '',
      actual_amount: item.actual_amount || '',
      purchase_link: item.purchase_link || '',
    });
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.item_name || !itemForm.category_id) return;

    const payload = {
      category_id: itemForm.category_id,
      item_name: itemForm.item_name,
      brand: itemForm.brand,
      status: itemForm.status,
      budget_amount: Number(itemForm.budget_amount) || 0,
      actual_amount: Number(itemForm.actual_amount) || 0,
      purchase_link: itemForm.purchase_link,
    };

    if (editingItemId) {
      const { error } = await supabase.from('seserahan_items').update(payload).eq('id', editingItemId);
      if (!error) {
        setIsItemModalOpen(false);
        fetchData();
      }
    } else {
      const { error } = await supabase.from('seserahan_items').insert([payload]);
      if (!error) {
        setIsItemModalOpen(false);
        fetchData();
      }
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Hapus item seserahan ini?')) return;
    const { error } = await supabase.from('seserahan_items').delete().eq('id', id);
    if (!error) fetchData();
  };

  // Perhitungan Ringkasan Total
  const totalItems = items.length;
  const completedItems = items.filter((i) => i.status === 'Done').length;
  const totalBudget = items.reduce((sum, i) => sum + Number(i.budget_amount || 0), 0);
  const totalActual = items.reduce((sum, i) => sum + Number(i.actual_amount || 0), 0);

  if (isLoading) return <div className="flex justify-center pt-20 text-gray-400">Memuat Data Seserahan...</div>;

  return (
    <div className="pb-20 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2C3E50] mb-2 flex items-center gap-3">
            <Gift className="text-rose-900" size={32} /> Planner Seserahan
          </h1>
          <p className="text-gray-500 text-sm">Organisir daftar hantaran, brand, anggaran, dan tautan belanja.</p>
        </div>

        {/* Tombol Kanan Atas */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold transition shadow-sm"
          >
            <Plus size={18} /> Tambah Kategori
          </button>
          <button
            onClick={() => openAddItemModal()}
            className="bg-rose-900 hover:bg-rose-950 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold transition shadow-lg shadow-rose-900/20"
          >
            <Plus size={18} /> Tambah Item
          </button>
        </div>
      </div>

      {/* Metric Cards Top */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Status Barang</p>
          <p className="text-2xl font-bold text-[#2C3E50]">
            {completedItems} <span className="text-sm font-normal text-gray-400">/ {totalItems} Item Selesai</span>
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Estimasi Budget</p>
          <p className="text-2xl font-bold text-amber-600">Rp {totalBudget.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Realisasi Pengeluaran</p>
          <p className="text-2xl font-bold text-emerald-600">Rp {totalActual.toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* Kartu Kategori (Kartu Besar) */}
      <div className="space-y-6">
        {categories.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-gray-100">
            <p className="text-gray-400 mb-4">Belum ada kategori seserahan.</p>
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="bg-rose-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold"
            >
              + Tambah Kategori Pertama
            </button>
          </div>
        ) : (
          categories.map((cat) => {
            const categoryItems = items.filter((i) => i.category_id === cat.id);
            const catBudget = categoryItems.reduce((sum, i) => sum + Number(i.budget_amount || 0), 0);
            const catActual = categoryItems.reduce((sum, i) => sum + Number(i.actual_amount || 0), 0);
            const catDoneCount = categoryItems.filter((i) => i.status === 'Done').length;
            const isAllDone = categoryItems.length > 0 && catDoneCount === categoryItems.length;
            const isOpen = openCardIds.includes(cat.id);

            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-3xl border transition-all shadow-sm overflow-hidden ${
                  isAllDone ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-gray-100'
                }`}
              >
                {/* Header Kartu Besar */}
                <div className="p-6 bg-gradient-to-r from-amber-50/40 via-white to-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleCard(cat.id)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition"
                    >
                      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-[#2C3E50]">{cat.name}</h2>
                        
                        {/* Lencana Indikator SELURUH ITEM DONE */}
                        {isAllDone && (
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm">
                            <CheckCircle2 size={14} /> Lengkap All Done
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {categoryItems.length} Item • {catDoneCount} Selesai
                      </p>
                    </div>
                  </div>

                  {/* Subtotal & Aksi Kartu Besar */}
                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Total Realisasi / Budget</p>
                      <p className="text-sm font-bold text-gray-800">
                        Rp {catActual.toLocaleString('id-ID')}{' '}
                        <span className="text-xs font-normal text-gray-400">/ Rp {catBudget.toLocaleString('id-ID')}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openAddItemModal(cat.id)}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                      >
                        + Item
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="p-2 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                        title="Hapus Kartu Kategori"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Isi Kartu (Baris Detail Item) */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-6 space-y-3 bg-gray-50/30"
                    >
                      {categoryItems.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">Belum ada item di kategori ini.</p>
                      ) : (
                        categoryItems.map((item) => (
                          <div
                            key={item.id}
                            className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-sm transition"
                          >
                            {/* Info Barang */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className={`font-semibold text-base ${item.status === 'Done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                  {item.item_name}
                                </h4>
                                {item.brand && (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-md font-medium">
                                    {item.brand}
                                  </span>
                                )}
                              </div>
                              {item.purchase_link && (
                                <a
                                  href={item.purchase_link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-rose-600 hover:underline flex items-center gap-1 mt-1 font-medium"
                                >
                                  Link Pembelian <ExternalLink size={12} />
                                </a>
                              )}
                            </div>

                            {/* Harga & Status */}
                            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                              <div className="text-right">
                                <p className="text-xs text-gray-400">Budget: Rp {Number(item.budget_amount).toLocaleString('id-ID')}</p>
                                <p className="text-sm font-semibold text-emerald-700">
                                  Deal: Rp {Number(item.actual_amount).toLocaleString('id-ID')}
                                </p>
                              </div>

                              {/* Badge Status (Pending / Order / Done) */}
                              <span
                                className={`text-xs px-3 py-1 rounded-full font-bold border ${
                                  item.status === 'Done'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                    : item.status === 'Order'
                                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                                    : 'bg-gray-100 text-gray-600 border-gray-200'
                                }`}
                              >
                                {item.status}
                              </span>

                              {/* Aksi Item */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => openEditItemModal(item)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Modal 1: Tambah Kategori Baru */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
            >
              <button onClick={() => setIsCategoryModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
              <h2 className="text-2xl font-serif italic text-rose-900 mb-6">Tambah Kartu Kategori</h2>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Nama Kategori *</label>
                  <input
                    type="text"
                    placeholder="Contoh: Skincare & Bodycare"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400"
                    required
                    autoFocus
                  />
                </div>
                <button type="submit" className="w-full bg-rose-900 text-white py-3.5 rounded-xl font-medium hover:bg-rose-950 transition mt-6">
                  Simpan Kategori
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 2: Tambah / Edit Item */}
      <AnimatePresence>
        {isItemModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button onClick={() => setIsItemModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
              <h2 className="text-2xl font-serif italic text-rose-900 mb-6">
                {editingItemId ? 'Edit Item Seserahan' : 'Tambah Item Seserahan'}
              </h2>

              <form onSubmit={handleSaveItem} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Kategori *</label>
                  <select
                    value={itemForm.category_id}
                    onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400 bg-gray-50/50"
                    required
                  >
                    <option value="">Pilih Kategori...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Nama Barang *</label>
                    <input
                      type="text"
                      placeholder="Contoh: Night Cream"
                      value={itemForm.item_name}
                      onChange={(e) => setItemForm({ ...itemForm, item_name: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Brand / Merek</label>
                    <input
                      type="text"
                      placeholder="Contoh: Wardah"
                      value={itemForm.brand}
                      onChange={(e) => setItemForm({ ...itemForm, brand: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Status</label>
                    <select
                      value={itemForm.status}
                      onChange={(e) => setItemForm({ ...itemForm, status: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400 bg-gray-50/50"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Order">Order</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Budget (Rp)</label>
                    <input
                      type="number"
                      value={itemForm.budget_amount}
                      onChange={(e) => setItemForm({ ...itemForm, budget_amount: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Realisasi (Rp)</label>
                    <input
                      type="number"
                      value={itemForm.actual_amount}
                      onChange={(e) => setItemForm({ ...itemForm, actual_amount: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Link Pembelian (URL Shopee/Tokopedia)</label>
                  <input
                    type="text"
                    placeholder="https://s.shopee.co.id/..."
                    value={itemForm.purchase_link}
                    onChange={(e) => setItemForm({ ...itemForm, purchase_link: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400"
                  />
                </div>

                <button type="submit" className="w-full bg-rose-900 text-white py-3.5 rounded-xl font-medium hover:bg-rose-950 transition mt-6">
                  {editingItemId ? 'Simpan Perubahan' : 'Simpan Item'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}