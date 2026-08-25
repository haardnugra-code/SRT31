import React, { useState, useEffect } from 'react';
import { Globe, Save, RefreshCw, Image as ImageIcon, Link as LinkIcon, Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { LandingPageData, loadLandingData, saveLandingData, DEFAULT_LANDING_DATA, NewsPost } from '../services/storage';

interface CmsWebsiteTabProps {
  onShowToast?: (title: string, message: string, type: 'success' | 'error') => void;
}

export const CmsWebsiteTab: React.FC<CmsWebsiteTabProps> = ({ onShowToast }) => {
  const [data, setData] = useState<LandingPageData>(DEFAULT_LANDING_DATA);
  const [isSaving, setIsSaving] = useState(false);
  const [editingPost, setEditingPost] = useState<NewsPost | null>(null);

  useEffect(() => {
    setData(loadLandingData());
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      saveLandingData(data);
      setIsSaving(false);
      window.dispatchEvent(new Event('landing-data-updated'));
      if (onShowToast) onShowToast('Berhasil Disimpan', 'Konfigurasi Landing Page telah diperbarui.', 'success');
    }, 500);
  };

  const handleReset = () => {
    if (window.confirm('Yakin ingin mereset tampilan website ke bawaan pabrik?')) {
      setData(DEFAULT_LANDING_DATA);
      saveLandingData(DEFAULT_LANDING_DATA);
      window.dispatchEvent(new Event('landing-data-updated'));
      if (onShowToast) onShowToast('Direset', 'Website dikembalikan ke setelan awal.', 'success');
    }
  };

  const handleMissionChange = (index: number, value: string) => {
    const newMissions = [...data.missions];
    newMissions[index] = value;
    setData({ ...data, missions: newMissions });
  };

  const handleAddNewPost = () => {
    setEditingPost({
      id: Date.now().toString(),
      title: '',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      desc: '',
      category: 'Berita',
      img: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=600&h=400',
      status: 'draft'
    });
  };

  const handleSavePost = () => {
    if (!editingPost) return;
    const existingIndex = data.news.findIndex(n => n.id === editingPost.id);
    let newNews = [...data.news];
    if (existingIndex >= 0) {
      newNews[existingIndex] = editingPost;
    } else {
      newNews.unshift(editingPost);
    }
    setData({ ...data, news: newNews });
    setEditingPost(null);
  };

  const handleDeletePost = (id: string) => {
    if (window.confirm('Hapus berita ini?')) {
      setData({ ...data, news: data.news.filter(n => n.id !== id) });
    }
  };

  const handleToggleStatus = (id: string) => {
    setData({
      ...data,
      news: data.news.map(n => n.id === id ? { ...n, status: n.status === 'published' ? 'draft' : 'published' } : n)
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Globe className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Manajemen Website (CMS)</h2>
            <p className="text-sm text-slate-500">Ubah teks, berita, dan kontak pada Landing Page.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Reset Default
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* HERO SECTION */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
            <div className="w-2 h-6 bg-indigo-500 rounded-full" /> Teks Sambutan Depan
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Label Kecil Atas</label>
              <input
                type="text"
                value={data.heroSubtitle}
                onChange={(e) => setData({ ...data, heroSubtitle: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">HTML Judul Utama</label>
              <textarea
                value={data.heroTitle}
                onChange={(e) => setData({ ...data, heroTitle: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Teks Deskripsi</label>
              <textarea
                value={data.aboutText}
                onChange={(e) => setData({ ...data, aboutText: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* BERITA SECTION */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
              <div className="w-2 h-6 bg-blue-500 rounded-full" /> Berita Terkini & Slider
            </h3>
            {!editingPost && (
              <button 
                onClick={handleAddNewPost}
                className="flex items-center gap-1 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-4 h-4" /> Tulis Berita
              </button>
            )}
          </div>
          
          {editingPost ? (
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl space-y-4">
              <div className="flex justify-between items-center mb-2 border-b border-slate-200 pb-4">
                <h4 className="font-bold text-slate-900">Editor Berita</h4>
                <button onClick={() => setEditingPost(null)} className="text-slate-500 hover:text-slate-700"><X className="w-5 h-5"/></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Judul Berita</label>
                  <input type="text" value={editingPost.title} onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Contoh: Juara Lomba Cerdas Cermat" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                  <input type="text" value={editingPost.category} onChange={(e) => setEditingPost({ ...editingPost, category: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Contoh: Prestasi" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
                  <input type="text" value={editingPost.date} onChange={(e) => setEditingPost({ ...editingPost, date: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">URL Gambar (Thumbnail / Banner Slider)</label>
                  <input type="text" value={editingPost.img} onChange={(e) => setEditingPost({ ...editingPost, img: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="https://" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Isi Singkat / Deskripsi (Muncul di Halaman Depan)</label>
                  <textarea rows={3} value={editingPost.desc} onChange={(e) => setEditingPost({ ...editingPost, desc: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Isi Artikel Lengkap (Muncul saat berita diklik)</label>
                  <textarea rows={8} value={editingPost.content || ''} onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Tuliskan isi berita lengkap di sini..." />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Publikasi</label>
                  <select value={editingPost.status} onChange={(e) => setEditingPost({ ...editingPost, status: e.target.value as 'draft' | 'published' })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold">
                    <option value="published">🟢 Diterbitkan (Published)</option>
                    <option value="draft">🟡 Konsep (Draft)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-200">
                <button onClick={() => setEditingPost(null)} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition-colors">Batal</button>
                <button onClick={handleSavePost} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"><Check className="w-4 h-4" /> Simpan Posting</button>
              </div>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase w-12">No</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">Judul Berita</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase w-32">Kategori</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase w-32">Status</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase w-32 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.news.map((n, i) => (
                    <tr key={n.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-sm text-slate-500 font-medium">{i + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{n.title}</p>
                        <p className="text-xs text-slate-500">{n.date}</p>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-600">{n.category}</td>
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => handleToggleStatus(n.id)}
                          className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider transition-colors border ${n.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'}`}
                        >
                          {n.status === 'published' ? 'Diterbitkan' : 'Draft'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingPost(n)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeletePost(n.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Hapus">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {data.news.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        Belum ada berita. Klik "Tulis Berita" untuk menambahkan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* VISI MISI SECTION */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
            <div className="w-2 h-6 bg-red-500 rounded-full" /> Visi & Misi
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Visi</label>
              <textarea
                value={data.vision}
                onChange={(e) => setData({ ...data, vision: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Misi (4 Poin)</label>
              {data.missions.map((m, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <span className="w-8 h-10 flex-shrink-0 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-500">{i + 1}</span>
                  <input
                    type="text"
                    value={m}
                    onChange={(e) => handleMissionChange(i, e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* STRUKTUR ORGANISASI SECTION */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
            <div className="w-2 h-6 bg-amber-500 rounded-full" /> Struktur Organisasi & Pimpinan
          </h3>
          
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6 space-y-4">
            <h4 className="font-bold text-slate-800 border-b border-blue-200 pb-2">Teks Pengantar Organisasi</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Teks Badge / Label</label>
                <input type="text" value={data.orgOverview?.badge || ''} onChange={(e) => setData({ ...data, orgOverview: { ...data.orgOverview, badge: e.target.value } })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Staf / Keterangan Kiri Bawah</label>
                <input type="text" value={data.orgOverview?.staffCount || ''} onChange={(e) => setData({ ...data, orgOverview: { ...data.orgOverview, staffCount: e.target.value } })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Gelap (Misal: Pimpinan &)</label>
                <input type="text" value={data.orgOverview?.titleDark || ''} onChange={(e) => setData({ ...data, orgOverview: { ...data.orgOverview, titleDark: e.target.value } })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Warna (Misal: Tenaga Pendidik)</label>
                <input type="text" value={data.orgOverview?.titleHighlight || ''} onChange={(e) => setData({ ...data, orgOverview: { ...data.orgOverview, titleHighlight: e.target.value } })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Utama</label>
                <textarea rows={2} value={data.orgOverview?.description || ''} onChange={(e) => setData({ ...data, orgOverview: { ...data.orgOverview, description: e.target.value } })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Kutipan / Quote Pimpinan (Tampil di Kartu)</label>
                <textarea rows={2} value={data.orgOverview?.quote || ''} onChange={(e) => setData({ ...data, orgOverview: { ...data.orgOverview, quote: e.target.value } })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Teks Kanan Bawah (Misal: Periode 2025/2026)</label>
                <input type="text" value={data.orgOverview?.period || ''} onChange={(e) => setData({ ...data, orgOverview: { ...data.orgOverview, period: e.target.value } })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500" />
              </div>
            </div>
          </div>

          <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Profil Anggota Inti</h4>
          <div className="space-y-6">
            {data.organization?.map((org, index) => (
              <div key={org.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="font-bold text-slate-700 border-b pb-2">
                  Posisi {index === 0 ? 'Utama (Tengah Atas)' : `Bawah ${index}`}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Nama Lengkap</label>
                    <input 
                      type="text" 
                      value={org.name} 
                      onChange={(e) => {
                        const newOrg = [...data.organization];
                        newOrg[index].name = e.target.value;
                        setData({ ...data, organization: newOrg });
                      }} 
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Jabatan / Peran</label>
                    <input 
                      type="text" 
                      value={org.role} 
                      onChange={(e) => {
                        const newOrg = [...data.organization];
                        newOrg[index].role = e.target.value;
                        setData({ ...data, organization: newOrg });
                      }} 
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Deskripsi Singkat (Tanggung Jawab)</label>
                    <input 
                      type="text" 
                      value={org.description} 
                      onChange={(e) => {
                        const newOrg = [...data.organization];
                        newOrg[index].description = e.target.value;
                        setData({ ...data, organization: newOrg });
                      }} 
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><ImageIcon className="w-3 h-3" /> URL Foto Profil (Avatar)</label>
                    <input 
                      type="text" 
                      value={org.img} 
                      onChange={(e) => {
                        const newOrg = [...data.organization];
                        newOrg[index].img = e.target.value;
                        setData({ ...data, organization: newOrg });
                      }} 
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg" 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CONTACT SECTION */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
            <div className="w-2 h-6 bg-emerald-500 rounded-full" /> Kontak & Lokasi
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Alamat Lengkap</label>
              <textarea
                value={data.contact.address}
                onChange={(e) => setData({ ...data, contact: { ...data.contact, address: e.target.value } })}
                rows={2}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
              <input
                type="text"
                value={data.contact.email}
                onChange={(e) => setData({ ...data, contact: { ...data.contact, email: e.target.value } })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
              <label className="block text-sm font-bold text-slate-700 mt-3 mb-1">Telepon / WhatsApp</label>
              <input
                type="text"
                value={data.contact.phone}
                onChange={(e) => setData({ ...data, contact: { ...data.contact, phone: e.target.value } })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2"><LinkIcon className="w-4 h-4" /> Embed URL Google Maps (src iframe)</label>
              <input
                type="text"
                value={data.contact.mapUrl}
                onChange={(e) => setData({ ...data, contact: { ...data.contact, mapUrl: e.target.value } })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
