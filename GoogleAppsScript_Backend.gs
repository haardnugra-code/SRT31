/**
 * ==============================================================================
 * KODE BACKEND GOOGLE APPS SCRIPT - SISTEM KEASRAMAAN
 * ==============================================================================
 * Cara Penggunaan:
 * 1. Buka Google Drive (drive.google.com).
 * 2. Buat Google Apps Script baru (New > More > Google Apps Script).
 * 3. Hapus kode default (Code.gs), lalu paste seluruh kode ini ke dalamnya.
 * 4. Klik tombol "Simpan" (ikon disket).
 * 5. Pilih fungsi `setupEnvironment` di dropdown atas, lalu klik "Jalankan" (Run).
 * 6. Beri izin (Review Permissions) yang diminta oleh Google.
 * 7. Setelah sukses berjalan, pergi ke menu "Terapkan" (Deploy) > "Penerapan Baru" (New deployment).
 * 8. Pilih jenis "Aplikasi Web" (Web App).
 *    - Jalankan sebagai: "Saya (email Anda)"
 *    - Siapa yang memiliki akses: "Siapa saja" (Anyone)
 * 9. Klik "Terapkan" (Deploy). 
 * 10. Salin URL Aplikasi Web yang muncul dan gunakan sebagai endpoint API di aplikasi React Anda.
 * ==============================================================================
 */

const FOLDER_DB_NAME = 'Database_Keasramaan_Siswa';
const SPREADSHEET_NAME = 'DB_Keasramaan_Master';

// Skema tabel (Sheet) yang akan dibuat otomatis
const SCHEMAS = {
  'Config': ['id', 'schoolName', 'kopKiri', 'kopKanan', 'semester', 'academicYear', 'headmasterName', 'headmasterNip', 'updatedAt'],
  'Students': ['id', 'nisn', 'rfidTag', 'name', 'class', 'dorm', 'caretaker', 'height', 'weight', 'medicalHistory', 'createdAt', 'updatedAt'],
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
 * Fungsi untuk menyiapkan Database Spreadsheet & Folder secara otomatis
 */
function setupEnvironment() {
  let folders = DriveApp.getFoldersByName(FOLDER_DB_NAME);
  let folder;
  
  // 1. Buat atau ambil Folder utama
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder(FOLDER_DB_NAME);
  }
  
  // 2. Buat sub-folder untuk lampiran file (PDF/Foto)
  let attachmentFolders = folder.getFoldersByName('Lampiran_Berkas');
  if (!attachmentFolders.hasNext()) {
    folder.createFolder('Lampiran_Berkas');
  }

  // 3. Buat atau ambil File Spreadsheet Master
  let files = folder.getFilesByName(SPREADSHEET_NAME);
  let ss;
  
  if (files.hasNext()) {
    ss = SpreadsheetApp.openById(files.next().getId());
  } else {
    ss = SpreadsheetApp.create(SPREADSHEET_NAME);
    let ssFile = DriveApp.getFileById(ss.getId());
    ssFile.moveTo(folder);
  }
  
  // 4. Setup setiap Sheet (Tab) beserta Header-nya
  for (let sheetName in SCHEMAS) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    let headers = SCHEMAS[sheetName];
    // Cek apakah header sudah ada
    let currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0];
    if (!currentHeaders || currentHeaders[0] === '') {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.getRange(1, 1, 1, headers.length).setBackground('#e2e8f0');
      sheet.setFrozenRows(1);
    }
  }
  
  // Hapus Sheet1 bawaan jika masih ada
  let defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }
  
  // Simpan ID Spreadsheet ke Properties agar mudah diakses
  PropertiesService.getScriptProperties().setProperty('DB_SS_ID', ss.getId());
  
  Logger.log("SETUP BERHASIL!");
  Logger.log("Folder URL: " + folder.getUrl());
  Logger.log("Spreadsheet URL: " + ss.getUrl());
}

/**
 * Handle HTTP GET - Menerima parameter ?action=...&sheetName=...
 */
function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'ping') {
    return respondJSON({ status: 'success', message: 'API is online' });
  }
  
  if (action === 'getAllData') {
    return respondJSON(fetchAllData());
  }

  return respondJSON({ status: 'error', message: 'Unknown GET action' }, 400);
}

/**
 * Handle HTTP POST - Menerima JSON Payload dari React App
 */
