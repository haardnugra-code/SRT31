export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT BACKEND & PENYIMPANAN GOOGLE DRIVE OTOMATIS
 * SEKOLAH RAKYAT 31 PALEMBANG - SISTEM INFORMASI KEASRAMAAN & BK TERPADU
 * ==============================================================================
 * 
 * 🚀 PETUNJUK INSTALASI & PENGGUNAAN CEPAT:
 * 
 * 1. Buka Google Sheet baru Anda di Google Drive (drive.google.com).
 *    (Beri nama: "DATABASE SISTEM KEASRAMAAN SEKOLAH RAKYAT 31")
 * 2. Klik menu "Ekstensi" (Extensions) -> "Apps Script".
 * 3. Hapus semua kode bawaan di editor Apps Script.
 * 4. Salin (Copy) & Tempel (Paste) SELURUH KODE di bawah ini ke editor Apps Script.
 * 5. Klik ikon Simpan (Save) 💾.
 * 6. Jalankan fungsi "setupSheet" untuk pertama kali:
 *    - Pilih fungsi 'setupSheet' pada dropdown di atas editor.
 *    - Klik tombol 'Jalankan' / 'Run'.
 *    - Berikan izin otorisasi Google (Review Permissions -> Pilih Akun -> Advanced -> Go to Untitled project).
 *    - Seluruh 10 Sheet database resmi & 5 Struktur Folder Google Drive dibuat OTOMATIS!
 * 7. Terapkan sebagai Aplikasi Web (Deploy as Web App):
 *    - Klik tombol "Terapkan" (Deploy) di kanan atas -> "Penerapan baru" (New deployment).
 *    - Pilih jenis: "Aplikasi web" (Web app).
 *    - Deskripsi: Backend Keasramaan & Drive Storage SR31.
 *    - Jalankan sebagai (Execute as): "Saya" (Me).
 *    - Yang memiliki akses (Who has access): "Siapa saja" (Anyone) -> (PENTING untuk sinkronisasi Web).
 *    - Klik "Terapkan" (Deploy), lalu salin URL Web App yang berakhiran "/exec".
 * 8. Masukkan URL tersebut ke menu "Pengaturan" pada Aplikasi Web Sekolah Rakyat.
 * ==============================================================================
 */

// ==============================================================================
// 1. HTTP REQUEST ROUTER (GET & POST)
// ==============================================================================

function doGet(e) {
  try {
    var action = e && e.parameter ? e.parameter.action : '';
    
    if (action === 'ping') {
      return responseJSON({ 
        status: 'success', 
        message: 'Google Apps Script Backend & Drive Storage Aktif & Siap Digunakan.',
        timestamp: new Date().toISOString() 
      });
    }
    
    if (action === 'setupSheet' || action === 'setupSheets') {
      var setupRes = setupSheet();
      return responseJSON(setupRes);
    }

    if (action === 'backupDrive' || action === 'backupData') {
      var backupRes = autoBackupToDrive();
      return responseJSON(backupRes);
    }

    if (action === 'setupDriveFolders') {
      var folderRes = createSystemDriveFolders();
      return responseJSON(folderRes);
    }

    if (action === 'cleanShadowData') {
      var cleanRes = cleanShadowData();
      return responseJSON(cleanRes);
    }
    
    if (action === 'fetchData' || action === 'getAllData' || !action) {
      return responseJSON(getAllData());
    }
    
    return responseJSON({ 
      status: 'success', 
      message: 'Sistem Keasramaan Sekolah Rakyat 31 Palembang Active.',
      availableActions: ['ping', 'setupSheet', 'backupDrive', 'setupDriveFolders', 'cleanShadowData', 'fetchData']
    });
  } catch (err) {
    return responseJSON({ status: 'error', message: err.toString() });
  }
}

