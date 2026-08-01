import React, { useState } from 'react';
import { Save, FileText, Trash2 } from 'lucide-react';
import { Student, DailyJournal, AppConfig } from '../types';
import { ROUTINE_TASKS } from '../services/storage';
import { printJournalPDF } from '../services/pdfGenerator';

interface ChecklistTabProps {
  students: Student[];
  journals: DailyJournal[];
  config: AppConfig;
  onSaveJournal: (journal: DailyJournal) => void;
  onDeleteJournal: (id: string) => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'warning' | 'error') => void;
  onAskConfirm: (title: string, message: string) => Promise<boolean>;
}

export const ChecklistTab: React.FC<ChecklistTabProps> = ({
  students,
  journals,
  config,
  onSaveJournal,
  onDeleteJournal,
  onShowToast,
  onAskConfirm
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [taskStates, setTaskStates] = useState<Record<number, boolean>>({});

  const studentJournals = journals.filter((j) => String(j.studentId) === String(selectedStudentId));

  const handleToggleTask = (id: number) => {
    setTaskStates((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = () => {
    if (!selectedStudentId) {
      onShowToast('Pilih Siswa', 'Silakan pilih siswa terlebih dahulu.', 'warning');
      return;
    }
    if (!timeStart || !timeEnd) {
      onShowToast('Waktu Kosong', 'Silakan isi rentang waktu (Jam Mulai & Jam Selesai).', 'warning');
      return;
    }

    const student = students.find((s) => String(s.id) === String(selectedStudentId));
    let completedTasksCount = 0;
    const tasksSnapshot = ROUTINE_TASKS.map((item) => {
      const isDone = !!taskStates[item.id];
      if (isDone) completedTasksCount++;
      return { task: item.task, done: isDone };
    });

    const date = new Date().toISOString().split('T')[0];

    const newJournal: DailyJournal = {
      id: `jnl-${Date.now()}`,
      studentId: selectedStudentId,
      studentName: student ? student.name : '',
      date,
      timeRange: `${timeStart} - ${timeEnd}`,
      tasksCompleted: completedTasksCount,
      totalTasks: ROUTINE_TASKS.length,
      notes,
      tasksSnapshot
    };

    onSaveJournal(newJournal);
    setTimeStart('');
    setTimeEnd('');
    setNotes('');
    setTaskStates({});
    onShowToast('Jurnal Tersimpan', `Evaluasi rutinitas untuk ${student ? student.name : ''} berhasil direkam.`, 'success');
  };

  const handleDelete = async (id: string) => {
    const confirmed = await onAskConfirm('Hapus Jurnal?', 'Apakah Anda yakin ingin menghapus catatan harian ini?');
    if (confirmed) {
      onDeleteJournal(id);
      onShowToast('Jurnal Dihapus', 'Catatan berhasil dihapus dari riwayat.', 'success');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-slate-900">
            Jurnal & Ceklist Rutinitas Anak Asuh
          </h2>
          <p className="text-xs text-slate-500">
            Evaluasi rutinitas harian asrama secara individual per siswa.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Input Form */}
        <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
            Pengisian Jurnal Evaluasi
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Pilih Anak Asuh
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.class} - {s.dorm})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Jam Mulai
              </label>
              <input
                type="time"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Jam Selesai
              </label>
              <input
                type="time"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Daftar Rutinitas (Centang jika tuntas)
            </label>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 max-h-[220px] overflow-y-auto">
              {ROUTINE_TASKS.map((t) => (
                <label
                  key={t.id}
                  className="flex items-center gap-3 p-2.5 border rounded-lg cursor-pointer hover:bg-white bg-white sm:bg-slate-50 transition"
                >
                  <input
                    type="checkbox"
                    checked={!!taskStates[t.id]}
                    onChange={() => handleToggleTask(t.id)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="text-xs font-semibold text-slate-700">{t.task}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Catatan Observasi Wali Asuh (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder="Ketik catatan perkembangan sikap anak hari ini..."
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-emerald-600 text-white font-bold text-xs px-4 py-3 rounded-lg hover:bg-emerald-700 shadow-md transition active:scale-95 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Simpan Jurnal Anak
          </button>
        </div>

        {/* Right Panel: History */}
        <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
            Riwayat Jurnal & Cetak PDF
          </h3>
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
            {studentJournals.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-lg border border-slate-100">
                Belum ada riwayat jurnal evaluasi untuk anak asuh ini.
              </p>
            ) : (
              studentJournals.map((j) => (
                <div key={j.id} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-start border-b border-slate-200/50 pb-2">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">{j.date}</span>
                      <span className="text-[10px] font-medium text-slate-500">Pukul {j.timeRange}</span>
                    </div>
                    <div
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        j.tasksCompleted === j.totalTasks
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {j.tasksCompleted}/{j.totalTasks} Selesai
                    </div>
                  </div>
                  {j.notes && (
                    <p className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-100 italic leading-snug">
                      "{j.notes}"
                    </p>
                  )}
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => {
                        const s = students.find((st) => String(st.id) === String(j.studentId));
                        printJournalPDF(j, s, config);
                      }}
                      className="text-[10px] font-bold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 shadow transition flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" /> Cetak PDF
                    </button>
                    <button
                      onClick={() => handleDelete(j.id)}
                      className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-100 transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Hapus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
