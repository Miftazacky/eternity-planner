'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, Gift, ChevronDown, ChevronUp, CheckCircle2, ExternalLink, Edit2 } from 'lucide-react';
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

  const getCategoryTheme = (index: number) => {
    const themes = [
      { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-900', btn: 'bg-rose-100 text-rose-800 hover:bg-rose-200' },
      { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', btn: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
      { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', btn: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' },
      { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', btn: 'bg-purple-100 text-purple-800 hover:bg-purple-200' },
      { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', btn: 'bg-amber-100 text-amber-800 hover:bg-amber-200' },
    ];
    return themes[index % themes.length];
  };

  const totalItems = items.length;
  const completedItems = items.filter((i) => i.status === 'Done').length;
  const totalBudget = items.reduce((sum, i) => sum + Number(i.budget_amount || 0), 0);
  const totalActual = items.reduce((sum, i) => sum + Number(i.actual_amount || 0), 0);

  if (isLoading) return <div className="flex justify-center pt-20 text-gray-400">Memuat Data Seserahan...</div>;

  return (
    <div className="pb-20 max-w-5xl mx-auto">
      
      {/* Banner Header Berwarna (Desain Baru) */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-rose-900 to-rose-950 rounded-[2.5rem] p-8 md:p-10 mb-8 text-white shadow-2xl shadow-rose-900/20 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-20 w-40 h-40 bg-rose-500/20 rounded-full blur-3xl -mb-10 pointer-events-none"></div>

        <div className="relative z-10">
          <span className="inline-block bg-white/20 text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4 backdrop-blur-sm border border-white/20">
            Modul Hantaran
          </span>
          <h1 className="text-3xl md:text-4xl font-serif italic font-semibold mb-2 text-white flex items-center gap-3">
            <Gift size={32} className="text-rose-300" /> Planner Seserahan
          </h1>
          <p className="text-rose-100 text-sm font-medium">Organisir daftar hantaran, brand, anggaran, dan tautan belanja.</p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="bg-rose-800/60 border border-rose-400/30 text-white hover:bg-rose-800 px-5 py-3.5 rounded-xl flex items-center gap-2 text-sm font-bold transition backdrop-blur-sm"
          >
            <Plus size={18} /> Tambah Kategori
          </button>
          <button
            onClick={() => openAddItemModal()}
            className="bg-white text-rose-900 hover:bg-rose-50 px-5 py-3.5 rounded-xl flex items-center gap-2 text-sm font-bold transition shadow-lg"
          >
            <Plus size={18} /> Tambah Item
          </button>
        </div>
      </motion.div>

      {/* Metric Cards Top (Dengan Gradasi Lembut) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-6 rounded-[2rem] border border-blue-100 shadow-sm">
          <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Status Barang</p>
          <p className="text-3xl font-extrabold text-blue-900">
            {completedItems} <span className="text-sm font-medium text-blue-600/70">/ {totalItems} Selesai</span>
          </p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-6 rounded-[2rem] border border-amber-100 shadow-sm">
          <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">Estimasi Budget</p>
          <p className="text-3xl font-extrabold text-amber-700">Rp {totalBudget.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-6 rounded-[2rem] border border-emerald-100 shadow-sm">
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">Realisasi Pengeluaran</p>
          <p className="text-3xl font-extrabold text-emerald-700">Rp {totalActual.toLocaleString('id-ID')}</p>
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
          categories.map((cat, index) => {
            const categoryItems = items.filter((i) => i.category_id === cat.id);
            const catBudget = categoryItems.reduce((sum, i) => sum + Number(i.budget_amount || 0), 0);
            const catActual = categoryItems.reduce((sum, i) => sum + Number(i.actual_amount || 0), 0);
            const catDoneCount = categoryItems.filter((i) => i.status === 'Done').length;
            const isAllDone = categoryItems.length > 0 && catDoneCount === categoryItems.length;
            const isOpen = openCardIds.includes(cat.id);
            const theme = getCategoryTheme(index);

            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-[2rem] border transition-all shadow-sm overflow-hidden ${
                  isAllDone ? 'border-emerald-300 ring-2 ring-emerald-100' : theme.border
                }`}
              >
                {/* Header Kartu Besar Berwarna */}
                <div className={`p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b ${isAllDone ? 'bg-emerald-50 border-emerald-100' : `${theme.bg}${theme.border}`}`}>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleCard(cat.id)}
                      className={`p-1.5 rounded-lg transition ${isAllDone ? 'text-emerald-700 hover:bg-emerald-100' : `${theme.text} hover:bg-white/50`}`}
                    >
                      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className={`text-xl font-extrabold tracking-wide uppercase ${isAllDone ? 'text-emerald-900' : theme.text}`}>
                          {cat.name}
                        </h2>
                        
                        {isAllDone && (
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm">
                            <CheckCircle2 size={14} /> All Done
                          </span>
                        )}
                      </div>
                      <p className={`text-xs font-medium mt-1 ${isAllDone ? 'text-emerald-700/70' : theme.text} opacity-70`}>
                        {categoryItems.length} Item • {catDoneCount} Selesai
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                      <p className={`text-xs font-semibold ${isAllDone ? 'text-emerald-700/60' : theme.text} opacity-60`}>Total Realisasi / Budget</p>
                      <p className={`text-sm font-bold ${isAllDone ? 'text-emerald-900' : theme.text}`}>
                        Rp {catActual.toLocaleString('id-ID')}{' '}
                        <span className="text-xs font-medium opacity-60">/ Rp {catBudget.toLocaleString('id-ID')}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openAddItemModal(cat.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${isAllDone ? 'bg-emerald-200 text-emerald-900 hover:bg-emerald-300' : theme.btn}`}
                      >
                        + Item
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className={`p-2 rounded-xl transition ${isAllDone ? 'text-emerald-600 hover:bg-emerald-200' : `${theme.text} opacity-50 hover:opacity-100 hover:bg-white/50`}`}
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
                      className="p-6 space-y-3 bg-white"
                    >
                      {categoryItems.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">Belum ada item di kategori ini.</p>
                      ) : (
                        categoryItems.map((item) => (
                          <div
                            key={item.id}
                            className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className={`font-bold text-base ${item.status === 'Done' ? 'line-through text-gray-400' : 'text-[#2C3E50]'}`}>
                                  {item.item_name}
                                </h4>
                                {item.brand && (
                                  <span className="text-xs bg-gray-100 border border-gray-200 text-gray-600 px-2.5 py-0.5 rounded-md font-semibold tracking-wide uppercase">
                                    {item.brand}
                                  </span>
                                )}
                              </div>
                              {item.purchase_link && (
                                <a
                                  href={item.purchase_link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium w-fit"
                                >
                                  Link Pembelian <ExternalLink size={12} />
                                </a>
                              )}
                            </div>

                            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                              <div className="text-right">
                                <p className="text-xs text-gray-400 font-medium">Budget: Rp {Number(item.budget_amount).toLocaleString('id-ID')}</p>
                                <p className="text-sm font-extrabold text-emerald-700">
                                  Deal: Rp {Number(item.actual_amount).toLocaleString('id-ID')}
                                </p>
                              </div>

                              <span
                                className={`text-xs px-4 py-1.5 rounded-full font-bold border ${
                                  item.status === 'Done'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200 shadow-sm'
                                    : item.status === 'Order'
                                    ? 'bg-amber-100 text-amber-800 border-amber-200 shadow-sm'
                                    : 'bg-gray-100 text-gray-600 border-gray-200 shadow-sm'
                                }`}
                              >
                                {item.status}
                              </span>

                              <div className="flex items-center gap-1 border-l border-gray-100 pl-3 ml-1">
                                <button
                                  onClick={() => openEditItemModal(item)}
                                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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

      {/* Modal 1 & 2 tetap sama (Pop-up Tambah/Edit) */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
            >
              <button onClick={() => setIsCategoryModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X size={20} /></button>
              <h2 className="text-2xl font-serif italic text-rose-900 mb-6">Tambah Kartu Kategori</h2>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Nama Kategori *</label>
                  <input type="text" placeholder="Contoh: Skincare & Bodycare" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400" required autoFocus />
                </div>
                <button type="submit" className="w-full bg-rose-900 text-white py-3.5 rounded-xl font-medium hover:bg-rose-950 transition mt-6">Simpan Kategori</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isItemModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button onClick={() => setIsItemModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X size={20} /></button>
              <h2 className="text-2xl font-serif italic text-rose-900 mb-6">{editingItemId ? 'Edit Item Seserahan' : 'Tambah Item Seserahan'}</h2>
              <form onSubmit={handleSaveItem} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Kategori *</label>
                  <select value={itemForm.category_id} onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400 bg-gray-50/50" required>
                    <option value="">Pilih Kategori...</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Nama Barang *</label>
                    <input type="text" placeholder="Contoh: Night Cream" value={itemForm.item_name} onChange={(e) => setItemForm({ ...itemForm, item_name: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400" required />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Brand / Merek</label>
                    <input type="text" placeholder="Contoh: Wardah" value={itemForm.brand} onChange={(e) => setItemForm({ ...itemForm, brand: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Status</label>
                    <select value={itemForm.status} onChange={(e) => setItemForm({ ...itemForm, status: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400 bg-gray-50/50">
                      <option value="Pending">Pending</option>
                      <option value="Order">Order</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Budget (Rp)</label>
                    <input type="number" value={itemForm.budget_amount} onChange={(e) => setItemForm({ ...itemForm, budget_amount: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Realisasi (Rp)</label>
                    <input type="number" value={itemForm.actual_amount} onChange={(e) => setItemForm({ ...itemForm, actual_amount: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Link Pembelian</label>
                  <input type="text" placeholder="https://s.shopee.co.id/..." value={itemForm.purchase_link} onChange={(e) => setItemForm({ ...itemForm, purchase_link: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400" />
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