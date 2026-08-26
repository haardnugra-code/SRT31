const fs = require('fs');
let code = fs.readFileSync('src/services/googleAppsScriptCode.ts', 'utf8');

// Add ConnectingJournals and MenstruationRecords to getAllData
code = code.replace(
  "prayerAttendance: getSheetDataAsObjects(ss, 'PrayerAttendance')",
  "prayerAttendance: getSheetDataAsObjects(ss, 'PrayerAttendance'),\n    connectingJournals: getSheetDataAsObjects(ss, 'ConnectingJournals'),\n    menstruationRecords: getSheetDataAsObjects(ss, 'MenstruationRecords')"
);

// Add ConnectingJournals and MenstruationRecords to sheetConfigs
const newConfigs = `    'PrayerAttendance': {
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
    },`;
code = code.replace(
  /    'PrayerAttendance': {[\s\S]*?    },/,
  newConfigs
);

// Add crud operations
const crudOps = `
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
`;
code = code.replace(
  "    // 7. RAPOR PERKEMBANGAN ASRAMA (REPORT CARDS)",
  crudOps + "\n    // 7. RAPOR PERKEMBANGAN ASRAMA (REPORT CARDS)"
);

// Add to total records in backup
code = code.replace(
  "(allData.prayerAttendance ? allData.prayerAttendance.length : 0);",
  "(allData.prayerAttendance ? allData.prayerAttendance.length : 0) +\n                       (allData.connectingJournals ? allData.connectingJournals.length : 0) +\n                       (allData.menstruationRecords ? allData.menstruationRecords.length : 0);"
);

// Clean up Shadow Data targets
const newTargets = `      { name: 'Violations', idCol: 2, nameCol: 3 },
      { name: 'Counseling', idCol: 3, nameCol: 4 },
      { name: 'Leaves', idCol: 1, nameCol: 2 },
      { name: 'DailyJournals', idCol: 2, nameCol: 3 },
      { name: 'MedicalRecords', idCol: 1, nameCol: 2 },
      { name: 'ReportCards', idCol: 0, nameCol: 1 },
      { name: 'PrayerAttendance', idCol: 2, nameCol: 3 },
      { name: 'ConnectingJournals', idCol: 3, nameCol: 4 },
      { name: 'MenstruationRecords', idCol: 1, nameCol: 2 }`;
code = code.replace(
  /      \{ name: 'Violations'[\s\S]*?name: 'PrayerAttendance', idCol: 2, nameCol: 3 \}/,
  newTargets
);

fs.writeFileSync('src/services/googleAppsScriptCode.ts', code);
console.log("Done patching googleAppsScriptCode.ts");
