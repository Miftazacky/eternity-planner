'use client';

import { motion } from 'framer-motion';
import { Wallet, TrendingUp, AlertCircle, CreditCard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function BudgetDashboard() {
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFinancialData() {
      // 1. Kalkulasi Total Pagu Dana
      const { data: categories } = await supabase.from('budget_categories').select('allocated_amount');
      const budget = categories?.reduce((sum, cat) => sum + Number(cat.allocated_amount), 0) || 0;

      // 2. Kalkulasi Total Pengeluaran Aktual
      const { data: expenses } = await supabase.from('expenses').select('paid_amount');
      const spent = expenses?.reduce((sum, exp) => sum + Number(exp.paid_amount), 0) || 0;

      setTotalBudget(budget);
      setTotalSpent(spent);
      setIsLoading(false);
    }

    fetchFinancialData();
  }, []);

  const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const remainingBudget = totalBudget - totalSpent;

  if (isLoading) {
    return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-gray-400">Menyinkronkan data keuangan...</div>;
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C3E50] font-sans pb-20">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto pt-16 px-8"
      >
        <p className="text-sm uppercase tracking-widest text-rose-400 mb-2 font-semibold">Financial Command Center</p>
        <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-10">
          Wedding <span className="font-serif italic text-rose-900">Ledger</span>.
        </h1>

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

      {/* Grid Vendor (Sementara Masih Statis) */}
      <div className="max-w-6xl mx-auto px-8 mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatusCard title="Jatuh Tempo Terdekat" vendor="Belum ada data vendor" amount="Rp 0" date="-" icon={<AlertCircle className="text-amber-500" />} />
        <StatusCard title="Termin Aktif" vendor="Belum ada tagihan" amount="Rp 0" date="-" icon={<CreditCard className="text-blue-500" />} />
      </div>
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