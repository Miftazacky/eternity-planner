'use client';

import { motion } from 'framer-motion';
import { AlertCircle, Calendar, CheckCircle2, FileText, Wallet, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DashboardHome() {
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      // Fetch Kategori untuk Total Pagu Anggaran
      const { data: catData } = await supabase.from('budget_categories').select('allocated_amount');
      const budget = catData?.reduce((sum, cat) => sum + Number(cat.allocated_amount), 0) || 0;

      // Fetch Pengeluaran dari struktur tabel yang BARU (Fase 2)
      const { data: expData } = await supabase.from('expenses').select('paid_amount');
      const spent = expData?.reduce((sum, exp) => sum + Number(exp.paid_amount), 0) || 0;

      setTotalBudget(budget);
      setTotalSpent(spent);
      setIsLoading(false);
    }
    fetchDashboardData();
  }, []);

  const budgetPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Memuat Dasbor...</div>;
  }

  return (
    <div className="pb-20 max-w-6xl mx-auto">
      {/* Sapaan & Tanggal */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <p className="text-sm font-semibold tracking-wider text-rose-500 uppercase mb-2">
          Nikahnya 2027, nyiapinnya dari sekarang
        </p>
        <h1 className="text-3xl font-bold text-[#2C3E50] mb-2">
          Kemprut Lucknut & Tata Ganteng
        </h1>
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Calendar size={16} />
          <span>Minggu, 20 Mei 2027 • H-220 Menuju Acara</span>
        </div>
      </motion.div>

      {/* Banner Warning Dinamis */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-rose-50 border border-rose-100 rounded-2xl p-5 mb-8 flex items-start gap-4 shadow-sm"
      >
        <div className="bg-white p-2 rounded-full text-rose-500 shadow-sm mt-0.5">
          <AlertCircle size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-rose-900 text-lg">Tidak ada warning besar saat ini</h3>
          <p className="text-sm text-rose-700/80 mt-1">
            Siap cek vendor, siapkan dokumen, dan evaluasi secara berkala.
          </p>
        </div>
      </motion.div>

      {/* Grid Konten Dasbor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Progres Utama (Mengambil porsi 2 kolom) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-8 shadow-sm flex flex-col justify-between"
        >
          <h3 className="text-xl font-bold text-[#2C3E50] mb-6">Progres Utama</h3>
          
          <div className="space-y-6">
            {/* Progres Checklist (Dummy) */}
            <ProgressBar 
              icon={<CheckCircle2 size={18} className="text-emerald-500" />}
              title="Checklist"
              subtitle="1/14 Selesai"
              percentage={7}
              colorClass="bg-emerald-500"
            />

            {/* Progres Dokumen (Dummy) */}
            <ProgressBar 
              icon={<FileText size={18} className="text-blue-500" />}
              title="Dokumen"
              subtitle="0/5 Dokumen Terpenuhi"
              percentage={0}
              colorClass="bg-blue-500"
            />

            {/* Progres Budget (Real-time DB) */}
            <ProgressBar 
              icon={<Wallet size={18} className="text-rose-500" />}
              title="Budget Usage"
              subtitle={`Rp ${totalSpent.toLocaleString('id-ID')} / Rp ${totalBudget.toLocaleString('id-ID')}`}
              percentage={budgetPercentage}
              colorClass="bg-rose-500"
            />
          </div>
        </motion.div>

        {/* Kolom Kanan: Widget Pelengkap */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-amber-50 p-2 rounded-xl text-amber-600"><Clock size={18} /></div>
              <h3 className="font-bold text-[#2C3E50]">Rundown Terdekat</h3>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">08:00 - 10:00</p>
              <p className="font-semibold text-[#2C3E50]">Makeup Pengantin</p>
              <p className="text-sm text-gray-500 mt-1">Sesi makeup pengantin wanita & ibu</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
            className="bg-[#2C3E50] text-white rounded-3xl p-6 shadow-md"
          >
            <h3 className="font-bold text-lg mb-2">Sesuai Jadwal</h3>
            <p className="text-sm text-gray-300 opacity-90 leading-relaxed mb-4">
              Agenda persiapan berjalan lancar. Lanjutkan fokus ke pencarian vendor dekorasi minggu ini!
            </p>
            <button className="text-sm font-semibold bg-white text-[#2C3E50] px-4 py-2 rounded-xl w-full hover:bg-gray-100 transition">
              Lihat Checklist
            </button>
          </motion.div>
        </div>

      </div>
    </div>
  );
}

// Komponen Reusable untuk Progress Bar
function ProgressBar({ icon, title, subtitle, percentage, colorClass }: any) {
  return (
    <div>
      <div className="flex justify-between items-end mb-2">
        <div className="flex items-center gap-3">
          <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">{icon}</div>
          <div>
            <p className="font-semibold text-[#2C3E50]">{title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          </div>
        </div>
        <p className="font-bold text-lg text-[#2C3E50]">{percentage.toFixed(0)}%</p>
      </div>
      <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${colorClass} rounded-full`}
        />
      </div>
    </div>
  );
}