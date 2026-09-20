'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, CheckCircle2, ListTodo, ChevronDown, ChevronUp, MapPin, Link2, Edit2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ChecklistPage() {
  const [checklists, setChecklists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openCardCategories, setOpenCardCategories] = useState<string[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'KUA',
    due_date: '',
    vendor_link: '',
    tempat: ''
  });

  const fetchChecklists = async () => {
    const { data } = await supabase
      .from('checklists')
      .select('*')
      .order('is_completed', { ascending: true })
      .order('created_at', { ascending: false });
    
    if (data) {
      setChecklists(data);
      // Buka semua kartu kategori secara default
      const uniqueCategories = Array.from(new Set(data.map(item => item.category)));
      setOpenCardCategories(uniqueCategories);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchChecklists();
  }, []);

  const toggleCategoryCard = (category: string) => {
    setOpenCardCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const resetForm = () => {
    setFormData({ title: '', category: 'KUA', due_date: '', vendor_link: '', tempat: '' });
    setEditingId(null);
    setIsModalOpen(false);
  };

  const handleEditClick = (item: any) => {
    setFormData({
      title: item.title,
      category: item.category || 'KUA',
      due_date: item.due_date || '',
      vendor_link: item.vendor_link || '',
      tempat: item.tempat || ''
    });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    if (editingId) {
      const { error } = await supabase.from('checklists').update(formData).eq('id', editingId);
      if (!error) { resetForm(); fetchChecklists(); }
    } else {
      const { error } = await supabase.from('checklists').insert([{ ...formData, is_completed: false }]);
      if (!error) { resetForm(); fetchChecklists(); }
    }
  };

  const toggleCompletion = async (id: string, currentStatus: boolean) => {
    setChecklists(checklists.map(item => item.id === id ? { ...item, is_completed: !currentStatus } : item));
    await supabase.from('checklists').update({ is_completed: !currentStatus }).eq('id', id);
    fetchChecklists();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus tugas ini?')) return;
    await supabase.from('checklists').delete().eq('id', id);
    fetchChecklists();
  };

  // Grouping Data berdasarkan Kategori
  const groupedChecklists = checklists.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const getCategoryTheme = (index: number) => {
    const themes = [
      { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-900', btn: 'bg-rose-100 text-rose-800' },
      { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', btn: 'bg-blue-100 text-blue-800' },
      { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', btn: 'bg-emerald-100 text-emerald-800' },
      { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', btn: 'bg-purple-100 text-purple-800' },
      { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', btn: 'bg-amber-100 text-amber-800' },
    ];
    return themes[index % themes.length];
  };

  const totalTasks = checklists.length;
  const completedTasks = checklists.filter(c => c.is_completed).length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  if (isLoading) return <div className="flex justify-center pt-20 text-gray-400">Memuat Checklist...</div>;

  return (
    <div className="pb-20 max-w-5xl mx-auto">
      
      {/* Banner Header Berwarna (Seragam dengan Dasbor & Budget) */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-rose-900 to-rose-950 rounded-[2.5rem] p-8 md:p-10 mb-8 text-white shadow-2xl shadow-rose-900/20 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-20 w-40 h-40 bg-rose-500/20 rounded-full blur-3xl -mb-10 pointer-events-none"></div>

        <div className="relative z-10">
          <span className="inline-block bg-white/20 text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4 backdrop-blur-sm border border-white/20">
            Modul Persiapan
          </span>
          <h1 className="text-3xl md:text-4xl font-serif italic font-semibold mb-2 text-white flex items-center gap-3">
            <ListTodo size={32} className="text-rose-300" /> Master Checklist
          </h1>
          <p className="text-rose-100 text-sm font-medium">Kelola daftar tugas, jadwal, vendor, dan lokasi acara secara terstruktur.</p>
        </div>

        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="relative z-10 bg-white text-rose-900 hover:bg-rose-50 px-6 py-3.5 rounded-xl flex items-center gap-2 text-sm font-bold transition shadow-lg"
        >
          <Plus size={18} /> Tambah Tugas
        </button>
      </motion.div>

      {/* Progress Widget */}
      <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm mb-8">
        <div className="flex justify-between items-end mb-3">
          <div>
            <h3 className="font-bold text-[#2C3E50] text-lg">Progres Persiapan</h3>
            <p className="text-sm font-medium text-gray-500">{completedTasks} dari {totalTasks} tugas selesai</p>
          </div>
          <p className="text-3xl font-extrabold text-rose-900">{progressPercentage.toFixed(0)}%</p>
        </div>
        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercentage}%` }} transition={{ duration: 1 }} className="h-full bg-emerald-500 rounded-full" />
        </div>
      </div>

      {/* Kartu Kategori Akordeon */}
      <div className="space-y-6">
        <AnimatePresence>
          {Object.keys(groupedChecklists).length === 0 ? (
            <p className="text-center text-gray-400 py-10">Belum ada daftar tugas. Klik "Tambah Tugas" untuk memulai.</p>
          ) : (
            Object.entries(groupedChecklists).map(([categoryName, items]: [string, any], index) => {
              const catDoneCount = items.filter((i: any) => i.is_completed).length;
              const isAllDone = items.length > 0 && catDoneCount === items.length;
              const isOpen = openCardCategories.includes(categoryName);
              const theme = getCategoryTheme(index);

              return (
                <motion.div key={categoryName} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`bg-white rounded-[2rem] border transition-all shadow-sm overflow-hidden ${isAllDone ? 'border-emerald-300 ring-2 ring-emerald-100' : theme.border}`}>
                  
                  {/* Header Kartu Besar */}
                  <div className={`p-6 flex justify-between items-center gap-4 border-b ${isAllDone ? 'bg-emerald-50 border-emerald-100' : `${theme.bg}${theme.border}`}`}>
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleCategoryCard(categoryName)} className={`p-1.5 rounded-lg transition ${isAllDone ? 'text-emerald-700 hover:bg-emerald-100' : `${theme.text} hover:bg-white/50`}`}>
                        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                      <div className="flex items-center gap-3">
                        <h2 className={`text-xl font-extrabold tracking-wide uppercase ${isAllDone ? 'text-emerald-900' : theme.text}`}>{categoryName}</h2>
                        {isAllDone && <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm"><CheckCircle2 size={14} /> All Done</span>}
                      </div>
                    </div>
                    <p className={`text-sm font-bold ${isAllDone ? 'text-emerald-700' : theme.text} opacity-80`}>{catDoneCount} / {items.length} Selesai</p>
                  </div>

                  {/* Isi Kartu (Baris Detail Item) */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-6 space-y-3 bg-white">
                        {items.map((item: any) => (
                          <div key={item.id} className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-md transition">
                            
                            {/* Kiri: Info Tugas */}
                            <div className="flex-1">
                              <h3 className={`font-bold text-lg mb-2 ${item.is_completed ? 'line-through text-gray-400' : 'text-[#2C3E50]'}`}>
                                {item.title}
                              </h3>
                              <div className="flex flex-wrap items-center gap-4">
                                {item.due_date && (
                                  <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100">
                                    Tgl: {new Date(item.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                )}
                                {item.tempat && (
                                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 flex items-center gap-1">
                                    <MapPin size={12}/> {item.tempat}
                                  </span>
                                )}
                                {item.vendor_link && (
                                  <a href={item.vendor_link.startsWith('http') ? item.vendor_link : `https://${item.vendor_link}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 hover:bg-emerald-100 flex items-center gap-1 transition">
                                    <Link2 size={12}/> Vendor / Link
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Kanan: Aksi (Tandai Selesai, Edit, Hapus) 3 Baris Vertikal */}
                            <div className="flex flex-col gap-2 min-w-[140px] items-stretch w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                              <button 
                                onClick={() => toggleCompletion(item.id, item.is_completed)}
                                className={`w-full px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-md ${
                                  item.is_completed ? 'bg-gray-300 text-gray-700 hover:bg-gray-400' : 'bg-rose-900 text-white hover:bg-rose-950'
                                }`}
                              >
                                {item.is_completed ? 'Batalkan' : 'Tandai Selesai'}
                              </button>
                              <button 
                                onClick={() => handleEditClick(item)}
                                className="w-full px-5 py-2.5 rounded-full text-sm font-bold bg-white text-[#2C3E50] border border-gray-200 hover:bg-gray-50 shadow-sm transition-all text-center"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDelete(item.id)}
                                className="w-full px-5 py-2.5 rounded-full text-sm font-bold bg-white text-rose-600 border border-gray-200 hover:bg-rose-50 shadow-sm transition-all text-center"
                              >
                                Hapus
                              </button>
                            </div>

                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Modal Tambah/Edit Tugas */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button onClick={resetForm} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X size={20} /></button>
              <h2 className="text-2xl font-serif italic text-rose-900 mb-6">{editingId ? 'Edit Tugas' : 'Tugas Baru'}</h2>
              
              <form onSubmit={handleSaveChecklist} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Nama Tugas *</label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Contoh: Rias pengantin" className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400" required autoFocus />
                </div>

                {/* Dropdown Kategori disesuaikan dengan Excel Anda */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Kategori *</label>
                  <select name="category" value={formData.category} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400 bg-gray-50/50">
                    <option value="KUA">KUA</option>
                    <option value="MUA">MUA</option>
                    <option value="Mahar dan Seserahan">Mahar dan Seserahan</option>
                    <option value="Venue/lokasi">Venue/lokasi</option>
                    <option value="Dokumentasi">Dokumentasi</option>
                    <option value="Pengisi Acara">Pengisi Acara</option>
                    <option value="Makanan">Makanan</option>
                    <option value="Undangan & Souvenir">Undangan & Souvenir</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Tenggat Waktu</label>
                    <input type="date" name="due_date" value={formData.due_date} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-600 focus:outline-rose-400" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Tempat Acara</label>
                    <input type="text" name="tempat" value={formData.tempat} onChange={handleChange} placeholder="Contoh: KUA Kec..." className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Vendor / Kontak / Link</label>
                  <input type="text" name="vendor_link" value={formData.vendor_link} onChange={handleChange} placeholder="Nama vendor atau link web..." className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400" />
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