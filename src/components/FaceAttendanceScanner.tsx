import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  SwitchCamera,
  UserCheck,
  UserPlus,
  Clock,
  Sparkles,
  Users,
  ShieldCheck,
  Search,
  Filter,
  Check,
  X,
  Play,
  Square,
  Award,
  ChevronRight,
  Sliders,
  RefreshCw,
  Eye,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Smartphone,
  ShieldAlert,
} from 'lucide-react';
import { Student, PrayerAttendance, ClassLevel } from '../types';
import {
  loadFaceRecognitionModels,
  detectAllFacesInFrame,
  buildFaceMatcher,
  cacheStudentDescriptor,
  getCachedStudentDescriptor,
  distanceToConfidence,
  extractSingleFaceDescriptor,
  removeCachedStudentDescriptor,
} from '../services/faceRecognitionService';
import { FaceRegistrationModal } from './FaceRegistrationModal';

interface FaceAttendanceScannerProps {
  students: Student[];
  prayerAttendance: PrayerAttendance[];
  selectedDate: string;
  selectedPrayerTime: string;
  sessionCategoryFilter: 'Semua' | 'Sholat' | 'Makan' | 'Kegiatan';
  onDateChange: (date: string) => void;
  onPrayerTimeChange: (session: string) => void;
  onRecordAttendance: (student: Student, confidence: number, snapshotUrl?: string) => void;
  onSaveStudentFace: (studentId: string, photoUrl: string, descriptor: number[]) => void;
  onDeleteStudentFace?: (studentId: string) => void;
  onShowToast?: (title: string, message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  onSwitchToQrScanner?: () => void;
}

export const FaceAttendanceScanner: React.FC<FaceAttendanceScannerProps> = ({
  students,
  prayerAttendance,
  selectedDate,
  selectedPrayerTime,
  sessionCategoryFilter,
  onDateChange,
  onPrayerTimeChange,
  onRecordAttendance,
  onSaveStudentFace,
  onDeleteStudentFace,
  onShowToast,
  onSwitchToQrScanner,
}) => {
  // Mobile UI Tabs ('scanner' | 'roster' | 'manage')
  const [mobileActiveTab, setMobileActiveTab] = useState<'scanner' | 'roster' | 'manage'>('scanner');
  // Desktop Right Panel Tab ('roster' | 'manage')
  const [desktopPanelTab, setDesktopPanelTab] = useState<'roster' | 'manage'>('roster');

  // Filter for Face ID management ('all' | 'enrolled' | 'unenrolled')
  const [faceStatusFilter, setFaceStatusFilter] = useState<'all' | 'enrolled' | 'unenrolled'>('all');
  const [manageSearchQuery, setManageSearchQuery] = useState('');

  // Delete Face Confirmation State
  const [studentToDeleteFace, setStudentToDeleteFace] = useState<Student | null>(null);

  // Audio & Voice feedback state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceSpeechEnabled, setVoiceSpeechEnabled] = useState(true);

  // Video & Stream Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Camera Settings
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  // AI & Detection State
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [modelsReady, setModelsReady] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [isScanningActive, setIsScanningActive] = useState(true);
  const [detectionConfidenceThreshold, setDetectionConfidenceThreshold] = useState<number>(0.52);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  // Preloading & Enrolled Counts
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [isPreloadingDescriptors, setIsPreloadingDescriptors] = useState(false);

  // Live Scan Logs & Flash Alert
  const [lastRecognizedAlert, setLastRecognizedAlert] = useState<{
    student: Student;
    confidence: number;
    timestamp: string;
    alreadyAttended: boolean;
  } | null>(null);

  // Anti-spam cooldown (studentId -> timestamp)
  const cooldownMapRef = useRef<Map<string, number>>(new Map());

  // Registration Modal for Student Face
  const [registrationModalStudent, setRegistrationModalStudent] = useState<Student | null>(null);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);

