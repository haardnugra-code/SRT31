/**
 * ==============================================================================
 * GOOGLE APPS SCRIPTSCRIPT BACKEND & AUTOMATIC SHEET SETUP
 * Sistem Informasi Keasramaan & UKS / Rekam Medis - Sekolah Rakyat Terpadu
 * ==============================================================================
 *
 * CARA PENGGUNAAN:
 * 1. Buka Google Sheet Anda.
 * 2. Klik menu "Ekstensi" -> "Apps Script".
 * 3. Hapus semua kode bawaan, lalu salin (paste) SELURUH KODE di bawah ini.
 * 4. Untuk membuat seluruh Sheet & Header otomatis:
 *    - Pilih fungsi "setupSheets" di bagian atas editor Apps Script.
 *    - Klik tombol "Jalankan" (Run). Seluruh Sheet akan dibuat dan di-format otomatis!
 * 5. Terapkan sebagai Aplikasi Web (Deploy as Web App):
 *    - Klik "Terapkan" (Deploy) -> "Terapkan baru" (New deployment).
 *    - Pilih jenis: "Aplikasi web" (Web app).
 *    - Jalankan sebagai (Execute as): "Saya" (Me).
 *    - Yang memiliki akses (Who has access): "Siapa saja" (Anyone).
 *    - Klik "Terapkan" (Deploy), berikan izin otorisasi, lalu salin URL Web App ke Pengaturan Aplikasi.
 * ==============================================================================
 */

// Nama-nama Sheet Database
var SHEETS = {
  STUDENTS: 'DataSiswa',
  VIOLATIONS: 'Pelanggaran',
  COUNSELING: 'Konseling',
  LEAVES: 'IzinKepulangan',
  JOURNALS: 'JurnalHarian',
  MEDICAL: 'RekamMedis',
  CONFIG: 'Pengaturan'
};

/**
 * FUNGSI SETUP AUTOMATIS:
 * Membuat semua sheet & header kolom dengan format profesional jika belum ada.
 */
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Sheet DataSiswa
  setupSheetHeader(ss, SHEETS.STUDENTS, [
    'NISN/ID', 'Nama Siswa', 'Kelas', 'Asrama', 'Wali Asuh'
  ], '#1e293b');

  // 2. Sheet Pelanggaran
  setupSheetHeader(ss, SHEETS.VIOLATIONS, [
    'ID Kasus', 'Tanggal', 'NISN/ID', 'Nama Siswa', 'Gedung/Lokasi', 'Jenis Pelanggaran', 'Poin', 'Pelapor', 'URL Berkas Bukti'
  ], '#b91c1c');

  // 3. Sheet Konseling
  setupSheetHeader(ss, SHEETS.COUNSELING, [
    'ID Sesi', 'Tanggal', 'NISN/ID', 'Nama Siswa', 'Permasalahan', 'Rekomendasi/Tindakan', 'Konselor/Wali', 'Status'
  ], '#0369a1');

  // 4. Sheet IzinKepulangan
  setupSheetHeader(ss, SHEETS.LEAVES, [
    'ID Surat', 'NISN/ID', 'Nama Siswa', 'Tanggal Keluar', 'Tanggal Kembali', 'Alasan/Tujuan', 'Wali Asuh Pendamping', 'Status'
  ], '#d97706');

  // 5. Sheet JurnalHarian
  setupSheetHeader(ss, SHEETS.JOURNALS, [
    'ID Jurnal', 'Tanggal', 'NISN/ID', 'Nama Siswa', 'Skor Ketaatan (%)', 'Catatan Wali', 'Detail Snapshot (JSON)'
  ], '#4d7c0f');

  // 6. Sheet RekamMedis (UKS & Klinik)
  setupSheetHeader(ss, SHEETS.MEDICAL, [
    'ID Medis', 'Tanggal', 'Jam', 'NISN/ID', 'Nama Siswa', 'Lokasi Penanganan', 'Suhu Tubuh', 'Vital Signs', 'Gejala Utama', 'Diagnosa', 'Tindakan & Obat', 'Durasi Izin (Hari)', 'Ada Surat Izin', 'Status', 'Petugas Medis', 'Catatan'
  ], '#be123c');

  // 7. Sheet Pengaturan
  setupSheetHeader(ss, SHEETS.CONFIG, [
    'Kunci', 'Nilai'
  ], '#334155');

  SpreadsheetApp.flush();
  Logger.log('✅ Berhasil membuat dan memformat seluruh Sheet otomatis!');
  return 'Setup Sheet Berhasil!';
}

/**
 * Helper untuk membuat sheet & mewarnai header
 */
function setupSheetHeader(ss, sheetName, headers, headerColorHex) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  // Jika baris pertama kosong, isi header
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else {
    // Timpa baris pertama dengan header resmi
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  // Format Header Style
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setFontColor('#ffffff');
  headerRange.setBackground(headerColorHex || '#1e293b');
  headerRange.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
}

