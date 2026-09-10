const DEFAULT_FALLBACK_DORMS = [
  "Asrama Dewantara",
  "Asrama Pattimura",
  "Asrama Teuku Umar",
  "Asrama Cut Nyak Dien",
  "Asrama RA Kartini",
  "Asrama Dewi Sartika"
];

/**
 * Normalizes a raw string for comparing dorm identities.
 * Removes prefixes like "Asrama", "Gedung", "Kamar", "Blok", punctuation, and whitespace.
 */
export function getDormKey(raw?: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .replace(/^(asrama|gedung|kamar|blok|dorm)\s+/i, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Title cases words in a string, respecting common acronyms.
 */
function formatDormWords(str: string): string {
  return str
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      const upper = word.toUpperCase();
      if (upper === 'RA' || upper === 'R.A.' || upper === 'SD' || upper === 'SMP' || upper === 'SMA') {
        return 'RA';
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Returns a canonical, unified dorm name for grouping.
 * Merges variations like "Dewantara", "asrama dewantara", "ASRAMA DEWANTARA", "Gedung Dewantara"
 * into a single canonical name (e.g. "Asrama Dewantara").
 */
export function getCanonicalDormName(rawDorm?: string, knownList?: string[]): string {
  if (!rawDorm || !rawDorm.trim()) {
    return 'Asrama Utama';
  }

  const cleaned = rawDorm.trim().replace(/\s+/g, ' ');
  const targetKey = getDormKey(cleaned);

  if (!targetKey) {
    return 'Asrama Utama';
  }

  // Combine known list with defaults
  const candidates = [
    ...(knownList || []),
    ...DEFAULT_FALLBACK_DORMS
  ];

  // Try to find an exact key match in the candidate list
  for (const candidate of candidates) {
    if (getDormKey(candidate) === targetKey) {
      return candidate.trim();
    }
  }

  // If not in candidate list, format cleanly
  const hasPrefix = /^(asrama|gedung|wisma|paviliun|pavilion|mess|barak|blok|kamar|rusunawa|residence|villa|unit)\s+/i.test(cleaned);
  if (hasPrefix) {
    return formatDormWords(cleaned);
  }

  return formatDormWords(cleaned);
}

/**
 * Consolidates a list of dorm names by merging duplicates and variations
 * (e.g. "Dewantara", "Asrama Dewantara", "asrama dewantara", "Gedung Dewantara")
 * into a single unified canonical dorm name.
 */
export function consolidateDormList(list?: string[]): string[] {
  if (!list || !Array.isArray(list)) return [];
  const map = new Map<string, string>(); // key: getDormKey -> canonical name

  for (const raw of list) {
    if (!raw) continue;
    const trimmed = String(raw).trim();
    if (!trimmed) continue;
    const key = getDormKey(trimmed);
    if (!key) continue;

    if (!map.has(key)) {
      // Pick best representation
      const canonical = getCanonicalDormName(trimmed, list);
      map.set(key, canonical);
    }
  }

  return Array.from(map.values());
}

