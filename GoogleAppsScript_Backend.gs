/**
 * ==============================================================================
 * KODE BACKEND GOOGLE APPS SCRIPT - SISTEM KEASRAMAAN & PENYIMPANAN OTOMATIS JSON
 * ==============================================================================
 * Fitur:
 * 1. Manajemen Database Multi-Sheet Otomatis (Siswa, Pelanggaran, Asesmen MMPI, Medis, dll).
 * 2. Penyimpanan Real-Time Perubahan Data Siswa & Semua Modul.
 * 3. Penyimpanan Cadangan Otomatis File JSON ke Folder Google Drive ("Backup_JSON").
 * 4. Penanganan File Lampiran (Foto / Dokumen PDF) ke Folder "Lampiran_Berkas".
 * 
 * Cara Penggunaan:
 * 1. Buka script.google.com atau Google Apps Script proyek Anda.
 * 2. Ganti seluruh isi file Code.gs dengan kode ini.
 * 3. Simpan dan jalankan fungsi `setupEnvironment` (Review Permissions jika diminta).
 * 4. Terapkan (Deploy) > Kelola Penerapan / Penerapan Baru > Web App (Akses: Siapa Saja).
 * ==============================================================================
 */

const FOLDER_DB_NAME = 'Database_Keasramaan_Siswa';
const SPREADSHEET_NAME = 'DB_Keasramaan_Master';
const FOLDER_BACKUP_NAME = 'Backup_JSON';
const FOLDER_ATTACHMENT_NAME = 'Lampiran_Berkas';

// Skema tabel (Sheet) yang dibuat otomatis
const SCHEMAS = {
  'Config': ['id', 'schoolName', 'kopKiri', 'kopKanan', 'semester', 'academicYear', 'headmasterName', 'headmasterNip', 'updatedAt'],
  'Students': ['id', 'nisn', 'rfidTag', 'name', 'class', 'dorm', 'caretaker', 'gender', 'height', 'weight', 'medicalHistory', 'parentPhone', 'birthDate', 'shirtSize', 'pantsSize', 'createdAt', 'updatedAt'],
  'Violations': ['id', 'studentId', 'studentName', 'studentClass', 'studentDorm', 'date', 'time', 'location', 'category', 'description', 'points', 'handledBy', 'followUp', 'status', 'createdAt', 'updatedAt'],
  'Counseling': ['id', 'studentId', 'studentName', 'date', 'caseDescription', 'notes', 'followUp', 'counselor', 'status', 'createdAt'],
  'Leaves': ['id', 'studentId', 'studentName', 'studentClass', 'studentDorm', 'leaveDate', 'returnDate', 'reason', 'status', 'approvedBy', 'companion', 'notes', 'createdAt', 'updatedAt'],
  'Medical': ['id', 'studentId', 'studentName', 'date', 'time', 'location', 'complaint', 'diagnosis', 'treatment', 'isSickLeave', 'restUntil', 'handledBy', 'createdAt'],
  'DailyJournals': ['id', 'studentId', 'studentName', 'date', 'time', 'activity', 'description', 'status', 'supervisor', 'createdAt'],
  'PrayerAttendance': ['id', 'studentId', 'studentName', 'date', 'prayerName', 'status', 'notes', 'recordedBy', 'createdAt'],
  'Menstruation': ['id', 'studentId', 'studentName', 'startDate', 'endDate', 'status', 'notes', 'recordedBy', 'createdAt'],
  'PsychologicalAssessments': ['id', 'studentId', 'studentName', 'testType', 'testTitle', 'date', 'totalScore', 'overallStatus', 'overallStatusLabel', 'filledBy', 'assessorName', 'createdAt', 'dimensionScores_JSON', 'psychologicalConsiderations_JSON', 'recommendations_JSON'],
  'SpecialChronology': ['id', 'date', 'time', 'title', 'location', 'description', 'involvedParties_JSON', 'reporter', 'status', 'createdAt'],
  'DormInspection': ['id', 'dormName', 'date', 'time', 'inspector', 'grade', 'totalScore', 'actionRequired', 'notes', 'createdAt'],
  'DormAsset': ['id', 'dormName', 'assetName', 'category', 'condition', 'quantity', 'lastChecked', 'checkedBy', 'notes'],
  'FileAttachments': ['id', 'fileName', 'mimeType', 'driveUrl', 'driveId', 'uploadedAt', 'relatedEntityId']
};

/**
 * Inisialisasi Lingkungan Spreadsheet & Folder Drive
 */