function doPost(e) {
  try {
    var contents = e.postData ? e.postData.contents : '{}';
    var payload = JSON.parse(contents);
    var action = payload.action;
    var data = payload.data || {};
    
    if (action === 'ping') {
      return responseJSON({ status: 'success', message: 'Koneksi Web App Google Apps Script Terverifikasi!' });
    }
    
    if (action === 'setupSheet' || action === 'setupSheets') {
      var sRes = setupSheet();
      return responseJSON(sRes);
    }

    if (action === 'backupDrive' || action === 'backupData') {
      var bRes = autoBackupToDrive();
      return responseJSON(bRes);
    }

    if (action === 'cleanShadowData') {
      var cRes = cleanShadowData();
      return responseJSON(cRes);
    }

    // --- FITUR UPLOAD FILE LANGSUNG KE GOOGLE DRIVE ---
    if (action === 'uploadFile' || action === 'uploadDrive') {
      var uploadRes = uploadFileToDrive(data);
      return responseJSON(uploadRes);
    }
    
    // 1. DATA SISWA CRUD (STUDENTS)
    if (action === 'addStudent' || action === 'updateStudent') {
      saveOrUpdateRow('Students', 0, data.id, [
        data.id,
        data.name,
        data.class || 'SD',
        data.dorm || 'Asrama Terpadu',
        data.caretaker || '',
        data.rfidTag || '',
        data.height || '',
        data.weight || '',
        data.shirtSize || '',
        data.pantsSize || '',
        data.photo || '',
        data.gender || '',
        data.parentPhone || '',
        data.bloodType || '',
        data.medicalHistory || '',
        data.specialNeeds || '',
        new Date().toISOString()
      ]);
      return responseJSON({ status: 'success', message: 'Data siswa & profil tersimpan ke Sheet Students.' });
    }
    if (action === 'deleteStudent') {
      deleteRowById('Students', 0, data.id);
      return responseJSON({ status: 'success', message: 'Data siswa berhasil dihapus.' });
    }
    
    // 2. PELANGGARAN & DISIPLIN (VIOLATIONS)
    if (action === 'addViolation' || action === 'updateViolation') {
      saveOrUpdateRow('Violations', 0, data.id, [
        data.id,
        data.date,
        data.studentId,
        data.studentName,
        data.level || 1,
        data.violation || '',
        data.sanction || '',
        data.note || '',
        data.reporter || '',
        data.photo || '',
        data.semester || 'Genap',
        data.academicYear || '2025/2026',
        data.location || 'Asrama',
        data.status || 'Tercatat',
        new Date().toISOString()
      ]);
      return responseJSON({ status: 'success', message: 'Catatan pelanggaran tersimpan ke Sheet Violations.' });
    }
    if (action === 'deleteViolation') {
      deleteRowById('Violations', 0, data.id);
      return responseJSON({ status: 'success', message: 'Catatan pelanggaran dihapus.' });
    }
    
    // 3. BIMBINGAN & KONSELING BK LENGKAP (COUNSELING)
    if (action === 'addCounseling' || action === 'updateCounseling') {
      saveOrUpdateRow('Counseling', 0, data.id, [
        data.id,
        data.date,
        data.time || '14:00 - 15:00 WIB',
        data.studentId,
        data.studentName,
        data.sessionNumber || 1,
        data.location || 'Ruang Bimbingan & Konseling (BK)',
        data.counselor || '',
        data.counselorNip || '',
        data.accompanyingPerson || '',
        data.counselingType || 'Konseling Individu',
        data.counselingField || 'Pribadi',
        data.urgencyLevel || 'Rutin',
        data.confidentiality || 'Rahasia',
        data.caseDescription || '',
        data.backgroundAnalysis || '',
        data.counselingApproach || '',
        data.studentObservation || '',
        data.notes || '',
        data.studentCommitment || '',
        data.followUp || '',
        data.targetReviewDate || '',
        data.recommendations || '',
        data.status || 'Open',
        data.referralDetails || '',
        new Date().toISOString()
      ]);
      return responseJSON({ status: 'success', message: 'Data konseling BK komprehensif tersimpan ke Sheet Counseling.' });
    }
    if (action === 'deleteCounseling') {
      deleteRowById('Counseling', 0, data.id);
      return responseJSON({ status: 'success', message: 'Data konseling BK dihapus.' });
    }
    
    // 4. SURAT IZIN KELUAR ASRAMA (LEAVES)
    if (action === 'addLeave' || action === 'updateLeave') {
      saveOrUpdateRow('Leaves', 0, data.id, [
        data.id,
        data.studentId,
        data.studentName,
        data.type || 'Reguler',
        data.reason || '',
        data.leaveDate || '',
        data.returnDate || '',
        data.caretaker || '',
        data.status || 'Active',
        data.category || 'Izin Keluar Sementara',
        data.leaveTime || '',
        data.returnTime || '',
        data.letterNumber || '',
        data.destinationAddress || '',
        data.parentContact || '',
        data.pickupPerson || '',
        new Date().toISOString()
      ]);
      return responseJSON({ status: 'success', message: 'Surat izin kepulangan tersimpan ke Sheet Leaves.' });
    }
    if (action === 'deleteLeave') {
      deleteRowById('Leaves', 0, data.id);
      return responseJSON({ status: 'success', message: 'Surat izin kepulangan dihapus.' });
    }
    
    // 5. JURNAL HARIAN & IBADAH (DAILY JOURNALS)
    if (action === 'addJournal' || action === 'updateJournal') {
      saveOrUpdateRow('DailyJournals', 0, data.id, [
        data.id,
        data.date,
        data.studentId,
        data.studentName,
        data.timeRange || '',
        data.tasksCompleted || 0,
        data.totalTasks || 0,
        data.notes || '',
        JSON.stringify(data.tasksSnapshot || []),
        new Date().toISOString()
      ]);
      return responseJSON({ status: 'success', message: 'Jurnal harian tersimpan ke Sheet DailyJournals.' });
    }
    if (action === 'deleteJournal') {
      deleteRowById('DailyJournals', 0, data.id);
      return responseJSON({ status: 'success', message: 'Jurnal harian dihapus.' });
    }
    
    // 6. REKAM MEDIS & LAYANAN UKS (MEDICAL RECORDS)
    if (action === 'addMedicalRecord' || action === 'updateMedicalRecord') {
      saveOrUpdateRow('MedicalRecords', 0, data.id, [
        data.id,
        data.studentId,
        data.studentName,
        data.date || '',
        data.time || '',
        data.location || '',
        data.symptoms || '',
        data.diagnosis || '',
        data.treatment || '',
        data.restDays || 0,
        data.isSickLeave ? 'Ya' : 'Tidak',
        data.status || 'Sembuh/Kembali KBM',
        data.officer || '',
        data.temperature || '',
        data.vitalSigns || '',
        data.notes || '',
        data.fileUrl || '',
        new Date().toISOString()
      ]);
      return responseJSON({ status: 'success', message: 'Rekam medis UKS tersimpan ke Sheet MedicalRecords.' });
    }
    if (action === 'deleteMedicalRecord') {
      deleteRowById('MedicalRecords', 0, data.id);
      return responseJSON({ status: 'success', message: 'Rekam medis dihapus.' });
    }
    

    // 8. JURNAL PENGHUBUNG (CONNECTING JOURNALS)
    if (action === 'addConnectingJournal' || action === 'updateConnectingJournal') {
      saveOrUpdateRow('ConnectingJournals', 0, data.id, [
        data.id,
        data.date,
        data.targetClass || '',
        data.studentId || '',
        data.studentName || '',
        data.subject || '',
        data.teacherName || '',
        data.teacherNip || '',
        data.learningAchievement || '',
        data.taskOrder || '',
        data.deadline || '',
        data.followUp || '',
        data.caretakerName || '',
        data.caretakerNip || '',
        data.responseDate || '',
        data.status || 'Menunggu Respon',
        data.notes || '',
        new Date().toISOString()
      ]);
      return responseJSON({ status: 'success', message: 'Jurnal Penghubung tersimpan ke Sheet ConnectingJournals.' });
    }
    if (action === 'deleteConnectingJournal') {
      deleteRowById('ConnectingJournals', 0, data.id);
      return responseJSON({ status: 'success', message: 'Jurnal Penghubung dihapus.' });
    }

    // 9. REKAM MENSTRUASI (MENSTRUATION RECORDS)
    if (action === 'addMenstruationRecord' || action === 'updateMenstruationRecord') {
      saveOrUpdateRow('MenstruationRecords', 0, data.id, [
        data.id,
        data.studentId || '',
        data.studentName || '',
        data.class || '',
        data.dorm || '',
        data.startDate || '',
        data.startTime || '',
        data.endDate || '',
        data.endTime || '',
        data.durationText || (data.durationDays ? data.durationDays + ' Hari' : ''),
        data.purificationDate || '',
        data.purificationTime || '',
        data.purificationVerifiedBy || '',
        data.status || '',
        (data.symptoms || []).join(', '),
        data.painLevel || '',
        data.medicineOrCare || '',
        data.sanitaryPadsProvided || '',
        data.readyForWorshipDate || '',
        new Date().toISOString()
      ]);
      return responseJSON({ status: 'success', message: 'Rekam Menstruasi tersimpan ke Sheet MenstruationRecords.' });
    }
    if (action === 'deleteMenstruationRecord') {
      deleteRowById('MenstruationRecords', 0, data.id);
      return responseJSON({ status: 'success', message: 'Rekam Menstruasi dihapus.' });
    }

    // 10. PRESENSI SHOLAT (PRAYER ATTENDANCE)
    if (action === 'addPrayerAttendance' || action === 'updatePrayerAttendance') {
      saveOrUpdateRow('PrayerAttendance', 0, data.id, [
        data.id,
        data.date,
        data.studentId,
        data.studentName,
        data.class || '',
        data.dorm || '',
        data.session || '',
        data.status || '',
        data.time || '',
        data.officer || '',
        data.notes || '',
        data.rfidTag || '',
        new Date().toISOString()
      ]);
      return responseJSON({ status: 'success', message: 'Presensi Sholat tersimpan ke Sheet.' });
    }
    if (action === 'deletePrayerAttendance') {
      deleteRowById('PrayerAttendance', 0, data.id);
      return responseJSON({ status: 'success', message: 'Presensi Sholat dihapus.' });
    }

    // 7. RAPOR PERKEMBANGAN ASRAMA (REPORT CARDS)
    if (action === 'saveReportCard') {
      var studentId = data.studentId;
      var rep = data.report || data;
      saveOrUpdateRow('ReportCards', 0, studentId, [
        studentId,
        rep.studentName || '',
        JSON.stringify(rep.grades || {}),
        JSON.stringify(rep.descriptions || {}),
        rep.specialNote || '',
        rep.customCaretaker || '',
        rep.customCaretakerNip || '',
        rep.semester || 'Genap',
        rep.academicYear || '2025/2026',
        new Date().toISOString()
      ]);
      return responseJSON({ status: 'success', message: 'Data Rapor tersimpan ke Sheet ReportCards.' });
    }
    if (action === 'deleteReportCard') {
      deleteRowById('ReportCards', 0, data.studentId || data.id);
      return responseJSON({ status: 'success', message: 'Rapor asrama dihapus.' });
    }

    // 8. PAPAN PENGUMUMAN (ANNOUNCEMENTS)
    if (action === 'saveAnnouncement' || action === 'addAnnouncement') {
      saveOrUpdateRow('Announcements', 0, data.id || 'ANN001', [
        data.id || 'ANN001',
        data.message || data.pesan || '',
        data.status || 'Aktif',
        new Date().toISOString()
      ]);
      return responseJSON({ status: 'success', message: 'Pesan pengumuman tersimpan ke Sheet Announcements.' });
    }

    // 9. PRESENSI SHOLAT & KEGIATAN RFID (PRAYER ATTENDANCE)
    if (action === 'addPrayerAttendance' || action === 'saveAttendance') {
      saveOrUpdateRow('PrayerAttendance', 0, data.id, [
        data.id,
        data.date,
        data.studentId,
        data.studentName,
        data.class || '',
        data.dorm || '',
        data.prayerTime || data.session || '',
        data.status || 'Hadir',
        data.timestamp || '',
        data.scannedBy || '',
        data.note || '',
        data.rfidTag || '',
        new Date().toISOString()
      ]);
      return responseJSON({ status: 'success', message: 'Presensi tersimpan ke Sheet PrayerAttendance.' });
    }
    if (action === 'deletePrayerAttendance') {
      deleteRowById('PrayerAttendance', 0, data.id);
      return responseJSON({ status: 'success', message: 'Data presensi dihapus.' });
    }

    return responseJSON({ status: 'error', message: 'Aksi tidak dikenali: ' + action });
  } catch (err) {
    return responseJSON({ status: 'error', message: 'Gagal memproses POST: ' + err.toString() });
  }
}

