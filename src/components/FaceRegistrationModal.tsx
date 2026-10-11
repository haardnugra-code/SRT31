import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Upload,
  UserCheck,
  ShieldCheck,
  Sparkles,
  SwitchCamera,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { Student } from '../types';
import {
  loadFaceRecognitionModels,
  extractSingleFaceDescriptor,
  cacheStudentDescriptor,
  removeCachedStudentDescriptor,
} from '../services/faceRecognitionService';

interface FaceRegistrationModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveFace: (studentId: string, photoDataUrl: string, descriptor: number[]) => void;
  onDeleteFace?: (studentId: string) => void;
  onShowToast?: (title: string, message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const FaceRegistrationModal: React.FC<FaceRegistrationModalProps> = ({
  student,
  isOpen,
  onClose,
  onSaveFace,
  onDeleteFace,
  onShowToast,
}) => {
  const hasExistingFace = !!(student?.faceDescriptor && student.faceDescriptor.length === 128);

  // Sub-view: if existing face, default to 'status' overview, otherwise 'capture'
  const [viewMode, setViewMode] = useState<'status' | 'capture'>(hasExistingFace ? 'status' : 'capture');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [isModelLoading, setIsModelLoading] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);

  // Camera & Stream
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Detection & Capture State
  const [faceQualityMessage, setFaceQualityMessage] = useState<string>('Mempersiapkan kamera & model AI...');
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedDescriptor, setCapturedDescriptor] = useState<number[] | null>(null);
  const [isProcessingCapture, setIsProcessingCapture] = useState(false);
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const detectIntervalRef = useRef<number | null>(null);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (detectIntervalRef.current) {
      window.clearInterval(detectIntervalRef.current);
      detectIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setIsFaceDetected(false);
  }, []);

  // Initialize models and enumerate cameras
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedPhoto(null);
      setCapturedDescriptor(null);
      setShowDeleteConfirm(false);
      return;
    }

    // Set initial view mode based on existing face
    setViewMode(hasExistingFace ? 'status' : 'capture');
    setShowDeleteConfirm(false);

    let isMounted = true;
    setIsModelLoading(true);
    setModelError(null);

    loadFaceRecognitionModels()
      .then((success) => {
        if (!isMounted) return;
        if (success) {
          setIsModelLoading(false);
        } else {
          setModelError('Gagal memuat model deteksi wajah AI. Periksa koneksi internet atau restart browser.');
          setIsModelLoading(false);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setModelError('Gagal inisialisasi AI Face Recognition: ' + (err?.message || 'Error'));
        setIsModelLoading(false);
      });

    // Enumerate video devices
    navigator.mediaDevices?.enumerateDevices()
      .then((devices) => {
        if (!isMounted) return;
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setAvailableDevices(videoInputs);
        if (videoInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isOpen, hasExistingFace, stopCamera, selectedDeviceId]);

  // Live detection loop
  const startDetectionLoop = useCallback(() => {
    if (detectIntervalRef.current) {
      window.clearInterval(detectIntervalRef.current);
    }

    detectIntervalRef.current = window.setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

      try {
        const result = await extractSingleFaceDescriptor(videoRef.current);
        if (result && result.detection.score > 0.45) {
          setIsFaceDetected(true);
          setFaceQualityMessage('✓ Wajah terdeteksi jelas. Siap ambil foto!');
        } else {
          setIsFaceDetected(false);
          setFaceQualityMessage('Posisikan wajah tepat di dalam lingkaran.');
        }
      } catch {
        // Ignore frame extraction error
      }
    }, 400);
  }, []);

  // Start Camera
  const startCamera = useCallback(async () => {
    stopCamera();
    try {
      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 640 }, height: { ideal: 480 } }
          : { facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
        setFaceQualityMessage('Arahkan wajah ke lingkaran panduan.');
        startDetectionLoop();
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setFaceQualityMessage('Kamera tidak dapat diakses: ' + (err?.message || 'Izin ditolak'));
      setIsCameraActive(false);
    }
  }, [facingMode, selectedDeviceId, startDetectionLoop, stopCamera]);

  // When switching to 'capture' view with camera tab, launch camera
  useEffect(() => {
    if (isOpen && viewMode === 'capture' && activeTab === 'camera' && !capturedPhoto && !isModelLoading) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isOpen, viewMode, activeTab, capturedPhoto, isModelLoading, startCamera, stopCamera]);

  // Flip camera (User <-> Environment)
  const handleFlipCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    setSelectedDeviceId('');
  };

  // Capture Photo from Video Stream
  const handleCapturePhoto = async () => {
    if (!videoRef.current || !isCameraActive || isProcessingCapture) return;

    setIsProcessingCapture(true);
    setFaceQualityMessage('Mengekstrak 128 vektor biometrik wajah...');

    try {
      const video = videoRef.current;
      const result = await extractSingleFaceDescriptor(video);

      if (!result) {
        onShowToast?.(
          'Wajah Tidak Dikenali',
          'Pastikan wajah menghadap lurus ke kamera dengan pencahayaan terang.',
          'warning'
        );
        setIsProcessingCapture(false);
        setFaceQualityMessage('Wajah tidak terdeteksi. Silakan coba lagi.');
        return;
      }

      // Draw snapshot and crop around face box
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        const box = result.detection.box;
        const margin = Math.max(box.width, box.height) * 0.35;
        const cropX = Math.max(0, box.x - margin);
        const cropY = Math.max(0, box.y - margin);
        const cropW = Math.min(video.videoWidth - cropX, box.width + margin * 2);
        const cropH = Math.min(video.videoHeight - cropY, box.height + margin * 2);

        // Mirror if user mode
        if (facingMode === 'user') {
          ctx.translate(300, 0);
          ctx.scale(-1, 1);
        }

        ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, 300, 300);
      }

      const photoUrl = canvas.toDataURL('image/jpeg', 0.85);
      const descriptorArray = Array.from(result.descriptor);

      stopCamera();
      setCapturedPhoto(photoUrl);
      setCapturedDescriptor(descriptorArray);
      setFaceQualityMessage('Wajah berhasil diekstrak dengan akurasi biometrik tinggi!');
      onShowToast?.('Wajah Terdeteksi', '128 Vektor biometrik berhasil dihasilkan.', 'success');
    } catch (err: any) {
      console.error('Error capturing face:', err);
      onShowToast?.('Gagal Ekstraksi', err?.message || 'Error pemrosesan wajah', 'error');
    } finally {
      setIsProcessingCapture(false);
    }
  };

  // Handle Upload Photo from file picker
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingCapture(true);
    setFaceQualityMessage('Membaca file foto & mengekstrak biometrik wajah...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const dataUrl = event.target?.result as string;
        const img = new Image();
        img.onload = async () => {
          const result = await extractSingleFaceDescriptor(img);
          if (!result) {
            onShowToast?.(
              'Wajah Tidak Dikenali di Foto',
              'Gunakan foto pasfoto atau foto selfie yang jelas menghadap depan.',
              'warning'
            );
            setIsProcessingCapture(false);
            return;
          }

          // Crop face avatar
          const canvas = document.createElement('canvas');
          canvas.width = 300;
          canvas.height = 300;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const box = result.detection.box;
            const margin = Math.max(box.width, box.height) * 0.35;
            const cropX = Math.max(0, box.x - margin);
            const cropY = Math.max(0, box.y - margin);
            const cropW = Math.min(img.naturalWidth - cropX, box.width + margin * 2);
            const cropH = Math.min(img.naturalHeight - cropY, box.height + margin * 2);
            ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, 300, 300);
          }

          const photoCropUrl = canvas.toDataURL('image/jpeg', 0.85);
          const descriptorArray = Array.from(result.descriptor);

          setCapturedPhoto(photoCropUrl);
          setCapturedDescriptor(descriptorArray);
          setFaceQualityMessage('Wajah berhasil diekstrak dari file foto!');
          onShowToast?.('Wajah Berhasil Diproses', 'Data biometrik siap disimpan.', 'success');
          setIsProcessingCapture(false);
        };
        img.src = dataUrl;
      } catch (err: any) {
        onShowToast?.('Error', err?.message || 'Gagal memproses gambar', 'error');
        setIsProcessingCapture(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedPhoto(null);
    setCapturedDescriptor(null);
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  // Save Face ID
  const handleSave = () => {
    if (!student || !capturedPhoto || !capturedDescriptor) return;

    cacheStudentDescriptor(student.id, capturedDescriptor);
    onSaveFace(student.id, capturedPhoto, capturedDescriptor);
    onShowToast?.('Face ID Tersimpan!', `Wajah ${student.name} siap digunakan untuk absensi otomatis.`, 'success');
    onClose();
  };

  // Execute Delete Face ID
  const handleConfirmDeleteFace = () => {
    if (!student || !onDeleteFace) return;

    removeCachedStudentDescriptor(student.id);
    onDeleteFace(student.id);
    onShowToast?.('Face ID Dihapus', `Data biometrik wajah siswa ${student.name} telah berhasil dihapus.`, 'info');
    setShowDeleteConfirm(false);
    onClose();
  };

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[94vh] sm:my-4 my-0 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        
        {/* Header (Mobile-Friendly) */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-red-950 text-white p-4 sm:p-5 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-red-600/30 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight flex items-center gap-2 truncate">
                <span>Pendaftaran Wajah (Face ID)</span>
                <span className="text-[9px] bg-red-600 text-white font-mono px-2 py-0.5 rounded-full uppercase font-bold shrink-0">
                  AI Biometrik
                </span>
              </h3>
              <p className="text-xs text-slate-300 truncate">
                {student.name} • {student.class} • NISN: {student.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white flex items-center justify-center transition shrink-0 ml-2"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* IN-APP CONFIRMATION MODAL OVERLAY FOR DELETE */}
        {showDeleteConfirm && (
          <div className="p-5 bg-red-50 border-b border-red-200 space-y-3 animate-in fade-in duration-150 shrink-0">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-sm text-red-900">
                  Hapus Face Recognition Terdaftar?
                </h4>
                <p className="text-xs text-red-800 leading-relaxed">
                  Apakah Anda yakin ingin menghapus data biometrik wajah untuk <strong>{student.name}</strong> ({student.class})?
                </p>
                <p className="text-[11px] text-red-700">
                  Setelah dihapus, siswa ini tidak dapat melakukan presensi wajah otomatis sampai didaftarkan kembali.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition active:scale-95"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteFace}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-red-600/30 transition active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus Face ID Ini
              </button>
            </div>
          </div>
        )}

        {/* VIEW MODE 1: STATUS OVERVIEW OF CURRENTLY REGISTERED FACE */}
        {viewMode === 'status' && hasExistingFace && !showDeleteConfirm && (
          <div className="p-5 space-y-5 overflow-y-auto">
            {/* Status Card */}
            <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-50 to-slate-50 border border-emerald-200 rounded-3xl p-5 text-center space-y-4">
              <div className="relative w-28 h-28 mx-auto rounded-3xl overflow-hidden border-4 border-emerald-500 shadow-lg bg-slate-950 flex items-center justify-center">
                {student.photo ? (
                  <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-white font-black text-3xl">
                    {student.name.charAt(0)}
                  </div>
                )}
                <div className="absolute top-1.5 right-1.5 bg-emerald-600 text-white rounded-full p-1 shadow">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Face ID Aktif Terdaftar
                </span>
                <h4 className="font-extrabold text-base text-slate-900">{student.name}</h4>
                <p className="text-xs text-slate-500">
                  {student.class} • Gedung {student.dorm} • NISN: {student.id}
                </p>
                {student.faceRegisteredAt && (
                  <p className="text-[11px] text-slate-400 font-mono">
                    Terdaftar: {new Date(student.faceRegisteredAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-left bg-white p-3 rounded-2xl border border-emerald-100 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Format AI</span>
                  <span className="font-extrabold text-slate-800">128 Vektor Biometrik</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Status Presensi</span>
                  <span className="font-extrabold text-emerald-700">Dapat Scan Otomatis</span>
                </div>
              </div>
            </div>

            {/* Actions for Mobile / Touch */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3.5 px-4 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 hover:text-red-700 font-extrabold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>Hapus Face Recognition Terdaftar</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('capture')}
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-amber-400" />
                <span>Ambil Ulang / Perbarui Wajah</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW MODE 2: CAPTURE / UPLOAD NEW FACE */}
        {(viewMode === 'capture' || !hasExistingFace) && !showDeleteConfirm && (
          <>
            {/* Top Bar for Switch Mode & Existing Info */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs shrink-0">
              {hasExistingFace ? (
                <button
                  type="button"
                  onClick={() => setViewMode('status')}
                  className="text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Lihat Status Wajah Saat Ini</span>
                </button>
              ) : (
                <span className="text-slate-500 font-semibold">
                  Siswa belum memiliki data wajah.
                </span>
              )}

              {hasExistingFace && onDeleteFace && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-600 hover:text-red-700 font-extrabold flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Wajah</span>
                </button>
              )}
            </div>

            {/* Tab switch between Camera & Upload */}
            {!capturedPhoto && (
              <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-600 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('camera')}
                  className={`py-2 rounded-xl flex items-center justify-center gap-2 transition ${
                    activeTab === 'camera'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  Kamera Langsung
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`py-2 rounded-xl flex items-center justify-center gap-2 transition ${
                    activeTab === 'upload'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Upload Foto
                </button>
              </div>
            )}

            {/* Body Content */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {isModelLoading ? (
                <div className="py-14 text-center space-y-3">
                  <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm font-bold text-slate-800">Memuat Model AI Pendeteksi Wajah...</p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Model neural network sedang diinisialisasi untuk akurasi tinggi di browser.
                  </p>
                </div>
              ) : modelError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    Peringatan Inisialisasi
                  </div>
                  <p>{modelError}</p>
                </div>
              ) : capturedPhoto ? (
                /* PREVIEW OF CAPTURED / UPLOADED FACE */
                <div className="space-y-4 text-center">
                  <div className="relative w-40 h-40 sm:w-44 sm:h-44 mx-auto rounded-3xl overflow-hidden border-4 border-emerald-500 shadow-xl bg-slate-950 flex items-center justify-center">
                    <img src={capturedPhoto} alt="Captured Face" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-emerald-600 text-white rounded-full p-1 shadow">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      128 Vektor Biometrik AI Berhasil Dihasilkan
                    </span>
                    <p className="text-xs text-slate-500">
                      Foto dan data vektor biometrik siap digunakan untuk pencocokan otomatis pada absensi.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={handleRetake}
                      className="py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Ambil Ulang
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      Simpan Face ID
                    </button>
                  </div>
                </div>
              ) : activeTab === 'camera' ? (
                /* CAMERA VIEWPORT */
                <div className="space-y-3">
                  <div className="relative bg-slate-950 rounded-2xl sm:rounded-3xl overflow-hidden aspect-square sm:aspect-[4/3] flex items-center justify-center border border-slate-800 shadow-inner">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${
                        facingMode === 'user' ? 'transform scale-x-[-1]' : ''
                      }`}
                    />

                    {/* Face Guide Oval */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div
                        className={`w-44 h-56 sm:w-52 sm:h-64 rounded-[48%] border-2 border-dashed transition-all duration-300 flex items-center justify-center ${
                          isFaceDetected
                            ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                            : 'border-white/50 bg-black/10'
                        }`}
                      >
                        {!isFaceDetected && (
                          <span className="text-[11px] font-bold text-white/80 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                            Posisikan Wajah Di Sini
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Overlay */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                      <span
                        className={`text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1.5 shadow-sm transition ${
                          isFaceDetected
                            ? 'bg-emerald-600/90 text-white'
                            : 'bg-black/60 text-slate-200'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isFaceDetected ? 'bg-white animate-ping' : 'bg-amber-400'
                          }`}
                        />
                        {isFaceDetected ? 'Wajah Terdeteksi Jelas' : 'Mencari Wajah...'}
                      </span>

                      {/* Camera Flip Button */}
                      <button
                        type="button"
                        onClick={handleFlipCamera}
                        className="pointer-events-auto bg-black/60 hover:bg-black/80 active:scale-95 text-white p-2.5 rounded-full backdrop-blur-md transition shadow"
                        title="Putar Kamera Depan / Belakang"
                      >
                        <SwitchCamera className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Bottom Guide Prompt */}
                    <div className="absolute bottom-3 inset-x-3 text-center pointer-events-none">
                      <p className="text-[11px] font-semibold text-white bg-black/75 py-1.5 px-3 rounded-full backdrop-blur-md inline-block shadow max-w-[90%] truncate">
                        {faceQualityMessage}
                      </p>
                    </div>
                  </div>

                  {/* Controls (Big Touch Shutter Button) */}
                  <div className="flex items-center justify-between pt-1 gap-2">
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Pencahayaan terang & hadap lurus ke kamera.
                    </p>
                    <button
                      type="button"
                      onClick={handleCapturePhoto}
                      disabled={!isCameraActive || isProcessingCapture}
                      className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-red-600/30 transition active:scale-95 shrink-0"
                    >
                      {isProcessingCapture ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Mengekstrak Wajah...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4" />
                          Ambil Foto Wajah
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* UPLOAD FILE VIEW */
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-red-500 rounded-3xl p-8 text-center cursor-pointer transition bg-slate-50 hover:bg-red-50/20 group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 group-hover:border-red-300 group-hover:text-red-600 text-slate-500 flex items-center justify-center mx-auto mb-3 shadow-sm transition">
                      <Upload className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-sm text-slate-800 mb-1">
                      Pilih Foto dari Galeri / Dokumen
                    </h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Format JPG, PNG, atau WEBP. Pastikan wajah siswa tampak jelas dari depan (seperti pasfoto).
                    </p>
                  </div>

                  {isProcessingCapture && (
                    <div className="text-center py-4 space-y-2">
                      <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs font-semibold text-slate-700">{faceQualityMessage}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Info Box */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">Face Recognition 100% On-Device:</strong> Data biometrik diproses langsung di peramban secara aman dan disinkronkan ke basis data.
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
