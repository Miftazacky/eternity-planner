'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Plus, X, Trash2, Edit2, Link2, Paperclip, Loader2, CheckCircle2, ChevronDown, ChevronUp, MapPin, Clock, UserCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PreweddingPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  const [formData, setFormData] = useState({
    category: '',
    task_name: '',
    pic: 'Berdua',
    status: 'Belum Mulai',
    link: '',
    notes: '',
    file_url: '',
    file_name: ''
  });

  const fetchData = async () => {
    const { data } = await supabase
      .from('prewedding')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (data) setItems(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const defaultCategories = ['Perizinan & Administrasi', 'Akomodasi & Transportasi', 'Wardrobe & Tata Rias', 'Visual & Dokumentasi', 'Properti & Logistik'];
  const dynamicCategories = Array.from(new Set([...defaultCategories, ...items.map(i => i.category)]));

  const [openCategories, setOpenCategories] = useState<string[]>(dynamicCategories);

  useEffect(() => {
    if (items.length > 0) {
      setOpenCategories(Array.from(new Set([...defaultCategories, ...items.map(i => i.category)])));
    }
  }, [items.length]);

  const toggleCategoryCard = (category: string) => {
    setOpenCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
  };

  const resetForm = () => {
    const firstCat = dynamicCategories.length > 0 ? dynamicCategories[0] : 'custom';
    setFormData({ category: firstCat, task_name: '', pic: 'Berdua', status: 'Belum Mulai', link: '', notes: '', file_url: '', file_name: '' });
    setCustomCategory('');
    setEditingId(null);
    setSelectedFile(null);
    setIsModalOpen(false);
  };

  const handleEditClick = (item: any) => {
    setFormData({
      category: item.category,
      task_name: item.task_name,
      pic: item.pic || 'Berdua',
      status: item.status || 'Belum Mulai',
      link: item.link || '',
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
    if (e.target.name === 'category' && e.target.value !== 'custom') setCustomCategory('');
  };

  const handleFileChange = (e: any) => {
    if (e.target.files && e.target.files.length > 0) setSelectedFile(e.target.files[0]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.task_name) return;

    const finalCategory = formData.category === 'custom' ? customCategory : formData.category;
    if (!finalCategory) { alert('Kategori tidak boleh kosong!'); return; }

    setIsUploading(true);
    let newFileUrl = formData.file_url;
    let newFileName = formData.file_name;

    if (selectedFile) {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const { data, error } = await supabase.storage.from('berkas_prewedding').upload(fileName, selectedFile);
      if (error) { alert('Gagal upload. Pastikan bucket "berkas_prewedding" sudah dibuat.'); setIsUploading(false); return; }
      const { data: publicData } = supabase.storage.from('berkas_prewedding').getPublicUrl(fileName);
      newFileUrl = publicData.publicUrl;
      newFileName = selectedFile.name;
    }

    const payload = { category: finalCategory, task_name: formData.task_name, pic: formData.pic, status: formData.status, link: formData.link, notes: formData.notes, file_url: newFileUrl, file_name: newFileName };

    if (editingId) {
      await supabase.from('prewedding').update(payload).eq('id', editingId);
    } else {
      await supabase.from('prewedding').insert([payload]);
    }
    resetForm(); fetchData(); setIsUploading(false);
  };

  const handleDelete = async (id: string, fileUrl: string | null) => {
    if (!confirm('Hapus item persiapan ini?')) return;
    if (fileUrl) {
      const fileName = fileUrl.split('/').pop();
      if (fileName) await supabase.storage.from('berkas_prewedding').remove([fileName]);
    }
    await supabase.from('prewedding').delete().eq('id', id);
    fetchData();
  };

  const handleDeleteCategory = async (catName: string) => {
    if (!confirm(`PERINGATAN: Hapus kategori "${catName}" beserta isinya?`)) return;
    await supabase.from('prewedding').delete().eq('category', catName);
    fetchData();
  };

  const setStatusSelesai = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Selesai' ? 'Belum Mulai' : 'Selesai';
    setItems(items.map(item => item.id === id ? { ...item, status: newStatus } : item));
    await supabase.from('prewedding').update({ status: newStatus }).eq('id', id);
    fetchData();
  };

  const getCategoryTheme = (index: number) => {
    const themes = [
      { bg: 'bg-orange-50', border: 'border-orange-200 border-l-orange-500', text: 'text-orange-900', btn: 'bg-orange-200 text-orange-900 hover:bg-orange-300' },
      { bg: 'bg-amber-50', border: 'border-amber-200 border-l-amber-500', text: 'text-amber-900', btn: 'bg-amber-200 text-amber-900 hover:bg-amber-300' },
      { bg: 'bg-red-50', border: 'border-red-200 border-l-red-500', text: 'text-red-900', btn: 'bg-red-200 text-red-900 hover:bg-red-300' },
      { bg: 'bg-yellow-50', border: 'border-yellow-200 border-l-yellow-500', text: 'text-yellow-900', btn: 'bg-yellow-200 text-yellow-900 hover:bg-yellow-300' },
    ];
    return themes[index % themes.length];
  };

  const totalItems = items.length;
  const selesaiCount = items.filter(i => i.status === 'Selesai').length;
  const prosesCount = items.filter(i => i.status === 'Sedang Diproses').length;
  const progressPercentage = totalItems > 0 ? (selesaiCount / totalItems) * 100 : 0;

  if (isLoading) return <div className="flex justify-center pt-20 text-gray-400">Memuat Data Prewedding...</div>;

  return (
    <div className="pb-20 max-w-5xl mx-auto">
      
      {/* Banner Header - Tema Senja Prambanan */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-orange-800 via-orange-900 to-amber-950 rounded-[2.5rem] p-8 md:p-10 mb-8 text-white shadow-2xl shadow-orange-900/20 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-20 w-40 h-40 bg-red-500/20 rounded-full blur-3xl -mb-10 pointer-events-none"></div>

        <div className="relative z-10">
          <span className="inline-block bg-white/20 text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4 backdrop-blur-sm border border-white/20">
            Modul Dokumentasi
          </span>
          <h1 className="text-3xl md:text-4xl font-serif italic font-semibold mb-2 text-white flex items-center gap-3">
            <Camera size={32} className="text-orange-300" /> Prewedding Planner
          </h1>
          <p className="text-orange-100 text-sm font-medium flex items-center gap-2">
            <MapPin size={14}/> Destination: Prambanan, Yogyakarta
          </p>
        </div>

        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="relative z-10 bg-white text-orange-900 hover:bg-orange-50 px-6 py-3.5 rounded-xl flex items-center gap-2 text-sm font-bold transition shadow-lg">
          <Plus size={18} /> Tambah Agenda
        </button>
      </motion.div>

      {/* Progress Bar Widget */}
      <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm mb-8">
        <div className="flex justify-between items-end mb-3">
          <div>
            <h3 className="font-bold text-[#2C3E50] text-lg">Persiapan Menuju Jogja</h3>
            <p className="text-sm font-medium text-gray-500">{selesaiCount} selesai • {prosesCount} diproses</p>
          </div>
          <p className="text-3xl font-extrabold text-orange-800">{progressPercentage.toFixed(0)}%</p>
        </div>
        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercentage}%` }} transition={{ duration: 1 }} className="h-full bg-orange-500 rounded-full" />
        </div>
      </div>

      {/* Kartu Kategori Accordion */}
      <div className="space-y-6">
        <AnimatePresence>
          {dynamicCategories.map((catName, index) => {
            const catItems = items.filter(d => d.category === catName);
            const doneCount = catItems.filter(d => d.status === 'Selesai').length;
            const isAllDone = catItems.length > 0 && doneCount === catItems.length;
            const isOpen = openCategories.includes(catName);
            const theme = getCategoryTheme(index);

            if (catItems.length === 0 && !defaultCategories.includes(catName)) return null;

            return (
              <motion.div key={catName} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className={`bg-white rounded-[2rem] border border-l-[8px] transition-all shadow-sm overflow-hidden ${isAllDone ? 'border-emerald-200 border-l-emerald-500 ring-2 ring-emerald-50' : theme.border}`}>
                
                <div className={`p-6 flex justify-between items-center gap-4 border-b ${isAllDone ? 'bg-emerald-50 border-emerald-100' : `${theme.bg}${theme.border}`}`}>
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleCategoryCard(catName)} className={`p-1.5 rounded-lg transition ${isAllDone ? 'text-emerald-700 hover:bg-emerald-100' : `${theme.text} hover:bg-white/50`}`}>
                      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    <div className="flex items-center gap-3">
                      <h2 className={`text-xl font-extrabold tracking-wide uppercase ${isAllDone ? 'text-emerald-900' : theme.text}`}>{catName}</h2>
                      {isAllDone && <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm hidden md:flex"><CheckCircle2 size={14} /> Beres!</span>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {catItems.length > 0 ? (
                      <p className={`text-sm font-bold ${isAllDone ? 'text-emerald-700' : theme.text} opacity-80 hidden md:block`}>{doneCount} / {catItems.length} Selesai</p>
                    ) : (
                      <p className="text-xs font-medium text-gray-400 hidden md:block">Belum ada persiapan</p>
                    )}
                    <button onClick={() => handleDeleteCategory(catName)} className={`p-2 rounded-xl transition ${isAllDone ? 'text-emerald-600 hover:bg-emerald-200' : `${theme.text} opacity-50 hover:opacity-100 hover:bg-white/50`}`} title="Hapus Kategori"><Trash2 size={18} /></button>
                  </div>
                </div>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-4 md:p-6 space-y-3 bg-white">
                      
                      {catItems.length === 0 ? (
                        <div className="text-center py-6">
                          <p className="text-xs text-gray-400 mb-3">Belum ada persiapan di kategori ini.</p>
                          <button onClick={(e) => { e.stopPropagation(); setFormData({...formData, category: catName}); setIsModalOpen(true); }} className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${theme.btn}`}>
                            + Tambah Data
                          </button>
                        </div>
                      ) : (
                        catItems.map((item) => (
                          <div key={item.id} className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-md transition">
                            
                            <div className="flex-1 flex items-start gap-3">
                              <div className="mt-1 w-full">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className={`font-bold text-base md:text-lg ${item.status === 'Selesai' ? 'line-through text-gray-400' : 'text-[#2C3E50]'}`}>
                                    {item.task_name}
                                  </h3>
                                  <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-md font-bold border ${
                                    item.status === 'Selesai' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                                    item.status === 'Sedang Diproses' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                                  }`}>{item.status}</span>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 w-full mt-2">
                                  <span className="text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-1">
                                    <UserCircle size={14}/> PIC: {item.pic}
                                  </span>
                                  {item.notes && (
                                    <span className="text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-1">
                                      📝 {item.notes}
                                    </span>
                                  )}
                                  {item.link && (
                                    <a href={item.link.startsWith('http') ? item.link : `https://${item.link}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition flex items-center gap-1">
                                      <Link2 size={14} /> Referensi
                                    </a>
                                  )}
                                  {item.file_url && (
                                    <a href={item.file_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-lg transition flex items-center gap-1">
                                      <Paperclip size={14} /> Dokumen/E-Ticket
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 min-w-[140px] items-stretch w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                              <button onClick={() => setStatusSelesai(item.id, item.status)} className={`w-full px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-md ${item.status === 'Selesai' ? 'bg-gray-300 text-gray-700 hover:bg-gray-400' : 'bg-orange-600 text-white hover:bg-orange-700'}`}>
                                {item.status === 'Selesai' ? 'Batalkan Selesai' : 'Tandai Selesai'}
                              </button>
                              <div className="flex gap-2">
                                <button onClick={() => handleEditClick(item)} className="w-1/2 px-2 py-2 rounded-full text-sm font-bold bg-white text-[#2C3E50] border border-gray-200 hover:bg-gray-50 shadow-sm transition-all text-center flex justify-center items-center gap-1">Edit</button>
                                <button onClick={() => handleDelete(item.id, item.file_url)} className="w-1/2 px-2 py-2 rounded-full text-sm font-bold bg-white text-rose-600 border border-gray-200 hover:bg-rose-50 shadow-sm transition-all text-center flex justify-center items-center gap-1">Hapus</button>
                              </div>
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

      {/* Modal Tambah/Edit Prewedding */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button onClick={resetForm} className="disabled:opacity-50 absolute top-6 right-6 text-gray-400 hover:text-gray-600" disabled={isUploading}><X size={20} /></button>
              <h2 className="text-2xl font-serif italic text-orange-900 mb-6">{editingId ? 'Edit Persiapan' : 'Tambah Agenda Prewedding'}</h2>
              
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Kategori *</label>
                  <select name="category" value={formData.category} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-orange-400 bg-gray-50/50" disabled={isUploading}>
                    {dynamicCategories.map(p => <option key={p} value={p}>{p}</option>)}
                    <option value="custom" className="font-bold text-orange-600">+ Tambah Kategori Baru...</option>
                  </select>
                  <AnimatePresence>
                    {formData.category === 'custom' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2">
                        <input type="text" placeholder="Cth: Dokumentasi Tambahan..." value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} className="w-full border border-orange-300 rounded-xl p-3 text-sm focus:outline-orange-500 bg-orange-50/50" required disabled={isUploading} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Nama Kebutuhan *</label>
                    <input type="text" name="task_name" value={formData.task_name} onChange={handleChange} placeholder="Cth: Sewa Hiace / SIMAKSI" className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-orange-400" required disabled={isUploading} />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">PIC (Penanggung Jawab)</label>
                    <input type="text" name="pic" value={formData.pic} onChange={handleChange} placeholder="Cth: Saya / Calon / Vendor" className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-orange-400 bg-gray-50/50" disabled={isUploading} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Status Persiapan</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-orange-400 bg-gray-50/50" disabled={isUploading}>
                      <option value="Belum Mulai">Belum Mulai</option>
                      <option value="Sedang Diproses">Sedang Diproses (DP/Booking)</option>
                      <option value="Selesai">Selesai / Lunas</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Link Referensi (IG/Web)</label>
                    <input type="text" name="link" value={formData.link} onChange={handleChange} placeholder="https://..." className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-orange-400 bg-gray-50/50" disabled={isUploading} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Catatan Tambahan (Opsional)</label>
                  <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} placeholder="Cth: Bawa payung cadangan..." className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-orange-400 bg-gray-50/50" disabled={isUploading} />
                </div>

                <div className="pt-2">
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Lampirkan Dokumen (Tiket/Surat Izin/Foto)</label>
                  {formData.file_name && !selectedFile && (
                    <div className="mb-2 text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-100 flex items-center justify-between">
                      <span className="truncate pr-2">File tersimpan: {formData.file_name}</span>
                      <button type="button" onClick={() => setFormData({...formData, file_name: '', file_url: ''})} className="text-rose-500 font-bold"><Trash2 size={14}/></button>
                    </div>
                  )}
                  <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition cursor-pointer">
                    <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={isUploading} />
                    <div className="flex flex-col items-center justify-center gap-1 text-gray-500">
                      <Paperclip size={20} className="mb-1 text-orange-400" />
                      <span className="text-sm font-semibold">{selectedFile ? selectedFile.name : 'Klik atau seret file PDF/Foto ke sini'}</span>
                    </div>
                  </div>
                </div>
                
                <button type="submit" disabled={isUploading} className="w-full bg-orange-700 text-white py-3.5 rounded-xl font-medium hover:bg-orange-800 transition mt-6 flex items-center justify-center gap-2 disabled:bg-orange-700/60 disabled:cursor-not-allowed">
                  {isUploading ? <><Loader2 size={18} className="animate-spin" /> Mengunggah File...</> : (editingId ? 'Simpan Perubahan' : 'Simpan Agenda Prewedding')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}