const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace ping if it exists
code = code.replace(
  /fetch\(\`\$\{config\.googleScriptUrl\}\?action=ping\`/g,
  'fetch(`${config.googleScriptUrl}?action=ping`'
);

// Replace fetchData
const fetchLine = 'const response = await fetch(`${config.googleScriptUrl}?action=fetchData`);';
const newFetchLine = `        // Call the new GAS API
        const response = await fetch(\`\${config.googleScriptUrl}?action=getAllData\`);`;
code = code.replace(fetchLine, newFetchLine);

// Since the GAS returns capitalized keys: 'Students', 'Violations', we need to map them back for the rest of App.tsx logic
const mapLogic = `
        if (resJson.status === 'success' || !resJson.status) {
          // Map new GAS keys to App.tsx expected keys
          const mappedRes = {
             status: 'success',
             students: resJson.Students || [],
             violations: resJson.Violations || [],
             counseling: resJson.Counseling || [],
             leaves: resJson.Leaves || [],
             medicalRecords: resJson.Medical || [],
             journals: resJson.DailyJournals || [],
             prayerAttendance: resJson.PrayerAttendance || [],
             menstruationRecords: resJson.Menstruation || [],
             psychologicalAssessments: resJson.PsychologicalAssessments || [],
             specialCases: resJson.SpecialChronology || [],
             dormInspections: resJson.DormInspection || [],
             dormAssets: resJson.DormAsset || [],
             announcements: []
          };
          
          // Re-assign to resJson so the rest of the function works exactly as before
          Object.assign(resJson, mappedRes);
`;

code = code.replace(/if \(resJson\.status === 'success'\) \{/, mapLogic);

// Now for the POST (sync to cloud). 
// The user's GAS supports:
// if (action === 'sync') { let result = handleSyncData(payload.data); ... }

// Let's add a bulk POST push at the very end of syncCloudData, before it resolves.
// We will look for: saveLastIntegrityReport(integrityReport);

const pushLogic = `          saveLastIntegrityReport(integrityReport);
          setLastIntegrityReport(integrityReport);

          // NEW: Push all local data to cloud (Bulk Sync)
          try {
            await fetch(config.googleScriptUrl, {
              method: 'POST',
              body: JSON.stringify({
                action: 'sync',
                data: {
                  Students: reconciled.students,
                  Violations: reconciled.violations,
                  Counseling: reconciled.counseling,
                  Leaves: reconciled.leaves,
                  Medical: reconciled.medicalRecords,
                  DailyJournals: reconciled.dailyJournals,
                  PrayerAttendance: reconciled.prayerAttendance,
                  PsychologicalAssessments: psychologicalAssessments,
                  DormInspection: dormInspections,
                  DormAsset: dormAssets
                }
              })
            });
          } catch(e) {
            console.error('Failed to bulk push to cloud', e);
          }
`;

code = code.replace(/saveLastIntegrityReport\(integrityReport\);\n\s*setLastIntegrityReport\(integrityReport\);/, pushLogic);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx patched for sync');
