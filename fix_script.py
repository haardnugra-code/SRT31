import re

with open('Code.gs', 'r') as f:
    content = f.read()

new_func = """function cleanShadowData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var studentSheet = ss.getSheetByName('Students');
    if (!studentSheet) return { status: 'error', message: 'Sheet Students tidak ditemukan.' };

    var studentData = studentSheet.getDataRange().getValues();
    if (studentData.length <= 1) return { status: 'success', message: 'Tidak ada data siswa master untuk divalidasi.' };

    var studentMap = {};
    for (var i = 1; i < studentData.length; i++) {
      var id = String(studentData[i][0]).trim().toLowerCase();
      var name = String(studentData[i][1]).trim();
      if (id) {
        studentMap[id] = { id: id, name: name };
      }
    }

    var fixedCount = 0;
    var deletedCount = 0;
    var targetSheets = [
      { name: 'Violations', idCol: 2, nameCol: 3 },
      { name: 'Counseling', idCol: 3, nameCol: 4 },
      { name: 'Leaves', idCol: 1, nameCol: 2 },
      { name: 'DailyJournals', idCol: 2, nameCol: 3 },
      { name: 'MedicalRecords', idCol: 1, nameCol: 2 },
      { name: 'ReportCards', idCol: 0, nameCol: 1 },
      { name: 'PrayerAttendance', idCol: 2, nameCol: 3 }
    ];

    for (var s = 0; s < targetSheets.length; s++) {
      var conf = targetSheets[s];
      var sh = ss.getSheetByName(conf.name);
      if (!sh) continue;

      var range = sh.getDataRange();
      var rows = range.getValues();
      if (rows.length <= 1) continue;

      var modified = false;
      var rowsToDelete = [];
      
      for (var r = 1; r < rows.length; r++) {
        var rowId = String(rows[r][conf.idCol]).trim().toLowerCase();
        var rowName = String(rows[r][conf.nameCol]).trim();

        if (rowId) {
          if (studentMap[rowId]) {
            var masterName = studentMap[rowId].name;
            if (rowName !== masterName) {
              rows[r][conf.nameCol] = masterName;
              fixedCount++;
              modified = true;
            }
          } else {
            // Orphaned record found
            rowsToDelete.push(r + 1);
          }
        }
      }
      
      // Hapus baris yatim piatu dari bawah ke atas agar indeks tidak bergeser
      for (var d = rowsToDelete.length - 1; d >= 0; d--) {
        sh.deleteRow(rowsToDelete[d]);
        deletedCount++;
      }

      if (modified) {
        // Karena ada baris yang dihapus, kita ambil range yang baru jika ingin menyimpan nama yang dimodifikasi
        // Tapi setValues harus sama ukurannya. Jadi lebih aman kita update sel satu per satu atau tulis ulang.
        // Agar aman, tulis ulang tanpa baris yang dihapus:
        var updatedRows = rows.filter(function(row, index) {
          return rowsToDelete.indexOf(index + 1) === -1;
        });
        sh.clearContents();
        sh.getRange(1, 1, updatedRows.length, updatedRows[0].length).setValues(updatedRows);
      }
    }

    return {
      status: 'success',
      message: 'Rekonsiliasi Data Shadow Selesai! ' + fixedCount + ' data nama diselaraskan, ' + deletedCount + ' data yatim (shadow) dihapus.',
      fixedCount: fixedCount,
      deletedCount: deletedCount
    };
  } catch (err) {
    return { status: 'error', message: 'Gagal membersihkan data shadow: ' + err.toString() };
  }
}"""

# Find all occurrences of function cleanShadowData() { ... } and replace with new_func
pattern = r'function cleanShadowData\(\)\s*\{.*?(?=\n// ===|\nfunction|\n$)'
result = re.sub(pattern, new_func, content, flags=re.DOTALL)

with open('Code.gs', 'w') as f:
    f.write(result)
with open('src/services/googleAppsScriptCode.ts', 'r') as f:
    ts_content = f.read()

ts_result = re.sub(pattern, new_func, ts_content, flags=re.DOTALL)
with open('src/services/googleAppsScriptCode.ts', 'w') as f:
    f.write(ts_result)
