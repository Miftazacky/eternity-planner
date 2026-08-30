'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, TrendingUp, AlertCircle, CreditCard, Plus, X, Trash2, PieChart as PieIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function BudgetDashboard() {
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Data State
  const [categories, setCategories] = useState<any[]>([]);
  const [expensesList, setExpensesList] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [upcomingDueDate, setUpcomingDueDate] = useState<any>(null);
  const [activeTerm, setActiveTerm] = useState<any>(null);

  // Form State
  const [selectedCategory, setSelectedCategory] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  const fetchFinancialData = async () => {
    // 1. Fetch Kategori
    const { data: catData } = await supabase.from('budget_categories').select('*');
    if (catData) setCategories(catData);
    const budget = catData?.reduce((sum, cat) => sum + Number(cat.allocated_amount), 0) || 0;

    // 2. Fetch Expenses dengan Join Kategori
    const { data: expData } = await supabase
      .from('expenses')
      .select('*, budget_categories(name, icon_color)')
      .order('created_at', { ascending: false });

    if (expData) {
      setExpensesList(expData);

      // Hitung Total Pengeluaran Aktual
      const spent = expData.reduce((sum, exp) => sum + Number(exp.paid_amount), 0);
      setTotalSpent(spent);

      // Cari Vendor Jatuh Tempo Terdekat yang belum lunas
      const upcoming = expData
        .filter((exp) => exp.status !== 'Paid Off' && exp.due_date)
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];
      setUpcomingDueDate(upcoming || null);

      // Cari Termin Aktif (DP Paid / Pending)
      const active = expData.find((exp) => exp.status === 'DP Paid' || exp.status === 'Pending');
      setActiveTerm(active || null);

      // Agregasi Data untuk Grafik Pie (Berdasarkan Pengeluaran Per Kategori)
      if (catData) {
        const aggregated = catData.map((cat) => {
          const categorySpent = expData
            .filter((exp) => exp.category_id === cat.id)
            .reduce((sum, exp) => sum + Number(exp.paid_amount), 0);
          return {
            name: cat.name,
            value: categorySpent > 0 ? categorySpent : Number(cat.allocated_amount),
            color: cat.icon_color || '#e11d48',
          };
        });
        setChartData(aggregated);
      }
    }

    setTotalBudget(budget);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName || !totalCost || !selectedCategory) return;

    const paid = Number(paidAmount) || 0;
    const total = Number(totalCost);
    let status = 'Pending';
    if (paid >= total) status = 'Paid Off';
    else if (paid > 0) status = 'DP Paid';

    const { error } = await supabase.from('expenses').insert([
      {
        category_id: selectedCategory,
        vendor_name: vendorName,
        total_cost: total,
        paid_amount: paid,
        due_date: dueDate || null,
        status: status,
      },
    ]);

    if (!error) {
      setIsModalOpen(false);
      setVendorName('');
      setTotalCost('');
      setPaidAmount('');
      setDueDate('');
      fetchFinancialData();
    } else {
      alert('Gagal menyimpan tagihan vendor.');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Apakah kamu yakin ingin menghapus tagihan vendor ini?')) return;
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (!error) {
      fetchFinancialData();
    } else {
      alert('Gagal menghapus data.');
    }
  };

  const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const remainingBudget = totalBudget - totalSpent;

  if (isLoading) {
    return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-gray-400">Menyinkronkan data keuangan...</div>;
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C3E50] font-sans pb-20 relative">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto pt-16 px-8"
      >
        <div className="flex justify-between items-end mb-10">
          <div>
            <p className="text-sm uppercase tracking-widest text-rose-400 mb-2 font-semibold">Financial Command Center</p>
            <h1 className="text-4xl md:text-5xl font-light tracking-tight">
              Wedding <span className="font-serif italic text-rose-900">Ledger</span>.
            </h1>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#2C3E50] hover:bg-black text-white px-5 py-3 rounded-2xl flex items-center gap-2 text-sm font-medium transition shadow-lg shadow-gray-200"
          >
            <Plus size={18} /> Tambah Vendor
          </button>
        </div>

        {/* Master Card */}
        <div className="backdrop-blur-xl bg-white/60 border border-white/80 shadow-2xl shadow-rose-100/40 rounded-[2rem] p-8 md:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-200/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div>
              <p className="text-gray-500 mb-2 flex items-center gap-2">
                <Wallet size={18} /> Total Anggaran
              </p>
              <p className="text-4xl font-semibold">
                Rp {totalBudget.toLocaleString('id-ID')}
              </p>
            </div>
            <div>
              <p className="text-gray-500 mb-2 flex items-center gap-2">
                <TrendingUp size={18} className="text-rose-500"/> Dana Terpakai (Aktual)
              </p>
              <p className="text-4xl font-semibold text-rose-900">
                Rp {totalSpent.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex justify-between text-sm mb-2 font-medium">
              <span>Terserap: {percentage.toFixed(1)}%</span>
              <span className="text-gray-500">Sisa: Rp {remainingBudget.toLocaleString('id-ID')}</span>
            </div>
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-rose-300 to-rose-500 rounded-full"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Grid Status Vendor Dinamis */}
      <div className="max-w-6xl mx-auto px-8 mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatusCard 
          title="Jatuh Tempo Terdekat" 
          vendor={upcomingDueDate ? upcomingDueDate.vendor_name : "Belum ada tagihan terdekat"} 
          amount={upcomingDueDate ? `Sisa: Rp ${(Number(upcomingDueDate.total_cost) - Number(upcomingDueDate.paid_amount)).toLocaleString('id-ID')}` : "Rp 0"} 
          date={upcomingDueDate?.due_date ? new Date(upcomingDueDate.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : "-"} 
          icon={<AlertCircle className="text-amber-500" />} 
        />
        <StatusCard 
          title="Termin Aktif" 
          vendor={activeTerm ? activeTerm.vendor_name : "Tidak ada termin aktif"} 
          amount={activeTerm ? `Terbayar: Rp ${Number(activeTerm.paid_amount).toLocaleString('id-ID')}` : "Rp 0"} 
          date={activeTerm ? `Status: ${activeTerm.status}` : "-"} 
          icon={<CreditCard className="text-blue-500" />} 
        />
      </div>

      {/* Grid Grafik & Tabel Detail */}
      <div className="max-w-6xl mx-auto px-8 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Widget Donut Chart */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-serif italic text-rose-900 mb-2 flex items-center gap-2">
              <PieIcon size={20} /> Proporsi Anggaran
            </h3>
            <p className="text-xs text-gray-400">Visualisasi pembagian pagu dana per kategori.</p>
          </div>
          <div className="h-56 w-full my-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => `Rp ${Number(value).toLocaleString('id-ID')}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabel Detail Vendor */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
          <h3 className="text-xl font-serif italic text-rose-900 mb-6">Rincian Pengeluaran Vendor</h3>
          
          {expensesList.length === 0 ? (
            <p className="text-gray-400 text-sm py-4">Belum ada vendor yang ditambahkan.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                    <th className="pb-4 font-medium">Vendor</th>
                    <th className="pb-4 font-medium">Kategori</th>
                    <th className="pb-4 font-medium">Total Biaya</th>
                    <th className="pb-4 font-medium">Terbayar</th>
                    <th className="pb-4 font-medium">Status</th>
                    <th className="pb-4 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {expensesList.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-4 font-semibold text-gray-800">{item.vendor_name}</td>
                      <td className="py-4 text-gray-500">{item.budget_categories?.name || '-'}</td>
                      <td className="py-4 font-medium">Rp {Number(item.total_cost).toLocaleString('id-ID')}</td>
                      <td className="py-4 text-rose-900 font-medium">Rp {Number(item.paid_amount).toLocaleString('id-ID')}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          item.status === 'Paid Off' ? 'bg-emerald-100 text-emerald-800' :
                          item.status === 'DP Paid' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button 
                          onClick={() => handleDeleteExpense(item.id)}
                          className="text-gray-400 hover:text-rose-600 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Form Input Vendor */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative border border-gray-100"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>

              <h2 className="text-2xl font-serif italic text-rose-900 mb-6">Tambah Tagihan Vendor</h2>

              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">Kategori</label>
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-rose-400 text-sm bg-transparent"
                    required
                  >
                    <option value="">Pilih Kategori...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">Nama Vendor</label>
                  <input 
                    type="text"
                    placeholder="Contoh: Catering Nusantara"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-rose-400 text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">Total Biaya (Rp)</label>
                    <input 
                      type="number"
                      placeholder="50000000"
                      value={totalCost}
                      onChange={(e) => setTotalCost(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-rose-400 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">Sudah Dibayar/DP (Rp)</label>
                    <input 
                      type="number"
                      placeholder="15000000"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-rose-400 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">Tanggal Jatuh Tempo Pelunasan</label>
                  <input 
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-rose-400 text-sm"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-rose-900 text-white py-3.5 rounded-xl font-medium hover:bg-rose-950 transition mt-4"
                >
                  Simpan Vendor
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusCard({ title, vendor, amount, date, icon }: any) {
  return (
    <motion.div whileHover={{ y: -4 }} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
      <div className="p-3 bg-gray-50 rounded-xl">{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
        <p className="text-lg font-semibold text-gray-800">{vendor}</p>
        <div className="flex gap-4 mt-2 text-sm">
          <span className="text-rose-600 font-medium">{amount}</span>
          <span className="text-gray-400">{date}</span>
        </div>
      </div>
    </motion.div>
  );
}