function setupEnvironment() {
  let folders = DriveApp.getFoldersByName(FOLDER_DB_NAME);
  let folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(FOLDER_DB_NAME);
  
  // Buat sub-folder Lampiran dan Backup JSON
  let attachFolders = folder.getFoldersByName(FOLDER_ATTACHMENT_NAME);
  if (!attachFolders.hasNext()) folder.createFolder(FOLDER_ATTACHMENT_NAME);

  let backupFolders = folder.getFoldersByName(FOLDER_BACKUP_NAME);
  if (!backupFolders.hasNext()) folder.createFolder(FOLDER_BACKUP_NAME);

  // Buat atau buka Spreadsheet
  let files = folder.getFilesByName(SPREADSHEET_NAME);
  let ss = files.hasNext() ? SpreadsheetApp.openById(files.next().getId()) : SpreadsheetApp.create(SPREADSHEET_NAME);
  
  if (!files.hasNext()) {
    let ssFile = DriveApp.getFileById(ss.getId());
    ssFile.moveTo(folder);
  }
  
  // Setup seluruh Sheet
  for (let sheetName in SCHEMAS) {
    let sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
    let headers = SCHEMAS[sheetName];
    let currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0];
    
    if (!currentHeaders || currentHeaders[0] === '') {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#e2e8f0');
      sheet.setFrozenRows(1);
    }
  }
  
  let defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) ss.deleteSheet(defaultSheet);
  
  PropertiesService.getScriptProperties().setProperty('DB_SS_ID', ss.getId());
  Logger.log("SETUP BERHASIL!\nSpreadsheet: " + ss.getUrl() + "\nFolder Drive: " + folder.getUrl());
}

/**
 * Handle HTTP GET
 */
function doGet(e) {
  const action = e.parameter ? e.parameter.action : '';
  
  if (action === 'ping') {
    return respondJSON({ status: 'success', message: 'Database API Online & Siap Digunakan', timestamp: new Date().toISOString() });
  }
  
  if (action === 'getAllData' || action === 'fetchData') {
    return respondJSON(fetchAllData());
  }

  if (action === 'backupDrive' || action === 'backupJSON') {
    let backupRes = autoSaveDatabaseJSONToDrive();
    return respondJSON(backupRes);
  }

  return respondJSON({ status: 'error', message: 'Aksi GET tidak dikenali' }, 400);
}

/**
 * Handle HTTP POST (Menerima perubahan real-time & sinkronisasi bulk)
 */
