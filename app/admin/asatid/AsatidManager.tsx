'use client';

import { createClient } from '@/lib/supabase';
import { IoAdd, IoTrash, IoCheckmarkCircle, IoTimeOutline, IoChevronBack } from 'react-icons/io5';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface Teacher {
  id: string;
  name: string;
  phone: string;
  gender: 'male' | 'female';
  active_days: string[];
  start_hour: string;
  end_hour: string;
  is_active: boolean;
}

const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function AsatidManager() {
  const supabase = createClient();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Teacher>>({
    name: '',
    phone: '',
    gender: 'male',
    active_days: [],
    start_hour: '08:00',
    end_hour: '21:00',
    is_active: true,
  });

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('asatid')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) setTeachers(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (editingId) {
      const { error } = await supabase
        .from('asatid')
        .update(formData)
        .eq('id', editingId);
      if (error) alert(error.message);
    } else {
      const { error } = await supabase
        .from('asatid')
        .insert([formData]);
      if (error) alert(error.message);
    }

    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      name: '',
      phone: '',
      gender: 'male',
      active_days: [],
      start_hour: '08:00',
      end_hour: '21:00',
      is_active: true,
    });
    setSaving(false);
    fetchTeachers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus asatid ini?')) return;
    const { error } = await supabase.from('asatid').delete().eq('id', id);
    if (error) alert(error.message);
    fetchTeachers();
  };

  const toggleDay = (day: string) => {
    const current = formData.active_days || [];
    if (current.includes(day)) {
      setFormData({ ...formData, active_days: current.filter(d => d !== day) });
    } else {
      setFormData({ ...formData, active_days: [...current, day] });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <Link href="/admin/warna" className="text-emerald-600 text-xs font-bold uppercase flex items-center gap-1 mb-1 hover:underline">
              <IoChevronBack /> Kembali ke Admin
            </Link>
            <h1 className="text-2xl font-bold text-slate-800">Manajemen Asatid</h1>
            <p className="text-slate-500 text-sm">Input data nomor dan jadwal aktif ustadz/ustadzah.</p>
          </div>
          <button 
            onClick={() => { setEditingId(null); setIsModalOpen(true); }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <IoAdd size={20} />
            <span>Tambah Data</span>
          </button>
        </header>

        {loading ? (
          <div className="text-center py-20 text-slate-400">Memuat data asatid...</div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
            Belum ada data asatid. Klik &quot;Tambah Data&quot; untuk menginput.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teachers.map((t) => (
              <div key={t.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:border-emerald-500/30 transition-all flex justify-between items-start group">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${t.gender === 'male' ? 'bg-blue-50 text-blue-500' : 'bg-rose-50 text-rose-500'}`}>
                      {t.gender === 'male' ? '👳‍♂️' : '🧕'}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-800">{t.name}</h3>
                      <p className="text-slate-400 text-xs">{t.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {INDO_DAYS.map(day => (
                      <span key={day} className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${t.active_days.includes(day) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-300'}`}>
                        {day.slice(0, 3)}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-1">
                       <IoTimeOutline className="text-emerald-500" />
                       {t.start_hour} - {t.end_hour}
                    </div>
                    {t.is_active ? 
                       <span className="text-emerald-500 flex items-center gap-1"><IoCheckmarkCircle /> Akun Aktif</span> : 
                       <span className="text-rose-400 italic">Nonaktif</span>
                    }
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => { setEditingId(t.id); setFormData(t); setIsModalOpen(true); }}
                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(t.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <IoTrash size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
              <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h2 className="text-lg font-bold text-slate-800">{editingId ? 'Edit Data Asatid' : 'Tambah Asatid Baru'}</h2>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                     Tutup
                  </button>
                </div>

                <div className="p-8 overflow-y-auto space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">Nama Lengkap & Gelar</label>
                    <input 
                      required
                      className="w-full bg-slate-100 border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-medium"
                      placeholder="Contoh: Ust. Adi Hidayat"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-600">Nomor WhatsApp</label>
                      <input 
                        required
                        className="w-full bg-slate-100 border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-medium"
                        placeholder="62812345..."
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-600">Kategori</label>
                      <select 
                        className="w-full bg-slate-100 border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-medium"
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                      >
                        <option value="male">Ustadz (Pria)</option>
                        <option value="female">Ustadzah (Wanita)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-600">Hari Aktif (Jadwal Kerja)</label>
                    <div className="flex flex-wrap gap-2">
                      {INDO_DAYS.map(day => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${formData.active_days?.includes(day) ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-500'}`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-600">Jam Mulai Aktif</label>
                      <input 
                        type="time"
                        className="w-full bg-slate-100 border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 font-medium"
                        value={formData.start_hour}
                        onChange={(e) => setFormData({ ...formData, start_hour: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-600">Jam Akhir Aktif</label>
                      <input 
                        type="time"
                        className="w-full bg-slate-100 border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 font-medium"
                        value={formData.end_hour}
                        onChange={(e) => setFormData({ ...formData, end_hour: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 rounded-b-3xl">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2 text-slate-500 font-bold"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan Data'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
