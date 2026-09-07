import { DEFAULT_CONFIG } from '../services/storage';

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
    ...(DEFAULT_CONFIG.dormList || [])
  ];

  // Try to find an exact key match in the candidate list
  for (const candidate of candidates) {
    if (getDormKey(candidate) === targetKey) {
      return candidate.trim();
    }
  }

  // If not in candidate list, format cleanly
  const hasPrefix = /^(asrama|gedung)\s+/i.test(cleaned);
  if (hasPrefix) {
    return formatDormWords(cleaned);
  }

  return `Asrama ${formatDormWords(cleaned)}`;
}
