'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function WeddingDashboard() {
  // Ganti tanggal ini dengan tanggal pernikahanmu (Format: YYYY-MM-DDTHH:mm:ss)
  const weddingDate = new Date('2028-02-19T08:00:00').getTime();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = weddingDate - now;
      
      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          mins: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [weddingDate]);

  if (!isMounted) return null; // Mencegah error hydration di Next.js

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C3E50] font-sans selection:bg-rose-200">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-5xl mx-auto pt-24 px-8"
      >
        <p className="text-sm uppercase tracking-widest text-rose-400 mb-4">Command Center</p>
        <h1 className="text-5xl md:text-7xl font-light tracking-tight mb-8">
          The Journey to <br/> <span className="font-serif italic text-rose-900">Forever</span>.
        </h1>

        <div className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-xl shadow-rose-100/50 rounded-3xl p-8 flex gap-8 max-w-fit">
          <div className="text-center">
            <span className="block text-4xl font-light">{timeLeft.days}</span>
            <span className="text-xs uppercase tracking-wider text-gray-500">Days</span>
          </div>
          <div className="text-center">
            <span className="block text-4xl font-light">{timeLeft.hours}</span>
            <span className="text-xs uppercase tracking-wider text-gray-500">Hours</span>
          </div>
          <div className="text-center">
            <span className="block text-4xl font-light">{timeLeft.mins}</span>
            <span className="text-xs uppercase tracking-wider text-gray-500">Mins</span>
          </div>
        </div>
      </motion.div>

      <div className="max-w-5xl mx-auto px-8 mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Guest RSVP" value="0 / 300" subtitle="Pending Integration" />
        <StatCard title="Budget Used" value="0%" subtitle="IDR 0 / Target" />
        <StatCard title="Pending Tasks" value="Vendor" subtitle="Catering & MUA" />
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle }: { title: string, value: string, subtitle: string }) {
  return (
    <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <h3 className="text-sm font-medium text-gray-400 mb-2">{title}</h3>
      <p className="text-2xl font-semibold text-gray-800">{value}</p>
      <p className="text-xs text-rose-400 mt-2">{subtitle}</p>
    </motion.div>
  );
}