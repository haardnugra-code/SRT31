const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const backupFunc = `  const backupDatabaseToDrive = useCallback(async () => {
    if (!config.googleScriptUrl) return;
    try {
      await fetch(\`\${config.googleScriptUrl}?action=backupDrive\`, {
        method: 'GET',
        mode: 'no-cors'
      });
      console.log('Automated Drive backup triggered successfully.');
    } catch (e) {
      console.error('Failed to trigger automated Drive backup.', e);
    }
  }, [config.googleScriptUrl]);

  // --- Fetch Cloud Data Sync ---`;

code = code.replace('  // --- Fetch Cloud Data Sync ---', backupFunc);

const backupCall = `          // Tampilkan notifikasi ringkasan data yang berhasil diperbarui & status integritas
          showToast(
            integrityReport.summaryToastTitle,
            integrityReport.summaryToastMessage,
            integrityReport.overallStatus === 'warning' ? 'warning' : 'success',
            {
              label: 'Lihat Rincian Audit',
              onClick: () => setIsIntegrityModalOpen(true)
            },
            7000
          );
          
          // Auto trigger backup after successful sync
          backupDatabaseToDrive();`;

code = code.replace(/          \/\/ Tampilkan notifikasi ringkasan data yang berhasil diperbarui & status integritas\n          showToast\(\n            integrityReport\.summaryToastTitle,\n            integrityReport\.summaryToastMessage,\n            integrityReport\.overallStatus === 'warning' \? 'warning' : 'success',\n            {\n              label: 'Lihat Rincian Audit',\n              onClick: \(\) => setIsIntegrityModalOpen\(true\)\n            },\n            7000\n          \);/, backupCall);

const dependencies = `      specialCases,
      psychologicalAssessments,
      backupDatabaseToDrive
    ]`;

code = code.replace(/      specialCases,\n      psychologicalAssessments\n    \]/, dependencies);

fs.writeFileSync('src/App.tsx', code);
console.log('Patched');