function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==============================================================================
// 2. FETCH ALL DATA
// ==============================================================================

function getAllData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return {
    status: 'success',
    timestamp: new Date().toISOString(),
    students: getSheetDataAsObjects(ss, 'Students'),
    violations: getSheetDataAsObjects(ss, 'Violations'),
    counseling: getSheetDataAsObjects(ss, 'Counseling'),
    leaves: getSheetDataAsObjects(ss, 'Leaves'),
    dailyJournals: getSheetDataAsObjects(ss, 'DailyJournals'),
    medicalRecords: getSheetDataAsObjects(ss, 'MedicalRecords'),
    reportCards: getSheetDataAsObjects(ss, 'ReportCards'),
    announcements: getSheetDataAsObjects(ss, 'Announcements'),
    prayerAttendance: getSheetDataAsObjects(ss, 'PrayerAttendance'),
    connectingJournals: getSheetDataAsObjects(ss, 'ConnectingJournals'),
    menstruationRecords: getSheetDataAsObjects(ss, 'MenstruationRecords')
  };
}

function getSheetDataAsObjects(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  var headers = data[0];
  var result = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var obj = {};
    var isEmptyRow = true;
    for (var j = 0; j < headers.length; j++) {
      var val = row[j];
      if (val !== "" && val !== null && val !== undefined) isEmptyRow = false;
      obj[headers[j]] = val;
    }
    if (!isEmptyRow) result.push(obj);
  }
  return result;
}

