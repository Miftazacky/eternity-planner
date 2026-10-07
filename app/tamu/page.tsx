'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, X, Trash2, Edit2, Mail, UsersRound, Send, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TamuPage() {
  const [guests, setGuests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [customGroup, setCustomGroup] = useState('');

  const [formData, setFormData] = useState({
    group_name: '',
    name: '',
    relation: 'Pihak CPW',
    invitation_type: 'Digital',
    pax: 1,
    status: 'Belum Terkirim'
  });

  const fetchData = async () => {
    const { data } = await supabase
      .from('tamu')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setGuests(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const defaultGroups = ['Keluarga Inti', 'Keluarga Besar', 'Teman Sekolah', 'Teman Kerja', 'Rekan Bisnis', 'VIP'];
  const dynamicGroups = Array.from(new Set([...defaultGroups, ...guests.map(g => g.group_name)]));

  const [openGroups, setOpenGroups] = useState<string[]>(dynamicGroups);

  useEffect(() => {
    if (guests.length > 0) {
      setOpenGroups(Array.from(new Set([...defaultGroups, ...guests.map(g => g.group_name)])));
    }
  }, [guests.length]);

  const toggleGroupCard = (group: string) => {
    setOpenGroups(prev => prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]);
  };

  const resetForm = () => {
    const firstGroup = dynamicGroups.length > 0 ? dynamicGroups[0] : 'custom';
    setFormData({ 
      group_name: firstGroup, 
      name: '', 
      relation: 'Pihak CPW', 
      invitation_type: 'Digital', 
      pax: 1, 
      status: 'Belum Terkirim' 
    });
    setCustomGroup('');
    setEditingId(null);
    setIsModalOpen(false);
  };

  const handleEditClick = (item: any) => {
    setFormData({
      group_name: item.group_name,
      name: item.name,
      relation: item.relation || 'Pihak CPW',
      invitation_type: item.invitation_type || 'Digital',
      pax: item.pax || 1,
      status: item.status || 'Belum Terkirim'
    });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'group_name' && e.target.value !== 'custom') {
      setCustomGroup('');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const finalGroup = formData.group_name === 'custom' ? customGroup : formData.group_name;
    if (!finalGroup) {
      alert('Nama Grup Tamu tidak boleh kosong!');
      return;
    }

    const payload = {
      group_name: finalGroup,
      name: formData.name,
      relation: formData.relation,
      invitation_type: formData.invitation_type,
      pax: Number(formData.pax) || 1,
      status: formData.status
    };

    if (editingId) {
      const { error } = await supabase.from('tamu').update(payload).eq('id', editingId);
      if (!error) { resetForm(); fetchData(); }
    } else {
      const { error } = await supabase.from('tamu').insert([payload]);
      if (!error) { resetForm(); fetchData(); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus data tamu ini?')) return;
    await supabase.from('tamu').delete().eq('id', id);
    fetchData();
  };

  const handleDeleteGroup = async (groupName: string) => {
    if (!confirm(`PERINGATAN: Hapus grup "${groupName}" beserta SELURUH TAMU di dalamnya?`)) return;
    await supabase.from('tamu').delete().eq('group_name', groupName);
    fetchData();
  };

  const getCategoryTheme = (index: number) => {
    const themes = [
      { bg: 'bg-purple-50', border: 'border-purple-200 border-l-purple-600', text: 'text-purple-900', btn: 'bg-purple-200 text-purple-900 hover:bg-purple-300' },
      { bg: 'bg-indigo-50', border: 'border-indigo-200 border-l-indigo-600', text: 'text-indigo-900', btn: 'bg-indigo-200 text-indigo-900 hover:bg-indigo-300' },
      { bg: 'bg-fuchsia-50', border: 'border-fuchsia-200 border-l-fuchsia-600', text: 'text-fuchsia-900', btn: 'bg-fuchsia-200 text-fuchsia-900 hover:bg-fuchsia-300' },
      { bg: 'bg-violet-50', border: 'border-violet-200 border-l-violet-600', text: 'text-violet-900', btn: 'bg-violet-200 text-violet-900 hover:bg-violet-300' },
      { bg: 'bg-pink-50', border: 'border-pink-200 border-l-pink-600', text: 'text-pink-900', btn: 'bg-pink-200 text-pink-900 hover:bg-pink-300' },
    ];
    return themes[index % themes.length];
  };

  // Kalkulasi Metrik (Statistik Tamu)
  const totalUndangan = guests.length;
  const totalPax = guests.reduce((sum, g) => sum + (Number(g.pax) || 0), 0);
  const terkirim = guests.filter(g => g.status === 'Terkirim' || g.status === 'RSVP Hadir').length;
  const rsvpHadir = guests.filter(g => g.status === 'RSVP Hadir').reduce((sum, g) => sum + (Number(g.pax) || 0), 0);
  
  // Statistik Relasi
  const cpwCount = guests.filter(g => g.relation === 'Pihak CPW').length;
  const cppCount = guests.filter(g => g.relation === 'Pihak CPP').length;
  const ortuCount = guests.filter(g => g.relation === 'Pihak Orang Tua').length;

  if (isLoading) return <div className="flex justify-center pt-20 text-gray-400">Memuat Data Tamu...</div>;

  return (
    <div className="pb-20 max-w-6xl mx-auto">
      
      {/* Banner Header Berwarna (Purple/Indigo Theme) */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-indigo-900 to-purple-950 rounded-[2.5rem] p-8 md:p-10 mb-8 text-white shadow-2xl shadow-indigo-900/20 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-20 w-40 h-40 bg-fuchsia-500/20 rounded-full blur-3xl -mb-10 pointer-events-none"></div>

        <div className="relative z-10">
          <span className="inline-block bg-white/20 text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4 backdrop-blur-sm border border-white/20">
            Modul Resepsi
          </span>
          <h1 className="text-3xl md:text-4xl font-serif italic font-semibold mb-2 text-white flex items-center gap-3">
            <Users size={32} className="text-fuchsia-300" /> Daftar Tamu Undangan
          </h1>
          <p className="text-indigo-200 text-sm font-medium">Kelola daftar tamu, relasi, jenis undangan, pax, dan pantau status RSVP.</p>
        </div>

        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="relative z-10 bg-white text-indigo-950 hover:bg-indigo-50 px-6 py-3.5 rounded-xl flex items-center gap-2 text-sm font-bold transition shadow-lg"
        >
          <Plus size={18} /> Tambah Tamu
        </button>
      </motion.div>

      {/* 4 Kartu Metrik Statistik Tamu */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-6 rounded-[2rem] border border-blue-100 shadow-sm">
          <p className="text-[10px] md:text-xs font-bold text-blue-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Mail size={14}/> Total Undangan</p>
          <p className="text-2xl md:text-3xl font-extrabold text-blue-900">{totalUndangan} <span className="text-xs font-medium text-blue-600/70">Nama</span></p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50/50 p-6 rounded-[2rem] border border-purple-100 shadow-sm">
          <p className="text-[10px] md:text-xs font-bold text-purple-500 uppercase tracking-wider mb-1 flex items-center gap-1"><UsersRound size={14}/> Total Kapasitas (Pax)</p>
          <p className="text-2xl md:text-3xl font-extrabold text-purple-900">{totalPax} <span className="text-xs font-medium text-purple-600/70">Orang</span></p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-6 rounded-[2rem] border border-amber-100 shadow-sm">
          <p className="text-[10px] md:text-xs font-bold text-amber-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Send size={14}/> Undangan Terkirim</p>
          <p className="text-2xl md:text-3xl font-extrabold text-amber-700">{terkirim} <span className="text-xs font-medium text-amber-600/70">/ {totalUndangan}</span></p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-6 rounded-[2rem] border border-emerald-100 shadow-sm">
          <p className="text-[10px] md:text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1 flex items-center gap-1"><CheckCircle2 size={14}/> RSVP Konfirmasi Hadir</p>
          <p className="text-2xl md:text-3xl font-extrabold text-emerald-700">{rsvpHadir} <span className="text-xs font-medium text-emerald-600/70">Pax</span></p>
        </div>
      </div>

      {/* Ringkasan Relasi */}
      <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm mb-8 flex gap-6 overflow-x-auto text-sm">
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200 min-w-max">
          <span className="font-bold text-gray-500">Pihak CPW:</span> <span className="font-extrabold text-[#2C3E50]">{cpwCount} Undangan</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200 min-w-max">
          <span className="font-bold text-gray-500">Pihak CPP:</span> <span className="font-extrabold text-[#2C3E50]">{cppCount} Undangan</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200 min-w-max">
          <span className="font-bold text-gray-500">Pihak Orang Tua:</span> <span className="font-extrabold text-[#2C3E50]">{ortuCount} Undangan</span>
        </div>
      </div>

      {/* Kartu Kategori Grup Tamu (Accordion) */}
      <div className="space-y-6">
        <AnimatePresence>
          {dynamicGroups.map((groupName, index) => {
            const groupGuests = guests.filter(g => g.group_name === groupName);
            const groupPax = groupGuests.reduce((sum, g) => sum + (Number(g.pax) || 0), 0);
            const isOpen = openGroups.includes(groupName);
            const theme = getCategoryTheme(index);

            if (groupGuests.length === 0 && !defaultGroups.includes(groupName)) return null;

            return (
              <motion.div 
                key={groupName}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-white rounded-[2rem] border border-l-[8px] transition-all shadow-sm overflow-hidden ${theme.border}`}
              >
                
                {/* Header Kartu Group */}
                <div className={`p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b ${theme.bg} ${theme.border}`}>
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleGroupCard(groupName)} className={`p-1.5 rounded-lg transition ${theme.text} hover:bg-white/50`}>
                      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    <div>
                      <h2 className={`text-xl font-extrabold tracking-wide uppercase ${theme.text}`}>{groupName}</h2>
                      <p className={`text-xs font-medium mt-1 ${theme.text} opacity-70`}>{groupGuests.length} Undangan • {groupPax} Total Pax</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <button onClick={(e) => { e.stopPropagation(); setFormData({...formData, group_name: groupName}); setIsModalOpen(true); }} className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${theme.btn}`}>
                      + Tambah Tamu
                    </button>
                    <button onClick={() => handleDeleteGroup(groupName)} className={`p-2 rounded-xl transition ${theme.text} opacity-50 hover:opacity-100 hover:bg-white/50`} title="Hapus Grup">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Isi Kartu / List Tamu */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-2 md:p-6 bg-white overflow-x-auto">
                      
                      {groupGuests.length === 0 ? (
                        <div className="text-center py-6">
                          <p className="text-xs text-gray-400">Belum ada daftar tamu di grup ini.</p>
                        </div>
                      ) : (
                        <div className="min-w-[800px] space-y-3">
                          {/* Header Tabel (Desktop View) */}
                          <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-lg text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            <div className="col-span-3">Nama Tamu</div>
                            <div className="col-span-2">Relasi Pihak</div>
                            <div className="col-span-2">Jenis / Tipe</div>
                            <div className="col-span-1 text-center">Pax</div>
                            <div className="col-span-2 text-center">Status Undangan</div>
                            <div className="col-span-2 text-right">Aksi</div>
                          </div>

                          {/* Data Row */}
                          {groupGuests.map((item) => (
                            <div key={item.id} className="grid grid-cols-12 gap-4 px-4 py-4 bg-white border border-gray-100 rounded-2xl items-center hover:shadow-md transition">
                              
                              <div className="col-span-3 font-bold text-[#2C3E50] text-sm truncate">
                                {item.name}
                              </div>
                              
                              <div className="col-span-2">
                                <span className={`text-[10px] md:text-xs px-2.5 py-1 rounded-md font-semibold border ${
                                  item.relation === 'Pihak CPW' ? 'bg-pink-50 text-pink-700 border-pink-200' : 
                                  item.relation === 'Pihak CPP' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-700 border-gray-200'
                                }`}>
                                  {item.relation}
                                </span>
                              </div>

                              <div className="col-span-2">
                                <span className={`text-[10px] md:text-xs px-2.5 py-1 rounded-md font-semibold border ${
                                  item.invitation_type === 'Digital' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  📝 {item.invitation_type}
                                </span>
                              </div>

                              <div className="col-span-1 text-center font-extrabold text-indigo-900">
                                {item.pax}
                              </div>

                              <div className="col-span-2 text-center">
                                <span className={`text-[10px] md:text-xs px-3 py-1.5 rounded-full font-bold shadow-sm border ${
                                  item.status === 'RSVP Hadir' ? 'bg-emerald-500 text-white border-emerald-600' :
                                  item.status === 'Terkirim' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                                  item.status === 'Batal / Tidak Hadir' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                                  'bg-gray-100 text-gray-500 border-gray-200'
                                }`}>
                                  {item.status}
                                </span>
                              </div>

                              <div className="col-span-2 flex items-center justify-end gap-1">
                                <button onClick={() => handleEditClick(item)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit Data"><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" title="Hapus"><Trash2 size={16} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Modal Tambah/Edit Tamu */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button onClick={resetForm} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X size={20} /></button>
              <h2 className="text-2xl font-serif italic text-indigo-950 mb-6">{editingId ? 'Edit Data Tamu' : 'Tambah Tamu Undangan'}</h2>
              
              <form onSubmit={handleSave} className="space-y-4">
                
                {/* Grup & Relasi */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Grup Tamu *</label>
                    <select name="group_name" value={formData.group_name} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-indigo-400 bg-gray-50/50">
                      {dynamicGroups.map(p => <option key={p} value={p}>{p}</option>)}
                      <option value="custom" className="font-bold text-indigo-600">+ Tambah Grup Baru...</option>
                    </select>
                    
                    <AnimatePresence>
                      {formData.group_name === 'custom' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2">
                          <input type="text" placeholder="Cth: Teman Kuliah..." value={customGroup} onChange={(e) => setCustomGroup(e.target.value)} className="w-full border border-indigo-300 rounded-xl p-3 text-sm focus:outline-indigo-500 bg-indigo-50/50" required />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Relasi (Dari Pihak)</label>
                    <select name="relation" value={formData.relation} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-indigo-400 bg-gray-50/50">
                      <option value="Pihak CPW">Pihak CPW (Wanita)</option>
                      <option value="Pihak CPP">Pihak CPP (Pria)</option>
                      <option value="Pihak Orang Tua">Pihak Orang Tua</option>
                      <option value="Umum">Umum / Lainnya</option>
                    </select>
                  </div>
                </div>

                {/* Nama Lengkap */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Nama Undangan / Tamu *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Cth: Keluarga Bpk. Budi Santoso" className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-indigo-400" required autoFocus />
                </div>

                {/* Jenis Undangan & Jumlah Pax */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Jenis Undangan</label>
                    <select name="invitation_type" value={formData.invitation_type} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-indigo-400 bg-gray-50/50">
                      <option value="Digital">Digital (Web / WA)</option>
                      <option value="Cetak">Cetak (Fisik)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-purple-700/70 mb-1">Total Pax (Orang)</label>
                    <input type="number" name="pax" value={formData.pax} onChange={handleChange} min={1} className="w-full border border-purple-200 rounded-xl p-3 text-sm focus:outline-purple-500 bg-purple-50/30 font-bold" required />
                  </div>
                </div>

                {/* Status Undangan & RSVP */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Status Undangan & RSVP</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-indigo-400 bg-gray-50/50 font-semibold">
                    <option value="Belum Terkirim">Belum Terkirim</option>
                    <option value="Terkirim">Terkirim / Menunggu Balasan</option>
                    <option value="RSVP Hadir">RSVP Konfirmasi Hadir</option>
                    <option value="Batal / Tidak Hadir">Maaf, Tidak Bisa Hadir</option>
                  </select>
                </div>
                
                <button type="submit" className="w-full bg-indigo-900 text-white py-3.5 rounded-xl font-medium hover:bg-indigo-950 transition mt-6">
                  {editingId ? 'Simpan Perubahan' : 'Simpan Data Tamu'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}