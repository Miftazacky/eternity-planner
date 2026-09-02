'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, CheckCircle2, Circle, Calendar, ListTodo } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ChecklistPage() {
  const [checklists, setChecklists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Persiapan Awal');
  const [dueDate, setDueDate] = useState('');

  const fetchChecklists = async () => {
    const { data } = await supabase
      .from('checklists')
      .select('*')
      .order('is_completed', { ascending: true }) // Yang belum selesai di atas
      .order('created_at', { ascending: false });
    
    if (data) setChecklists(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchChecklists();
  }, []);

  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const { error } = await supabase.from('checklists').insert([{
      title,
      category,
      due_date: dueDate || null,
      is_completed: false
    }]);

    if (!error) {
      setIsModalOpen(false);
      setTitle('');
      setCategory('Persiapan Awal');
      setDueDate('');
      fetchChecklists();
    }
  };

  const toggleCompletion = async (id: string, currentStatus: boolean) => {
    // Optimistic UI update (biar terasa cepat/instan saat diklik)
    setChecklists(checklists.map(item => 
      item.id === id ? { ...item, is_completed: !currentStatus } : item
    ));

    // Update ke database
    await supabase.from('checklists').update({ is_completed: !currentStatus }).eq('id', id);
    fetchChecklists(); // Refresh untuk mengurutkan ulang
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus tugas ini?')) return;
    await supabase.from('checklists').delete().eq('id', id);
    fetchChecklists();
  };

  // Kalkulasi Progres
  const totalTasks = checklists.length;
  const completedTasks = checklists.filter(c => c.is_completed).length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  if (isLoading) return <div className="flex justify-center pt-20 text-gray-400">Memuat Checklist...</div>;

  return (
    <div className="pb-20 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2C3E50] mb-2 flex items-center gap-3">
            <ListTodo className="text-rose-900" size={32} /> Master Checklist
          </h1>
          <p className="text-gray-500 text-sm">Kelola daftar tugas persiapan pernikahanmu dengan rapi.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#2C3E50] hover:bg-black text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition shadow-lg"
        >
          <Plus size={18} /> Tambah Tugas
        </button>
      </div>

      {/* Progress Bar Widget */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm mb-8">
        <div className="flex justify-between items-end mb-3">
          <div>
            <h3 className="font-bold text-[#2C3E50] text-lg">Progres Persiapan</h3>
            <p className="text-sm text-gray-500">{completedTasks} dari {totalTasks} tugas selesai</p>
          </div>
          <p className="text-3xl font-bold text-rose-900">{progressPercentage.toFixed(0)}%</p>
        </div>
        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }} animate={{ width: `${progressPercentage}%` }} transition={{ duration: 1 }}
            className="h-full bg-emerald-500 rounded-full"
          />
        </div>
      </div>

      {/* Daftar Checklist */}
      <div className="space-y-3">
        <AnimatePresence>
          {checklists.length === 0 ? (
            <p className="text-center text-gray-400 py-10">Belum ada daftar tugas. Klik "Tambah Tugas" untuk memulai.</p>
          ) : (
            checklists.map((item) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-white p-5 rounded-2xl border transition-all flex items-center justify-between group ${
                  item.is_completed ? 'border-gray-100 bg-gray-50/50' : 'border-gray-200 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => toggleCompletion(item.id, item.is_completed)}>
                  {/* Tombol Checklist Interaktif */}
                  <motion.div whileTap={{ scale: 0.8 }}>
                    {item.is_completed ? (
                      <CheckCircle2 size={26} className="text-emerald-500" />
                    ) : (
                      <Circle size={26} className="text-gray-300 hover:text-rose-400 transition-colors" />
                    )}
                  </motion.div>
                  
                  {/* Info Tugas */}
                  <div>
                    <h3 className={`font-semibold text-lg transition-colors ${item.is_completed ? 'text-gray-400 line-through' : 'text-[#2C3E50]'}`}>
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${item.is_completed ? 'bg-gray-200 text-gray-500' : 'bg-rose-100 text-rose-800'}`}>
                        {item.category}
                      </span>
                      {item.due_date && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar size={12} /> {new Date(item.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tombol Hapus */}
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-600 transition-all p-2"
                >
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Modal Tambah Tugas */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
            >
              <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X size={20} /></button>
              <h2 className="text-2xl font-serif italic text-rose-900 mb-6">Tugas Baru</h2>
              
              <form onSubmit={handleAddChecklist} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Nama Tugas *</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Booking MUA" className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400" required autoFocus />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Kategori</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400">
                    <option value="Persiapan Awal">Persiapan Awal</option>
                    <option value="Vendor">Vendor</option>
                    <option value="Administrasi & Dokumen">Administrasi & Dokumen</option>
                    <option value="Tamu & Undangan">Tamu & Undangan</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Tenggat Waktu (Deadline)</label>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-600 focus:outline-rose-400" />
                </div>
                <button type="submit" className="w-full bg-rose-900 text-white py-3.5 rounded-xl font-medium hover:bg-rose-950 transition mt-6">
                  Simpan Tugas
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}