// ==============================================================================
// 3. ROW CRUD & UPSERT HELPERS
// ==============================================================================

function saveOrUpdateRow(sheetName, idColIndex, idValue, rowValues) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    setupSheet();
    sheet = ss.getSheetByName(sheetName);
  }
  
  var data = sheet.getDataRange().getValues();
  var foundRowIndex = -1;
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idColIndex]).trim() === String(idValue).trim()) {
      foundRowIndex = i + 1;
      break;
    }
  }
  
  if (foundRowIndex > 0) {
    sheet.getRange(foundRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

function deleteRowById(sheetName, idColIndex, idValue) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][idColIndex]).trim() === String(idValue).trim()) {
      sheet.deleteRow(i + 1);
    }
  }
}

// ==============================================================================
// 4. OTOMATISASI SETUP SHEET & HEADER RESMI (SETUPSHEET)
// ==============================================================================

/**
 * FUNGSI SETUP SHEET OTOMATIS
 * Membuat seluruh Sheet database, format header warna resmi, freeze baris pertama,
 * dan menginisialisasi struktur Google Drive.
 */
function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Skema Header & Warna Indikator Resmi Tiap Tab
  var sheetConfigs = {
    'Students': {
      color: '#1e293b', // Slate
      headers: ['NISN/ID', 'Nama Lengkap', 'Jenjang', 'Asrama', 'Wali Asuh', 'RFID Tag', 'Tinggi (cm)', 'Berat (kg)', 'Ukuran Baju', 'Ukuran Celana', 'Foto Profil', 'Jenis Kelamin', 'Kontak Ortu', 'Golongan Darah', 'Riwayat Medis', 'Kebutuhan Khusus', 'Terakhir Diperbarui']
    },
    'Violations': {
      color: '#b91c1c', // Merah Disiplin
      headers: ['ID Kasus', 'Tanggal', 'NISN/ID', 'Nama Siswa', 'Tingkat Poin', 'Bentuk Pelanggaran', 'Rekomendasi Sanksi', 'Catatan Kronologi', 'Pelapor', 'URL Bukti Foto (Drive)', 'Semester', 'Tahun Ajaran', 'Lokasi Kejadian', 'Status Penanganan', 'Terakhir Diperbarui']
    },
    'Counseling': {
      color: '#0369a1', // Biru Konseling BK
      headers: ['ID Sesi', 'Tanggal', 'Waktu/Pukul', 'NISN/ID', 'Nama Siswa', 'Sesi Ke', 'Lokasi Pertemuan', 'Guru BK / Konselor', 'NIP Konselor', 'Pendamping Hadir', 'Jenis Layanan', 'Bidang Bimbingan', 'Tingkat Urgensi', 'Sifat Kerahasiaan', 'Topik Permasalahan', 'Latar Belakang & Pemicu', 'Teknik Pendekatan', 'Observasi Sikap Siswa', 'Dinamika Sesi & Hasil Pembinaan', 'Komitmen Janji Siswa', 'Rencana Tindak Lanjut (RTL)', 'Target Tanggal Evaluasi', 'Rekomendasi Wali Asuh', 'Status Kasus', 'Keterangan Rujukan Ahli', 'Terakhir Diperbarui']
    },
    'Leaves': {
      color: '#d97706', // Amber Izin
      headers: ['ID Surat', 'NISN/ID', 'Nama Siswa', 'Kategori Izin', 'Alasan Kepulangan', 'Tgl Berangkat', 'Tgl Kembali', 'Wali Asuh Pendamping', 'Status Izin', 'Jenis Izin', 'Jam Berangkat', 'Jam Kembali', 'Nomor Surat', 'Alamat Tujuan', 'Kontak Ortu', 'Nama Penjemput', 'Terakhir Diperbarui']
    },
    'DailyJournals': {
      color: '#15803d', // Hijau Ibadah
      headers: ['ID Jurnal', 'Tanggal', 'NISN/ID', 'Nama Siswa', 'Rentang Waktu', 'Total Tugas Selesai', 'Total Target Tugas', 'Catatan Wali Asuh', 'Detail Snapshot JSON', 'Terakhir Diperbarui']
    },
    'MedicalRecords': {
      color: '#be123c', // Rose UKS
      headers: ['ID Rekam Medis', 'NISN/ID', 'Nama Siswa', 'Tanggal Rawat', 'Waktu/Jam', 'Lokasi Penanganan', 'Gejala & Keluhan', 'Diagnosa Medis', 'Tindakan & Terapi Obat', 'Lama Istirahat (Hari)', 'Surat Izin Sakit?', 'Status Pemulihan', 'Petugas Medis', 'Suhu Tubuh (°C)', 'Tanda Vital / Tekanan Darah', 'Catatan Medis Tambahan', 'URL Lampiran Surat/Foto (Drive)', 'Terakhir Diperbarui']
    },
    'ReportCards': {
      color: '#4338ca', // Indigo Rapor
      headers: ['NISN/ID', 'Nama Siswa', 'Predikat Nilai JSON', 'Deskripsi Nilai JSON', 'Catatan Perkembangan Khusus', 'Wali Asuh Penandatangan', 'NIP Wali Asuh', 'Semester', 'Tahun Ajaran', 'Terakhir Diperbarui']
    },
    'Announcements': {
      color: '#0f766e', // Teal Pengumuman
      headers: ['ID Pengumuman', 'Isi Pesan Running Text', 'Status Aktif', 'Terakhir Diperbarui']
    },
    'PrayerAttendance': {
      color: '#475569', // Slate Presensi
      headers: ['ID Presensi', 'Tanggal', 'NISN/ID', 'Nama Siswa', 'Kelas', 'Gedung Asrama', 'Sesi Presensi', 'Status Kehadiran', 'Waktu Scan', 'Petugas / Scan By', 'Catatan', 'RFID UID Tag', 'Terakhir Diperbarui']
    },
    'ConnectingJournals': {
      color: '#8b5cf6', // Violet Jurnal Penghubung
      headers: ['ID Jurnal', 'Tanggal', 'Target Kelas', 'NISN/ID Siswa', 'Nama Siswa', 'Mata Pelajaran', 'Nama Guru', 'NIP Guru', 'Capaian Materi', 'Task Order Asrama', 'Batas Waktu', 'Tindak Lanjut', 'Wali Asuh', 'NIP Wali Asuh', 'Tanggal Respon', 'Status', 'Catatan Tambahan', 'Terakhir Diperbarui']
    },
    'MenstruationRecords': {
      color: '#ec4899', // Pink Menstruasi
      headers: ['ID Rekam', 'NISN/ID', 'Nama Siswa', 'Kelas', 'Asrama', 'Mulai Tgl', 'Mulai Jam', 'Selesai Tgl', 'Selesai Jam', 'Durasi Haid', 'Tgl Bersuci', 'Jam Bersuci', 'Diverifikasi Oleh', 'Status Siklus', 'Keluhan / Gejala', 'Skala Nyeri', 'Tindakan UKS', 'Jml Pembalut', 'Siap Ibadah Tgl', 'Terakhir Diperbarui']
    },
    'BackupLogs': {
      color: '#334155', // Log Backup
      headers: ['ID Log', 'Waktu Backup', 'Nama File Backup', 'Tipe Backup', 'URL File Google Drive', 'URL Folder Drive', 'Total Siswa', 'Total Rekam Data', 'Status']
    }
  };
  
  var createdCount = 0;
  for (var sheetName in sheetConfigs) {
    var conf = sheetConfigs[sheetName];
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      createdCount++;
    }
    
    var headers = conf.headers;
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setFontWeight("bold")
      .setBackground(conf.color)
      .setFontColor("#ffffff")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle")
      .setFontSize(9)
      .setWrap(false);
      
    sheet.setRowHeight(1, 32);
    sheet.setFrozenRows(1);
  }

  // Hapus Sheet default kosong "Sheet1" jika ada
  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch (e) {}
  }

  // Inisialisasi struktur Folder Google Drive
  var driveInfo = createSystemDriveFolders();

  return {
    status: 'success',
    message: 'Setup Sheet Berhasil! Seluruh 10 Sheet database & Struktur Google Drive telah siap digunakan.',
    totalSheets: Object.keys(sheetConfigs).length,
    driveFolders: driveInfo
  };
}

