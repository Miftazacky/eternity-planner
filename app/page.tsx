'use client';

import { motion } from 'framer-motion';
import { AlertCircle, Calendar, CheckCircle2, FileText, Wallet, Clock, MapPin } from 'lucide-react';
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

      // Fetch Pengeluaran
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
      
      {/* Banner Header Berwarna (Desain Baru) */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-rose-900 to-rose-950 rounded-[2.5rem] p-8 md:p-12 mb-8 text-white shadow-2xl shadow-rose-900/20 relative overflow-hidden"
      >
        {/* Ornamen Dekoratif Blur di Background Banner */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-20 w-40 h-40 bg-rose-500/20 rounded-full blur-3xl -mb-10 pointer-events-none"></div>

        <div className="relative z-10">
          <span className="inline-block bg-white/20 text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm border border-white/20">
            Wedding Planner
          </span>
          <h1 className="text-4xl md:text-5xl font-serif italic font-semibold mb-4 text-white">
            Elsa Anindita & Raphael Mahesa
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-rose-100 text-sm font-medium">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-rose-300" />
              <span>Minggu, 20 Mei 2027</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-rose-300" />
              <span>JIEXPO Kemayoran</span>
            </div>
            <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-rose-400"></div>
            <span className="bg-rose-800/80 px-3 py-1 rounded-lg border border-rose-700/50">H-220 Menuju Acara</span>
          </div>
        </div>
      </motion.div>

      {/* Banner Warning Dinamis */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-rose-50 border border-rose-100 rounded-[2rem] p-6 mb-8 flex items-start gap-4 shadow-sm"
      >
        <div className="bg-white p-2.5 rounded-full text-rose-500 shadow-sm mt-0.5">
          <AlertCircle size={22} />
        </div>
        <div>
          <h3 className="font-bold text-rose-900 text-lg">Tidak ada warning besar saat ini</h3>
          <p className="text-sm text-rose-700/80 mt-1 font-medium">
            Tetap cek vendor, siapkan dokumen, dan evaluasi rundown secara berkala.
          </p>
        </div>
      </motion.div>

      {/* Grid Konten Dasbor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Progres Utama (Mengambil porsi 2 kolom) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm flex flex-col justify-between"
        >
          <h3 className="text-xl font-bold text-[#2C3E50] mb-8">Progres Utama</h3>
          
          <div className="space-y-8">
            {/* Progres Checklist */}
            <ProgressBar 
              icon={<CheckCircle2 size={20} className="text-emerald-500" />}
              title="Checklist"
              subtitle="1/14 Selesai"
              percentage={7}
              colorClass="bg-emerald-500"
            />

            {/* Progres Dokumen */}
            <ProgressBar 
              icon={<FileText size={20} className="text-blue-500" />}
              title="Dokumen"
              subtitle="0/5 Dokumen Terpenuhi"
              percentage={0}
              colorClass="bg-blue-500"
            />

            {/* Progres Budget */}
            <ProgressBar 
              icon={<Wallet size={20} className="text-rose-500" />}
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
            className="bg-white border border-gray-100 rounded-[2rem] p-7 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600"><Clock size={20} /></div>
              <h3 className="font-bold text-[#2C3E50] text-lg">Rundown Terdekat</h3>
            </div>
            <div className="p-5 bg-gray-50/80 rounded-2xl border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">08:00 - 10:00</p>
              <p className="font-bold text-[#2C3E50] text-lg">Makeup Pengantin</p>
              <p className="text-sm text-gray-500 mt-1 font-medium">Sesi makeup pengantin wanita & ibu</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
            className="bg-[#2C3E50] text-white rounded-[2rem] p-7 shadow-md relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
            <h3 className="font-bold text-xl mb-3 relative z-10">Sesuai Jadwal</h3>
            <p className="text-sm text-gray-300 opacity-90 leading-relaxed mb-6 relative z-10 font-medium">
              Agenda persiapan berjalan lancar. Lanjutkan fokus ke pencarian vendor dekorasi minggu ini!
            </p>
            <button className="text-sm font-bold bg-white text-[#2C3E50] px-5 py-3 rounded-xl w-full hover:bg-gray-100 transition relative z-10 shadow-sm">
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
      <div className="flex justify-between items-end mb-3">
        <div className="flex items-center gap-4">
          <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 shadow-sm">{icon}</div>
          <div>
            <p className="font-bold text-[#2C3E50] text-lg">{title}</p>
            <p className="text-xs font-medium text-gray-500 mt-0.5">{subtitle}</p>
          </div>
        </div>
        <p className="font-extrabold text-2xl text-[#2C3E50]">{percentage.toFixed(0)}%</p>
      </div>
      <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
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