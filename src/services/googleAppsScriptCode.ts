export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * GOOGLE APPS SCRIPT BACKEND (Code.gs)
 * SEKOLAH RAKYAT TERINTEGRASI 31 PALEMBANG
 * 
 * Petunjuk Instalasi:
 * 1. Buka Google Sheet baru di Google Drive Anda.
 * 2. Klik menu "Ekstensi" -> "Apps Script".
 * 3. Hapus seluruh isi kode default, lalu tempelkan (paste) seluruh kode di bawah ini.
 * 4. Jalankan fungsi "setupSheet" sekali (Klik tombol 'Jalankan' / 'Run') untuk membuat semua Tab, Header Sheet & Folder Backup Google Drive secara otomatis.
 * 5. Jalankan fungsi "createDailyBackupTrigger" sekali jika ingin backup otomatis ke Google Drive setiap malam pukul 23:00.
 * 6. Klik tombol "Terapkan" / "Deploy" -> "Terapkan sebagai Aplikasi Web" / "New deployment".
 * 7. Pilih Akses (Who has access): "Siapa Saja" / "Anyone" (Penting agar web aplikasi dapat terhubung).
 * 8. Salin URL Web App yang dihasilkan, lalu masukkan ke kolom 'Google Apps Script Web App URL' di Pengaturan Aplikasi.
 */

function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : '';
  
  if (action === 'ping') {
    return responseJSON({ status: 'success', message: 'Apps Script aktif & siap digunakan.' });
  }
  
  if (action === 'setupSheet') {
    setupSheet();
    return responseJSON({ status: 'success', message: 'Seluruh sheet, header & folder Google Drive berhasil dibuat!' });
  }

  if (action === 'backupDrive') {
    var backupRes = autoBackupToDrive();
    return responseJSON(backupRes);
  }
  
  if (action === 'fetchData') {
    return responseJSON(getAllData());
  }
  
  return responseJSON({ status: 'success', message: 'Google Apps Script Backend Active' });
}

function doPost(e) {
  try {
    var contents = e.postData ? e.postData.contents : '{}';
    var payload = JSON.parse(contents);
    var action = payload.action;
    var data = payload.data;
    
    if (action === 'ping') {
      return responseJSON({ status: 'success', message: 'Ping OK' });
    }
    
    if (action === 'setupSheet') {
      setupSheet();
      return responseJSON({ status: 'success', message: 'Setup sheet berhasil.' });
    }

    if (action === 'backupDrive') {
      var backupRes = autoBackupToDrive();
      return responseJSON(backupRes);
    }
    
    // 1. Students CRUD (Termasuk RFID, Height, Weight, Shirt, Pants)
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
        data.pantsSize || ''
      ]);
      return responseJSON({ status: 'success', message: 'Data siswa disimpan' });
    }
    if (action === 'deleteStudent') {
      deleteRowById('Students', 0, data.id);
      return responseJSON({ status: 'success', message: 'Siswa dihapus' });
    }
    
    // 2. Violations CRUD
    if (action === 'addViolation' || action === 'updateViolation') {
      saveOrUpdateRow('Violations', 0, data.id, [
        data.id,
        data.date,
        data.studentId,
        data.studentName,
        data.level,
        data.violation,
        data.sanction,
        data.note || '',
        data.reporter || '',
        data.photo || ''
      ]);
      return responseJSON({ status: 'success', message: 'Pelanggaran disimpan' });
    }
    if (action === 'deleteViolation') {
      deleteRowById('Violations', 0, data.id);
      return responseJSON({ status: 'success', message: 'Pelanggaran dihapus' });
    }
    
    // 3. Counseling CRUD
    if (action === 'addCounseling' || action === 'updateCounseling') {
      saveOrUpdateRow('Counseling', 0, data.id, [
        data.id,
        data.date,
        data.studentId,
        data.studentName,
        data.caseDescription,
        data.notes || '',
        data.followUp || '',
        data.counselor || '',
        data.status || 'Open'
      ]);
      return responseJSON({ status: 'success', message: 'Konseling disimpan' });
    }
    if (action === 'deleteCounseling') {
      deleteRowById('Counseling', 0, data.id);
      return responseJSON({ status: 'success', message: 'Konseling dihapus' });
    }
    
    // 4. Leaves CRUD
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
        data.status || 'Active'
      ]);
      return responseJSON({ status: 'success', message: 'Izin disimpan' });
    }
    if (action === 'deleteLeave') {
      deleteRowById('Leaves', 0, data.id);
      return responseJSON({ status: 'success', message: 'Izin dihapus' });
    }
    
    // 5. Daily Journals CRUD
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
        JSON.stringify(data.tasksSnapshot || [])
      ]);
      return responseJSON({ status: 'success', message: 'Jurnal disimpan' });
    }
    if (action === 'deleteJournal') {
      deleteRowById('DailyJournals', 0, data.id);
      return responseJSON({ status: 'success', message: 'Jurnal dihapus' });
    }
    
    // 6. Medical Records CRUD
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
        data.notes || ''
      ]);
      return responseJSON({ status: 'success', message: 'Rekam medis disimpan' });
    }
    if (action === 'deleteMedicalRecord') {
      deleteRowById('MedicalRecords', 0, data.id);
      return responseJSON({ status: 'success', message: 'Rekam medis dihapus' });
    }
    
    // 7. Report Cards CRUD
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
        rep.academicYear || '2025/2026'
      ]);
      return responseJSON({ status: 'success', message: 'Rapor disimpan' });
    }
    if (action === 'deleteReportCard') {
      deleteRowById('ReportCards', 0, data.studentId || data.id);
      return responseJSON({ status: 'success', message: 'Rapor dihapus' });
    }

    return responseJSON({ status: 'error', message: 'Aksi tidak dikenali: ' + action });
  } catch (err) {
    return responseJSON({ status: 'error', message: err.toString() });
  }
}