// ==============================================================================
// 5. OTOMATISASI PENYIMPANAN GOOGLE DRIVE (AUTOMATIC DRIVE STORAGE)
// ==============================================================================

var ROOT_FOLDER_NAME = "SISTEM_KEASRAMAAN_SEKOLAH_RAKYAT_31";

var SUBFOLDERS = {
  BACKUP: "📁 1_CADANGAN_DATABASE_BACKUP",
  STUDENT_PHOTOS: "📁 2_FOTO_PROFIL_SISWA",
  COUNSELING_DOCS: "📁 3_DOKUMEN_BERITA_ACARA_BK",
  VIOLATION_EVIDENCE: "📁 4_BUKTI_FOTO_PELANGGARAN",
  MEDICAL_FILES: "📁 5_SURAT_MEDIS_UKS"
};

/**
 * Membuat Folder Induk & Seluruh Subfolder di Google Drive secara otomatis.
 */
function createSystemDriveFolders() {
  try {
    var rootFolder = getOrCreateDriveFolder(ROOT_FOLDER_NAME);
    var subfolderUrls = {};

    for (var key in SUBFOLDERS) {
      var subName = SUBFOLDERS[key];
      var subFolder = getOrCreateDriveSubfolder(rootFolder, subName);
      subfolderUrls[key] = {
        name: subName,
        id: subFolder.getId(),
        url: subFolder.getUrl()
      };
    }

    return {
      status: 'success',
      rootFolderId: rootFolder.getId(),
      rootFolderUrl: rootFolder.getUrl(),
      subfolders: subfolderUrls
    };
  } catch (err) {
    return { status: 'error', message: 'Gagal membuat folder Google Drive: ' + err.toString() };
  }
}

