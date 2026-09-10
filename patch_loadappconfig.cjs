const fs = require('fs');
let code = fs.readFileSync('src/services/storage.ts', 'utf-8');

const oldCondition = "parsed.googleScriptUrl.includes('AKfycbyLuQMTdlNs5vk9-9mQIcuMx0QodSuzau2HoZI_ekbJLT6yh0qJpJYRPZEl6QFItbDF')";
const newCondition = "parsed.googleScriptUrl.includes('AKfycbyLuQMTdlNs5vk9-9mQIcuMx0QodSuzau2HoZI_ekbJLT6yh0qJpJYRPZEl6QFItbDF') || parsed.googleScriptUrl.includes('AKfycbwOscEltpKZ3aZP7h7-ZyzZHb-DUgZ5ZD9LxCrIMRQTscJ9cP0WKKWu5cFtOrISJXGuNA')";

code = code.replace(oldCondition, newCondition);
fs.writeFileSync('src/services/storage.ts', code);
