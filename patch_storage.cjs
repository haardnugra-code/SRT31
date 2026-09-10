const fs = require('fs');
let code = fs.readFileSync('src/services/storage.ts', 'utf-8');
code = code.replace(
  /export const DEFAULT_SCRIPT_URL = ".*";/,
  'export const DEFAULT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxva2GX_N3-ogOwiy0b-VShpbZ-vC_UKR_t6eKPtBX0yvWTnSiBVoud7VdPDNHYzCrkmA/exec";'
);
fs.writeFileSync('src/services/storage.ts', code);