function doPost(e) {
  try {
    let payload = JSON.parse(e.postData.contents);
    let action = payload.action;
    let data = payload.data;
    
    // 1. Bulk Sync
    if (action === 'sync') {
      let result = handleSyncData(data);
      // Simpan juga snapshot backup JSON otomatis di Google Drive
      try { autoSaveDatabaseJSONToDrive(); } catch(err){}
      return respondJSON({ status: 'success', message: 'Data berhasil disinkronisasi & di-backup JSON', result: result });
    }
    
    // 2. Real-Time Student Mutation
    if (action === 'addStudent' || action === 'updateStudent') {
      upsertSingleRecord('Students', data);
      return respondJSON({ status: 'success', message: 'Data siswa tersimpan real-time' });
    }
    if (action === 'deleteStudent') {
      deleteSingleRecord('Students', data ? data.id : null);
      return respondJSON({ status: 'success', message: 'Data siswa berhasil dihapus' });
    }

    // 3. Real-Time Violations
    if (action === 'addViolation' || action === 'updateViolation') {
      upsertSingleRecord('Violations', data);
      return respondJSON({ status: 'success', message: 'Pelanggaran tersimpan' });
    }
    if (action === 'deleteViolation') {
      deleteSingleRecord('Violations', data ? data.id : null);
      return respondJSON({ status: 'success', message: 'Pelanggaran dihapus' });
    }

    // 4. Real-Time Counseling
    if (action === 'addCounseling' || action === 'updateCounseling') {
      upsertSingleRecord('Counseling', data);
      return respondJSON({ status: 'success', message: 'Konseling tersimpan' });
    }
    if (action === 'deleteCounseling') {
      deleteSingleRecord('Counseling', data ? data.id : null);
      return respondJSON({ status: 'success', message: 'Konseling dihapus' });
    }

    // 5. Real-Time Leaves (Izin Keluar)
    if (action === 'addLeave' || action === 'updateLeave') {
      upsertSingleRecord('Leaves', data);
      return respondJSON({ status: 'success', message: 'Izin keluar tersimpan' });
    }
    if (action === 'deleteLeave') {
      deleteSingleRecord('Leaves', data ? data.id : null);
      return respondJSON({ status: 'success', message: 'Izin keluar dihapus' });
    }

    // 6. Real-Time Medical (Klinik / UKS)
    if (action === 'addMedicalRecord' || action === 'updateMedicalRecord') {
      upsertSingleRecord('Medical', data);
      return respondJSON({ status: 'success', message: 'Rekam medis tersimpan' });
    }
    if (action === 'deleteMedicalRecord') {
      deleteSingleRecord('Medical', data ? data.id : null);
      return respondJSON({ status: 'success', message: 'Rekam medis dihapus' });
    }

    // 7. Real-Time Journals
    if (action === 'addDailyJournal' || action === 'updateDailyJournal') {
      upsertSingleRecord('DailyJournals', data);
      return respondJSON({ status: 'success', message: 'Jurnal harian tersimpan' });
    }
    if (action === 'deleteDailyJournal') {
      deleteSingleRecord('DailyJournals', data ? data.id : null);
      return respondJSON({ status: 'success', message: 'Jurnal harian dihapus' });
    }

    // 8. Real-Time Prayer Attendance
    if (action === 'addPrayerAttendance' || action === 'updatePrayerAttendance') {
      upsertSingleRecord('PrayerAttendance', data);
      return respondJSON({ status: 'success', message: 'Absensi ibadah tersimpan' });
    }

    // 9. Real-Time Menstruation
    if (action === 'addMenstruationRecord' || action === 'updateMenstruationRecord') {
      upsertSingleRecord('Menstruation', data);
      return respondJSON({ status: 'success', message: 'Rekam menstruasi tersimpan' });
    }
    if (action === 'deleteMenstruationRecord') {
      deleteSingleRecord('Menstruation', data ? data.id : null);
      return respondJSON({ status: 'success', message: 'Rekam menstruasi dihapus' });
    }

    // 10. Real-Time Psychological Assessment (MMPI dll)
    if (action === 'addPsychologicalAssessment' || action === 'updatePsychologicalAssessment') {
      upsertSingleRecord('PsychologicalAssessments', data);
      return respondJSON({ status: 'success', message: 'Asesmen psikologi tersimpan' });
    }
    if (action === 'deletePsychologicalAssessment') {
      deleteSingleRecord('PsychologicalAssessments', data ? data.id : null);
      return respondJSON({ status: 'success', message: 'Asesmen psikologi dihapus' });
    }

    // 11. Upload File Lampiran
    if (action === 'uploadFile') {
      let result = handleFileUpload(payload.fileName, payload.base64Data, payload.mimeType, payload.relatedEntityId);
      return respondJSON({ status: 'success', message: 'File berhasil diunggah', fileData: result });
    }

    // 12. Backup Manual JSON ke Drive
    if (action === 'backupDrive' || action === 'backupJSON') {
      let backupRes = autoSaveDatabaseJSONToDrive();
      return respondJSON(backupRes);
    }
    
    return respondJSON({ status: 'error', message: 'Aksi POST tidak dikenal: ' + action }, 400);
  } catch (error) {
    return respondJSON({ status: 'error', message: error.toString() }, 500);
  }
}

/**
 * HELPER: Simpan atau update 1 record tunggal secara real-time
 */
function upsertSingleRecord(sheetName, record) {
  if (!record || !record.id) return;
  let ssId = PropertiesService.getScriptProperties().getProperty('DB_SS_ID');
  let ss = SpreadsheetApp.openById(ssId);
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;

  let headers = SCHEMAS[sheetName];
  let data = sheet.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(record.id)) {
      rowIndex = i + 1;
      break;
    }
  }

  let rowArray = headers.map(h => {
    let val = record[h] || record[h.replace('_JSON', '')];
    if (typeof val === 'object' && val !== null) return JSON.stringify(val);
    return val === undefined ? '' : val;
  });

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowArray.length).setValues([rowArray]);
  } else {
    sheet.appendRow(rowArray);
  }
}

/**
 * HELPER: Hapus 1 record berdasarkan ID
 */
function deleteSingleRecord(sheetName, id) {
  if (!id) return;
  let ssId = PropertiesService.getScriptProperties().getProperty('DB_SS_ID');
  let ss = SpreadsheetApp.openById(ssId);
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;

  let data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

/**
 * HELPER: Fetch semua data dari seluruh sheet
 */
function fetchAllData() {
  let ssId = PropertiesService.getScriptProperties().getProperty('DB_SS_ID');
  if (!ssId) throw new Error("Database belum disetup. Jalankan setupEnvironment().");
  
  let ss = SpreadsheetApp.openById(ssId);
  let allData = { status: 'success' };
  
  for (let sheetName in SCHEMAS) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      allData[sheetName] = [];
      continue;
    }
    
    let values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      allData[sheetName] = [];
      continue;
    }
    
    let headers = values[0];
    allData[sheetName] = values.slice(1).map(row => {
      let obj = {};
      headers.forEach((h, i) => {
        let val = row[i];
        if (h.endsWith('_JSON') && val) {
          try { val = JSON.parse(val); } catch(e) {}
        }
        obj[h] = val;
      });
      return obj;
    });
  }
  
  return allData;
}

