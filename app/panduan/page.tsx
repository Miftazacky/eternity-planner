'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Map, Plus, X, Trash2, CheckCircle2, ChevronDown, ChevronUp, Edit2, CircleDot, Paperclip, Loader2, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PanduanPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // State untuk Upload File
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // State untuk Kategori/Fase Kustom
  const [customPhase, setCustomPhase] = useState('');

  const [formData, setFormData] = useState({
    phase: '',
    task_name: '',
    notes: '',
    file_url: '',
    file_name: ''
  });

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('panduan')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (data) setTasks(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const defaultPhases = ['H-6 Bulan', 'H-5 Bulan', 'H-4 Bulan', 'H-3 Bulan', 'H-2 Bulan', 'H-1 Bulan', 'Minggu Acara', 'Hari H'];
  const dynamicPhases = Array.from(new Set([...defaultPhases, ...tasks.map(t => t.phase)]));

  const [openPhases, setOpenPhases] = useState<string[]>(dynamicPhases);

  useEffect(() => {
    if (tasks.length > 0) {
      setOpenPhases(Array.from(new Set([...defaultPhases, ...tasks.map(t => t.phase)])));
    }
  }, [tasks.length]);

  const togglePhaseCard = (phase: string) => {
    setOpenPhases(prev => 
      prev.includes(phase) ? prev.filter(p => p !== phase) : [...prev, phase]
    );
  };

  const resetForm = () => {
    const firstPhase = dynamicPhases.length > 0 ? dynamicPhases[0] : 'custom';
    setFormData({ phase: firstPhase, task_name: '', notes: '', file_url: '', file_name: '' });
    setCustomPhase('');
    setEditingId(null);
    setSelectedFile(null);
    setIsModalOpen(false);
  };

  const handleEditClick = (item: any) => {
    setFormData({
      phase: item.phase,
      task_name: item.task_name,
      notes: item.notes || '',
      file_url: item.file_url || '',
      file_name: item.file_name || ''
    });
    setEditingId(item.id);
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'phase' && e.target.value !== 'custom') {
      setCustomPhase('');
    }
  };

  const handleFileChange = (e: any) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.task_name) return;

    const finalPhase = formData.phase === 'custom' ? customPhase : formData.phase;
    if (!finalPhase) {
      alert('Nama fase waktu tidak boleh kosong!');
      return;
    }

    setIsUploading(true);
    let newFileUrl = formData.file_url;
    let newFileName = formData.file_name;

    // Logika Upload File ke Supabase Storage (Jika ada file yang dipilih)
    if (selectedFile) {
      // Bikin nama file unik agar tidak bentrok
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('dokumen_panduan')
        .upload(fileName, selectedFile);

      if (error) {
        alert('Gagal upload dokumen: Pastikan nama bucket "dokumen_panduan" sudah dibuat dan public.');
        setIsUploading(false);
        return;
      }

      // Ambil URL Publik
      const { data: publicData } = supabase.storage
        .from('dokumen_panduan')
        .getPublicUrl(fileName);

      newFileUrl = publicData.publicUrl;
      newFileName = selectedFile.name;
    }

    const payload = {
      phase: finalPhase,
      task_name: formData.task_name,
      notes: formData.notes,
      file_url: newFileUrl,
      file_name: newFileName
    };

    if (editingId) {
      const { error } = await supabase.from('panduan').update(payload).eq('id', editingId);
      if (!error) { resetForm(); fetchTasks(); }
    } else {
      const { error } = await supabase.from('panduan').insert([{ ...payload, is_completed: false }]);
      if (!error) { resetForm(); fetchTasks(); }
    }
    
    setIsUploading(false);
  };

  const toggleCompletion = async (id: string, currentStatus: boolean) => {
    setTasks(tasks.map(item => item.id === id ? { ...item, is_completed: !currentStatus } : item));
    await supabase.from('panduan').update({ is_completed: !currentStatus }).eq('id', id);
    fetchTasks();
  };

  const handleDelete = async (id: string, fileUrl: string | null) => {
    if (!confirm('Hapus agenda ini?')) return;
    
    // Opsi lanjutan: Menghapus file fisik di storage (tidak wajib tapi bagus untuk kebersihan)
    if (fileUrl) {
      const fileName = fileUrl.split('/').pop();
      if (fileName) await supabase.storage.from('dokumen_panduan').remove([fileName]);
    }

    await supabase.from('panduan').delete().eq('id', id);
    fetchTasks();
  };

  const handleDeletePhase = async (phaseName: string) => {
    if (!confirm(`PERINGATAN: Hapus timeline "${phaseName}" beserta SELURUH AGENDA di dalamnya?`)) return;
    await supabase.from('panduan').delete().eq('phase', phaseName);
    fetchTasks();
  };

  const getPhaseTheme = (index: number) => {
    const themes = [
      { bg: 'bg-rose-50', border: 'border-rose-200 border-l-rose-500', text: 'text-rose-900', dot: 'bg-rose-500 ring-rose-200', btn: 'bg-rose-100 text-rose-800 hover:bg-rose-200' },
      { bg: 'bg-blue-50', border: 'border-blue-200 border-l-blue-500', text: 'text-blue-900', dot: 'bg-blue-500 ring-blue-200', btn: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
      { bg: 'bg-emerald-50', border: 'border-emerald-200 border-l-emerald-500', text: 'text-emerald-900', dot: 'bg-emerald-500 ring-emerald-200', btn: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' },
      { bg: 'bg-purple-50', border: 'border-purple-200 border-l-purple-500', text: 'text-purple-900', dot: 'bg-purple-500 ring-purple-200', btn: 'bg-purple-100 text-purple-800 hover:bg-purple-200' },
      { bg: 'bg-amber-50', border: 'border-amber-200 border-l-amber-500', text: 'text-amber-900', dot: 'bg-amber-500 ring-amber-200', btn: 'bg-amber-100 text-amber-800 hover:bg-amber-200' },
    ];
    return themes[index % themes.length];
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.is_completed).length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  if (isLoading) return <div className="flex justify-center pt-20 text-gray-400">Memuat Panduan Timeline...</div>;

  return (
    <div className="pb-20 max-w-5xl mx-auto">
      
      {/* Banner Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-rose-900 to-rose-950 rounded-[2.5rem] p-8 md:p-10 mb-8 text-white shadow-2xl shadow-rose-900/20 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-20 w-40 h-40 bg-rose-500/20 rounded-full blur-3xl -mb-10 pointer-events-none"></div>

        <div className="relative z-10">
          <span className="inline-block bg-white/20 text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4 backdrop-blur-sm border border-white/20">
            Modul Panduan
          </span>
          <h1 className="text-3xl md:text-4xl font-serif italic font-semibold mb-2 text-white flex items-center gap-3">
            <Map size={32} className="text-rose-300" /> Timeline Persiapan
          </h1>
          <p className="text-rose-100 text-sm font-medium">Peta perjalanan, jadwal target, dan manajemen dokumen Anda.</p>
        </div>

        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="relative z-10 bg-white text-rose-900 hover:bg-rose-50 px-6 py-3.5 rounded-xl flex items-center gap-2 text-sm font-bold transition shadow-lg"
        >
          <Plus size={18} /> Tambah Agenda
        </button>
      </motion.div>

      {/* Progress Bar Widget */}
      <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm mb-10">
        <div className="flex justify-between items-end mb-3">
          <div>
            <h3 className="font-bold text-[#2C3E50] text-lg">Progres Keseluruhan</h3>
            <p className="text-sm font-medium text-gray-500">{completedTasks} dari {totalTasks} agenda selesai</p>
          </div>
          <p className="text-3xl font-extrabold text-rose-900">{progressPercentage.toFixed(0)}%</p>
        </div>
        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercentage}%` }} transition={{ duration: 1 }} className="h-full bg-emerald-500 rounded-full" />
        </div>
      </div>

      {/* VERTICAL TIMELINE CONTAINER */}
      <div className="relative ml-2 md:ml-6 border-l-4 border-gray-100 pl-6 md:pl-10 space-y-12">
        
        <AnimatePresence>
          {dynamicPhases.map((phaseName, index) => {
            const phaseTasks = tasks.filter(t => t.phase === phaseName);
            const doneCount = phaseTasks.filter(t => t.is_completed).length;
            const isAllDone = phaseTasks.length > 0 && doneCount === phaseTasks.length;
            const isOpen = openPhases.includes(phaseName);
            const theme = getPhaseTheme(index);

            if (phaseTasks.length === 0 && !defaultPhases.includes(phaseName)) return null;

            return (
              <motion.div 
                key={phaseName}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="relative"
              >
                {/* TITIK TIMELINE (TIMELINE DOT) */}
                <div className={`absolute -left-[38px] md:-left-[54px] top-6 w-5 h-5 rounded-full ring-4 ring-white z-10 shadow-sm ${isAllDone ? 'bg-emerald-500' : phaseTasks.length > 0 ? theme.dot.split(' ')[0] : 'bg-gray-300'}`}></div>

                {/* KARTU AKORDEON */}
                <div className={`bg-white rounded-[2rem] border border-l-[8px] transition-all shadow-sm overflow-hidden ${isAllDone ? 'border-emerald-200 border-l-emerald-500 ring-2 ring-emerald-50' : theme.border}`}>
                  
                  {/* Header Kartu */}
                  <div className={`p-6 flex justify-between items-center gap-4 border-b ${isAllDone ? 'bg-emerald-50 border-emerald-100' : `${theme.bg}${theme.border}`}`}>
                    <div className="flex items-center gap-3">
                      <button onClick={() => togglePhaseCard(phaseName)} className={`p-1.5 rounded-lg transition ${isAllDone ? 'text-emerald-700 hover:bg-emerald-100' : `${theme.text} hover:bg-white/50`}`}>
                        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                      <div className="flex items-center gap-3">
                        <h2 className={`text-xl font-extrabold tracking-wide uppercase ${isAllDone ? 'text-emerald-900' : theme.text}`}>{phaseName}</h2>
                        {isAllDone && <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm hidden md:flex"><CheckCircle2 size={14} /> Tuntas</span>}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {phaseTasks.length > 0 ? (
                        <p className={`text-sm font-bold ${isAllDone ? 'text-emerald-700' : theme.text} opacity-80 hidden md:block`}>{doneCount} / {phaseTasks.length} Selesai</p>
                      ) : (
                        <p className="text-xs font-medium text-gray-400 hidden md:block">Belum ada agenda</p>
                      )}
                      <button onClick={() => handleDeletePhase(phaseName)} className={`p-2 rounded-xl transition ${isAllDone ? 'text-emerald-600 hover:bg-emerald-200' : `${theme.text} opacity-50 hover:opacity-100 hover:bg-white/50`}`} title="Hapus Fase Timeline"><Trash2 size={18} /></button>
                    </div>
                  </div>

                  {/* Isi Kartu */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-4 md:p-6 space-y-3 bg-white">
                        
                        {phaseTasks.length === 0 ? (
                          <div className="text-center py-6">
                            <p className="text-xs text-gray-400 mb-3">Belum ada agenda di fase ini.</p>
                            <button onClick={(e) => { e.stopPropagation(); setFormData({...formData, phase: phaseName}); setIsModalOpen(true); }} className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${theme.btn}`}>
                              + Tambah Agenda {phaseName}
                            </button>
                          </div>
                        ) : (
                          phaseTasks.map((item) => (
                            <div key={item.id} className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-md transition">
                              
                              <div className="flex-1 flex items-start gap-3">
                                {/* Checkbox Icon */}
                                <button onClick={() => toggleCompletion(item.id, item.is_completed)} className={`mt-1 transition ${item.is_completed ? 'text-emerald-500' : 'text-gray-300 hover:text-rose-400'}`}>
                                  {item.is_completed ? <CheckCircle2 size={24} className="fill-emerald-100"/> : <CircleDot size={24} />}
                                </button>
                                
                                <div className="mt-1 w-full">
                                  <h3 className={`font-bold text-base md:text-lg mb-2 ${item.is_completed ? 'line-through text-gray-400' : 'text-[#2C3E50]'}`}>
                                    {item.task_name}
                                  </h3>
                                  
                                  <div className="flex flex-col gap-2 w-full">
                                    {item.notes && (
                                      <p className="text-xs font-medium text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 w-fit">
                                        📝 {item.notes}
                                      </p>
                                    )}

                                    {/* Tombol Lihat/Download Dokumen */}
                                    {item.file_url && (
                                      <a 
                                        href={item.file_url} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-2 rounded-lg transition w-fit"
                                      >
                                        <FileText size={14} />
                                        {item.file_name || 'Lihat Dokumen'}
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* 3 Tombol Aksi (Selesai, Edit, Hapus) */}
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
                                  onClick={() => handleDelete(item.id, item.file_url)}
                                  className="w-full px-5 py-2.5 rounded-full text-sm font-bold bg-white text-rose-600 border border-gray-200 hover:bg-rose-50 shadow-sm transition-all text-center"
                                >
                                  Hapus
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Modal Tambah/Edit Agenda */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button onClick={resetForm} className="disabled:opacity-50 absolute top-6 right-6 text-gray-400 hover:text-gray-600" disabled={isUploading}><X size={20} /></button>
              <h2 className="text-2xl font-serif italic text-rose-900 mb-6">{editingId ? 'Edit Agenda' : 'Tambah Agenda'}</h2>
              
              <form onSubmit={handleSaveTask} className="space-y-4">
                {/* Dropdown Kategori */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Fase / Target Waktu *</label>
                  <select name="phase" value={formData.phase} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400 bg-gray-50/50" disabled={isUploading}>
                    {dynamicPhases.map(p => <option key={p} value={p}>{p}</option>)}
                    <option value="custom" className="font-bold text-rose-600">+ Tambah Fase Baru (Custom)...</option>
                  </select>
                  
                  <AnimatePresence>
                    {formData.phase === 'custom' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2">
                        <input type="text" placeholder="Cth: H-7 Bulan..." value={customPhase} onChange={(e) => setCustomPhase(e.target.value)} className="w-full border border-rose-300 rounded-xl p-3 text-sm focus:outline-rose-500 bg-rose-50/50" required disabled={isUploading} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Nama Agenda / Tugas *</label>
                  <input type="text" name="task_name" value={formData.task_name} onChange={handleChange} placeholder="Cth: Tentukan tanggal pernikahan" className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400" required autoFocus disabled={isUploading} />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Catatan Tambahan (Opsional)</label>
                  <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} placeholder="Cth: Diskusikan dengan keluarga besar..." className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-rose-400 bg-gray-50/50" disabled={isUploading} />
                </div>

                {/* Input File Dokumen */}
                <div className="pt-2">
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Lampirkan Dokumen (PDF, JPG, Word)</label>
                  
                  {formData.file_name && !selectedFile && (
                    <div className="mb-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100 flex items-center justify-between">
                      <span className="truncate pr-2">File saat ini: {formData.file_name}</span>
                      <button type="button" onClick={() => setFormData({...formData, file_name: '', file_url: ''})} className="text-rose-500 hover:text-rose-700 font-bold" title="Hapus File Saat Ini"><Trash2 size={14}/></button>
                    </div>
                  )}

                  <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition cursor-pointer">
                    <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={isUploading} />
                    <div className="flex flex-col items-center justify-center gap-1 text-gray-500">
                      <Paperclip size={20} className="mb-1 text-rose-400" />
                      <span className="text-sm font-semibold">{selectedFile ? selectedFile.name : 'Klik atau seret file ke sini'}</span>
                      <span className="text-xs">Max. 5MB (Opsional)</span>
                    </div>
                  </div>
                </div>
                
                <button type="submit" disabled={isUploading} className="w-full bg-rose-900 text-white py-3.5 rounded-xl font-medium hover:bg-rose-950 transition mt-6 flex items-center justify-center gap-2 disabled:bg-rose-900/60 disabled:cursor-not-allowed">
                  {isUploading ? <><Loader2 size={18} className="animate-spin" /> Mengunggah & Menyimpan...</> : (editingId ? 'Simpan Perubahan' : 'Simpan Agenda')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}