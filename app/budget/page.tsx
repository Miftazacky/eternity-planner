'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Plus, X, Trash2, Receipt, CheckCircle, Clock, Edit2, Calculator, CheckSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function BudgetPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Summary State
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalEstimated, setTotalEstimated] = useState(0);
  const [totalActual, setTotalActual] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);

  // Form State
  const [formData, setFormData] = useState({
    category_id: '',
    vendor_name: '',
    estimated_cost: '',
    actual_cost: '',
    paid_amount: '',
    payment_status: 'Belum bayar',
    payment_date: '',
    due_date: '',
    payment_proof_link: '',
    notes: ''
  });

  const fetchData = async () => {
    const { data: catData } = await supabase.from('budget_categories').select('*');
    if (catData) setCategories(catData);

    const budget = catData?.reduce((sum, cat) => sum + Number(cat.allocated_amount), 0) || 0;
    setTotalBudget(budget);

    const { data: expData } = await supabase
      .from('expenses')
      .select('*, budget_categories(name)')
      .order('created_at', { ascending: false });

    if (expData) {
      setExpenses(expData);
      setTotalEstimated(expData.reduce((sum, exp) => sum + Number(exp.estimated_cost), 0));
      setTotalActual(expData.reduce((sum, exp) => sum + Number(exp.actual_cost), 0));
      setTotalPaid(expData.reduce((sum, exp) => sum + Number(exp.paid_amount), 0));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      category_id: '', vendor_name: '', estimated_cost: '', actual_cost: '',
      paid_amount: '', payment_status: 'Belum bayar', payment_date: '',
      due_date: '', payment_proof_link: '', notes: ''
    });
    setEditingId(null);
    setIsModalOpen(false);
  };

  const handleEditClick = (item: any) => {
    setFormData({
      category_id: item.category_id || '',
      vendor_name: item.vendor_name || '',
      estimated_cost: item.estimated_cost || '',
      actual_cost: item.actual_cost || '',
      paid_amount: item.paid_amount || '',
      payment_status: item.payment_status || 'Belum bayar',
      payment_date: item.payment_date || '',
      due_date: item.due_date || '',
      payment_proof_link: item.payment_proof_link || '',
      notes: item.notes || ''
    });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      category_id: formData.category_id,
      vendor_name: formData.vendor_name,
      estimated_cost: Number(formData.estimated_cost) || 0,
      actual_cost: Number(formData.actual_cost) || 0,
      paid_amount: Number(formData.paid_amount) || 0,
      payment_status: formData.payment_status,
      payment_date: formData.payment_date || null,
      due_date: formData.due_date || null,
      payment_proof_link: formData.payment_proof_link,
      notes: formData.notes
    };

    if (editingId) {
      // Mode Edit (Update)
      const { error } = await supabase.from('expenses').update(payload).eq('id', editingId);
      if (!error) {
        resetForm();
        fetchData();
      } else {
        alert('Gagal memperbarui data.');
      }
    } else {
      // Mode Tambah Baru (Insert)
      const { error } = await supabase.from('expenses').insert([payload]);
      if (!error) {
        resetForm();
        fetchData();
      } else {
        alert('Gagal menyimpan data.');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus detail budget ini?')) return;
    await supabase.from('expenses').delete().eq('id', id);
    fetchData();
  };

  const getCardTheme = (categoryId: string) => {
    const index = categories.findIndex(c => c.id === categoryId);
    const idx = index !== -1 ? index : 0;
    const themes = [
      { bg: 'bg-rose-50', border: 'border-rose-100 border-l-rose-500', text: 'text-rose-900', badge: 'bg-rose-100 text-rose-800 border-rose-200' },
      { bg: 'bg-blue-50', border: 'border-blue-100 border-l-blue-500', text: 'text-blue-900', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
      { bg: 'bg-emerald-50', border: 'border-emerald-100 border-l-emerald-500', text: 'text-emerald-900', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      { bg: 'bg-purple-50', border: 'border-purple-100 border-l-purple-500', text: 'text-purple-900', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
      { bg: 'bg-amber-50', border: 'border-amber-100 border-l-amber-500', text: 'text-amber-900', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
    ];
    return themes[idx % themes.length];
  };

  // Kalkulasi Global
  const totalSelisih = totalEstimated - totalActual;
  const totalItems = expenses.length;
  const completedItems = expenses.filter(exp => exp.payment_status === 'Lunas').length;

  if (isLoading) return <div className="flex justify-center pt-20 text-gray-400">Memuat Data Budget...</div>;

  return (
    <div className="pb-20 max-w-6xl mx-auto">
      
      {/* Banner Header */}
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
          <p className="text-rose-100 text-sm font-medium">Pantau estimasi, aktual budget, selisih, dan status pelunasan.</p>
        </div>

        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="relative z-10 bg-white text-rose-900 hover:bg-rose-50 px-6 py-3.5 rounded-xl flex items-center gap-2 text-sm font-bold transition shadow-lg"
        >
          <Plus size={18} /> Tambah Detail Budget
        </button>
      </motion.div>

      {/* Metric Cards (Desain Berwarna 6 Kotak) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-6 rounded-[2rem] border border-blue-100 shadow-sm">
          <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1 flex items-center gap-1"><CheckSquare size={14}/> Status Pembayaran</p>
          <p className="text-3xl font-extrabold text-blue-900">
            {completedItems} <span className="text-sm font-medium text-blue-600/70">/ {totalItems} Lunas</span>
          </p>
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

      {/* Kartu Daftar Pengeluaran */}
      <div className="space-y-4">
        <AnimatePresence>
          {expenses.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-gray-100">
              <p className="text-gray-400 mb-4">Belum ada data pengeluaran.</p>
              <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-rose-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
                + Tambah Budget Pertama
              </button>
            </div>
          ) : (
            expenses.map((item) => {
              const theme = getCardTheme(item.category_id);
              const selisih = Number(item.estimated_cost) - Number(item.actual_cost);
              
              return (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-6 rounded-[2rem] border border-l-[6px] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-all ${theme.bg} ${theme.border}`}
                >
                  {/* Bagian Kiri: Vendor & Kategori */}
                  <div className="flex-1">
                    <span className={`text-xs px-3 py-1 rounded-full font-bold border mb-3 inline-block shadow-sm ${theme.badge}`}>
                      {item.budget_categories?.name || 'Lain-lain'}
                    </span>
                    <h3 className={`font-bold text-xl ${theme.text}`}>{item.vendor_name}</h3>
                    {item.notes && <p className={`text-sm mt-1 font-medium opacity-70 ${theme.text}`}>{item.notes}</p>}
                  </div>

                  {/* Bagian Tengah: Rincian Angka (Estimasi, Aktual, Selisih, Terbayar) */}
                  <div className="flex flex-wrap items-center gap-4 md:gap-6 w-full md:w-auto">
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-wider opacity-60 ${theme.text}`}>Estimasi</p>
                      <p className={`font-semibold ${theme.text}`}>Rp {Number(item.estimated_cost).toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-wider opacity-60 ${theme.text}`}>Aktual Budget</p>
                      <p className={`font-extrabold ${theme.text}`}>Rp {Number(item.actual_cost).toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-wider opacity-60 ${theme.text}`}>Selisih</p>
                      <p className={`font-bold ${selisih < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {selisih < 0 ? '-Rp ' : '+Rp '} {Math.abs(selisih).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="bg-white/60 px-4 py-2.5 rounded-xl border border-white/50 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700/70">Terbayar</p>
                      <p className="font-extrabold text-rose-700">Rp {Number(item.paid_amount).toLocaleString('id-ID')}</p>
                    </div>
                  </div>

                  {/* Bagian Kanan: Status & Aksi */}
                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 md:border-l border-gray-200/50 pt-4 md:pt-0 md:pl-6 mt-2 md:mt-0">
                    <span className={`px-4 py-2 rounded-full text-xs font-bold border shadow-sm ${
                      item.payment_status === 'Lunas' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                      item.payment_status === 'DP' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                      'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      {item.payment_status}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEditClick(item)} 
                        className="p-2.5 bg-white rounded-full text-gray-400 hover:text-blue-600 shadow-sm hover:shadow transition"
                        title="Edit Item Budget"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)} 
                        className="p-2.5 bg-white rounded-full text-gray-400 hover:text-rose-600 shadow-sm hover:shadow transition"
                        title="Hapus Item Budget"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Modal Tambah/Edit */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button onClick={resetForm} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X size={20} /></button>
              
              <h2 className="text-2xl font-serif italic text-rose-900 mb-6">
                {editingId ? 'Edit Detail Budget' : 'Tambah Detail Budget'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Nama Item / Vendor *</label>
                    <input type="text" name="vendor_name" value={formData.vendor_name} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400 bg-gray-50/50" required />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Kategori *</label>
                    <select name="category_id" value={formData.category_id} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400 bg-gray-50/50" required>
                      <option value="">Pilih Kategori...</option>
                      {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Estimasi Biaya (Rp)</label>
                    <input type="number" name="estimated_cost" value={formData.estimated_cost} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400 bg-gray-50/50" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Aktual Budget (Deal) (Rp)</label>
                    <input type="number" name="actual_cost" value={formData.actual_cost} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400 bg-gray-50/50" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-4 mt-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Status Pembayaran</label>
                    <select name="payment_status" value={formData.payment_status} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400 bg-gray-50/50">
                      <option value="Belum bayar">Belum bayar</option>
                      <option value="DP">DP (Cicilan)</option>
                      <option value="Lunas">Lunas</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Jumlah Sudah Dibayar (Rp)</label>
                    <input type="number" name="paid_amount" value={formData.paid_amount} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400 bg-gray-50/50" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Tanggal Pembayaran</label>
                    <input type="date" name="payment_date" value={formData.payment_date} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-600 focus:outline-rose-400 bg-gray-50/50" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Deadline Pelunasan</label>
                    <input type="date" name="due_date" value={formData.due_date} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-600 focus:outline-rose-400 bg-gray-50/50" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Catatan Tambahan</label>
                  <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} placeholder="Contoh: Nomor rekening vendor..." className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400 bg-gray-50/50" />
                </div>

                <button type="submit" className="w-full bg-rose-900 text-white py-3.5 rounded-xl font-medium hover:bg-rose-950 transition mt-6">
                  {editingId ? 'Simpan Perubahan' : 'Simpan Detail Budget'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}