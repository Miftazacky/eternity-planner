'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ListTodo } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ChecklistPage() {
  const [checklists, setChecklists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Persiapan Awal');
  const [dueDate, setDueDate] = useState('');

  const fetchChecklists = async () => {
    const { data } = await supabase
      .from('checklists')
      .select('*')
      .order('is_completed', { ascending: true })
      .order('created_at', { ascending: false });
    
    if (data) setChecklists(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchChecklists();
  }, []);

  const resetForm = () => {
    setTitle('');
    setCategory('Persiapan Awal');
    setDueDate('');
    setEditingId(null);
    setIsModalOpen(false);
  };

  const handleEditClick = (item: any) => {
    setTitle(item.title);
    setCategory(item.category || 'Persiapan Awal');
    setDueDate(item.due_date || '');
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleSaveChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    if (editingId) {
      const { error } = await supabase
        .from('checklists')
        .update({ title, category, due_date: dueDate || null })
        .eq('id', editingId);

      if (!error) {
        resetForm();
        fetchChecklists();
      } else {
        alert('Gagal memperbarui tugas.');
      }
    } else {
      const { error } = await supabase.from('checklists').insert([{
        title,
        category,
        due_date: dueDate || null,
        is_completed: false
      }]);

      if (!error) {
        resetForm();
        fetchChecklists();
      } else {
        alert('Gagal menyimpan tugas.');
      }
    }
  };

  const toggleCompletion = async (id: string, currentStatus: boolean) => {
    setChecklists(checklists.map(item => 
      item.id === id ? { ...item, is_completed: !currentStatus } : item
    ));
    await supabase.from('checklists').update({ is_completed: !currentStatus }).eq('id', id);
    fetchChecklists();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus tugas ini?')) return;
    await supabase.from('checklists').delete().eq('id', id);
    fetchChecklists();
  };

  // Desain Baru: Menambahkan border-l-[6px] untuk penanda kiri yang gelap
  const getCategoryColor = (cat: string, isCompleted: boolean) => {
    if (isCompleted) return 'bg-gray-50 border-gray-200 border-l-gray-400 text-gray-500';
    
    switch (cat) {
      case 'Persiapan Awal': return 'bg-blue-50 border-blue-100 border-l-blue-500 text-blue-900';
      case 'Vendor': return 'bg-orange-50 border-orange-100 border-l-orange-500 text-orange-900';
      case 'Administrasi & Dokumen': return 'bg-purple-50 border-purple-100 border-l-purple-500 text-purple-900';
      case 'Tamu & Undangan': return 'bg-emerald-50 border-emerald-100 border-l-emerald-500 text-emerald-900';
      case 'Lain-lain': return 'bg-amber-50 border-amber-100 border-l-amber-500 text-amber-900';
      default: return 'bg-rose-50 border-rose-100 border-l-rose-500 text-rose-900';
    }
  };

  const getBadgeColor = (cat: string, isCompleted: boolean) => {
    if (isCompleted) return 'bg-gray-200 text-gray-500 border-gray-300';
    
    switch (cat) {
      case 'Persiapan Awal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Vendor': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Administrasi & Dokumen': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Tamu & Undangan': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Lain-lain': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

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
          onClick={() => { resetForm(); setIsModalOpen(true); }}
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
      <div className="space-y-4">
        <AnimatePresence>
          {checklists.length === 0 ? (
            <p className="text-center text-gray-400 py-10">Belum ada daftar tugas. Klik "Tambah Tugas" untuk memulai.</p>
          ) : (
            checklists.map((item) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className={`p-6 rounded-2xl border border-l-[6px] transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm ${getCategoryColor(item.category, item.is_completed)}`}
              >
                {/* Bagian Kiri: Info Tugas */}
                <div className="flex-1">
                  <div className="flex gap-2 mb-3">
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${getBadgeColor(item.category, item.is_completed)}`}>
                      {item.category}
                    </span>
                  </div>
                  <h3 className={`font-bold text-xl mb-1 ${item.is_completed ? 'line-through opacity-70' : ''}`}>
                    {item.title}
                  </h3>
                  <p className="text-sm opacity-80 font-medium">
                    Deadline: {item.due_date ? new Date(item.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                  </p>
                </div>

                {/* Bagian Kanan: Aksi (Tandai Selesai, Edit, Hapus) - Semua Berbentuk Pil Vertikal */}
                <div className="flex flex-col gap-1 min-w-[140px] items-stretch w-full md:w-auto">
                  <button 
                    onClick={() => toggleCompletion(item.id, item.is_completed)}
                    className={`w-full px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                      item.is_completed 
                        ? 'bg-gray-300 text-gray-700 hover:bg-gray-400' 
                        : 'bg-rose-900 text-white hover:bg-rose-950 shadow-md'
                    }`}
                  >
                    {item.is_completed ? 'Batalkan' : 'Tandai Selesai'}
                  </button>
                  <button 
                    onClick={() => handleEditClick(item)}
                    className="w-full px-5 py-2 rounded-full text-sm font-semibold opacity-70 hover:opacity-100 hover:bg-black/5 transition-all text-center"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="w-full px-5 py-2 rounded-full text-sm font-semibold text-rose-600 opacity-70 hover:opacity-100 hover:bg-rose-100 transition-all text-center"
                  >
                    Hapus
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Modal Tambah/Edit Tugas */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
            >
              <button onClick={resetForm} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X size={20} /></button>
              <h2 className="text-2xl font-serif italic text-rose-900 mb-6">
                {editingId ? 'Edit Tugas' : 'Tugas Baru'}
              </h2>
              
              <form onSubmit={handleSaveChecklist} className="space-y-4">
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
                  {editingId ? 'Simpan Perubahan' : 'Simpan Tugas'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}