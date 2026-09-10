const fs = require('fs');
let code = fs.readFileSync('src/services/storage.ts', 'utf-8');

const loaderFunc = `export function loadConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    
    // Auto-migrate old default URL to new default URL
    if (parsed.googleScriptUrl === "https://script.google.com/macros/s/AKfycbwOscEltpKZ3aZP7h7-ZyzZHb-DUgZ5ZD9LxCrIMRQTscJ9cP0WKKWu5cFtOrISJXGuNA/exec") {
      parsed.googleScriptUrl = DEFAULT_SCRIPT_URL;
      localStorage.setItem(CONFIG_KEY, JSON.stringify(parsed));
    }
    
    return {
      ...DEFAULT_CONFIG,
      ...parsed
    };
  } catch (err) {
    return DEFAULT_CONFIG;
  }
}`;

// I'll just replace the original loadConfig function completely. Let's find it.
const origLoadConfig = code.match(/export function loadConfig\(\): AppConfig \{[\s\S]*?\n\}/)[0];
code = code.replace(origLoadConfig, loaderFunc);

fs.writeFileSync('src/services/storage.ts', code);
