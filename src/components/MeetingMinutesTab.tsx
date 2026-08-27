import React, { useState, useEffect, useMemo } from 'react';
import { MeetingMinute, MeetingAttendee, MeetingStatus, AppConfig } from '../types';
import { Plus, Edit2, Trash2, Download, Check, X, FileText, Calendar, Clock, MapPin, Users, DownloadCloud } from 'lucide-react';
import { printMeetingMinutePDF, printMeetingAttendancePDF } from '../services/pdfGenerator';

interface Props {
  showToast: (title: string, message: string, type?: 'success' | 'warning' | 'error') => void;
  askConfirm: (title: string, message: string) => Promise<boolean>;
  config: AppConfig;
  meetingMinutes: MeetingMinute[];
  onSaveMinute: (minute: MeetingMinute, isEdit: boolean) => void;
  onDeleteMinute: (id: string) => void;
}

export function MeetingMinutesTab({ showToast, askConfirm, config, meetingMinutes: minutes, onSaveMinute, onDeleteMinute }: Props) {
  const [activeView, setActiveView] = useState<'list' | 'form' | 'detail'>('list');
  const [currentMinute, setCurrentMinute] = useState<MeetingMinute | null>(null);

  const handleCreateNew = () => {
    setCurrentMinute({
      id: `mtg-${Date.now()}`,
      agenda: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      location: '',
      leader: '',
      attendees: [],
      decisions: '',
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    setActiveView('form');
  };

  const handleEdit = (minute: MeetingMinute) => {
    setCurrentMinute({ ...minute });
    setActiveView('form');
  };

  const handleView = (minute: MeetingMinute) => {
    setCurrentMinute({ ...minute });
    setActiveView('detail');
  };

  const handleDelete = async (id: string) => {
    const confirm = await askConfirm('Hapus Notulensi', 'Apakah Anda yakin ingin menghapus notulensi ini?');
    if (confirm) {
      onDeleteMinute(id);
      showToast('Berhasil', 'Notulensi rapat berhasil dihapus', 'success');
      if (currentMinute && currentMinute.id === id) {
        setActiveView('list');
        setCurrentMinute(null);
      }
    }
  };

  const handleSave = (minute: MeetingMinute, publish: boolean) => {
    const newStatus: MeetingStatus = publish ? 'published' : 'draft';
    const isEdit = minutes.some(m => m.id === minute.id);
    const updatedMinute = { ...minute, status: newStatus, updatedAt: Date.now() };
    
    onSaveMinute(updatedMinute, isEdit);
    
    showToast('Tersimpan', `Notulensi berhasil disimpan sebagai ${publish ? 'Publikasi' : 'Draft'}`, 'success');
    setActiveView('list');
    setCurrentMinute(null);
  };

  const downloadAttendancePDF = async (minute: MeetingMinute) => {
    await printMeetingAttendancePDF(minute, config);
  };

  const downloadMinutePDF = async (minute: MeetingMinute) => {
    await printMeetingMinutePDF(minute, config);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notulensi Rapat</h1>
          <p className="text-sm text-gray-500">Kelola dan dokumentasikan hasil rapat asrama</p>
        </div>
        
        {activeView === 'list' && (
          <button 
            onClick={handleCreateNew}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Buat Notulensi Baru</span>
          </button>
        )}
        
        {activeView !== 'list' && (
          <button 
            onClick={() => {
              setActiveView('list');
              setCurrentMinute(null);
            }}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            &larr; Kembali ke Daftar
          </button>
        )}
      </div>

      {activeView === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="p-4">Agenda Rapat</th>
                  <th className="p-4">Tanggal & Waktu</th>
                  <th className="p-4">Pimpinan Rapat</th>
                  <th className="p-4">Kehadiran</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {minutes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      Belum ada notulensi rapat. Klik "Buat Notulensi Baru" untuk menambahkan.
                    </td>
                  </tr>
                ) : (
                  minutes.map(m => {
                    const presentCount = m.attendees.filter(a => a.isPresent).length;
                    return (
                      <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-medium text-gray-900">{m.agenda || '-'}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Calendar className="w-4 h-4" /> {m.date || '-'}
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-1">
                            <Clock className="w-3 h-3" /> {m.time || '-'}
                          </div>
                        </td>
                        <td className="p-4">{m.leader || '-'}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {presentCount} / {m.attendees.length} Hadir
                          </span>
                        </td>
                        <td className="p-4">
                          {m.status === 'published' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <Check className="w-3.5 h-3.5" />
                              Publikasi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                              <FileText className="w-3.5 h-3.5" />
                              Draft
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button 
                            onClick={() => handleView(m)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Lihat Detail"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEdit(m)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(m.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeView === 'form' && currentMinute && (
        <MinuteForm 
          initialData={currentMinute}
          onSave={handleSave}
          onDownloadAttendance={() => downloadAttendancePDF(currentMinute)}
        />
      )}

      {activeView === 'detail' && currentMinute && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="flex justify-between items-start border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{currentMinute.agenda}</h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {currentMinute.date}</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {currentMinute.time}</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {currentMinute.location}</span>
              </div>
            </div>
            <div>
              {currentMinute.status === 'published' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Check className="w-4 h-4" /> Publikasi
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                  <FileText className="w-4 h-4" /> Draft
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Keputusan Rapat</h3>
                <div className="bg-gray-50 p-4 rounded-lg text-gray-700 whitespace-pre-wrap min-h-[150px] border border-gray-200">
                  {currentMinute.decisions || <span className="text-gray-400 italic">Belum ada keputusan tertulis.</span>}
                </div>
              </div>
              
              <div>
                 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Pimpinan Rapat</h3>
                 <p className="text-gray-800 font-medium">{currentMinute.leader || '-'}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-fit">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4" /> Daftar Hadir
                </h3>
                <span className="bg-white px-2 py-1 rounded text-xs font-bold text-blue-700 border border-blue-200">
                  {currentMinute.attendees.filter(a => a.isPresent).length} / {currentMinute.attendees.length} Hadir
                </span>
              </div>
              
              <ul className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {currentMinute.attendees.map(a => (
                  <li key={a.id} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-gray-700 font-medium">{a.name}</span>
                    {a.isPresent ? (
                      <span className="text-emerald-600 flex items-center gap-1 text-xs font-semibold"><Check className="w-3 h-3"/> Hadir</span>
                    ) : (
                      <span className="text-gray-400 flex items-center gap-1 text-xs"><X className="w-3 h-3"/> Tidak</span>
                    )}
                  </li>
                ))}
                {currentMinute.attendees.length === 0 && (
                  <li className="text-sm text-gray-500 italic text-center py-4">Belum ada peserta terdaftar.</li>
                )}
              </ul>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => handleEdit(currentMinute)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Edit Notulensi
            </button>
            <button
              onClick={() => downloadAttendancePDF(currentMinute)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <DownloadCloud className="w-4 h-4" /> Unduh Daftar Hadir (PDF)
            </button>
            <button
              onClick={() => downloadMinutePDF(currentMinute)}
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-white font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Unduh Dokumen (PDF)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component for Form
function MinuteForm({ 
  initialData, 
  onSave, 
  onDownloadAttendance 
}: { 
  initialData: MeetingMinute, 
  onSave: (m: MeetingMinute, publish: boolean) => void,
  onDownloadAttendance: () => void 
}) {
  const [formData, setFormData] = useState<MeetingMinute>(initialData);
  const [newAttendeeName, setNewAttendeeName] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddAttendee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttendeeName.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      attendees: [...prev.attendees, { id: `att-${Date.now()}`, name: newAttendeeName.trim(), isPresent: false }]
    }));
    setNewAttendeeName('');
  };

  const handleRemoveAttendee = (id: string) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.filter(a => a.id !== id)
    }));
  };

  const handleToggleAttendance = (id: string) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.map(a => a.id === id ? { ...a, isPresent: !a.isPresent } : a)
    }));
  };

  const presentCount = formData.attendees.filter(a => a.isPresent).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-800">
          {formData.status === 'published' ? 'Edit Notulensi Publikasi' : 'Draft Notulensi'}
        </h2>
        <div className="text-sm font-medium text-gray-500">
          Generator Kehadiran: <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded">{presentCount} / {formData.attendees.length} Hadir</span>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Kiri: Detail Rapat & Keputusan */}
        <div className="lg:col-span-2 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Agenda Rapat</label>
            <input 
              type="text" 
              name="agenda"
              value={formData.agenda} 
              onChange={handleChange}
              placeholder="Contoh: Rapat Evaluasi Bulanan Asrama"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal</label>
              <input 
                type="date" 
                name="date"
                value={formData.date} 
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Waktu (Pukul)</label>
              <input 
                type="time" 
                name="time"
                value={formData.time} 
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tempat</label>
              <input 
                type="text" 
                name="location"
                value={formData.location} 
                onChange={handleChange}
                placeholder="Contoh: Ruang Rapat Asrama"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Pimpinan Rapat</label>
              <input 
                type="text" 
                name="leader"
                value={formData.leader} 
                onChange={handleChange}
                placeholder="Contoh: Bpk. Ahmad"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Keputusan Rapat / Notulensi</label>
            <textarea 
              name="decisions"
              value={formData.decisions} 
              onChange={handleChange}
              rows={8}
              placeholder="Tuliskan hasil diskusi, keputusan, dan rencana tindak lanjut di sini..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
            />
          </div>
        </div>

        {/* Kolom Kanan: Daftar Peserta */}
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" /> Daftar Peserta Rapat
            </h3>
            
            <form onSubmit={handleAddAttendee} className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={newAttendeeName} 
                onChange={(e) => setNewAttendeeName(e.target.value)}
                placeholder="Nama peserta..."
                className="flex-1 px-3 py-2 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button type="submit" className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </form>

            <div className="bg-white rounded-lg border border-blue-100 overflow-hidden flex flex-col h-[350px]">
              <div className="overflow-y-auto flex-1 p-2 space-y-1">
                {formData.attendees.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md group">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={a.isPresent}
                        onChange={() => handleToggleAttendance(a.id)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                        title="Tandai Hadir"
                      />
                      <span className={`text-sm font-medium ${a.isPresent ? 'text-gray-900' : 'text-gray-500 line-through opacity-70'}`}>
                        {a.name}
                      </span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleRemoveAttendee(a.id)}
                      className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {formData.attendees.length === 0 && (
                  <div className="text-center text-sm text-gray-500 py-6 italic">
                    Daftar peserta kosong. Tambahkan peserta terlebih dahulu.
                  </div>
                )}
              </div>
            </div>
            
            <button
              type="button"
              onClick={onDownloadAttendance}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
            >
              <DownloadCloud className="w-4 h-4" />
              Unduh Daftar (Bisa Kosong)
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end">
        <button 
          onClick={() => onSave(formData, false)}
          className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
        >
          <FileText className="w-4 h-4" /> Simpan sbg Draft
        </button>
        <button 
          onClick={() => onSave(formData, true)}
          className="px-6 py-2.5 bg-emerald-600 rounded-lg text-white font-medium hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <Check className="w-4 h-4" /> Simpan & Publikasi
        </button>
      </div>
    </div>
  );
}
