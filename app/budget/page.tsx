'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Plus, X, Trash2, Receipt, CheckCircle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function BudgetPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('expenses').insert([{
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
    }]);

    if (!error) {
      setIsModalOpen(false);
      setFormData({
        category_id: '', vendor_name: '', estimated_cost: '', actual_cost: '',
        paid_amount: '', payment_status: 'Belum bayar', payment_date: '',
        due_date: '', payment_proof_link: '', notes: ''
      });
      fetchData();
    } else {
      alert('Gagal menyimpan data.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus detail budget ini?')) return;
    await supabase.from('expenses').delete().eq('id', id);
    fetchData();
  };

  // Fungsi untuk mendapatkan tema warna kartu berdasarkan kategori
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
          <p className="text-rose-100 text-sm font-medium">Pantau estimasi, realisasi pembayaran, dan status pelunasan.</p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="relative z-10 bg-white text-rose-900 hover:bg-rose-50 px-6 py-3.5 rounded-xl flex items-center gap-2 text-sm font-bold transition shadow-lg"
        >
          <Plus size={18} /> Tambah Detail Budget
        </button>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <SummaryCard title="Target Budget" amount={totalBudget} icon={<Wallet size={20} className="text-blue-500"/>} />
        <SummaryCard title="Estimasi Biaya" amount={totalEstimated} icon={<Clock size={20} className="text-amber-500"/>} />
        <SummaryCard title="Realisasi Biaya (Deal)" amount={totalActual} icon={<Receipt size={20} className="text-rose-500"/>} />
        <SummaryCard title="Sudah Dibayar" amount={totalPaid} icon={<CheckCircle size={20} className="text-emerald-500"/>} />
      </div>

      {/* Kartu Daftar Pengeluaran (Menggantikan Tabel) */}
      <div className="space-y-4">
        <AnimatePresence>
          {expenses.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-gray-100">
              <p className="text-gray-400 mb-4">Belum ada data pengeluaran.</p>
              <button onClick={() => setIsModalOpen(true)} className="bg-rose-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
                + Tambah Budget Pertama
              </button>
            </div>
          ) : (
            expenses.map((item) => {
              const theme = getCardTheme(item.category_id);
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

                  {/* Bagian Tengah: Rincian Angka */}
                  <div className="flex flex-wrap md:flex-nowrap items-center gap-4 md:gap-8 w-full md:w-auto">
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-wider opacity-60 ${theme.text}`}>Estimasi</p>
                      <p className={`font-semibold ${theme.text}`}>Rp {Number(item.estimated_cost).toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-wider opacity-60 ${theme.text}`}>Deal (Realisasi)</p>
                      <p className={`font-extrabold ${theme.text}`}>Rp {Number(item.actual_cost).toLocaleString('id-ID')}</p>
                    </div>
                    <div className="bg-white/60 px-4 py-2 rounded-xl border border-white/50 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700/70">Terbayar</p>
                      <p className="font-extrabold text-rose-700">Rp {Number(item.paid_amount).toLocaleString('id-ID')}</p>
                    </div>
                  </div>

                  {/* Bagian Kanan: Status & Aksi */}
                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 md:border-l border-gray-200/50 pt-4 md:pt-0 md:pl-6 mt-2 md:mt-0">
                    <span className={`px-4 py-2 rounded-full text-xs font-bold border shadow-sm ${
                      item.payment_status === 'Lunas' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                      item.payment_status === 'DP' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                      'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      {item.payment_status}
                    </span>
                    
                    <button 
                      onClick={() => handleDelete(item.id)} 
                      className="p-2.5 bg-white rounded-full text-gray-400 hover:text-rose-600 shadow-sm hover:shadow transition"
                      title="Hapus Item Budget"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Advanced Modal (Pop-up Form) - Tetap Sama */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X size={20} /></button>
              
              <h2 className="text-2xl font-serif italic text-rose-900 mb-6">Tambah Detail Budget</h2>
              
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
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Realisasi Biaya / Deal (Rp)</label>
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
                  Simpan Detail Budget
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SummaryCard({ title, amount, icon }: any) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-500 uppercase">{title}</p>
        {icon}
      </div>
      <p className="text-xl font-bold text-[#2C3E50]">Rp {amount.toLocaleString('id-ID')}</p>
    </div>
  );
}