  // Sidebar Filter & Search for Roster
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDormFilter, setSelectedDormFilter] = useState('Semua');

  // Play pleasant chime using Web Audio API
  const playSuccessChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      // Note 1: E6 (1318 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1318.5, ctx.currentTime);
      gain1.gain.setValueAtTime(0.2, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.15);

      // Note 2: B6 (1975 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1975.5, ctx.currentTime + 0.08);
      gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.08);
      osc2.stop(ctx.currentTime + 0.28);
    } catch {
      // Audio autoplay policy fallback
    }
  }, [soundEnabled]);

  // Voice Text-to-Speech Announcement
  const speakStudentName = useCallback(
    (name: string) => {
      if (!voiceSpeechEnabled || !('speechSynthesis' in window)) return;
      try {
        window.speechSynthesis.cancel();
        const firstName = name.split(' ')[0] || name;
        const utterance = new SpeechSynthesisUtterance(`Hadir, ${firstName}`);
        utterance.lang = 'id-ID';
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Speech synthesis fallback
      }
    },
    [voiceSpeechEnabled]
  );

  // Initialize face-api models
  useEffect(() => {
    let isMounted = true;
    setIsModelLoading(true);
    setModelError(null);

    loadFaceRecognitionModels()
      .then((success) => {
        if (!isMounted) return;
        if (success) {
          setModelsReady(true);
          setIsModelLoading(false);
        } else {
          setModelError('Gagal mengunduh neural network model face-api. Cek koneksi internet Anda.');
          setIsModelLoading(false);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setModelError(err?.message || 'Error initializing face recognition models');
        setIsModelLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Enumerate video input devices
  useEffect(() => {
    let mounted = true;
    navigator.mediaDevices?.enumerateDevices()
      .then((devices) => {
        if (!mounted) return;
        const cams = devices.filter((d) => d.kind === 'videoinput');
        setAvailableCameras(cams);
        if (cams.length > 0 && !selectedCameraId) {
          setSelectedCameraId(cams[0].deviceId);
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [selectedCameraId]);

  // Count enrolled students and pre-load/cache descriptors
  useEffect(() => {
    if (!modelsReady) return;

    let mounted = true;
    let count = 0;

    // Count students with existing faceDescriptor
    students.forEach((s) => {
      if (!s.faceDisabled && s.faceDescriptor && s.faceDescriptor.length === 128) {
        cacheStudentDescriptor(s.id, s.faceDescriptor);
        count++;
      } else {
        // If student does not have valid faceDescriptor or faceDisabled is true, ALWAYS evict from cache!
        removeCachedStudentDescriptor(s.id);
      }
    });

    setEnrolledCount(count);

    // Auto-extract descriptors for students with photo but no faceDescriptor and NOT faceDisabled
    const studentsNeedingExtraction = students.filter(
      (s) => !s.faceDisabled && s.photo && (!s.faceDescriptor || s.faceDescriptor.length !== 128) && !getCachedStudentDescriptor(s.id)
    );

    if (studentsNeedingExtraction.length > 0) {
      setIsPreloadingDescriptors(true);
      (async () => {
        for (const s of studentsNeedingExtraction) {
          if (!mounted) break;
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            const loadPromise = new Promise<boolean>((resolve) => {
              img.onload = () => resolve(true);
              img.onerror = () => resolve(false);
            });
            img.src = s.photo!;
            const loaded = await loadPromise;
            if (loaded && mounted) {
              const res = await extractSingleFaceDescriptor(img);
              if (res) {
                cacheStudentDescriptor(s.id, res.descriptor);
                count++;
                setEnrolledCount((prev) => prev + 1);
              }
            }
          } catch {
            // Skip unprocessable image
          }
        }
        if (mounted) {
          setIsPreloadingDescriptors(false);
        }
      })();
    }

    return () => {
      mounted = false;
    };
  }, [modelsReady, students]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Start camera stream
  const startCamera = useCallback(async () => {
    stopCamera();
    try {
      const constraints: MediaStreamConstraints = {
        video: selectedCameraId
          ? { deviceId: { exact: selectedCameraId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.error('Camera start error:', err);
      onShowToast?.('Gagal Mengakses Kamera', err?.message || 'Pastikan izin kamera diaktifkan di browser.', 'error');
      setIsCameraActive(false);
    }
  }, [facingMode, selectedCameraId, stopCamera, onShowToast]);

  // Flip camera mode
  const handleFlipFacingMode = () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    setSelectedCameraId('');
  };

  // Auto-start camera when models ready and on mobile 'scanner' view
  useEffect(() => {
    const shouldRunCamera = modelsReady && isScanningActive && (mobileActiveTab === 'scanner' || window.innerWidth >= 1024);
    if (shouldRunCamera && !isCameraActive) {
      startCamera();
    } else if (!shouldRunCamera && isCameraActive) {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [modelsReady, isScanningActive, mobileActiveTab, isCameraActive, startCamera, stopCamera]);

  // Compute session attendance map for quick status lookup
  const sessionAttendanceMap = useMemo(() => {
    const map = new Map<string, PrayerAttendance>();
    prayerAttendance.forEach((att) => {
      if (att.date === selectedDate && att.prayerTime === selectedPrayerTime) {
        map.set(String(att.studentId).trim(), att);
      }
    });
    return map;
  }, [prayerAttendance, selectedDate, selectedPrayerTime]);

  // Recognition and Rendering Loop
  useEffect(() => {
    if (!modelsReady || !isCameraActive || !isScanningActive) return;

    let animId: number;
    let isProcessingFrame = false;

    const faceMatcher = buildFaceMatcher(students, detectionConfidenceThreshold);

    const processFrame = async () => {
      if (!videoRef.current || !canvasRef.current || videoRef.current.paused || videoRef.current.ended) {
        animId = requestAnimationFrame(processFrame);
        return;
      }

      if (isProcessingFrame) {
        animId = requestAnimationFrame(processFrame);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        animId = requestAnimationFrame(processFrame);
        return;
      }

      // Synchronize canvas size
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(processFrame);
        return;
      }

      isProcessingFrame = true;

      try {
        const detections = await detectAllFacesInFrame(video);

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const now = Date.now();

        for (const d of detections) {
          const box = d.detection.box;
          let studentMatch: Student | null = null;
          let confidencePercent = 0;
          let matchDistance = 1.0;

          if (faceMatcher) {
            const bestMatch = faceMatcher.findBestMatch(d.descriptor);
            if (bestMatch.label !== 'unknown') {
              studentMatch = students.find((s) => String(s.id).trim() === bestMatch.label) || null;
              matchDistance = bestMatch.distance;
              confidencePercent = distanceToConfidence(matchDistance, detectionConfidenceThreshold);
            }
          }

          // Visual Coordinates
          const x = box.x;
          const y = box.y;
          const w = box.width;
          const h = box.height;

          const isRecognized = !!studentMatch && confidencePercent >= 50;

          // Box Style
          const primaryColor = isRecognized ? '#10b981' : '#f59e0b';
          const cornerLength = Math.min(w, h) * 0.22;

          ctx.save();
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = primaryColor;
          ctx.fillStyle = primaryColor;

          // Draw HUD Corner Brackets
          ctx.beginPath();
          // Top Left
          ctx.moveTo(x, y + cornerLength);
          ctx.lineTo(x, y);
          ctx.lineTo(x + cornerLength, y);
          // Top Right
          ctx.moveTo(x + w - cornerLength, y);
          ctx.lineTo(x + w, y);
          ctx.lineTo(x + w, y + cornerLength);
          // Bottom Right
          ctx.moveTo(x + w, y + h - cornerLength);
          ctx.lineTo(x + w, y + h);
          ctx.lineTo(x + w - cornerLength, y + h);
          // Bottom Left
          ctx.moveTo(x + cornerLength, y + h);
          ctx.lineTo(x, y + h);
          ctx.lineTo(x, y + h - cornerLength);
          ctx.stroke();

          // Subtle glowing background
          ctx.fillStyle = isRecognized ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.08)';
          ctx.fillRect(x, y, w, h);

          // HUD Label Box
          const labelText = isRecognized
            ? `${studentMatch?.name} (${confidencePercent}%)`
            : 'Mencocokkan Wajah...';

          ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
          const textWidth = ctx.measureText(labelText).width;
          const labelPadding = 8;
          const labelHeight = 24;
          const labelY = Math.max(0, y - labelHeight - 6);

          // Label Background Pill
          ctx.fillStyle = primaryColor;
          ctx.beginPath();
          ctx.roundRect(x, labelY, textWidth + labelPadding * 2, labelHeight, 6);
          ctx.fill();

          // Label Text
          ctx.fillStyle = '#ffffff';
          ctx.fillText(labelText, x + labelPadding, labelY + 17);

          ctx.restore();

          // If recognized and not on cooldown, record attendance!
          if (isRecognized && studentMatch) {
            const lastCheckin = cooldownMapRef.current.get(studentMatch.id) || 0;
            const cooldownPeriod = 8000; // 8 seconds cooldown per student

            if (now - lastCheckin > cooldownPeriod) {
              cooldownMapRef.current.set(studentMatch.id, now);

              const nowTime = new Date().toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              });

              const isAlreadyAttended = sessionAttendanceMap.has(String(studentMatch.id).trim());

              setLastRecognizedAlert({
                student: studentMatch,
                confidence: confidencePercent,
                timestamp: nowTime,
                alreadyAttended: isAlreadyAttended,
              });

              if (!isAlreadyAttended) {
                // Audio & Speech
                playSuccessChime();
                speakStudentName(studentMatch.name);

                // Capture snapshot for audit trail
                let snapshotUrl: string | undefined = undefined;
                try {
                  const snapCanvas = document.createElement('canvas');
                  snapCanvas.width = 160;
                  snapCanvas.height = 160;
                  const sCtx = snapCanvas.getContext('2d');
                  if (sCtx) {
                    sCtx.drawImage(video, 0, 0, 160, 160);
                    snapshotUrl = snapCanvas.toDataURL('image/jpeg', 0.6);
                  }
                } catch {
                  // Fallback without snapshot
                }

                onRecordAttendance(studentMatch, confidencePercent, snapshotUrl);
                onShowToast?.(
                  'Hadir: ' + studentMatch.name,
                  `Wajah terverifikasi (${confidencePercent}%). Sesi ${selectedPrayerTime} tercatat.`,
                  'success'
                );
              } else {
                playSuccessChime();
                onShowToast?.(
                  'Sudah Hadir',
                  `${studentMatch.name} sudah tercatat hadir pada sesi ${selectedPrayerTime}.`,
                  'info'
                );
              }
            }
          }
        }
      } catch (err) {
        console.error('Frame detection error:', err);
      } finally {
        isProcessingFrame = false;
        animId = requestAnimationFrame(processFrame);
      }
    };

    animId = requestAnimationFrame(processFrame);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [
    modelsReady,
    isCameraActive,
    isScanningActive,
    students,
    detectionConfidenceThreshold,
    sessionAttendanceMap,
    selectedPrayerTime,
    playSuccessChime,
    speakStudentName,
    onRecordAttendance,
    onShowToast,
  ]);

  // Execute Face Deletion
  const handleConfirmDeleteFace = () => {
    if (!studentToDeleteFace) return;

    removeCachedStudentDescriptor(studentToDeleteFace.id);

    if (onDeleteStudentFace) {
      onDeleteStudentFace(studentToDeleteFace.id);
    }

    onShowToast?.(
      'Face ID Dihapus',
      `Data biometrik wajah siswa ${studentToDeleteFace.name} berhasil dihapus dari sistem.`,
      'info'
    );

    setStudentToDeleteFace(null);
  };

  // Dorm options
  const dormOptions = useMemo(() => {
    const list = Array.from(new Set(students.map((s) => s.dorm).filter(Boolean)));
    return list.sort();
  }, [students]);

  // Filtered students for Roster List
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return students.filter((s) => {
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.rfidTag && s.rfidTag.toLowerCase().includes(q));
      const matchDorm = selectedDormFilter === 'Semua' || s.dorm === selectedDormFilter;
      return matchSearch && matchDorm;
    });
  }, [students, searchQuery, selectedDormFilter]);

  // Filtered students for Face ID Management
  const filteredManageStudents = useMemo(() => {
    const q = manageSearchQuery.toLowerCase().trim();
    return students.filter((s) => {
      const hasFace = !s.faceDisabled && !!(s.faceDescriptor && s.faceDescriptor.length === 128);
      
      if (faceStatusFilter === 'enrolled' && !hasFace) return false;
      if (faceStatusFilter === 'unenrolled' && hasFace) return false;

      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.class.toLowerCase().includes(q) ||
        s.dorm.toLowerCase().includes(q)
      );
    });
  }, [students, manageSearchQuery, faceStatusFilter]);

  // Attendance rate stats
  const totalStudents = students.length;
  const attendedCount = sessionAttendanceMap.size;
  const attendanceRate = totalStudents > 0 ? Math.round((attendedCount / totalStudents) * 100) : 0;
  const unenrolledCount = Math.max(0, totalStudents - enrolledCount);

  return (
    <div className="space-y-4">
      {/* Top Banner / Session Info Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 text-white rounded-3xl p-4 sm:p-6 shadow-xl border border-slate-700/60 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-red-600/30 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white flex items-center gap-2 flex-wrap">
                Presensi Wajah AI
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-wider">
                  Real-Time Biometrik
                </span>
              </h2>
              <p className="text-xs text-slate-400 hidden sm:block">
                Pengenal wajah on-device otomatis. Siswa cukup berdiri di depan kamera.
              </p>
            </div>
          </div>
        </div>

        {/* Quick controls bar */}
        <div className="flex flex-wrap items-center gap-2 relative z-10 w-full sm:w-auto justify-between sm:justify-end">
          {/* QR Scanner switch */}
          {onSwitchToQrScanner && (
            <button
              type="button"
              onClick={onSwitchToQrScanner}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Scanner QR / RFID</span>
              <span className="sm:hidden">Mode QR</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition active:scale-95 ${
              soundEnabled
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title={soundEnabled ? 'Suara Chime Aktif' : 'Suara Dimatikan'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Voice Announcer Toggle */}
          <button
            type="button"
            onClick={() => setVoiceSpeechEnabled(!voiceSpeechEnabled)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 active:scale-95 ${
              voiceSpeechEnabled
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="Penyebutan nama siswa lewat Text-to-Speech"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{voiceSpeechEnabled ? 'Suara Nama: ON' : 'Suara Nama: OFF'}</span>
            <span className="sm:hidden">{voiceSpeechEnabled ? 'Suara ON' : 'Suara OFF'}</span>
          </button>

          {/* Settings Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition active:scale-95"
            title="Pengaturan Sensitivitas Kamera & AI"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MOBILE SEGMENTED BAR (Special Mobile View Selector) */}
      <div className="lg:hidden bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-3 gap-1 text-xs font-extrabold">
        <button
          type="button"
          onClick={() => setMobileActiveTab('scanner')}
          className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 ${
            mobileActiveTab === 'scanner'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Camera className="w-4 h-4 text-emerald-400" />
          <span>Kamera</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileActiveTab('roster')}
          className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 ${
            mobileActiveTab === 'roster'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4 text-blue-400" />
          <span>Presensi ({attendedCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileActiveTab('manage')}
          className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 ${
            mobileActiveTab === 'manage'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-300" />
          <span>Kelola Face ({enrolledCount})</span>
        </button>
      </div>

      {/* Session & Date Selector Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex-1 sm:flex-none min-w-[140px]">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Tanggal Presensi
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
          </div>

          <div className="flex-1 sm:flex-none min-w-[150px]">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Sesi Kegiatan / Sholat
            </label>
            <select
              value={selectedPrayerTime}
              onChange={(e) => onPrayerTimeChange(e.target.value)}
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            >
              <optgroup label="Sesi Sholat Berjamaah">
                <option value="Subuh">Sholat Subuh</option>
                <option value="Dzuhur">Sholat Dzuhur</option>
                <option value="Ashar">Sholat Ashar</option>
                <option value="Maghrib">Sholat Maghrib</option>
                <option value="Isya">Sholat Isya</option>
              </optgroup>
              <optgroup label="Sesi Makan Bersama">
                <option value="Sarapan Pagi">Sarapan Pagi</option>
                <option value="Makan Siang">Makan Siang</option>
                <option value="Makan Malam">Makan Malam</option>
                <option value="Sahur">Sahur (Puasa)</option>
                <option value="Buka Puasa">Buka Puasa</option>
              </optgroup>
              <optgroup label="Kegiatan & Asrama">
                <option value="Apel / Baris Asrama">Apel / Baris Asrama</option>
                <option value="Kajian / Kegiatan">Kajian Malam / Majelis</option>
                <option value="Kebersihan / Ro'an">Piket Bersama (Ro'an)</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Live Attendance Counter Pill */}
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 bg-slate-50 rounded-2xl p-2 px-3 sm:px-4 border border-slate-100">
          <div className="text-right">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Tercatat Hadir
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900">
              {attendedCount} <span className="text-xs font-bold text-slate-400">/ {totalStudents}</span>
            </div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-black text-xs sm:text-sm">
            {attendanceRate}%
          </div>
          <div className="border-l border-slate-200 pl-3 sm:pl-4">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Face ID
            </div>
            <div className="text-xs sm:text-sm font-extrabold text-blue-600 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {enrolledCount} Siswa
            </div>
          </div>
        </div>
      </div>

      {/* Settings Drawer (Foldable) */}
      {showSettingsDrawer && (
        <div className="bg-slate-800 text-white p-4 sm:p-5 rounded-3xl border border-slate-700 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h4 className="font-extrabold text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-red-400" />
              Konfigurasi AI Face Recognition & Kamera
            </h4>
            <button
              onClick={() => setShowSettingsDrawer(false)}
              className="text-slate-400 hover:text-white transition p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Camera Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Pilih Kamera Aktif
              </label>
              <select
                value={selectedCameraId}
                onChange={(e) => {
                  setSelectedCameraId(e.target.value);
                  setTimeout(() => startCamera(), 100);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-red-500/40"
              >
                {availableCameras.map((cam, idx) => (
                  <option key={cam.deviceId || idx} value={cam.deviceId}>
                    {cam.label || `Kamera ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Threshold Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Tingkat Ketelitian AI
                </label>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  {Math.round((1 - detectionConfidenceThreshold / 0.8) * 100)}% Presisi
                </span>
              </div>
              <input
                type="range"
                min="0.40"
                max="0.65"
                step="0.02"
                value={detectionConfidenceThreshold}
                onChange={(e) => setDetectionConfidenceThreshold(parseFloat(e.target.value))}
                className="w-full accent-red-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                <span>Ketat (Akurasi Tinggi)</span>
                <span>Standar</span>
                <span>Cepat</span>
              </div>
            </div>

            {/* Manual Camera Flip & Restart */}
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={handleFlipFacingMode}
                className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95"
              >
                <SwitchCamera className="w-4 h-4" />
                Putar Kamera ({facingMode === 'user' ? 'Depan' : 'Belakang'})
              </button>
              <button
                type="button"
                onClick={startCamera}
                className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition active:scale-95"
                title="Restart Kamera"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT SECTION: Video Viewport (Col 7 on desktop, or active on mobile) */}
        <div className={`lg:col-span-7 space-y-4 ${mobileActiveTab !== 'scanner' ? 'hidden lg:block' : 'block'}`}>
          <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl relative aspect-square sm:aspect-[4/3] flex items-center justify-center">
            {isModelLoading ? (
              <div className="text-center p-6 space-y-3 z-20">
                <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <h4 className="text-white font-extrabold text-sm sm:text-base">Menyiapkan Engine AI Pengenal Wajah...</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Neural network TinyFace & 128-d Recognition sedang diinisialisasi untuk pemindaian instan di browser.
                </p>
              </div>
            ) : modelError ? (
              <div className="text-center p-6 space-y-3 z-20 text-red-400 max-w-sm">
                <AlertCircle className="w-10 h-10 mx-auto text-red-500" />
                <h4 className="font-extrabold text-base">Model AI Gagal Dimuat</h4>
                <p className="text-xs text-slate-300">{modelError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold mt-2"
                >
                  Muat Ulang Halaman
                </button>
              </div>
            ) : (
              <>
                {/* Live Video Feed */}
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    facingMode === 'user' ? 'transform scale-x-[-1]' : ''
                  }`}
                />

                {/* Face Tracker Overlay Canvas */}
                <canvas
                  ref={canvasRef}
                  className={`absolute inset-0 w-full h-full pointer-events-none ${
                    facingMode === 'user' ? 'transform scale-x-[-1]' : ''
                  }`}
                />

                {/* Scanning Laser Line Effect */}
                {isScanningActive && (
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_15px_#ef4444] animate-pulse pointer-events-none opacity-60" />
                )}

                {/* Top Overlay HUD Badge */}
                <div className="absolute top-3 inset-x-3 sm:top-4 sm:inset-x-4 flex items-center justify-between pointer-events-none z-10">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="bg-slate-900/85 backdrop-blur-md text-white border border-white/10 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-extrabold flex items-center gap-1.5 shadow">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      LIVE AI SCANNER
                    </span>
                    {isPreloadingDescriptors && (
                      <span className="bg-blue-900/85 backdrop-blur-md text-blue-200 border border-blue-400/20 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Sinkronisasi Foto...
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pointer-events-auto">
                    {/* Quick Flip Camera Button for Mobile view */}
                    <button
                      type="button"
                      onClick={handleFlipFacingMode}
                      className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition active:scale-95 shadow"
                      title="Ganti Kamera Depan / Belakang"
                    >
                      <SwitchCamera className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsScanningActive(!isScanningActive)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border transition flex items-center gap-1.5 shadow active:scale-95 ${
                        isScanningActive
                          ? 'bg-red-600/80 hover:bg-red-600 text-white border-red-500/40'
                          : 'bg-emerald-600/80 hover:bg-emerald-600 text-white border-emerald-500/40'
                      }`}
                    >
                      {isScanningActive ? (
                        <>
                          <Square className="w-3 h-3 fill-white" /> Jeda
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-white" /> Mulai
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Guidance Bottom Pill */}
                <div className="absolute bottom-3 inset-x-3 sm:bottom-4 sm:inset-x-4 text-center pointer-events-none z-10">
                  <p className="bg-slate-900/85 backdrop-blur-md text-slate-200 border border-white/10 text-[11px] sm:text-xs font-semibold py-1.5 px-3 rounded-full inline-block shadow max-w-[95%] truncate">
                    💡 Posisikan wajah menghadap kamera • Sistem otomatis merekam kehadiran
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Flash Alert Banner when student is recognized */}
          {lastRecognizedAlert && (
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-3.5 sm:p-4 rounded-2xl shadow-lg border border-emerald-400/30 flex items-center justify-between gap-3 animate-in slide-in-from-top-3 duration-200">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-white/20 border border-white/30 overflow-hidden flex items-center justify-center shrink-0">
                  {lastRecognizedAlert.student.photo ? (
                    <img
                      src={lastRecognizedAlert.student.photo}
                      alt={lastRecognizedAlert.student.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCheck className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm sm:text-base leading-tight truncate">
                      {lastRecognizedAlert.student.name}
                    </h4>
                    <span className="bg-white/20 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0">
                      {lastRecognizedAlert.confidence}%
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100 truncate">
                    {lastRecognizedAlert.student.class} • {lastRecognizedAlert.student.dorm} • Pukul {lastRecognizedAlert.timestamp}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="bg-white text-emerald-800 text-xs font-black px-2.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  HADIR
                </span>
              </div>
            </div>
          )}

          {/* Quick Enrolled vs Unenrolled Info */}
          <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <Users className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                <strong>{enrolledCount}</strong> dari <strong>{totalStudents}</strong> siswa memiliki data biometrik wajah.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileActiveTab('manage');
                  setDesktopPanelTab('manage');
                }}
                className="font-bold text-red-600 hover:text-red-700 flex items-center gap-1 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Kelola / Hapus Face ID
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION: Panel with Roster & Face ID Management Tabs (Col 5) */}
        <div className={`lg:col-span-5 space-y-4 ${mobileActiveTab === 'scanner' ? 'hidden lg:block' : 'block'}`}>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
            
            {/* Desktop Panel Header Switcher */}
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl w-full">
                <button
                  type="button"
                  onClick={() => {
                    setDesktopPanelTab('roster');
                    setMobileActiveTab('roster');
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    (desktopPanelTab === 'roster' && mobileActiveTab !== 'manage') || mobileActiveTab === 'roster'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-red-600" />
                  <span>Presensi ({attendedCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDesktopPanelTab('manage');
                    setMobileActiveTab('manage');
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    (desktopPanelTab === 'manage' && mobileActiveTab !== 'roster') || mobileActiveTab === 'manage'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Kelola Face ID ({enrolledCount})</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT A: PRESENSI LOG ROSTER */}
            {((desktopPanelTab === 'roster' && mobileActiveTab !== 'manage') || mobileActiveTab === 'roster') ? (
              <>
                {/* Search & Filter Header */}
                <div className="p-3 border-b border-slate-100 bg-white space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari siswa..."
                        className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      />
                    </div>
                    <select
                      value={selectedDormFilter}
                      onChange={(e) => setSelectedDormFilter(e.target.value)}
                      className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    >
                      <option value="Semua">Semua Asrama</option>
                      {dormOptions.map((dorm) => (
                        <option key={dorm} value={dorm}>
                          {dorm}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Attendance Roster Scrollable Body */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
                  {filteredStudents.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      Tidak ada siswa yang sesuai pencarian.
                    </div>
                  ) : (
                    filteredStudents.map((s) => {
                      const att = sessionAttendanceMap.get(String(s.id).trim());
                      const isAttended = !!att;
                      const hasFaceId = !s.faceDisabled && !!(s.faceDescriptor && s.faceDescriptor.length === 128);

                      return (
                        <div
                          key={s.id}
                          className={`p-2.5 rounded-2xl flex items-center justify-between gap-2.5 transition ${
                            isAttended ? 'bg-emerald-50/60 border border-emerald-100/80' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Student Avatar */}
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs relative">
                              {s.photo ? (
                                <img src={s.photo} alt={s.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-slate-200 text-slate-700 flex items-center justify-center font-black">
                                  {s.name.charAt(0)}
                                </div>
                              )}

                              {/* Face ID registered micro badge */}
                              {hasFaceId && (
                                <div
                                  className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-blue-600 rounded-tl-md flex items-center justify-center text-[8px] text-white font-bold"
                                  title="Face ID Aktif"
                                >
                                  ✓
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <h4 className="font-bold text-xs text-slate-800 truncate leading-snug">
                                {s.name}
                              </h4>
                              <p className="text-[11px] text-slate-400 truncate">
                                {s.class} • {s.dorm}
                              </p>
                            </div>
                          </div>

                          {/* Right Status / Action */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isAttended ? (
                              <div className="text-right">
                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Hadir
                                </span>
                                <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
                                  {att.timestamp}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                {/* If unenrolled, button to enroll */}
                                {!hasFaceId ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRegistrationModalStudent(s);
                                      setIsRegistrationOpen(true);
                                    }}
                                    className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-[10px] font-bold flex items-center gap-1 transition active:scale-95"
                                    title="Daftarkan Wajah Siswa"
                                  >
                                    <Camera className="w-3 h-3" />
                                    <span className="hidden sm:inline">Daftar Face</span>
                                  </button>
                                ) : (
                                  /* If enrolled, quick action to delete face */
                                  <button
                                    type="button"
                                    onClick={() => setStudentToDeleteFace(s)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition active:scale-95"
                                    title="Hapus Face ID Siswa Ini"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Manual Mark Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    onRecordAttendance(s, 100);
                                    playSuccessChime();
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-600 text-[10px] font-bold transition active:scale-95"
                                  title="Tandai Hadir Manual"
                                >
                                  + Hadir
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              /* TAB CONTENT B: KELOLA & HAPUS FACE ID MANAGEMENT */
              <div className="flex flex-col h-full overflow-hidden">
                {/* Search & Status Filters */}
                <div className="p-3 border-b border-slate-100 bg-white space-y-2.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={manageSearchQuery}
                      onChange={(e) => setManageSearchQuery(e.target.value)}
                      placeholder="Cari siswa untuk kelola / hapus Face ID..."
                      className="w-full pl-8 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setFaceStatusFilter('all')}
                      className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                        faceStatusFilter === 'all'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Semua ({students.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFaceStatusFilter('enrolled')}
                      className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                        faceStatusFilter === 'enrolled'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      }`}
                    >
                      Sudah Face ID ({enrolledCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFaceStatusFilter('unenrolled')}
                      className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                        faceStatusFilter === 'unenrolled'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      Belum Face ID ({unenrolledCount})
                    </button>
                  </div>
                </div>

                {/* List of Students for Face Management */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
                  {filteredManageStudents.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs space-y-1">
                      <p>Tidak ada siswa ditemukan.</p>
                      {faceStatusFilter === 'enrolled' && (
                        <p className="text-[11px] text-slate-400">Belum ada siswa yang didaftarkan Face ID.</p>
                      )}
                    </div>
                  ) : (
                    filteredManageStudents.map((s) => {
                      const hasFaceId = !s.faceDisabled && !!(s.faceDescriptor && s.faceDescriptor.length === 128);

                      return (
                        <div
                          key={s.id}
                          className="p-3 rounded-2xl border border-slate-100 hover:border-slate-200 bg-white flex items-center justify-between gap-3 transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Avatar */}
                            <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-sm relative">
                              {s.photo ? (
                                <img src={s.photo} alt={s.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-slate-200 text-slate-700 flex items-center justify-center font-black">
                                  {s.name.charAt(0)}
                                </div>
                              )}

                              {hasFaceId && (
                                <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white" />
                              )}
                            </div>

                            <div className="min-w-0 space-y-0.5">
                              <h4 className="font-extrabold text-xs text-slate-900 truncate">
                                {s.name}
                              </h4>
                              <p className="text-[11px] text-slate-500 truncate">
                                {s.class} • Gedung {s.dorm} • NISN: {s.id}
                              </p>
                              <div>
                                {hasFaceId ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                    Face ID Aktif
                                  </span>
                                ) : (
                                  <span className="inline-block text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                    Belum Terdaftar
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons: Delete Face / Re-register / Register */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {hasFaceId ? (
                              <>
                                {/* TOMBOL HAPUS FACE RECOGNITION TERDAFTAR */}
                                <button
                                  type="button"
                                  onClick={() => setStudentToDeleteFace(s)}
                                  className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 active:scale-95 text-red-600 border border-red-200 text-xs font-extrabold flex items-center gap-1 transition cursor-pointer"
                                  title="Hapus data biometrik wajah siswa ini"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                  <span>Hapus</span>
                                </button>

                                {/* UBAH / PERBARUI WAJAH */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRegistrationModalStudent(s);
                                    setIsRegistrationOpen(true);
                                  }}
                                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition active:scale-95 cursor-pointer"
                                  title="Lihat / Perbarui Foto Wajah"
                                >
                                  <Camera className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              /* DAFTAR FACE ID BARU */
                              <button
                                type="button"
                                onClick={() => {
                                  setRegistrationModalStudent(s);
                                  setIsRegistrationOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Daftar</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL / DIALOG IN-APP KONFIRMASI HAPUS FACE RECOGNITION TERDAFTAR */}
      {studentToDeleteFace && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-base text-slate-900 leading-snug">
                  Hapus Face Recognition Terdaftar?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Apakah Anda yakin ingin menghapus data biometrik wajah untuk siswa:
                </p>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-2">
                  <p className="font-extrabold text-sm text-slate-800">{studentToDeleteFace.name}</p>
                  <p className="text-xs text-slate-500">Kelas {studentToDeleteFace.class} • Gedung {studentToDeleteFace.dorm} • NISN: {studentToDeleteFace.id}</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-red-50/70 rounded-xl border border-red-100 text-[11px] text-red-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>
                128-Vektor biometrik AI akan dihapus dari cache lokal dan Google Sheet. Siswa tidak dapat absen otomatis via kamera hingga wajah didaftarkan ulang.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStudentToDeleteFace(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteFace}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-red-600/30 transition active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                Ya, Hapus Face ID Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Face Registration Modal */}
      {isRegistrationOpen && registrationModalStudent && (
        <FaceRegistrationModal
          student={registrationModalStudent}
          isOpen={isRegistrationOpen}
          onClose={() => {
            setIsRegistrationOpen(false);
            setRegistrationModalStudent(null);
          }}
          onSaveFace={(studentId, photoDataUrl, descriptor) => {
            onSaveStudentFace(studentId, photoDataUrl, descriptor);
            setIsRegistrationOpen(false);
            setRegistrationModalStudent(null);
            setTimeout(() => startCamera(), 200);
          }}
          onDeleteFace={(studentId) => {
            if (onDeleteStudentFace) {
              onDeleteStudentFace(studentId);
            }
            setIsRegistrationOpen(false);
            setRegistrationModalStudent(null);
          }}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
};
