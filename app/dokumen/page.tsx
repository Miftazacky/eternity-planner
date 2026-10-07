'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, X, Trash2, CheckCircle2, ChevronDown, ChevronUp, Edit2, CircleDot, Paperclip, Loader2, FolderOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DokumenPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  const [formData, setFormData] = useState({
    category: '',
    doc_name: '',
    notes: '',
    file_url: '',
    file_name: ''
  });

  const fetchData = async () => {
    const { data } = await supabase
      .from('dokumen')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (data) setDocuments(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const defaultCategories = ['Calon Pengantin Wanita', 'Calon Pengantin Pria', 'Dokumen Bersama / KUA'];
  const dynamicCategories = Array.from(new Set([...defaultCategories, ...documents.map(d => d.category)]));

  const [openCategories, setOpenCategories] = useState<string[]>(dynamicCategories);

  useEffect(() => {
    if (documents.length > 0) {
      setOpenCategories(Array.from(new Set([...defaultCategories, ...documents.map(d => d.category)])));
    }
  }, [documents.length]);

  const toggleCategoryCard = (category: string) => {
    setOpenCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const resetForm = () => {
    const firstCat = dynamicCategories.length > 0 ? dynamicCategories[0] : 'custom';
    setFormData({ category: firstCat, doc_name: '', notes: '', file_url: '', file_name: '' });
    setCustomCategory('');
    setEditingId(null);
    setSelectedFile(null);
    setIsModalOpen(false);
  };

  const handleEditClick = (item: any) => {
    setFormData({
      category: item.category,
      doc_name: item.doc_name,
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
    if (e.target.name === 'category' && e.target.value !== 'custom') {
      setCustomCategory('');
    }
  };

  const handleFileChange = (e: any) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.doc_name) return;

    const finalCategory = formData.category === 'custom' ? customCategory : formData.category;
    if (!finalCategory) {
      alert('Kategori dokumen tidak boleh kosong!');
      return;
    }

    setIsUploading(true);
    let newFileUrl = formData.file_url;
    let newFileName = formData.file_name;

    if (selectedFile) {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('berkas_dokumen')
        .upload(fileName, selectedFile);

      if (error) {
        alert('Gagal upload dokumen. Pastikan bucket "berkas_dokumen" sudah dibuat.');
        setIsUploading(false);
        return;
      }

      const { data: publicData } = supabase.storage
        .from('berkas_dokumen')
        .getPublicUrl(fileName);

      newFileUrl = publicData.publicUrl;
      newFileName = selectedFile.name;
    }

    const payload = {
      category: finalCategory,
      doc_name: formData.doc_name,
      notes: formData.notes,
      file_url: newFileUrl,
      file_name: newFileName
    };

    if (editingId) {
      const { error } = await supabase.from('dokumen').update(payload).eq('id', editingId);
      if (!error) { resetForm(); fetchData(); }
    } else {
      const { error } = await supabase.from('dokumen').insert([{ ...payload, is_completed: false }]);
      if (!error) { resetForm(); fetchData(); }
    }
    
    setIsUploading(false);
  };

  const toggleCompletion = async (id: string, currentStatus: boolean) => {
    setDocuments(documents.map(item => item.id === id ? { ...item, is_completed: !currentStatus } : item));
    await supabase.from('dokumen').update({ is_completed: !currentStatus }).eq('id', id);
    fetchData();
  };

  const handleDelete = async (id: string, fileUrl: string | null) => {
    if (!confirm('Hapus daftar dokumen ini?')) return;
    
    if (fileUrl) {
      const fileName = fileUrl.split('/').pop();
      if (fileName) await supabase.storage.from('berkas_dokumen').remove([fileName]);
    }

    await supabase.from('dokumen').delete().eq('id', id);
    fetchData();
  };

  const handleDeleteCategory = async (catName: string) => {
    if (!confirm(`PERINGATAN: Hapus kategori "${catName}" beserta SELURUH DOKUMEN di dalamnya?`)) return;
    await supabase.from('dokumen').delete().eq('category', catName);
    fetchData();
  };

  const getCategoryTheme = (index: number) => {
    const themes = [
      { bg: 'bg-slate-50', border: 'border-slate-200 border-l-slate-600', text: 'text-slate-900', btn: 'bg-slate-200 text-slate-800 hover:bg-slate-300' },
      { bg: 'bg-blue-50', border: 'border-blue-200 border-l-blue-600', text: 'text-blue-900', btn: 'bg-blue-200 text-blue-800 hover:bg-blue-300' },
      { bg: 'bg-indigo-50', border: 'border-indigo-200 border-l-indigo-600', text: 'text-indigo-900', btn: 'bg-indigo-200 text-indigo-800 hover:bg-indigo-300' },
      { bg: 'bg-cyan-50', border: 'border-cyan-200 border-l-cyan-600', text: 'text-cyan-900', btn: 'bg-cyan-200 text-cyan-800 hover:bg-cyan-300' },
    ];
    return themes[index % themes.length];
  };

  const totalDocs = documents.length;
  const completedDocs = documents.filter(d => d.is_completed).length;
  const progressPercentage = totalDocs > 0 ? (completedDocs / totalDocs) * 100 : 0;

  if (isLoading) return <div className="flex justify-center pt-20 text-gray-400">Memuat Data Dokumen...</div>;

  return (
    <div className="pb-20 max-w-5xl mx-auto">
      
      {/* Banner Header Berwarna (Navy/Blue untuk Administratif) */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] p-8 md:p-10 mb-8 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -mb-10 pointer-events-none"></div>

        <div className="relative z-10">
          <span className="inline-block bg-white/20 text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4 backdrop-blur-sm border border-white/20">
            Modul Administratif
          </span>
          <h1 className="text-3xl md:text-4xl font-serif italic font-semibold mb-2 text-white flex items-center gap-3">
            <FolderOpen size={32} className="text-blue-300" /> Dokumen Administrasi
          </h1>
          <p className="text-slate-200 text-sm font-medium">Kelola persyaratan nikah, surat pengantar KUA, dan lampiran file digital.</p>
        </div>

        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="relative z-10 bg-white text-slate-900 hover:bg-slate-100 px-6 py-3.5 rounded-xl flex items-center gap-2 text-sm font-bold transition shadow-lg"
        >
          <Plus size={18} /> Tambah Dokumen
        </button>
      </motion.div>

      {/* Progress Bar Widget */}
      <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm mb-8">
        <div className="flex justify-between items-end mb-3">
          <div>
            <h3 className="font-bold text-[#2C3E50] text-lg">Kelengkapan Berkas</h3>
            <p className="text-sm font-medium text-gray-500">{completedDocs} dari {totalDocs} dokumen siap</p>
          </div>
          <p className="text-3xl font-extrabold text-slate-800">{progressPercentage.toFixed(0)}%</p>
        </div>
        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercentage}%` }} transition={{ duration: 1 }} className="h-full bg-emerald-500 rounded-full" />
        </div>
      </div>

      {/* Kartu Kategori Dokumen */}
      <div className="space-y-6">
        <AnimatePresence>
          {dynamicCategories.map((catName, index) => {
            const catDocs = documents.filter(d => d.category === catName);
            const doneCount = catDocs.filter(d => d.is_completed).length;
            const isAllDone = catDocs.length > 0 && doneCount === catDocs.length;
            const isOpen = openCategories.includes(catName);
            const theme = getCategoryTheme(index);

            if (catDocs.length === 0 && !defaultCategories.includes(catName)) return null;

            return (
              <motion.div 
                key={catName}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-white rounded-[2rem] border border-l-[8px] transition-all shadow-sm overflow-hidden ${isAllDone ? 'border-emerald-200 border-l-emerald-500 ring-2 ring-emerald-50' : theme.border}`}
              >
                
                {/* Header Kartu */}
                <div className={`p-6 flex justify-between items-center gap-4 border-b ${isAllDone ? 'bg-emerald-50 border-emerald-100' : `${theme.bg}${theme.border}`}`}>
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleCategoryCard(catName)} className={`p-1.5 rounded-lg transition ${isAllDone ? 'text-emerald-700 hover:bg-emerald-100' : `${theme.text} hover:bg-white/50`}`}>
                      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    <div className="flex items-center gap-3">
                      <h2 className={`text-xl font-extrabold tracking-wide uppercase ${isAllDone ? 'text-emerald-900' : theme.text}`}>{catName}</h2>
                      {isAllDone && <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm hidden md:flex"><CheckCircle2 size={14} /> Berkas Lengkap</span>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {catDocs.length > 0 ? (
                      <p className={`text-sm font-bold ${isAllDone ? 'text-emerald-700' : theme.text} opacity-80 hidden md:block`}>{doneCount} / {catDocs.length} Siap</p>
                    ) : (
                      <p className="text-xs font-medium text-gray-400 hidden md:block">Belum ada daftar dokumen</p>
                    )}
                    <button onClick={() => handleDeleteCategory(catName)} className={`p-2 rounded-xl transition ${isAllDone ? 'text-emerald-600 hover:bg-emerald-200' : `${theme.text} opacity-50 hover:opacity-100 hover:bg-white/50`}`} title="Hapus Kategori Dokumen"><Trash2 size={18} /></button>
                  </div>
                </div>

                {/* Isi Kartu Dokumen */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-4 md:p-6 space-y-3 bg-white">
                      
                      {catDocs.length === 0 ? (
                        <div className="text-center py-6">
                          <p className="text-xs text-gray-400 mb-3">Belum ada dokumen yang perlu disiapkan di kategori ini.</p>
                          <button onClick={(e) => { e.stopPropagation(); setFormData({...formData, category: catName}); setIsModalOpen(true); }} className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${theme.btn}`}>
                            + Tambah Syarat Dokumen
                          </button>
                        </div>
                      ) : (
                        catDocs.map((item) => (
                          <div key={item.id} className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-md transition">
                            
                            <div className="flex-1 flex items-start gap-3">
                              {/* Checkbox Icon */}
                              <button onClick={() => toggleCompletion(item.id, item.is_completed)} className={`mt-1 transition ${item.is_completed ? 'text-emerald-500' : 'text-gray-300 hover:text-slate-400'}`}>
                                {item.is_completed ? <CheckCircle2 size={24} className="fill-emerald-100"/> : <CircleDot size={24} />}
                              </button>
                              
                              <div className="mt-1 w-full">
                                <h3 className={`font-bold text-base md:text-lg mb-2 ${item.is_completed ? 'line-through text-gray-400' : 'text-[#2C3E50]'}`}>
                                  {item.doc_name}
                                </h3>
                                
                                <div className="flex flex-col gap-2 w-full">
                                  {item.notes && (
                                    <p className="text-xs font-medium text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 w-fit">
                                      📝 {item.notes}
                                    </p>
                                  )}

                                  {/* Link Dokumen Scan */}
                                  {item.file_url && (
                                    <a 
                                      href={item.file_url} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-2 rounded-lg transition w-fit"
                                    >
                                      <FileText size={14} />
                                      {item.file_name || 'Lihat File Scan'}
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* 3 Tombol Aksi */}
                            <div className="flex flex-col gap-2 min-w-[140px] items-stretch w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                              <button 
                                onClick={() => toggleCompletion(item.id, item.is_completed)}
                                className={`w-full px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-md ${
                                  item.is_completed ? 'bg-gray-300 text-gray-700 hover:bg-gray-400' : 'bg-slate-800 text-white hover:bg-slate-900'
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
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Modal Tambah/Edit Dokumen */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button onClick={resetForm} className="disabled:opacity-50 absolute top-6 right-6 text-gray-400 hover:text-gray-600" disabled={isUploading}><X size={20} /></button>
              <h2 className="text-2xl font-serif italic text-slate-800 mb-6">{editingId ? 'Edit Dokumen' : 'Tambah Syarat Dokumen'}</h2>
              
              <form onSubmit={handleSaveDoc} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Kategori / Pemilik *</label>
                  <select name="category" value={formData.category} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-slate-400 bg-gray-50/50" disabled={isUploading}>
                    {dynamicCategories.map(p => <option key={p} value={p}>{p}</option>)}
                    <option value="custom" className="font-bold text-blue-600">+ Tambah Kategori Baru...</option>
                  </select>
                  
                  <AnimatePresence>
                    {formData.category === 'custom' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2">
                        <input type="text" placeholder="Cth: Dokumen KUA Kecamatan..." value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} className="w-full border border-blue-300 rounded-xl p-3 text-sm focus:outline-blue-500 bg-blue-50/50" required disabled={isUploading} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Nama Dokumen / Syarat *</label>
                  <input type="text" name="doc_name" value={formData.doc_name} onChange={handleChange} placeholder="Cth: N1 - Surat Keterangan Nikah" className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-slate-400" required autoFocus disabled={isUploading} />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Catatan Tambahan (Opsional)</label>
                  <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} placeholder="Cth: Minta stempel basah RT/RW..." className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-slate-400 bg-gray-50/50" disabled={isUploading} />
                </div>

                {/* Input File Dokumen (Scan) */}
                <div className="pt-2">
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Lampirkan File Scan (PDF/JPG)</label>
                  
                  {formData.file_name && !selectedFile && (
                    <div className="mb-2 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 flex items-center justify-between">
                      <span className="truncate pr-2">File tersimpan: {formData.file_name}</span>
                      <button type="button" onClick={() => setFormData({...formData, file_name: '', file_url: ''})} className="text-rose-500 hover:text-rose-700 font-bold" title="Hapus File"><Trash2 size={14}/></button>
                    </div>
                  )}

                  <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition cursor-pointer">
                    <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={isUploading} />
                    <div className="flex flex-col items-center justify-center gap-1 text-gray-500">
                      <Paperclip size={20} className="mb-1 text-slate-400" />
                      <span className="text-sm font-semibold">{selectedFile ? selectedFile.name : 'Klik atau seret file PDF/Foto ke sini'}</span>
                    </div>
                  </div>
                </div>
                
                <button type="submit" disabled={isUploading} className="w-full bg-slate-800 text-white py-3.5 rounded-xl font-medium hover:bg-slate-900 transition mt-6 flex items-center justify-center gap-2 disabled:bg-slate-800/60 disabled:cursor-not-allowed">
                  {isUploading ? <><Loader2 size={18} className="animate-spin" /> Mengunggah File...</> : (editingId ? 'Simpan Perubahan' : 'Simpan Dokumen')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}