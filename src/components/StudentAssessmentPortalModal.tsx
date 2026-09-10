import React, { useState, useMemo } from 'react';
import {
  Brain,
  Sparkles,
  HeartHandshake,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Smile,
  ShieldCheck,
  Search,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Activity
} from 'lucide-react';
import { Student, PsychologicalAssessment, PsychologicalTestType } from '../types';
import {
  PSYCHOLOGICAL_TESTS,
  calculateAssessmentResult
} from '../services/psychologicalBattery';

interface StudentAssessmentPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onSaveAssessment: (assessment: PsychologicalAssessment) => void;
  preselectedStudentId?: string;
  onShowToast: (title: string, message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const StudentAssessmentPortalModal: React.FC<StudentAssessmentPortalModalProps> = ({
  isOpen,
  onClose,
  students,
  onSaveAssessment,
  preselectedStudentId,
  onShowToast
}) => {
  // Navigation step: 'select_student' -> 'taking_test' -> 'result_feedback'
  const [step, setStep] = useState<'select_student' | 'taking_test' | 'result_feedback'>(
    preselectedStudentId ? 'taking_test' : 'select_student'
  );

  const [selectedStudentId, setSelectedStudentId] = useState<string>(preselectedStudentId || '');
  const [selectedTestType, setSelectedTestType] = useState<PsychologicalTestType>('sdq_25');
  const [searchStudentQuery, setSearchStudentQuery] = useState('');

  // Active question index during test
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [completedAssessment, setCompletedAssessment] = useState<PsychologicalAssessment | null>(null);

  const testDef = PSYCHOLOGICAL_TESTS[selectedTestType];

  const currentStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  const filteredStudents = useMemo(() => {
    if (!searchStudentQuery.trim()) return students.slice(0, 12);
    const q = searchStudentQuery.toLowerCase();
    return students
      .filter((s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.dorm.toLowerCase().includes(q))
      .slice(0, 15);
  }, [students, searchStudentQuery]);

  if (!isOpen) return null;

  const handleStartTest = () => {
    if (!currentStudent) {
      onShowToast('Pilih Nama Terlebih Dahulu', 'Silakan pilih nama siswa sebelum memulai tes.', 'warning');
      return;
    }
    setAnswers({});
    setCurrentQuestionIndex(0);
    setStep('taking_test');
  };

  const handleSelectAnswer = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const totalQuestions = testDef.questions.length;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  const handleFinishTest = () => {
    if (answeredCount < totalQuestions) {
      const unansweredIndex = testDef.questions.findIndex((q) => answers[q.id] === undefined);
      if (unansweredIndex !== -1) {
        setCurrentQuestionIndex(unansweredIndex);
        onShowToast(
          'Pertanyaan Belum Lengkap',
          `Masih ada pertanyaan yang belum dijawab (No. ${unansweredIndex + 1}). Silakan lengkapi ya!`,
          'warning'
        );
        return;
      }
    }

    if (!currentStudent) return;

    const result = calculateAssessmentResult(
      selectedTestType,
      answers,
      {
        id: currentStudent.id,
        name: currentStudent.name,
        class: currentStudent.class,
        dorm: currentStudent.dorm
      },
      'student',
      currentStudent.name
    );

    onSaveAssessment(result);
    setCompletedAssessment(result);
    setStep('result_feedback');
    onShowToast('Tes Berhasil Disimpan', 'Terima kasih atas kejujuranmu! Hasil asesmen telah tersimpan aman.', 'success');
  };

  const currentQuestion = testDef.questions[currentQuestionIndex];
  const isCurrentAnswered = currentQuestion && answers[currentQuestion.id] !== undefined;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-red-700 via-rose-700 to-amber-600 p-4 sm:p-5 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base sm:text-lg leading-tight tracking-tight">
                  Pojok Asesmen & Tumbuh Kembang Siswa
                </h2>
                <span className="bg-white/25 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                  Mandiri Siswa
                </span>
              </div>
              <p className="text-xs text-rose-100 font-medium">
                Kesehatan Mental, Resiliensi, & Tumbuh Kembang Jiwa Sekolah Rakyat
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-rose-100 hover:text-white hover:bg-white/20 rounded-xl transition cursor-pointer"
            title="Tutup Portal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-slate-50/50">
          {/* STEP 1: SELECT STUDENT & TEST */}
          {step === 'select_student' && (
            <div className="space-y-5">
              {/* Kind Empathetic Notice */}
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <p className="font-bold text-sm mb-1 text-amber-950">
                    Halo Siswa Sekolah Rakyat! 👋
                  </p>
                  <p>
                    Ini bukan ujian pelajaran berhitung atau hafalan. <strong>Tidak ada jawaban yang salah atau benar</strong>.
                    Pilihlah jawaban yang paling menggambarkan apa yang kamu rasakan di hati dan pikiranmu sehari-hari. Jawabanmu
                    sangat berharga untuk membantu para wali asuh dan guru mendampingi tumbuh kembangmu dengan penuh kasih sayang.
                  </p>
                </div>
              </div>

              {/* Step 1.1: Choose Student */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Pilih Nama Kamu (Siswa)
                </label>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ketik nama kamu atau NISN untuk mencari..."
                    value={searchStudentQuery}
                    onChange={(e) => setSearchStudentQuery(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-100 rounded-xl border border-slate-200">
                  {filteredStudents.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center col-span-2 py-4">
                      Nama siswa tidak ditemukan. Coba ketik kata kunci lain.
                    </p>
                  ) : (
                    filteredStudents.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedStudentId(s.id)}
                        className={`text-left p-2.5 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                          selectedStudentId === s.id
                            ? 'bg-red-50 border-red-500 shadow-xs ring-1 ring-red-500'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800 leading-tight">{s.name}</p>
                          <p className="text-[10px] text-slate-500">
                            Kelas {s.class} • {s.dorm}
                          </p>
                        </div>
                        {selectedStudentId === s.id && (
                          <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Step 1.2: Choose Psychological Test Battery */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  2. Pilih Paket Tes Psikologi
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedTestType('sdq_25')}
                    className={`text-left p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                      selectedTestType === 'sdq_25'
                        ? 'bg-red-50/80 border-red-500 ring-1 ring-red-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="p-2.5 rounded-xl bg-red-100 text-red-700 shrink-0">
                      <Brain className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-xs text-slate-900">
                          {PSYCHOLOGICAL_TESTS.sdq_25.title}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-800 rounded-full">
                          25 Soal (±10 mnt)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                        {PSYCHOLOGICAL_TESTS.sdq_25.description}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTestType('resilience_growth_20')}
                    className={`text-left p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                      selectedTestType === 'resilience_growth_20'
                        ? 'bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                      <HeartHandshake className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-xs text-slate-900">
                          {PSYCHOLOGICAL_TESTS.resilience_growth_20.title}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                          20 Soal (±7 mnt)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                        {PSYCHOLOGICAL_TESTS.resilience_growth_20.description}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTestType('mmpi_tni_polri')}
                    className={`text-left p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                      selectedTestType === 'mmpi_tni_polri'
                        ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 shrink-0">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-xs text-slate-900">
                          {PSYCHOLOGICAL_TESTS.mmpi_tni_polri.title}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                          100 Soal (±45 mnt)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                        {PSYCHOLOGICAL_TESTS.mmpi_tni_polri.description}
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Start Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={!currentStudent}
                  onClick={handleStartTest}
                  className={`w-full font-bold text-sm py-3.5 rounded-2xl transition flex items-center justify-center gap-2 text-white shadow-lg cursor-pointer ${
                    currentStudent
                      ? 'bg-red-600 hover:bg-red-700 active:scale-[0.99] shadow-red-600/30'
                      : 'bg-slate-300 cursor-not-allowed text-slate-500'
                  }`}
                >
                  <span>Mulai Mengerjakan Tes</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: TAKING TEST (QUESTION BY QUESTION) */}
          {step === 'taking_test' && currentQuestion && (
            <div className="space-y-4">
              {/* Progress & Active Student Bar */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                    <BookOpen className="w-3.5 h-3.5 text-red-600" />
                    <span>Siswa: <strong className="text-red-700">{currentStudent?.name}</strong></span>
                    <span className="text-slate-400">({currentStudent?.dorm})</span>
                  </div>
                  <span className="font-bold text-slate-600">
                    Soal {currentQuestionIndex + 1} dari {totalQuestions}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-red-600 to-amber-500 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>Terjawab: {answeredCount}/{totalQuestions} Soal</span>
                  <span>{progressPercent}% Selesai</span>
                </div>
              </div>

              {/* Question Card */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-md space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-black text-sm shrink-0">
                    {currentQuestion.number}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm sm:text-base font-bold text-slate-800 leading-relaxed">
                      "{currentQuestion.text}"
                    </p>
                    {currentQuestion.hint && (
                      <p className="text-xs text-slate-500 italic mt-1">
                        💡 Catatan: {currentQuestion.hint}
                      </p>
                    )}
                  </div>
                </div>

                {/* Options List */}
                <div className="space-y-2.5 pt-2">
                  {currentQuestion.options.map((option) => {
                    const isSelected = answers[currentQuestion.id] === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleSelectAnswer(currentQuestion.id, option.value)}
                        className={`w-full text-left p-3.5 rounded-2xl border transition cursor-pointer flex items-center gap-3.5 ${
                          isSelected
                            ? 'bg-red-50 border-red-500 text-red-950 font-bold shadow-xs ring-2 ring-red-400'
                            : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xl shrink-0">{option.emoji || '🔘'}</div>
                        <div className="flex-1">
                          <p className="text-xs sm:text-sm font-semibold">{option.label}</p>
                          {option.description && (
                            <p className="text-[10px] sm:text-xs text-slate-500 font-normal mt-0.5">
                              {option.description}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-red-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    currentQuestionIndex === 0
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 cursor-pointer shadow-xs'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </button>

                {currentQuestionIndex < totalQuestions - 1 ? (
                  <button
                    type="button"
                    disabled={!isCurrentAnswered}
                    onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition text-white shadow-sm cursor-pointer ${
                      isCurrentAnswered
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-slate-300 cursor-not-allowed text-slate-500'
                    }`}
                  >
                    <span>Pertanyaan Berikutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinishTest}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Selesaikan & Simpan Tes</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: RESULT & EMPATHETIC FEEDBACK */}
          {step === 'result_feedback' && completedAssessment && (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                <Smile className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  Terima Kasih, Ananda {completedAssessment.studentName}! 🌟
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                  Kamu hebat telah berani mengenali dan menceritakan perasaanmu secara jujur.
                  Hasil asesmen telah tersimpan dengan aman di database bimbingan Sekolah Rakyat.
                </p>
              </div>

              {/* Feedback Summary Card */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 text-left space-y-3 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-xs text-slate-800">Status Evaluasi Kejiwaan:</span>
                  </div>
                  <span
                    className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                      completedAssessment.overallStatus === 'normal'
                        ? 'bg-emerald-100 text-emerald-800'
                        : completedAssessment.overallStatus === 'borderline'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {completedAssessment.overallStatusLabel}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  {completedAssessment.developmentalInsights}
                </p>

                {completedAssessment.prosocialStrengths.length > 0 && (
                  <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
                    <p className="text-[11px] font-bold text-emerald-900 mb-1">
                      🌿 Kekuatan & Potensi Positif Kamu:
                    </p>
                    <ul className="text-[11px] text-emerald-800 space-y-1 list-disc list-inside">
                      {completedAssessment.prosocialStrengths.slice(0, 2).map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
                  💡 <strong>Pesan untuk Ananda:</strong> Apabila ada hal yang membuatmu cemas, rindu rumah,
                  atau berselisih paham dengan teman kamar, jangan sungkan untuk curhat kepada Wali Asuh atau
                  Guru BK ya. Kami siap mendengarkan dan mendukungmu!
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('select_student');
                    setCompletedAssessment(null);
                    setAnswers({});
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Ambil Tes Lain / Ganti Siswa</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Selesai & Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