/**
 * FUNGSI BACKUP DATA OTOMATIS KE GOOGLE DRIVE
 * Mengambil seluruh data sheet lalu menyimpannya sebagai file JSON berstempel waktu
 * di subfolder "1_CADANGAN_DATABASE_BACKUP".
 */
function autoBackupToDrive() {
  try {
    var rootFolder = getOrCreateDriveFolder(ROOT_FOLDER_NAME);
    var backupFolder = getOrCreateDriveSubfolder(rootFolder, SUBFOLDERS.BACKUP);
    
    var allData = getAllData();
    var now = new Date();
    var timeStamp = Utilities.formatDate(now, Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd_HH-mm-ss");
    var fileName = "Backup_SekolahRakyat31_" + timeStamp + ".json";
    
    var file = backupFolder.createFile(fileName, JSON.stringify(allData, null, 2), MimeType.PLAIN_TEXT);
    
    // Set izin agar dapat dibaca pengelola
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Hitung total record data
    var totalStudents = allData.students ? allData.students.length : 0;
    var totalRecords = (allData.violations ? allData.violations.length : 0) +
                       (allData.counseling ? allData.counseling.length : 0) +
                       (allData.leaves ? allData.leaves.length : 0) +
                       (allData.dailyJournals ? allData.dailyJournals.length : 0) +
                       (allData.medicalRecords ? allData.medicalRecords.length : 0) +
                       (allData.prayerAttendance ? allData.prayerAttendance.length : 0) +
                       (allData.connectingJournals ? allData.connectingJournals.length : 0) +
                       (allData.menstruationRecords ? allData.menstruationRecords.length : 0);

    // Catat ke Sheet BackupLogs
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var logSheet = ss.getSheetByName('BackupLogs');
    if (logSheet) {
      logSheet.appendRow([
        'LOG-' + Date.now(),
        Utilities.formatDate(now, Session.getScriptTimeZone() || "GMT+7", "dd/MM/yyyy HH:mm:ss"),
        fileName,
        'JSON Snapshot Otomatis',
        file.getUrl(),
        backupFolder.getUrl(),
        totalStudents,
        totalRecords,
        'Sukses'
      ]);
    }

    return {
      status: 'success',
      message: 'Backup otomatis database ke Google Drive berhasil disimpan!',
      fileName: fileName,
      fileId: file.getId(),
      fileUrl: file.getUrl(),
      folderUrl: backupFolder.getUrl(),
      totalStudents: totalStudents,
      totalRecords: totalRecords
    };
  } catch (err) {
    return { status: 'error', message: 'Gagal melakukan backup ke Drive: ' + err.toString() };
  }
}

/**
 * FUNGSI UPLOAD FILE KE GOOGLE DRIVE OTOMATIS
 * Menerima payload base64 dari aplikasi web dan menyimpannya ke subfolder Google Drive.
 */
function uploadFileToDrive(data) {
  try {
    if (!data.base64Data || !data.fileName) {
      return { status: 'error', message: 'Parameter base64Data dan fileName diperlukan.' };
    }

    var rootFolder = getOrCreateDriveFolder(ROOT_FOLDER_NAME);
    var targetSubfolderName = SUBFOLDERS[data.folderType] || SUBFOLDERS.BACKUP;
    var targetFolder = getOrCreateDriveSubfolder(rootFolder, targetSubfolderName);

    // Decode Base64
    var rawBase64 = data.base64Data;
    if (rawBase64.indexOf(',') > -1) {
      rawBase64 = rawBase64.split(',')[1];
    }
    var decoded = Utilities.base64Decode(rawBase64);
    var blob = Utilities.newBlob(decoded, data.mimeType || 'application/octet-stream', data.fileName);

    var file = targetFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return {
      status: 'success',
      message: 'File berhasil diunggah ke Google Drive!',
      fileName: file.getName(),
      fileId: file.getId(),
      fileUrl: file.getUrl(),
      directDownloadUrl: "https://drive.google.com/uc?export=download&id=" + file.getId(),
      folderName: targetSubfolderName
    };
  } catch (err) {
    return { status: 'error', message: 'Gagal mengunggah file ke Google Drive: ' + err.toString() };
  }
}

function getOrCreateDriveFolder(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return DriveApp.createFolder(folderName);
  }
}

