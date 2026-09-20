'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Plus, X, Trash2, Receipt, CheckCircle, Clock, Edit2, Calculator, CheckSquare, ChevronDown, ChevronUp, Link2, Phone, Store } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function BudgetPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [openCardCategories, setOpenCardCategories] = useState<string[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Form States
  const [categoryForm, setCategoryForm] = useState({ name: '', allocated_amount: '' });
  const [itemForm, setItemForm] = useState({
    category_id: '',
    vendor_name: '',
    contact: '',
    vendor_link: '',
    estimated_cost: '',
    actual_cost: '',
    paid_amount: '',
    payment_status: 'Belum bayar',
    payment_date: '',
    due_date: '',
    notes: ''
  });

  const fetchData = async () => {
    const { data: catData } = await supabase.from('budget_categories').select('*').order('created_at', { ascending: true });
    const { data: expData } = await supabase.from('expenses').select('*, budget_categories(name)').order('created_at', { ascending: false });

    if (catData) {
      setCategories(catData);
      setOpenCardCategories(catData.map(c => c.id));
    }
    if (expData) setExpenses(expData);
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleCategoryCard = (id: string) => {
    setOpenCardCategories(prev => prev.includes(id) ? prev.filter(catId => catId !== id) : [...prev, id]);
  };

  // Handler Kategori
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name) return;

    const payload = {
      name: categoryForm.name,
      allocated_amount: Number(categoryForm.allocated_amount) || 0
    };

    const { error } = await supabase.from('budget_categories').insert([payload]);
    if (!error) {
      setCategoryForm({ name: '', allocated_amount: '' });
      setIsCategoryModalOpen(false);
      fetchData();
    } else alert('Gagal menyimpan kategori.');
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Hapus Kategori "${name}" beserta SELURUH data pengeluaran di dalamnya?`)) return;
    await supabase.from('budget_categories').delete().eq('id', id);
    fetchData();
  };

  // Handler Item Pengeluaran
  const openAddItemModal = (catId?: string) => {
    setEditingItemId(null);
    setItemForm({
      category_id: catId || (categories[0]?.id || ''),
      vendor_name: '', contact: '', vendor_link: '',
      estimated_cost: '', actual_cost: '', paid_amount: '',
      payment_status: 'Belum bayar', payment_date: '', due_date: '', notes: ''
    });
    setIsItemModalOpen(true);
  };

  const openEditItemModal = (item: any) => {
    setEditingItemId(item.id);
    setItemForm({
      category_id: item.category_id || '',
      vendor_name: item.vendor_name || '',
      contact: item.contact || '',
      vendor_link: item.vendor_link || '',
      estimated_cost: item.estimated_cost || '',
      actual_cost: item.actual_cost || '',
      paid_amount: item.paid_amount || '',
      payment_status: item.payment_status || 'Belum bayar',
      payment_date: item.payment_date || '',
      due_date: item.due_date || '',
      notes: item.notes || ''
    });
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      category_id: itemForm.category_id,
      vendor_name: itemForm.vendor_name,
      contact: itemForm.contact,
      vendor_link: itemForm.vendor_link,
      estimated_cost: Number(itemForm.estimated_cost) || 0,
      actual_cost: Number(itemForm.actual_cost) || 0,
      paid_amount: Number(itemForm.paid_amount) || 0,
      payment_status: itemForm.payment_status,
      payment_date: itemForm.payment_date || null,
      due_date: itemForm.due_date || null,
      notes: itemForm.notes
    };

    if (editingItemId) {
      const { error } = await supabase.from('expenses').update(payload).eq('id', editingItemId);
      if (!error) { setIsItemModalOpen(false); fetchData(); }
    } else {
      const { error } = await supabase.from('expenses').insert([payload]);
      if (!error) { setIsItemModalOpen(false); fetchData(); }
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Hapus detail budget ini?')) return;
    await supabase.from('expenses').delete().eq('id', id);
    fetchData();
  };

  // Kalkulasi & Tema
  const totalBudget = categories.reduce((sum, cat) => sum + Number(cat.allocated_amount || 0), 0);
  const totalEstimated = expenses.reduce((sum, exp) => sum + Number(exp.estimated_cost || 0), 0);
  const totalActual = expenses.reduce((sum, exp) => sum + Number(exp.actual_cost || 0), 0);
  const totalPaid = expenses.reduce((sum, exp) => sum + Number(exp.paid_amount || 0), 0);
  const totalSelisih = totalEstimated - totalActual;
  const completedItems = expenses.filter(exp => exp.payment_status === 'Lunas').length;

  const getCategoryTheme = (index: number) => {
    const themes = [
      { bg: 'bg-rose-50', border: 'border-rose-200 border-l-rose-500', text: 'text-rose-900', btn: 'bg-rose-100 text-rose-800' },
      { bg: 'bg-blue-50', border: 'border-blue-200 border-l-blue-500', text: 'text-blue-900', btn: 'bg-blue-100 text-blue-800' },
      { bg: 'bg-emerald-50', border: 'border-emerald-200 border-l-emerald-500', text: 'text-emerald-900', btn: 'bg-emerald-100 text-emerald-800' },
      { bg: 'bg-purple-50', border: 'border-purple-200 border-l-purple-500', text: 'text-purple-900', btn: 'bg-purple-100 text-purple-800' },
      { bg: 'bg-amber-50', border: 'border-amber-200 border-l-amber-500', text: 'text-amber-900', btn: 'bg-amber-100 text-amber-800' },
    ];
    return themes[index % themes.length];
  };

  if (isLoading) return <div className="flex justify-center pt-20 text-gray-400">Memuat Data Budget...</div>;

  return (
    <div className="pb-20 max-w-6xl mx-auto">
      
      {/* Banner Header Berwarna */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-rose-900 to-rose-950 rounded-[2.5rem] p-8 md:p-10 mb-8 text-white shadow-2xl shadow-rose-900/20 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-20 w-40 h-40 bg-rose-500/20 rounded-full blur-3xl -mb-10 pointer-events-none"></div>

        <div className="relative z-10">
          <span className="inline-block bg-white/20 text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4 backdrop-blur-sm border border-white/20">
            Modul Keuangan
          </span>
          <h1 className="text-3xl md:text-4xl font-serif italic font-semibold mb-2 text-white flex items-center gap-3">
            <Wallet size={32} className="text-rose-300" /> Budget Planner
          </h1>
          <p className="text-rose-100 text-sm font-medium">Pantau estimasi, aktual budget, selisih, dan detail vendor per kategori.</p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button onClick={() => setIsCategoryModalOpen(true)} className="bg-rose-800/60 border border-rose-400/30 text-white hover:bg-rose-800 px-5 py-3.5 rounded-xl flex items-center gap-2 text-sm font-bold transition backdrop-blur-sm">
            <Plus size={18} /> Tambah Kategori
          </button>
          <button onClick={() => openAddItemModal()} className="bg-white text-rose-900 hover:bg-rose-50 px-5 py-3.5 rounded-xl flex items-center gap-2 text-sm font-bold transition shadow-lg">
            <Plus size={18} /> Tambah Detail Budget
          </button>
        </div>
      </motion.div>

      {/* 6 Kartu Metrik Global */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-6 rounded-[2rem] border border-blue-100 shadow-sm">
          <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1 flex items-center gap-1"><CheckSquare size={14}/> Status Pembayaran</p>
          <p className="text-3xl font-extrabold text-blue-900">{completedItems} <span className="text-sm font-medium text-blue-600/70">/ {expenses.length} Lunas</span></p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-6 rounded-[2rem] border border-amber-100 shadow-sm">
          <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Clock size={14}/> Estimasi Biaya</p>
          <p className="text-3xl font-extrabold text-amber-700">Rp {totalEstimated.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-6 rounded-[2rem] border border-emerald-100 shadow-sm">
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Receipt size={14}/> Aktual Budget</p>
          <p className="text-3xl font-extrabold text-emerald-700">Rp {totalActual.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50/50 p-6 rounded-[2rem] border border-purple-100 shadow-sm">
          <p className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-1 flex items-center gap-1"><CheckCircle size={14}/> Sudah Dibayar</p>
          <p className="text-3xl font-extrabold text-purple-700">Rp {totalPaid.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-gradient-to-br from-rose-50 to-pink-50/50 p-6 rounded-[2rem] border border-rose-100 shadow-sm">
          <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Calculator size={14}/> Total Selisih</p>
          <p className={`text-3xl font-extrabold ${totalSelisih < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
            {totalSelisih < 0 ? '-Rp ' : '+Rp '} {Math.abs(totalSelisih).toLocaleString('id-ID')}
          </p>
        </div>
        <div className="bg-gradient-to-br from-sky-50 to-cyan-50/50 p-6 rounded-[2rem] border border-sky-100 shadow-sm">
          <p className="text-xs font-bold text-sky-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Wallet size={14}/> Target Pagu Budget</p>
          <p className="text-3xl font-extrabold text-sky-700">Rp {totalBudget.toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* Kartu Kategori Akordeon untuk Budget */}
      <div className="space-y-6">
        <AnimatePresence>
          {categories.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-gray-100">
              <p className="text-gray-400 mb-4">Belum ada Kategori Anggaran.</p>
              <button onClick={() => setIsCategoryModalOpen(true)} className="bg-rose-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
                + Tambah Kategori Pertama
              </button>
            </div>
          ) : (
            categories.map((cat, index) => {
              const catExpenses = expenses.filter((e) => e.category_id === cat.id);
              const catActual = catExpenses.reduce((sum, e) => sum + Number(e.actual_cost || 0), 0);
              const catPagu = Number(cat.allocated_amount || 0);
              const isOverBudget = catActual > catPagu;
              const isOpen = openCardCategories.includes(cat.id);
              const theme = getCategoryTheme(index);

              return (
                <motion.div 
                  key={cat.id} 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-[2rem] border border-l-[8px] transition-all shadow-sm overflow-hidden ${isOverBudget ? 'border-rose-200 border-l-rose-500' : theme.border}`}
                >
                  
                  {/* Header Kartu Besar (Kategori) */}
                  <div className={`p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b ${isOverBudget ? 'bg-rose-50/50' : theme.bg}`}>
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleCategoryCard(cat.id)} className={`p-1.5 rounded-lg transition hover:bg-white/50 ${isOverBudget ? 'text-rose-700' : theme.text}`}>
                        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                      <div>
                        <h2 className={`text-xl font-extrabold tracking-wide uppercase ${isOverBudget ? 'text-rose-900' : theme.text}`}>{cat.name}</h2>
                        <p className={`text-xs font-medium mt-1 opacity-70 ${isOverBudget ? 'text-rose-700' : theme.text}`}>{catExpenses.length} Detail Pengeluaran</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-right">
                        <p className={`text-xs font-semibold opacity-60 ${isOverBudget ? 'text-rose-700' : theme.text}`}>Realisasi / Pagu Target</p>
                        <p className={`text-sm font-bold ${isOverBudget ? 'text-rose-700' : theme.text}`}>
                          Rp {catActual.toLocaleString('id-ID')} <span className="text-xs font-medium opacity-60">/ Rp {catPagu.toLocaleString('id-ID')}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openAddItemModal(cat.id)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${isOverBudget ? 'bg-rose-200 text-rose-900 hover:bg-rose-300' : theme.btn}`}>+ Item</button>
                        <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className={`p-2 rounded-xl transition opacity-50 hover:opacity-100 hover:bg-white/50 ${isOverBudget ? 'text-rose-700' : theme.text}`} title="Hapus Kategori"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  </div>

                  {/* Isi Akordeon: Item Detail Budget */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-6 space-y-4 bg-white">
                        {catExpenses.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-4">Belum ada rincian budget di kategori ini.</p>
                        ) : (
                          catExpenses.map((item) => {
                            const selisih = Number(item.estimated_cost) - Number(item.actual_cost);
                            return (
                              <div key={item.id} className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-md transition">
                                
                                {/* Kiri: Nama & Kontak Vendor */}
                                <div className="flex-1">
                                  <h3 className="font-bold text-lg mb-2 text-[#2C3E50]">{item.vendor_name}</h3>
                                  <div className="flex flex-wrap items-center gap-3">
                                    {item.contact && (
                                      <span className="text-xs font-semibold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-100 flex items-center gap-1">
                                        <Phone size={12}/> {item.contact}
                                      </span>
                                    )}
                                    {item.vendor_link && (
                                      <a href={item.vendor_link.startsWith('http') ? item.vendor_link : `https://${item.vendor_link}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 hover:bg-blue-200 flex items-center gap-1 transition">
                                        <Link2 size={12}/> Link Vendor
                                      </a>
                                    )}
                                    {item.notes && (
                                      <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200">
                                        Catatan: {item.notes}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Tengah: Angka Budget */}
                                <div className="flex flex-wrap items-center gap-4 md:gap-6 w-full md:w-auto">
                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Estimasi</p>
                                    <p className="font-semibold text-gray-700">Rp {Number(item.estimated_cost).toLocaleString('id-ID')}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/60">Aktual</p>
                                    <p className="font-extrabold text-emerald-800">Rp {Number(item.actual_cost).toLocaleString('id-ID')}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Selisih</p>
                                    <p className={`font-bold ${selisih < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                      {selisih < 0 ? '-Rp ' : '+Rp '} {Math.abs(selisih).toLocaleString('id-ID')}
                                    </p>
                                  </div>
                                </div>

                                {/* Kanan: Status & Aksi */}
                                <div className="flex flex-col gap-2 min-w-[120px] items-stretch w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 pl-0 md:pl-4 md:border-l border-gray-100">
                                  <div className={`px-4 py-2 rounded-xl text-center text-xs font-bold border shadow-sm ${
                                    item.payment_status === 'Lunas' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                    item.payment_status === 'DP' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                                  }`}>
                                    {item.payment_status}
                                  </div>
                                  <p className="text-center text-[10px] font-bold text-rose-700 mt-1">Terbayar: Rp {Number(item.paid_amount).toLocaleString('id-ID')}</p>
                                  
                                  <div className="flex justify-center items-center gap-2 mt-2">
                                    <button onClick={() => openEditItemModal(item)} className="p-2 bg-white rounded-full text-gray-400 hover:text-blue-600 border border-gray-100 shadow-sm hover:shadow transition"><Edit2 size={14} /></button>
                                    <button onClick={() => handleDeleteItem(item.id)} className="p-2 bg-white rounded-full text-gray-400 hover:text-rose-600 border border-gray-100 shadow-sm hover:shadow transition"><Trash2 size={14} /></button>
                                  </div>
                                </div>

                              </div>
                            );
                          })
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Modal 1: Tambah Kategori Anggaran */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
              <button onClick={() => setIsCategoryModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X size={20} /></button>
              <h2 className="text-2xl font-serif italic text-rose-900 mb-6">Tambah Kategori Anggaran</h2>
              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Nama Kategori (Contoh: Venue & Catering) *</label>
                  <input type="text" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400" required autoFocus />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Target Pagu Budget (Rp)</label>
                  <input type="number" value={categoryForm.allocated_amount} onChange={(e) => setCategoryForm({ ...categoryForm, allocated_amount: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400" />
                </div>
                <button type="submit" className="w-full bg-rose-900 text-white py-3.5 rounded-xl font-medium hover:bg-rose-950 transition mt-6">Simpan Kategori</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 2: Tambah/Edit Detail Item Vendor */}
      <AnimatePresence>
        {isItemModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setIsItemModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X size={20} /></button>
              <h2 className="text-2xl font-serif italic text-rose-900 mb-6">{editingItemId ? 'Edit Detail Budget' : 'Tambah Detail Budget'}</h2>
              
              <form onSubmit={handleSaveItem} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Kategori *</label>
                    <select name="category_id" value={itemForm.category_id} onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400 bg-gray-50/50" required>
                      <option value="">Pilih Kategori...</option>
                      {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Nama Item / Vendor *</label>
                    <input type="text" name="vendor_name" value={itemForm.vendor_name} onChange={(e) => setItemForm({ ...itemForm, vendor_name: e.target.value })} placeholder="Cth: Dekorasi Pelaminan..." className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400 bg-gray-50/50" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Kontak / No HP Vendor</label>
                    <input type="text" name="contact" value={itemForm.contact} onChange={(e) => setItemForm({ ...itemForm, contact: e.target.value })} placeholder="0812-XXXX..." className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400 bg-gray-50/50" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Link (Web / Instagram)</label>
                    <input type="text" name="vendor_link" value={itemForm.vendor_link} onChange={(e) => setItemForm({ ...itemForm, vendor_link: e.target.value })} placeholder="https://instagram.com/..." className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400 bg-gray-50/50" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Estimasi Biaya (Rp)</label>
                    <input type="number" name="estimated_cost" value={itemForm.estimated_cost} onChange={(e) => setItemForm({ ...itemForm, estimated_cost: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400 bg-gray-50/50" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-emerald-700/70 mb-1">Aktual Budget (Deal) (Rp)</label>
                    <input type="number" name="actual_cost" value={itemForm.actual_cost} onChange={(e) => setItemForm({ ...itemForm, actual_cost: e.target.value })} className="w-full border border-emerald-200 rounded-xl p-3 text-sm focus:outline-emerald-500 bg-emerald-50/30" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Status Pembayaran</label>
                    <select name="payment_status" value={itemForm.payment_status} onChange={(e) => setItemForm({ ...itemForm, payment_status: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400 bg-gray-50/50">
                      <option value="Belum bayar">Belum bayar</option>
                      <option value="DP">DP (Cicilan)</option>
                      <option value="Lunas">Lunas</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs uppercase tracking-wider text-rose-700/70 mb-1">Jumlah Sudah Dibayar (Rp)</label>
                    <input type="number" name="paid_amount" value={itemForm.paid_amount} onChange={(e) => setItemForm({ ...itemForm, paid_amount: e.target.value })} className="w-full border border-rose-200 rounded-xl p-3 text-sm focus:outline-rose-400 bg-rose-50/30" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Catatan Tambahan</label>
                  <textarea name="notes" value={itemForm.notes} onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })} rows={2} placeholder="Contoh: Nomor rekening, detail paket..." className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400 bg-gray-50/50" />
                </div>

                <button type="submit" className="w-full bg-rose-900 text-white py-3.5 rounded-xl font-medium hover:bg-rose-950 transition mt-6">
                  {editingItemId ? 'Simpan Perubahan' : 'Simpan Detail Budget'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}