/**
 * SERVE DATA (GET REQUEST)
 */
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Pastikan sheet sudah dibuat
    setupSheets();

    var result = {
      students: getSheetDataAsObjects(ss, SHEETS.STUDENTS),
      violations: getSheetDataAsObjects(ss, SHEETS.VIOLATIONS),
      counseling: getSheetDataAsObjects(ss, SHEETS.COUNSELING),
      leaves: getSheetDataAsObjects(ss, SHEETS.LEAVES),
      dailyJournals: getSheetDataAsObjects(ss, SHEETS.JOURNALS),
      medicalRecords: getSheetDataAsObjects(ss, SHEETS.MEDICAL),
      status: 'success'
    };

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * HANDLE POST REQUEST (SIMPAN / DELETE / UPDATE)
 */
function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    var data = postData.data;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'ping') {
      return responseJSON({ status: 'ok', message: 'Apps Script Terhubung' });
    }

    if (action === 'setupSheets') {
      setupSheets();
      return responseJSON({ status: 'ok', message: 'Sheet berhasil dikonfigurasi' });
    }

    // --- REKAM MEDIS & UKS ---
    if (action === 'addMedicalRecord') {
      var sheetMed = ss.getSheetByName(SHEETS.MEDICAL);
      sheetMed.appendRow([
        data.id || '',
        data.date || '',
        data.time || '',
        data.studentId || '',
        data.studentName || '',
        data.location || '',
        data.temperature || '',
        data.vitalSigns || '',
        data.symptoms || '',
        data.diagnosis || '',
        data.treatment || '',
        data.restDays || 0,
        data.isSickLeave ? 'Ya' : 'Tidak',
        data.status || '',
        data.officer || '',
        data.notes || ''
      ]);
      return responseJSON({ status: 'ok' });
    }

    if (action === 'deleteMedicalRecord') {
      deleteRowById(ss, SHEETS.MEDICAL, 1, data.id);
      return responseJSON({ status: 'ok' });
    }

    // --- SISWA ---
    if (action === 'addStudent') {
      var sheetSiswa = ss.getSheetByName(SHEETS.STUDENTS);
      sheetSiswa.appendRow([
        data.id || '',
        data.name || '',
        data.class || '',
        data.dorm || '',
        data.caretaker || ''
      ]);
      return responseJSON({ status: 'ok' });
    }

    if (action === 'deleteStudent') {
      deleteRowById(ss, SHEETS.STUDENTS, 1, data.id);
      return responseJSON({ status: 'ok' });
    }

    // --- PELANGGARAN ---
    if (action === 'addViolation') {
      var sheetV = ss.getSheetByName(SHEETS.VIOLATIONS);
      sheetV.appendRow([
        data.id || '',
        data.date || '',
        data.studentId || '',
        data.studentName || '',
        data.dorm || '',
        data.violationType || '',
        data.points || 0,
        data.reporter || '',
        data.photo || ''
      ]);
      return responseJSON({ status: 'ok' });
    }

    if (action === 'deleteViolation') {
      deleteRowById(ss, SHEETS.VIOLATIONS, 1, data.id);
      return responseJSON({ status: 'ok' });
    }

    // --- KONSELING ---
    if (action === 'addCounseling') {
      var sheetC = ss.getSheetByName(SHEETS.COUNSELING);
      sheetC.appendRow([
        data.id || '',
        data.date || '',
        data.studentId || '',
        data.studentName || '',
        data.issue || '',
        data.recommendation || '',
        data.counselor || '',
        data.status || 'Open'
      ]);
      return responseJSON({ status: 'ok' });
    }

    if (action === 'deleteCounseling') {
      deleteRowById(ss, SHEETS.COUNSELING, 1, data.id);
      return responseJSON({ status: 'ok' });
    }

    // --- IZIN PULANG ---
    if (action === 'addLeave') {
      var sheetL = ss.getSheetByName(SHEETS.LEAVES);
      sheetL.appendRow([
        data.id || '',
        data.studentId || '',
        data.studentName || '',
        data.startDate || '',
        data.endDate || '',
        data.reason || '',
        data.caretaker || '',
        data.status || 'Active'
      ]);
      return responseJSON({ status: 'ok' });
    }

    if (action === 'deleteLeave') {
      deleteRowById(ss, SHEETS.LEAVES, 1, data.id);
      return responseJSON({ status: 'ok' });
    }

    // --- JURNAL HARIAN ---
    if (action === 'addJournal') {
      var sheetJ = ss.getSheetByName(SHEETS.JOURNALS);
      sheetJ.appendRow([
        data.id || '',
        data.date || '',
        data.studentId || '',
        data.studentName || '',
        data.obedienceScore || 0,
        data.notes || '',
        JSON.stringify(data.tasksSnapshot || [])
      ]);
      return responseJSON({ status: 'ok' });
    }

    if (action === 'deleteJournal') {
      deleteRowById(ss, SHEETS.JOURNALS, 1, data.id);
      return responseJSON({ status: 'ok' });
    }

    return responseJSON({ status: 'ignored', message: 'Action not found' });
  } catch (error) {
    return responseJSON({ status: 'error', message: error.toString() });
  }
}

/**
 * HELPER UNTUK MENGAMBIL DATA DARI SHEET DALAM BENTUK ARRAY OF OBJECT
 */
function getSheetDataAsObjects(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var headers = data[0];
  var result = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    result.push(obj);
  }
  return result;
}

/**
 * HELPER MENGHAPUS BARIS BERDASARKAN ID
 */
function deleteRowById(ss, sheetName, idColIndex, targetId) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][idColIndex - 1]).trim() === String(targetId).trim()) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
