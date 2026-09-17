import React, { useState, useEffect } from 'react';
import { X, Save, FileText, UploadCloud, UserCheck } from 'lucide-react';
import { AssessmentResult, Student } from '../types';

interface AssessmentResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onSave: (result: AssessmentResult) => void;
  initialData?: AssessmentResult;
}

export const AssessmentResultModal: React.FC<AssessmentResultModalProps> = ({
  isOpen,
  onClose,
  students,
  onSave,
  initialData
}) => {
  const [studentId, setStudentId] = useState('');
  const [assessmentType, setAssessmentType] = useState('');
  const [score, setScore] = useState('');
  const [category, setCategory] = useState('');
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [assessor, setAssessor] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (initialData) {
      setStudentId(initialData.studentId);
      setAssessmentType(initialData.assessmentType);
      setScore(initialData.score);
      setCategory(initialData.category);
      setStrengths(initialData.strengths);
      setWeaknesses(initialData.weaknesses);
      setRecommendations(initialData.recommendations);
      setAdditionalNotes(initialData.additionalNotes);
      setFileUrl(initialData.fileUrl);
      setAssessor(initialData.assessor);
      setDate(initialData.date);
    } else {
      setStudentId('');
      setAssessmentType('');
      setScore('');
      setCategory('');
      setStrengths('');
      setWeaknesses('');
      setRecommendations('');
      setAdditionalNotes('');
      setFileUrl('');
      setAssessor('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find(s => s.id === studentId);
    
    onSave({
      id: initialData ? initialData.id : `ASSESS-${Date.now()}`,
      studentId,
      studentName: st ? st.name : '',
      assessmentType,
      score,
      category,
      strengths,
      weaknesses,
      recommendations,
      additionalNotes,
      fileUrl,
      assessor,
      date
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 sm:p-5 bg-amber-500 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{initialData ? 'Edit Hasil Assessment' : 'Input Hasil Assessment'}</h3>
              <p className="text-white/80 text-xs">Simpan rekapan assessment tambahan ke database pusat</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Siswa <span className="text-red-500">*</span></label>
              <select
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full rounded-xl border-slate-200 bg-slate-50 text-sm focus:border-amber-500 focus:ring-amber-500"
              >
                <option value="">-- Pilih Siswa --</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.class})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Tanggal Assessment <span className="text-red-500">*</span></label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border-slate-200 bg-slate-50 text-sm focus:border-amber-500 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Jenis Assessment <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                placeholder="Misal: IQ Test, Minat Bakat..."
                value={assessmentType}
                onChange={(e) => setAssessmentType(e.target.value)}
                className="w-full rounded-xl border-slate-200 bg-slate-50 text-sm focus:border-amber-500 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Penguji / Assesor</label>
              <input
                type="text"
                placeholder="Nama lembaga/psikolog"
                value={assessor}
                onChange={(e) => setAssessor(e.target.value)}
                className="w-full rounded-xl border-slate-200 bg-slate-50 text-sm focus:border-amber-500 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Skor / Nilai</label>
              <input
                type="text"
                placeholder="Contoh: 120, A+, 85"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-full rounded-xl border-slate-200 bg-slate-50 text-sm focus:border-amber-500 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Kategori Skor</label>
              <input
                type="text"
                placeholder="Misal: Superior, Normal, Sangat Baik"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border-slate-200 bg-slate-50 text-sm focus:border-amber-500 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Kelebihan / Potensi Siswa</label>
              <textarea
                rows={2}
                placeholder="Uraikan kelebihan/potensi dari hasil tes..."
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                className="w-full rounded-xl border-slate-200 bg-slate-50 text-sm focus:border-amber-500 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Kekurangan / Area Perbaikan</label>
              <textarea
                rows={2}
                placeholder="Uraikan area yang perlu perhatian..."
                value={weaknesses}
                onChange={(e) => setWeaknesses(e.target.value)}
                className="w-full rounded-xl border-slate-200 bg-slate-50 text-sm focus:border-amber-500 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Rekomendasi Bimbingan & Tindak Lanjut</label>
              <textarea
                rows={2}
                placeholder="Apa rekomendasi tindak lanjutnya?"
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                className="w-full rounded-xl border-slate-200 bg-slate-50 text-sm focus:border-amber-500 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Catatan Tambahan Khusus</label>
              <textarea
                rows={2}
                placeholder="Catatan pelengkap dari penguji..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="w-full rounded-xl border-slate-200 bg-slate-50 text-sm focus:border-amber-500 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">URL Berkas / Laporan Asli (Google Drive)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UploadCloud className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="w-full pl-10 rounded-xl border-slate-200 bg-slate-50 text-sm focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-slate-200 flex justify-end gap-3 shrink-0 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold shadow-sm transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {initialData ? 'Perbarui Data' : 'Simpan Assessment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
