import re

def fix_file(filename):
    with open(filename, 'r') as f:
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

    # Remove all definitions of cleanShadowData
    content = re.sub(r'function cleanShadowData\(\)\s*\{.*?(?=\n// ===|\nfunction|\n\nfunction|\n$)', '', content, flags=re.DOTALL)
    # They might be stacked, so run it a few times to clear all duplicates
    content = re.sub(r'function cleanShadowData\(\)\s*\{.*?(?=\n// ===|\nfunction|\n\nfunction|\n$)', '', content, flags=re.DOTALL)
    content = re.sub(r'function cleanShadowData\(\)\s*\{.*?(?=\n// ===|\nfunction|\n\nfunction|\n$)', '', content, flags=re.DOTALL)

    # Insert it before the last menu function
    content = content.replace('// 9. MENU TOMBOL OTOMATIS', new_func + '\n\n// 9. MENU TOMBOL OTOMATIS')

    with open(filename, 'w') as f:
        f.write(content)

fix_file('Code.gs')
fix_file('src/services/googleAppsScriptCode.ts')
