const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');
let match = code.match(/fetch\(config\.googleScriptUrl/g);
console.log(match ? match.length : 0);
