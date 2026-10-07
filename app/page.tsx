'use client';

import { motion } from 'framer-motion';
import { 
  CalendarDays, MapPin, AlertCircle, CheckCircle2, 
  Wallet, Users, FileText, Camera, Gift, ListTodo, ChevronRight, Clock
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// --- PENGATURAN DASAR ---
const WEDDING_DATE = new Date('2027-05-20T08:00:00');
const BRIDE_GROOM_NAME = "Kimprut Lucknut & Tata Ganteng";
const VENUE = "JIEXPO Kemayoran";

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [daysLeft, setDaysLeft] = useState(0);

  // State untuk menyimpan agregasi data dari seluruh modul
  const [stats, setStats] = useState({
    checklist: { total: 0, done: 0 },
    dokumen: { total: 0, done: 0 },
    budget: { pagu: 0, actual: 0 },
    tamu: { undangan: 0, hadirPax: 0, totalPax: 0 },
    prewedding: { total: 0, done: 0 },
    seserahan: { total: 0, done: 0 }
  });

  useEffect(() => {
    // Hitung Mundur Hari-H
    const today = new Date();
    const diffTime = Math.abs(WEDDING_DATE.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysLeft(diffDays);

    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      // Jalankan semua query secara paralel agar loading secepat kilat
      const [
        { data: checklist },
        { data: dokumen },
        { data: budgetCat },
        { data: expenses },
        { data: tamu },
        { data: prewedding },
        { data: seserahan }
      ] = await Promise.all([
        supabase.from('checklist').select('is_completed'),
        supabase.from('dokumen').select('is_completed'),
        supabase.from('budget_categories').select('allocated_amount'),
        supabase.from('expenses').select('actual_cost'),
        supabase.from('tamu').select('status, pax'),
        supabase.from('prewedding').select('status'),
        supabase.from('seserahan_items').select('status')
      ]);

      // Kalkulasi Modul
      const clTotal = checklist?.length || 0;
      const clDone = checklist?.filter(i => i.is_completed).length || 0;
      
      const docTotal = dokumen?.length || 0;
      const docDone = dokumen?.filter(i => i.is_completed).length || 0;

      const budPagu = budgetCat?.reduce((sum, item) => sum + (Number(item.allocated_amount) || 0), 0) || 0;
      const budActual = expenses?.reduce((sum, item) => sum + (Number(item.actual_cost) || 0), 0) || 0;

      const tamuUndangan = tamu?.length || 0;
      const tamuTotalPax = tamu?.reduce((sum, item) => sum + (Number(item.pax) || 0), 0) || 0;
      const tamuHadir = tamu?.filter(i => i.status === 'RSVP Hadir').reduce((sum, item) => sum + (Number(item.pax) || 0), 0) || 0;

      const prewedTotal = prewedding?.length || 0;
      const prewedDone = prewedding?.filter(i => i.status === 'Selesai').length || 0;

      const srTotal = seserahan?.length || 0;
      const srDone = seserahan?.filter(i => i.status === 'Done').length || 0;

      setStats({
        checklist: { total: clTotal, done: clDone },
        dokumen: { total: docTotal, done: docDone },
        budget: { pagu: budPagu, actual: budActual },
        tamu: { undangan: tamuUndangan, hadirPax: tamuHadir, totalPax: tamuTotalPax },
        prewedding: { total: prewedTotal, done: prewedDone },
        seserahan: { total: srTotal, done: srDone }
      });

    } catch (error) {
      console.error("Gagal memuat data dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="flex justify-center pt-20 text-gray-400">Menyinkronkan Data Command Center...</div>;

  // Persentase Kalkulasi
  const getPct = (done: number, total: number) => total > 0 ? Math.round((done / total) * 100) : 0;
  
  const checklistPct = getPct(stats.checklist.done, stats.checklist.total);
  const dokumenPct = getPct(stats.dokumen.done, stats.dokumen.total);
  const budgetPct = getPct(stats.budget.actual, stats.budget.pagu);
  const prewedPct = getPct(stats.prewedding.done, stats.prewedding.total);
  const seserahanPct = getPct(stats.seserahan.done, stats.seserahan.total);
  const tamuPct = getPct(stats.tamu.hadirPax, stats.tamu.totalPax);

  // Logika Peringatan (Warning Logic)
  let warningMessage = "Persiapan berjalan lancar! Lanjutkan progres mingguan Anda.";
  let warningType = "safe"; // safe, warning, danger
  
  if (budgetPct > 100) {
    warningMessage = "Over-budget Terdeteksi! Pengeluaran aktual Anda melebihi pagu target.";
    warningType = "danger";
  } else if (daysLeft < 30 && dokumenPct < 100) {
    warningMessage = "Hari-H sudah dekat, tetapi Berkas Dokumen Legal belum 100% rampung!";
    warningType = "danger";
  } else if (checklistPct < 50 && daysLeft < 60) {
    warningMessage = "Progres Checklist Anda cukup lambat. Segera selesaikan agenda prioritas!";
    warningType = "warning";
  }

  return (
    <div className="pb-20 max-w-6xl mx-auto space-y-8">
      
      {/* 1. HERO BANNER (Super Aesthetic) */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-rose-900 via-rose-950 to-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-rose-900/20 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/20 rounded-full blur-3xl -ml-10 pointer-events-none"></div>

        <div className="relative z-10 w-full md:w-2/3 text-center md:text-left">
          <span className="inline-block bg-white/10 text-rose-100 text-[10px] md:text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6 backdrop-blur-md border border-white/10">
            Eternity Wedding Command Center
          </span>
          <h1 className="text-4xl md:text-5xl font-serif italic font-bold mb-6 text-white leading-tight">
            {BRIDE_GROOM_NAME}
          </h1>
          <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-sm font-medium text-rose-100/80">
            <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl backdrop-blur-sm"><CalendarDays size={16}/> {WEDDING_DATE.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl backdrop-blur-sm"><MapPin size={16}/> {VENUE}</div>
          </div>
        </div>

        {/* Countdown Box */}
        <div className="relative z-10 w-full md:w-auto flex flex-col items-center bg-white/10 backdrop-blur-md border border-white/20 p-6 md:p-8 rounded-[2rem] shadow-xl">
          <p className="text-xs uppercase tracking-widest text-rose-200 font-bold mb-2">Menuju Hari Bahagia</p>
          <div className="flex items-end gap-2">
            <span className="text-6xl md:text-7xl font-extrabold text-white leading-none">{daysLeft}</span>
            <span className="text-xl font-bold text-rose-200 mb-1">Hari</span>
          </div>
        </div>
      </motion.div>

      {/* 2. WARNING / INFO BAR */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className={`p-5 rounded-2xl border flex items-center gap-4 shadow-sm ${
        warningType === 'danger' ? 'bg-rose-50 border-rose-200 text-rose-800' : 
        warningType === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
      }`}>
        {warningType === 'safe' ? <CheckCircle2 size={24} className="text-emerald-500" /> : <AlertCircle size={24} className={warningType === 'danger' ? "text-rose-500" : "text-amber-500"} />}
        <div>
          <h4 className="font-bold text-sm">{warningType === 'safe' ? 'Status Aman' : 'Perhatian Dibutuhkan!'}</h4>
          <p className="text-xs font-medium opacity-80 mt-0.5">{warningMessage}</p>
        </div>
      </motion.div>

      {/* 3. TOP METRICS (4 Kotak Cepat) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/budget" className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition group">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition"><Wallet size={20}/></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Realisasi Budget</p>
          <p className={`text-xl md:text-2xl font-extrabold ${budgetPct > 100 ? 'text-rose-600' : 'text-[#2C3E50]'}`}>Rp {(stats.budget.actual / 1000000).toFixed(1)}Jt</p>
          <p className="text-[10px] font-bold text-gray-400 mt-1">Dari Pagu Rp {(stats.budget.pagu / 1000000).toFixed(1)}Jt</p>
        </Link>
        <Link href="/tamu" className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition group">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition"><Users size={20}/></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">RSVP Kehadiran</p>
          <p className="text-xl md:text-2xl font-extrabold text-[#2C3E50]">{stats.tamu.hadirPax} <span className="text-sm">Pax</span></p>
          <p className="text-[10px] font-bold text-gray-400 mt-1">Dari Total {stats.tamu.totalPax} Kapasitas</p>
        </Link>
        <Link href="/panduan" className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition group">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition"><FileText size={20}/></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Berkas Dokumen</p>
          <p className="text-xl md:text-2xl font-extrabold text-[#2C3E50]">{stats.dokumen.done} <span className="text-sm text-gray-400">/ {stats.dokumen.total}</span></p>
          <p className="text-[10px] font-bold text-gray-400 mt-1">Syarat Terpenuhi</p>
        </Link>
        <Link href="/vendor" className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition group">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4 group-hover:scale-110 transition"><Camera size={20}/></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Prewedding</p>
          <p className="text-xl md:text-2xl font-extrabold text-[#2C3E50]">{stats.prewedding.done} <span className="text-sm text-gray-400">/ {stats.prewedding.total}</span></p>
          <p className="text-[10px] font-bold text-gray-400 mt-1">Agenda Selesai</p>
        </Link>
      </div>

      {/* 4. DETAIL PROGRES (Kiri & Kanan) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Progress Tracker Besar */}
        <div className="md:col-span-2 bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold text-[#2C3E50] mb-8 flex items-center gap-2"><ListTodo size={24} className="text-rose-900" /> Progres Utama Persiapan</h2>
          
          <div className="space-y-6">
            {/* Checklist */}
            <div className="group">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <h4 className="font-bold text-sm text-gray-700 group-hover:text-rose-700 transition">Master Checklist</h4>
                  <p className="text-[10px] font-medium text-gray-400 mt-0.5">{stats.checklist.done} dari {stats.checklist.total} tugas selesai</p>
                </div>
                <span className="font-extrabold text-rose-700 text-lg">{checklistPct}%</span>
              </div>
              <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${checklistPct}%` }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-rose-500 rounded-full" />
              </div>
            </div>

            {/* Budget Usage */}
            <div className="group">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <h4 className="font-bold text-sm text-gray-700 group-hover:text-blue-700 transition">Konsumsi Budget</h4>
                  <p className="text-[10px] font-medium text-gray-400 mt-0.5">Rp {(stats.budget.actual / 1000000).toFixed(1)}Jt / Rp {(stats.budget.pagu / 1000000).toFixed(1)}Jt</p>
                </div>
                <span className={`font-extrabold text-lg ${budgetPct > 100 ? 'text-rose-600' : 'text-blue-700'}`}>{budgetPct}%</span>
              </div>
              <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${budgetPct > 100 ? 100 : budgetPct}%` }} transition={{ duration: 1, delay: 0.3 }} className={`h-full rounded-full ${budgetPct > 100 ? 'bg-rose-500' : 'bg-blue-500'}`} />
              </div>
            </div>

            {/* Hantaran / Seserahan */}
            <div className="group">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <h4 className="font-bold text-sm text-gray-700 group-hover:text-amber-700 transition">Barang Seserahan</h4>
                  <p className="text-[10px] font-medium text-gray-400 mt-0.5">{stats.seserahan.done} dari {stats.seserahan.total} barang sudah dibeli</p>
                </div>
                <span className="font-extrabold text-amber-700 text-lg">{seserahanPct}%</span>
              </div>
              <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${seserahanPct}%` }} transition={{ duration: 1, delay: 0.4 }} className="h-full bg-amber-500 rounded-full" />
              </div>
            </div>
            
            {/* Tamu / RSVP */}
            <div className="group">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <h4 className="font-bold text-sm text-gray-700 group-hover:text-purple-700 transition">Rasio Kehadiran (RSVP)</h4>
                  <p className="text-[10px] font-medium text-gray-400 mt-0.5">{stats.tamu.hadirPax} pax hadir dari {stats.tamu.totalPax} pax diundang</p>
                </div>
                <span className="font-extrabold text-purple-700 text-lg">{tamuPct}%</span>
              </div>
              <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${tamuPct}%` }} transition={{ duration: 1, delay: 0.5 }} className="h-full bg-purple-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Akses Cepat */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-[#2C3E50] to-slate-800 rounded-[2rem] p-8 text-white shadow-lg border border-slate-700">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
              <Clock size={24} className="text-blue-300" />
            </div>
            <h3 className="text-xl font-bold mb-2">Sesuai Jadwal!</h3>
            <p className="text-sm font-medium text-slate-300 mb-8 leading-relaxed">
              Persiapan Anda berada di jalur yang tepat. Jangan lupa untuk beristirahat dan menjaga kesehatan menjelang hari H.
            </p>
            <Link href="/checklist" className="block w-full bg-white text-slate-900 py-3 rounded-xl text-center text-sm font-bold hover:bg-slate-100 transition shadow-sm">
              Lanjutkan Checklist
            </Link>
          </div>

          <Link href="/rundown" className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm flex items-center justify-between group hover:border-rose-200 transition">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition">
                <CalendarDays size={18} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#2C3E50]">Cek Jadwal Rundown</h4>
                <p className="text-[10px] text-gray-400 font-medium">Timeline Persiapan & Hari-H</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-300 group-hover:text-rose-600 transition" />
          </Link>
        </div>

      </div>
    </div>
  );
}