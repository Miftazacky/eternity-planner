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

  if (isLoading) return <div className="flex justify-center pt-20 text-gray-400">Memuat Data Budget...</div>;

  return (
    <div className="pb-20 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#2C3E50] mb-2">Budget Planner</h1>
          <p className="text-gray-500 text-sm">Pantau estimasi, realisasi pembayaran, dan status pelunasan.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-rose-900 hover:bg-rose-950 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition shadow-lg shadow-rose-900/20"
        >
          <Plus size={18} /> Tambah Detail Budget
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <SummaryCard title="Target Budget" amount={totalBudget} icon={<Wallet size={20} className="text-blue-500"/>} />
        <SummaryCard title="Estimasi Biaya" amount={totalEstimated} icon={<Clock size={20} className="text-amber-500"/>} />
        <SummaryCard title="Realisasi Biaya (Deal)" amount={totalActual} icon={<Receipt size={20} className="text-rose-500"/>} />
        <SummaryCard title="Sudah Dibayar" amount={totalPaid} icon={<CheckCircle size={20} className="text-emerald-500"/>} />
      </div>

      {/* Tabel Data */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
              <th className="pb-4 font-medium">Nama Item / Vendor</th>
              <th className="pb-4 font-medium">Estimasi</th>
              <th className="pb-4 font-medium">Realisasi (Deal)</th>
              <th className="pb-4 font-medium">Terbayar</th>
              <th className="pb-4 font-medium">Status</th>
              <th className="pb-4 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm">
            {expenses.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-gray-400">Belum ada data pengeluaran.</td></tr>
            ) : (
              expenses.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition">
                  <td className="py-4">
                    <p className="font-semibold text-gray-800">{item.vendor_name}</p>
                    <p className="text-xs text-gray-400">{item.budget_categories?.name}</p>
                  </td>
                  <td className="py-4 text-gray-500">Rp {Number(item.estimated_cost).toLocaleString('id-ID')}</td>
                  <td className="py-4 font-medium text-gray-800">Rp {Number(item.actual_cost).toLocaleString('id-ID')}</td>
                  <td className="py-4 font-medium text-rose-700">Rp {Number(item.paid_amount).toLocaleString('id-ID')}</td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.payment_status === 'Lunas' ? 'bg-emerald-100 text-emerald-800' :
                      item.payment_status === 'DP' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {item.payment_status}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-rose-600"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Advanced Modal (Pop-up Form) */}
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