function getOrCreateDriveSubfolder(parentFolder, subfolderName) {
  var subFolders = parentFolder.getFoldersByName(subfolderName);
  if (subFolders.hasNext()) {
    return subFolders.next();
  } else {
    return parentFolder.createFolder(subfolderName);
  }
}

// ==============================================================================
// 6. PEMICU JADWAL BACKUP OTOMATIS GOOGLE DRIVE (23:00 NIGHTLY)
// ==============================================================================

/**
 * Mengaktifkan pemicu otomatis setiap hari pukul 23:00 malam untuk mem-backup
 * seluruh data database ke Google Drive.
 */
function createAutomatedDailyDriveSyncTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'autoBackupToDrive') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  
  ScriptApp.newTrigger('autoBackupToDrive')
    .timeBased()
    .everyDays(1)
    .atHour(23)
    .create();
    
  Logger.log("✅ Trigger backup otomatis ke Google Drive harian (23:00) berhasil diaktifkan.");
  return { 
    status: 'success', 
    message: 'Jadwal Backup Otomatis Harian (Pukul 23:00 WIB) Berhasil Diaktifkan di Google Apps Script!' 
  };
}

// ==============================================================================
// 7. FORMAT & RAPIKAN SELURUH TAMPILAN TABEL (AUTO FORMAT)
// ==============================================================================