function doPost(e) {
  try {
    let payload = JSON.parse(e.postData.contents);
    let action = payload.action;
    
    if (action === 'sync') {
      let result = handleSyncData(payload.data);
      return respondJSON({ status: 'success', message: 'Data synced successfully', result: result });
    }
    
    if (action === 'uploadFile') {
      let result = handleFileUpload(payload.fileName, payload.base64Data, payload.mimeType, payload.relatedEntityId);
      return respondJSON({ status: 'success', message: 'File uploaded', fileData: result });
    }
    
    return respondJSON({ status: 'error', message: 'Unknown POST action' }, 400);
  } catch (error) {
    return respondJSON({ status: 'error', message: error.toString() }, 500);
  }
}

/**
 * HELPER: Fetch semua data dari seluruh sheet (cocok untuk load pertama kali)
 */
function fetchAllData() {
  let ssId = PropertiesService.getScriptProperties().getProperty('DB_SS_ID');
  if (!ssId) throw new Error("Database belum disetup. Jalankan setupEnvironment().");
  
  let ss = SpreadsheetApp.openById(ssId);
  let allData = {};
  
  for (let sheetName in SCHEMAS) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) continue;
    
    let dataRange = sheet.getDataRange();
    let values = dataRange.getValues();
    
    if (values.length <= 1) {
      allData[sheetName] = [];
      continue;
    }
    
    let headers = values[0];
    let rows = values.slice(1);
    
    let jsonArray = rows.map(row => {
      let obj = {};
      headers.forEach((header, index) => {
        let val = row[index];
        // Parse kembali field JSON stringify menjadi Object (jika mengandung kata _JSON)
        if (header.endsWith('_JSON') && val) {
          try { val = JSON.parse(val); } catch(e) { }
        }
        obj[header] = val;
      });
      return obj;
    });
    
    allData[sheetName] = jsonArray;
  }
  
  return allData;
}

/**
 * HELPER: Handle Sinkronisasi (Menyimpan/Update array data ke masing-masing Sheet)
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
    
    // Mapping ID row yang sudah ada (untuk update)
    if (existingData.length > 1) {
      for (let i = 1; i < existingData.length; i++) {
        let idVal = existingData[i][0]; // Asumsi kolom indeks 0 adalah 'id'
        existingIds[idVal] = i + 1; // +1 karena index Spreadsheet mulai dari 1
      }
    }
    
    let updatedCount = 0;
    let newCount = 0;
    
    records.forEach(record => {
      let rowArray = headers.map(header => {
        let val = record[header] || record[header.replace('_JSON', '')];
        if (typeof val === 'object' && val !== null) {
          return JSON.stringify(val);
        }
        return val === undefined ? '' : val;
      });
      
      let recId = record.id;
      if (existingIds[recId]) {
        // Update
        sheet.getRange(existingIds[recId], 1, 1, rowArray.length).setValues([rowArray]);
        updatedCount++;
      } else {
        // Insert
        sheet.appendRow(rowArray);
        newCount++;
      }
    });
    
    resultSummary[sheetName] = { updated: updatedCount, inserted: newCount };
  }
  
  return resultSummary;
}

/**
 * HELPER: Handle File Upload (Misal PDF Laporan, Foto Pelanggaran) ke sub-folder
 */
function handleFileUpload(fileName, base64Data, mimeType, relatedEntityId) {
  let folders = DriveApp.getFoldersByName(FOLDER_DB_NAME);
  if (!folders.hasNext()) throw new Error("Folder utama tidak ditemukan");
  
  let folder = folders.next();
  let attachFolders = folder.getFoldersByName('Lampiran_Berkas');
  let attachFolder = attachFolders.hasNext() ? attachFolders.next() : folder.createFolder('Lampiran_Berkas');
  
  // Pisahkan header base64 (contoh: data:image/png;base64,iVBOR...)
  let data = base64Data;
  if (base64Data.indexOf('base64,') !== -1) {
    data = base64Data.split('base64,')[1];
  }
  
  let decodedData = Utilities.base64Decode(data);
  let blob = Utilities.newBlob(decodedData, mimeType, fileName);
  
  let file = attachFolder.createFile(blob);
  
  // Simpan record ke sheet FileAttachments
  let ssId = PropertiesService.getScriptProperties().getProperty('DB_SS_ID');
  let ss = SpreadsheetApp.openById(ssId);
  let sheet = ss.getSheetByName('FileAttachments');
  
  if (sheet) {
    let id = Utilities.getUuid();
    sheet.appendRow([
      id, fileName, mimeType, file.getUrl(), file.getId(), new Date().toISOString(), relatedEntityId
    ]);
  }
  
  return {
    url: file.getUrl(),
    id: file.getId()
  };
}

/**
 * HELPER: Format Response JSON
 */
function respondJSON(data, code = 200) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
