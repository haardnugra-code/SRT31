const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');
code = code.replace(
  'DormAsset: dormAssets',
  'DormAsset: dormAssets,\n                  SpecialChronology: specialCases,\n                  Menstruation: menstruationRecords'
);
fs.writeFileSync('src/App.tsx', code);