/**
 * HELPER: Sinkronisasi Bulk Data
 */
function handleSyncData(syncPayload) {
  let ssId = PropertiesService.getScriptProperties().getProperty('DB_SS_ID');
  let ss = SpreadsheetApp.openById(ssId);
  let resultSummary = {};
  
  for (let sheetName in syncPayload) {
    let records = syncPayload[sheetName];
    if (!records || !Array.isArray(records) || records.length === 0) continue;
    
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) continue;
    
    let headers = SCHEMAS[sheetName];
    let existingData = sheet.getDataRange().getValues();
    let existingIds = {};
    
    if (existingData.length > 1) {
      for (let i = 1; i < existingData.length; i++) {
        existingIds[String(existingData[i][0])] = i + 1;
      }
    }
    
    let updatedCount = 0;
    let newCount = 0;
    
    records.forEach(record => {
      let rowArray = headers.map(header => {
        let val = record[header] || record[header.replace('_JSON', '')];
        if (typeof val === 'object' && val !== null) return JSON.stringify(val);
        return val === undefined ? '' : val;
      });
      
      let recId = String(record.id);
      if (existingIds[recId]) {
        sheet.getRange(existingIds[recId], 1, 1, rowArray.length).setValues([rowArray]);
        updatedCount++;
      } else {
        sheet.appendRow(rowArray);
        newCount++;
      }
    });
    
    resultSummary[sheetName] = { updated: updatedCount, inserted: newCount };
  }
  
  return resultSummary;
}

/**
 * HELPER: Otomatis Ekspor Seluruh Database ke File JSON di Google Drive
 */
function autoSaveDatabaseJSONToDrive() {
  let folders = DriveApp.getFoldersByName(FOLDER_DB_NAME);
  if (!folders.hasNext()) return { status: 'error', message: 'Folder database tidak ditemukan' };
  
  let rootFolder = folders.next();
  let backupFolders = rootFolder.getFoldersByName(FOLDER_BACKUP_NAME);
  let backupFolder = backupFolders.hasNext() ? backupFolders.next() : rootFolder.createFolder(FOLDER_BACKUP_NAME);
  
  let allData = fetchAllData();
  let timestamp = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd_HH-mm-ss");
  let fileName = "Database_Keasramaan_" + timestamp + ".json";
  
  let jsonContent = JSON.stringify(allData, null, 2);
  let file = backupFolder.createFile(fileName, jsonContent, MimeType.PLAIN_TEXT);
  
  // Simpan juga file 'latest_backup.json' yang selalu update
  let latestFiles = backupFolder.getFilesByName("latest_database.json");
  if (latestFiles.hasNext()) {
    latestFiles.next().setContent(jsonContent);
  } else {
    backupFolder.createFile("latest_database.json", jsonContent, MimeType.PLAIN_TEXT);
  }
  
  return {
    status: 'success',
    message: 'File JSON otomatis tersimpan ke Google Drive: ' + fileName,
    fileUrl: file.getUrl(),
    folderUrl: backupFolder.getUrl()
  };
}

/**
 * HELPER: File Upload
 */
function handleFileUpload(fileName, base64Data, mimeType, relatedEntityId) {
  let folders = DriveApp.getFoldersByName(FOLDER_DB_NAME);
  if (!folders.hasNext()) throw new Error("Folder utama tidak ditemukan");
  
  let folder = folders.next();
  let attachFolders = folder.getFoldersByName(FOLDER_ATTACHMENT_NAME);
  let attachFolder = attachFolders.hasNext() ? attachFolders.next() : folder.createFolder(FOLDER_ATTACHMENT_NAME);
  
  let data = base64Data.indexOf('base64,') !== -1 ? base64Data.split('base64,')[1] : base64Data;
  let file = attachFolder.createFile(Utilities.newBlob(Utilities.base64Decode(data), mimeType, fileName));
  
  let sheet = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('DB_SS_ID')).getSheetByName('FileAttachments');
  if (sheet) {
    sheet.appendRow([Utilities.getUuid(), fileName, mimeType, file.getUrl(), file.getId(), new Date().toISOString(), relatedEntityId]);
  }
  
  return { url: file.getUrl(), id: file.getId() };
}

/**
 * HELPER: Format Response JSON
 */
function respondJSON(data, code = 200) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
