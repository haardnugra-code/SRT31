import QRCode from 'qrcode';
import { Student, AppConfig } from '../types';

/**
 * Generates a high-resolution CR80 (1011 x 638 px @ 300 DPI) PNG Data URL for a student card
 */
export async function generateStudentCardPNGDataUrl(
  student: Student,
  config: AppConfig
): Promise<string> {
  const width = 1011;
  const height = 638;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Gagal mendapatkan 2D Canvas context');

  // 1. Background Canvas - Slate 900
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  // 2. Load Logo if exists
  let logoImg: HTMLImageElement | null = null;
  if (config.logoKiriUrl) {
    try {
      logoImg = await new Promise<HTMLImageElement | null>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = config.logoKiriUrl!;
      });
    } catch {
      logoImg = null;
    }
  }

  if (logoImg) {
    ctx.drawImage(logoImg, 40, 35, 80, 80);
  }

  // 3. Header Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText('KEMENTERIAN SOSIAL RI', 135, 38);

  ctx.fillStyle = '#bae6fd'; // sky-200
  ctx.font = '20px sans-serif';
  ctx.fillText('PUSAT PENDIDIKAN & PELATIHAN PROFESI', 135, 72);

  ctx.fillStyle = '#fef08a'; // amber-200
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('SEKOLAH RAKYAT TERINTEGRASI 31 PALEMBANG', 135, 98);

  // Header Badge (Top Right)
  const badgeX = 790;
  const badgeY = 38;
  const badgeW = 180;
  const badgeH = 44;

  ctx.fillStyle = '#0c4a6e'; // sky-900
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 10);
  ctx.fill();

  ctx.fillStyle = '#7dd3fc'; // sky-300
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('KARTU SISWA', badgeX + badgeW / 2, badgeY + 12);
  ctx.textAlign = 'left';

  // 4. QR Code Box (Left Side)
  const qrBoxX = 40;
  const qrBoxY = 155;
  const qrBoxW = 230;
  const qrBoxH = 290;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(qrBoxX, qrBoxY, qrBoxW, qrBoxH, 16);
  ctx.fill();

  // Generate QR Code Image Data
  try {
    const studentQrId = String(student.id || '').trim();
    if (studentQrId) {
      const qrDataUrl = await QRCode.toDataURL(studentQrId, {
        margin: 1,
        width: 210,
        errorCorrectionLevel: 'M',
        color: { dark: '#0f172a', light: '#ffffff' }
      });

      const qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = qrDataUrl;
      });

      ctx.drawImage(qrImg, qrBoxX + 10, qrBoxY + 10, 210, 210);
    }
  } catch (err) {
    console.error('Gagal generate QR Code PNG:', err);
  }

  // QR Box Text Label
  ctx.fillStyle = '#0369a1'; // sky-700
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('QR ABSENSI', qrBoxX + qrBoxW / 2, qrBoxY + 235);

  // Student ID Label below QR Box
  ctx.fillStyle = '#38bdf8'; // sky-400
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(`ID: ${student.id}`, qrBoxX + qrBoxW / 2, qrBoxY + 310);
  ctx.textAlign = 'left';

  // 5. Student Details Section
  const detailsX = 300;
  let lineY = 170;

  // Student Name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';

  // Truncate name if too long
  let nameText = student.name || 'Nama Siswa';
  if (nameText.length > 25) {
    nameText = nameText.substring(0, 25) + '...';
  }
  ctx.fillText(nameText.toUpperCase(), detailsX, lineY);
  lineY += 52;

  // NISN / ID
  ctx.fillStyle = '#94a3b8'; // slate-400
  ctx.font = '22px sans-serif';
  ctx.fillText('NISN / ID:', detailsX, lineY);

  ctx.fillStyle = '#38bdf8'; // sky-400
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(student.id || '-', detailsX + 130, lineY);
  lineY += 42;

  // Class & Dorm
  ctx.fillStyle = '#94a3b8';
  ctx.font = '22px sans-serif';
  ctx.fillText('Kelas/Jenjang:', detailsX, lineY);

  ctx.fillStyle = '#f1f5f9'; // slate-100
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(`${student.class} (${student.dorm || 'Asrama'})`, detailsX + 160, lineY);
  lineY += 42;

  // Wali Asuh
  ctx.fillStyle = '#94a3b8';
  ctx.font = '22px sans-serif';
  ctx.fillText('Wali Asuh:', detailsX, lineY);

  ctx.fillStyle = '#f1f5f9';
  ctx.font = 'bold 24px sans-serif';
  let caretakerStr = student.caretaker ? String(student.caretaker).trim() : '-';
  if (caretakerStr.length > 26) {
    caretakerStr = caretakerStr.substring(0, 26) + '...';
  }
  ctx.fillText(caretakerStr, detailsX + 130, lineY);
  lineY += 50;

  // RFID Tag Pill
  const pillW = 480;
  const pillH = 50;
  ctx.fillStyle = '#064e3b'; // emerald-900
  ctx.beginPath();
  ctx.roundRect(detailsX, lineY, pillW, pillH, 10);
  ctx.fill();

  ctx.fillStyle = '#6ee7b7'; // emerald-300
  ctx.font = 'bold 20px sans-serif';
  const rfidText = student.rfidTag ? `RFID UID: ${student.rfidTag}` : 'SMART RFID CARD ENABLED';
  ctx.fillText(rfidText, detailsX + 20, lineY + 14);

  // 6. Footer Section
  const footerY = 585;

  ctx.fillStyle = '#94a3b8'; // slate-400
  ctx.font = '20px sans-serif';
  ctx.fillText('Sekolah Rakyat Terintegrasi 31 Palembang', 40, footerY);

  ctx.fillStyle = '#38bdf8'; // sky-400
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`ID: ${student.id}`, width - 40, footerY);

  return canvas.toDataURL('image/png');
}

/**
 * Triggers a download of a single student card as a high-resolution PNG image file
 */
export async function downloadStudentCardPNG(
  student: Student,
  config: AppConfig
): Promise<void> {
  const dataUrl = await generateStudentCardPNGDataUrl(student, config);
  const sanitizedName = (student.name || 'Siswa').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Kartu_QR_${sanitizedName}_${student.id}.png`;

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Downloads multiple student cards as individual PNG files
 */
export async function downloadMultipleCardsPNG(
  students: Student[],
  config: AppConfig,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    await downloadStudentCardPNG(student, config);
    onProgress?.(i + 1, students.length);
    // Slight delay between downloads to prevent browser blocking
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}