function autoFormatSheets() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ss.getSheets();
    
    for (var i = 0; i < sheets.length; i++) {
      var sh = sheets[i];
      var lastCol = sh.getLastColumn();
      var lastRow = sh.getLastRow();
      
      if (lastCol > 0 && lastRow > 0) {
        // Auto-fit kolom
        for (var c = 1; c <= Math.min(lastCol, 26); c++) {
          sh.autoResizeColumn(c);
        }
        // Alternating row background
        var bodyRange = sh.getRange(2, 1, Math.max(lastRow - 1, 1), lastCol);
        bodyRange.setFontFamily("Arial");
        bodyRange.setFontSize(8.5);
      }
    }
    
    return { status: 'success', message: 'Seluruh sheet berhasil dirapikan dan diselaraskan formatnya!' };
  } catch (err) {
    return { status: 'error', message: err.toString() };
  }
}

// ==============================================================================
// 8. REKONSILIASI & PENCEGAHAN DATA SHADOW
// ==============================================================================

function cleanShadowData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var studentSheet = ss.getSheetByName('Students');
    if (!studentSheet) return { status: 'error', message: 'Sheet Students tidak ditemukan.' };

    var studentData = studentSheet.getDataRange().getValues();
    if (studentData.length <= 1) return { status: 'success', message: 'Tidak ada data siswa master untuk divalidasi.' };

    var studentMap = {};
    for (var i = 1; i < studentData.length; i++) {
      var id = String(studentData[i][0]).trim();
      var name = String(studentData[i][1]).trim();
      if (id) {
        studentMap[id.toLowerCase()] = { id: id, name: name };
      }
    }

    var fixedCount = 0;
    var targetSheets = [
      { name: 'Violations', idCol: 2, nameCol: 3 },
      { name: 'Counseling', idCol: 3, nameCol: 4 },
      { name: 'Leaves', idCol: 1, nameCol: 2 },
      { name: 'DailyJournals', idCol: 2, nameCol: 3 },
      { name: 'MedicalRecords', idCol: 1, nameCol: 2 },
      { name: 'ReportCards', idCol: 0, nameCol: 1 },
      { name: 'PrayerAttendance', idCol: 2, nameCol: 3 },
      { name: 'ConnectingJournals', idCol: 3, nameCol: 4 },
      { name: 'MenstruationRecords', idCol: 1, nameCol: 2 }
    ];

    for (var s = 0; s < targetSheets.length; s++) {
      var conf = targetSheets[s];
      var sh = ss.getSheetByName(conf.name);
      if (!sh) continue;

      var range = sh.getDataRange();
      var rows = range.getValues();
      if (rows.length <= 1) continue;

      var modified = false;
      for (var r = 1; r < rows.length; r++) {
        var rowId = String(rows[r][conf.idCol]).trim().toLowerCase();
        var rowName = String(rows[r][conf.nameCol]).trim();

        if (rowId && studentMap[rowId]) {
          var masterName = studentMap[rowId].name;
          if (rowName !== masterName) {
            rows[r][conf.nameCol] = masterName;
            fixedCount++;
            modified = true;
          }
        }
      }

      if (modified) {
        range.setValues(rows);
      }
    }

    return {
      status: 'success',
      message: 'Rekonsiliasi Data Shadow Selesai! ' + fixedCount + ' data nama murid berhasil diselaraskan dengan Master Students.',
      fixedCount: fixedCount
    };
  } catch (err) {
    return { status: 'error', message: 'Gagal membersihkan data shadow: ' + err.toString() };
  }
}

// ==============================================================================
// 9. MENU TOMBOL OTOMATIS DI GOOGLE SPREADSHEET (UI MENU ON OPEN)
// ==============================================================================

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🏫 SISTEM KEASRAMAAN SR31')
    .addItem('📑 1. Inisialisasi / Setup Semua Sheet Otomatis', 'setupSheet')
    .addItem('📁 2. Buat Struktur Folder Google Drive Lengkap', 'createSystemDriveFolders')
    .addItem('💾 3. Simpan Backup Database Sekarang ke Google Drive', 'autoBackupToDrive')
    .addItem('⏰ 4. Pasang Jadwal Backup Otomatis Harian (23:00 WIB)', 'createAutomatedDailyDriveSyncTrigger')
    .addSeparator()
    .addItem('🧹 5. Bersihkan & Selaraskan Data Shadow Antar-Sheet', 'cleanShadowData')
    .addItem('📊 6. Rapikan & Format Tampilan Seluruh Tabel', 'autoFormatSheets')
    .addToUi();
}
`;
