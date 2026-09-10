const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');
code = code.replace(
  /      specialCases\n    \]\n  \);\n\n  \/\/ --- Real-Time Connection Ping Check ---/,
  '      specialCases,\n      psychologicalAssessments\n    ]\n  );\n\n  // --- Real-Time Connection Ping Check ---'
);
fs.writeFileSync('src/App.tsx', code);