function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getAllData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return {
    status: 'success',
    students: getSheetDataAsObjects(ss, 'Students'),
    violations: getSheetDataAsObjects(ss, 'Violations'),
    counseling: getSheetDataAsObjects(ss, 'Counseling'),
    leaves: getSheetDataAsObjects(ss, 'Leaves'),
    dailyJournals: getSheetDataAsObjects(ss, 'DailyJournals'),
    medicalRecords: getSheetDataAsObjects(ss, 'MedicalRecords'),
    reportCards: getSheetDataAsObjects(ss, 'ReportCards'),
    announcements: getSheetDataAsObjects(ss, 'Announcements')
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

function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var schema = {
    'Students': ['NISN/ID', 'Nama Lengkap', 'Jenjang', 'Asrama', 'Wali Asuh', 'RFID Tag', 'Tinggi (cm)', 'Berat (kg)', 'Ukuran Baju', 'Ukuran Celana'],
    'Violations': ['ID Kasus', 'Tanggal', 'NISN/ID', 'Nama Siswa', 'Tingkat', 'Bentuk Pelanggaran', 'Rekomendasi Sanksi', 'Catatan Kronologi', 'Pelapor', 'URL Berkas Bukti'],
    'Counseling': ['ID Sesi', 'Tanggal', 'NISN/ID', 'Nama Siswa', 'Permasalahan', 'Hasil Sesi Konseling', 'Rencana Tindak Lanjut', 'Konselor/Wali', 'Status'],
    'Leaves': ['ID Surat', 'NISN/ID', 'Nama Siswa', 'Kategori Izin', 'Alasan', 'Tgl Berangkat', 'Tgl Kembali', 'Wali Asuh Pendamping', 'Status'],
    'DailyJournals': ['ID Jurnal', 'Tanggal', 'NISN/ID', 'Nama Siswa', 'Rentang Waktu', 'Total Selesai', 'Total Tugas', 'Catatan Wali', 'Detail Snapshot (JSON)'],
    'MedicalRecords': ['ID Rekam Medis', 'NISN/ID', 'Nama Siswa', 'Tanggal', 'Waktu/Jam', 'Lokasi', 'Gejala', 'Diagnosa', 'Tindakan/Obat', 'Lama Istirahat (Hari)', 'Izin Istirahat?', 'Status Pemulihan', 'Petugas Medis', 'Suhu Tubuh', 'Tanda Vital/Tekanan Darah', 'Catatan Medis'],
    'ReportCards': ['NISN/ID', 'Nama Siswa', 'Predikat Nilai (JSON)', 'Deskripsi Nilai (JSON)', 'Catatan Perkembangan', 'Wali Asuh TTD', 'NIP Wali Asuh', 'Semester', 'Tahun Ajaran'],
    'Announcements': ['ID Pengumuman', 'Pesan', 'Status Aktif']
  };
  
  for (var sheetName in schema) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    var headers = schema[sheetName];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }

  // Buat folder backup di Google Drive otomatis
  getOrCreateDriveFolder("BACKUP_SEKOLAH_RAKYAT_SR31");
}

/**
 * FUNGSI BACKUP OTOMATIS KE GOOGLE DRIVE
 */
function autoBackupToDrive() {
  try {
    var folder = getOrCreateDriveFolder("BACKUP_SEKOLAH_RAKYAT_SR31");
    var allData = getAllData();
    var now = new Date();
    var timeStamp = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd_HH-mm-ss");
    var fileName = "Backup_SekolahRakyat_" + timeStamp + ".json";
    
    var file = folder.createFile(fileName, JSON.stringify(allData, null, 2), MimeType.PLAIN_TEXT);
    return {
      status: 'success',
      message: 'Backup otomatis ke Google Drive berhasil disimpan!',
      fileName: fileName,
      fileUrl: file.getUrl(),
      folderUrl: folder.getUrl()
    };
  } catch (err) {
    return { status: 'error', message: 'Gagal backup Drive: ' + err.toString() };
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

/**
 * PEMICU TRIGGER OTOMATIS HARIAN (RUN AT 23:00 NIGHTLY)
 */
function createDailyBackupTrigger() {
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
  Logger.log("Trigger backup otomatis ke Google Drive harian berhasil diaktifkan pada jam 23:00.");
}
`;

