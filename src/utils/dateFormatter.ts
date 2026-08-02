/**
 * Utility functions for consistent and robust Indonesian date formatting
 * preventing UTC timezone offset shifts when parsing YYYY-MM-DD strings.
 */

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_SHORT_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
];

const DAY_NAMES_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/**
 * Safely parses YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss string into a local Date object.
 * Avoids new Date("YYYY-MM-DD") UTC midnight shift bugs.
 */
export function parseLocalDate(dateStr: string | Date | undefined | null): Date | null {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;

  const str = String(dateStr).trim();
  if (!str) return null;

  // Match YYYY-MM-DD
  const match = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formats a date into full Indonesian format, e.g., "1 Agustus 2026" or "Sabtu, 1 Agustus 2026"
 */
export function formatDateIndonesian(
  dateInput: string | Date | undefined | null,
  includeDayName = false
): string {
  const d = parseLocalDate(dateInput);
  if (!d) return dateInput ? String(dateInput) : '-';

  const day = d.getDate();
  const month = MONTH_NAMES_ID[d.getMonth()];
  const year = d.getFullYear();

  const formatted = `${day} ${month} ${year}`;
  if (includeDayName) {
    const dayName = DAY_NAMES_ID[d.getDay()];
    return `${dayName}, ${formatted}`;
  }
  return formatted;
}

/**
 * Formats a date into short Indonesian format, e.g., "1 Agt 2026"
 */
export function formatDateShort(dateInput: string | Date | undefined | null): string {
  const d = parseLocalDate(dateInput);
  if (!d) return dateInput ? String(dateInput) : '-';

  const day = d.getDate();
  const month = MONTH_SHORT_ID[d.getMonth()];
  const year = d.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Formats date range, e.g. "1 - 5 Agustus 2026" or "28 Juli - 2 Agustus 2026"
 */
export function formatDateRange(startStr: string, endStr: string): string {
  const startD = parseLocalDate(startStr);
  const endD = parseLocalDate(endStr);

  if (!startD && !endD) return '-';
  if (!startD) return formatDateIndonesian(endStr);
  if (!endD) return formatDateIndonesian(startStr);

  const startDay = startD.getDate();
  const endDay = endD.getDate();
  const startMonth = MONTH_NAMES_ID[startD.getMonth()];
  const endMonth = MONTH_NAMES_ID[endD.getMonth()];
  const startYear = startD.getFullYear();
  const endYear = endD.getFullYear();

  if (startYear === endYear) {
    if (startMonth === endMonth) {
      if (startDay === endDay) {
        return `${startDay} ${startMonth} ${startYear}`;
      }
      return `${startDay} - ${endDay} ${startMonth} ${startYear}`;
    }
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${startYear}`;
  }
  return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
}
