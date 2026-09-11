const fs = require('fs');
let code = fs.readFileSync('src/components/StudentProfileTab.tsx', 'utf-8');
code = code.replace(
  "{currentStudent?.gender === 'Perempuan' && (",
  "{true && (" // Always show menstruation records snapshot
);
fs.writeFileSync('src/components/StudentProfileTab.tsx', code);
console.log('Patched');
