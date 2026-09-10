import React, { useState, useMemo, useEffect } from 'react';
import {
  PackageCheck,
  Building2,
  BedDouble,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Search,
  Plus,
  Printer,
  Download,
  RotateCcw,
  Layers,
  FolderSymlink,
  ExternalLink,
  Edit,
  Trash2,
  FileText,
  Sparkles,
  QrCode,
  Tag,
  Hash,
  ShieldCheck,
  MapPin,
  Calendar,
  SlidersHorizontal,
  X
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  AppConfig,
  DormAsset,
  DormAssetCategory,
  DormAssetDamageSeverity,
  DormAssetActionPlan
} from '../types';
import { formatDateIndonesian } from '../utils/dateFormatter';
import {
  generateDormAssetsReportPDF,
  generateSingleDormAssetDamageReportPDF,
  generateSingleDormAssetStickerPDF,
  generateDormAssetStickerSheetPDF
} from '../services/pdfGenerator';

interface DormAssetTabProps {
  config: AppConfig;
  assets: DormAsset[];
  onSaveAsset: (asset: DormAsset) => void;
  onDeleteAsset: (id: string) => void;
  onShowToast: (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onAskConfirm: (title: string, message: string) => Promise<boolean>;
  userRole?: string;
}

// Preset Rekomendasi Format Asrama Standar Instansi Kemensos / Sekolah Rakyat
export const INSTITUTIONAL_DORM_PRESETS = [
  'Gedung Asrama Putra I (Wisma Dewantara)',
  'Gedung Asrama Putra II (Wisma Soekarno)',
  'Gedung Asrama Putri I (Wisma Kartini)',
  'Gedung Asrama Putri II (Wisma Cut Nyak Dien)',
  'Paviliun / Wisma Tamu & Pembina Asrama',
  'Gedung Rusunawa Asrama Terpadu',
  'Area Fasilitas & Penunjang Asrama'
];

const ROOM_OPTIONS = [
  'Kamar 01',
  'Kamar 02',
  'Kamar 03',
  'Kamar 04',
  'Kamar 05',
  'Kamar 06',
  'Area Bersama Asrama',
  'Area Sanitasi & Mandi Asrama',
  'Ruang Belajar & Perpustakaan Asrama'
];

const BLOCK_OPTIONS = [
  'Lantai 1 / Sayap Timur',
  'Lantai 1 / Sayap Barat',
  'Lantai 2 / Sayap Timur',
  'Lantai 2 / Sayap Barat',
  'Lantai 1',
  'Lantai 2',
  'Lantai 3',
  'Blok A',
  'Blok B',
  'Area Publik / Bersama'
];

const FUNDING_OPTIONS = [
  'DIPA Kemensos RI',
  'APBN Kemensos RI',
  'BOS Sekolah Rakyat',
  'Hibah Terikat',
  'Swadaya Asrama',
  'Bantuan CSR / Donasi'
];

const CATEGORY_OPTIONS: DormAssetCategory[] = [
  'Tempat Tidur & Kasur',
  'Lemari & Locker',
  'Meja & Kursi Belajar',
  'Elektronik & Kelistrikan',
  'Sanitasi & Alat Kebersihan',
  'Sarana Kamar & Bangunan',
  'Lainnya'
];

const ACTION_PLAN_OPTIONS: DormAssetActionPlan[] = [
  'Siap Digunakan (Layak)',
  'Perbaikan Mandiri Asrama',
  'Pengajuan Servis/Tukang Sarpras',
  'Pengajuan Penggantian Baru',
  'Penghapusan / Afkir Aset',
  'Sedang Dalam Perbaikan'
];

// Preset SOP Template Items for quick filling
const SOP_PRESETS = [
  {
    name: 'Ranjang / Dipan Susun Besi',
    spec: 'Pipa Hollow 40x40 Ketebalan 1.8mm Cat Powder Coating Oven',
    category: 'Tempat Tidur & Kasur' as DormAssetCategory,
    defaultQty: 8
  },
  {
    name: 'Kasur Busa Inoac Standar SOP',
    spec: 'Inoac Super Yellow Density 23 (90 x 200 x 15 cm)',
    category: 'Tempat Tidur & Kasur' as DormAssetCategory,
    defaultQty: 16
  },
  {
    name: 'Lemari Siswa Plat Besi 2 Pintu',
    spec: 'Steel Locker Plat Besi 0.8mm Kunci Kombinasi Anti Karat',
    category: 'Lemari & Locker' as DormAssetCategory,
    defaultQty: 8
  },
  {
    name: 'Meja Belajar Bersama & Kursi',
    spec: 'Rangka Besi Hollow Top Table Plywood HPL Tahan Gores',
    category: 'Meja & Kursi Belajar' as DormAssetCategory,
    defaultQty: 4
  },
  {
    name: 'Kipas Angin Dinding Wall Fan 16"',
    spec: 'Maspion / Sekai Wall Fan 16" Heavy Duty 3 Kecepatan',
    category: 'Elektronik & Kelistrikan' as DormAssetCategory,
    defaultQty: 4
  },
  {
    name: 'Set Alat Kebersihan & Pel Lantai',
    spec: 'Gagang Pel Aluminium Microfiber & Ember Spin Mop Tebal',
    category: 'Sanitasi & Alat Kebersihan' as DormAssetCategory,
    defaultQty: 4
  },
  {
    name: 'Rak Sepatu Sandal Siswa 4 Susun',
    spec: 'Rangka Pipa Stainless Steel 4 Tier Kapasitas 16 Pasang',
    category: 'Sarana Kamar & Bangunan' as DormAssetCategory,
    defaultQty: 2
  }
];

export const DormAssetTab: React.FC<DormAssetTabProps> = ({
  config,
  assets,
  onSaveAsset,
  onDeleteAsset,
  onShowToast,
  onAskConfirm,
  userRole = 'admin'
}) => {
  // Custom Dormitories saved by user in local storage
  const [customDorms, setCustomDorms] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sr_custom_dorms');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Calculate all available dorm options (presets + custom + any from current assets)
  const allDormOptions = useMemo(() => {
    const list = new Set<string>();
    // First, standard institutional presets
    INSTITUTIONAL_DORM_PRESETS.forEach(d => list.add(d));
    // Then user custom dorms
    customDorms.forEach(d => list.add(d));
    // Then any dorm names found in existing assets
    assets.forEach(a => {
      if (a.dormName && a.dormName.trim()) {
        list.add(a.dormName.trim());
      }
    });
    return Array.from(list);
  }, [assets, customDorms]);

  const [selectedDorm, setSelectedDorm] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Semua');
  const [conditionFilter, setConditionFilter] = useState<'semua' | 'baik' | 'rusak_ringan' | 'rusak_berat' | 'rusak'>('semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);

  // Form Mode for Dormitory Selection: Preset Dropdown vs Manual Input
  const [isManualDormInput, setIsManualDormInput] = useState<boolean>(false);

  // Form Fields State
  const [formAssetCode, setFormAssetCode] = useState<string>('');
  const [formDormName, setFormDormName] = useState<string>(INSTITUTIONAL_DORM_PRESETS[0]);
  const [formBuildingBlock, setFormBuildingBlock] = useState<string>('Lantai 1 / Sayap Timur');
  const [formRoomNumber, setFormRoomNumber] = useState<string>('Kamar 01');
  const [formItemName, setFormItemName] = useState<string>('Ranjang / Dipan Susun Besi');
  const [formBrandSpec, setFormBrandSpec] = useState<string>('');
  const [formCategory, setFormCategory] = useState<DormAssetCategory>('Tempat Tidur & Kasur');
  const [formProcurementYear, setFormProcurementYear] = useState<string>(new Date().getFullYear().toString());
  const [formFundingSource, setFormFundingSource] = useState<string>('DIPA Kemensos RI');
  const [formTotalQuantity, setFormTotalQuantity] = useState<number>(8);
  const [formDamagedQuantity, setFormDamagedQuantity] = useState<number>(0);
  const [formDamageSeverity, setFormDamageSeverity] = useState<DormAssetDamageSeverity>('tidak_ada');
  const [formDamageStatus, setFormDamageStatus] = useState<string>('');
  const [formGdriveLink, setFormGdriveLink] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formActionPlan, setFormActionPlan] = useState<DormAssetActionPlan>('Siap Digunakan (Layak)');
  const [formInspectorName, setFormInspectorName] = useState<string>(config.waliAsrama || 'Petugas Sarpras');
  const [formInspectionDate, setFormInspectionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Asset Label Sticker Modal State
  const [labelModalAsset, setLabelModalAsset] = useState<DormAsset | null>(null);
  const [labelQrCodeUrl, setLabelQrCodeUrl] = useState<string>('');

  // Generate QR for sticker modal
  useEffect(() => {
    if (labelModalAsset) {
      const qrData = `BMN-SR31|KODE:${labelModalAsset.assetCode || labelModalAsset.id}|NAMA:${labelModalAsset.itemName}|GEDUNG:${labelModalAsset.dormName}|RUANG:${labelModalAsset.roomNumber}|KONDISI:${labelModalAsset.damagedQuantity > 0 ? 'RUSAK' : 'BAIK'}`;
      QRCode.toDataURL(qrData, { width: 140, margin: 1 })
        .then(url => setLabelQrCodeUrl(url))
        .catch(err => console.error(err));
    } else {
      setLabelQrCodeUrl('');
    }
  }, [labelModalAsset]);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter(item => {
      const matchDorm = selectedDorm === 'Semua' || item.dormName.toLowerCase() === selectedDorm.toLowerCase();
      const matchCategory = categoryFilter === 'Semua' || item.category === categoryFilter;
      
      let matchCondition = true;
      if (conditionFilter === 'baik') {
        matchCondition = item.damagedQuantity === 0;
      } else if (conditionFilter === 'rusak') {
        matchCondition = item.damagedQuantity > 0;
      } else if (conditionFilter === 'rusak_ringan') {
        matchCondition = item.damagedQuantity > 0 && item.damageSeverity === 'ringan';
      } else if (conditionFilter === 'rusak_berat') {
        matchCondition = item.damagedQuantity > 0 && (item.damageSeverity === 'berat' || item.damageSeverity === 'sedang');
      }

      const matchSearch =
        searchQuery === '' ||
        item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.assetCode && item.assetCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.dormName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.brandSpec && item.brandSpec.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.damageStatus.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchDorm && matchCategory && matchCondition && matchSearch;
    });
  }, [assets, selectedDorm, categoryFilter, conditionFilter, searchQuery]);

  // Overall Statistics for currently selected dorm
  const stats = useMemo(() => {
    const pool = selectedDorm === 'Semua' ? assets : assets.filter(a => a.dormName.toLowerCase() === selectedDorm.toLowerCase());
    const totalCount = pool.length;
    const totalUnits = pool.reduce((acc, curr) => acc + (Number(curr.totalQuantity) || 0), 0);
    const goodUnits = pool.reduce((acc, curr) => acc + (Number(curr.goodQuantity) || 0), 0);
    const damagedUnits = pool.reduce((acc, curr) => acc + (Number(curr.damagedQuantity) || 0), 0);
    const lightDamage = pool.filter(a => a.damageSeverity === 'ringan').reduce((acc, curr) => acc + (Number(curr.damagedQuantity) || 0), 0);
    const mediumDamage = pool.filter(a => a.damageSeverity === 'sedang').reduce((acc, curr) => acc + (Number(curr.damagedQuantity) || 0), 0);
    const heavyDamage = pool.filter(a => a.damageSeverity === 'berat').reduce((acc, curr) => acc + (Number(curr.damagedQuantity) || 0), 0);
    const percentage = totalUnits > 0 ? Math.round((goodUnits / totalUnits) * 100) : 100;

    return {
      totalCount,
      totalUnits,
      goodUnits,
      damagedUnits,
      lightDamage,
      mediumDamage,
      heavyDamage,
      percentage
    };
  }, [assets, selectedDorm]);

  // Helper to generate institutional code
  const generateInstitutionalAssetCode = (dormName: string, category: string) => {
    const year = new Date().getFullYear();
    let prefix = 'PA';
    if (dormName.toLowerCase().includes('putri')) prefix = 'PI';
    else if (dormName.toLowerCase().includes('tamu') || dormName.toLowerCase().includes('pembina')) prefix = 'WIS';
    else if (dormName.toLowerCase().includes('rusun')) prefix = 'RSN';
    else prefix = 'ASR';

    const count = assets.filter(a => a.dormName.toLowerCase() === dormName.toLowerCase()).length + 1;
    const seq = String(count).padStart(3, '0');
    return `BMN-ASR/${prefix}/${year}/${seq}`;
  };

  // Open Modal for New Entry
  const handleOpenAdd = () => {
    setEditingAssetId(null);
    const targetDorm = selectedDorm !== 'Semua' ? selectedDorm : INSTITUTIONAL_DORM_PRESETS[0];
    setFormDormName(targetDorm);
    setIsManualDormInput(!INSTITUTIONAL_DORM_PRESETS.includes(targetDorm));
    setFormAssetCode(generateInstitutionalAssetCode(targetDorm, 'Tempat Tidur & Kasur'));
    setFormBuildingBlock('Lantai 1 / Sayap Timur');
    setFormRoomNumber('Kamar 01');
    setFormItemName('Ranjang / Dipan Susun Besi');
    setFormBrandSpec('Pipa Hollow 40x40 Ketebalan 1.8mm Cat Powder Coating Oven');
    setFormCategory('Tempat Tidur & Kasur');
    setFormProcurementYear(new Date().getFullYear().toString());
    setFormFundingSource('DIPA Kemensos RI');
    setFormTotalQuantity(8);
    setFormDamagedQuantity(0);
    setFormDamageSeverity('tidak_ada');
    setFormDamageStatus('');
    setFormGdriveLink('');
    setFormNotes('');
    setFormActionPlan('Siap Digunakan (Layak)');
    setFormInspectorName(config.waliAsrama || 'Petugas Sarpras');
    setFormInspectionDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  // Open Modal for Editing
  const handleOpenEdit = (asset: DormAsset) => {
    setEditingAssetId(asset.id);
    setFormAssetCode(asset.assetCode || asset.id);
    setFormDormName(asset.dormName);
    setIsManualDormInput(!INSTITUTIONAL_DORM_PRESETS.includes(asset.dormName));
    setFormBuildingBlock(asset.buildingBlock || 'Lantai 1');
    setFormRoomNumber(asset.roomNumber);
    setFormItemName(asset.itemName);
    setFormBrandSpec(asset.brandSpec || '');
    setFormCategory(asset.category);
    setFormProcurementYear(asset.procurementYear || new Date().getFullYear().toString());
    setFormFundingSource(asset.fundingSource || 'DIPA Kemensos RI');
    setFormTotalQuantity(asset.totalQuantity);
    setFormDamagedQuantity(asset.damagedQuantity);
    setFormDamageSeverity(asset.damageSeverity);
    setFormDamageStatus(asset.damageStatus || '');
    setFormGdriveLink(asset.gdriveLink || '');
    setFormNotes(asset.notes || '');
    setFormActionPlan(asset.actionPlan);
    setFormInspectorName(asset.inspectorName || config.waliAsrama || '');
    setFormInspectionDate(asset.inspectionDate || new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  // Handle Preset Selection
  const handleSelectPreset = (preset: typeof SOP_PRESETS[0]) => {
    setFormItemName(preset.name);
    setFormBrandSpec(preset.spec);
    setFormCategory(preset.category);
    setFormTotalQuantity(preset.defaultQty);
  };

  // Handle Save
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanDormName = formDormName.trim();
    if (!cleanDormName) {
      onShowToast('Peringatan', 'Nama gedung/asrama tidak boleh kosong', 'warning');
      return;
    }

    if (!formItemName.trim()) {
      onShowToast('Peringatan', 'Nama barang inventaris tidak boleh kosong', 'warning');
      return;
    }

    // Save custom dorm name to custom list if not in presets
    if (!INSTITUTIONAL_DORM_PRESETS.includes(cleanDormName) && !customDorms.includes(cleanDormName)) {
      const updatedCustom = [...customDorms, cleanDormName];
      setCustomDorms(updatedCustom);
      try {
        localStorage.setItem('sr_custom_dorms', JSON.stringify(updatedCustom));
      } catch (e) {
        console.error(e);
      }
    }

    const total = Number(formTotalQuantity) || 0;
    const damaged = Math.min(Math.max(Number(formDamagedQuantity) || 0, 0), total);
    const good = Math.max(total - damaged, 0);

    const code = formAssetCode.trim() || generateInstitutionalAssetCode(cleanDormName, formCategory);

    const newAsset: DormAsset = {
      id: editingAssetId || `ASSET-${Date.now()}`,
      assetCode: code,
      dormName: cleanDormName,
      buildingBlock: formBuildingBlock.trim() || 'Lantai 1',
      roomNumber: formRoomNumber.trim() || 'Kamar Siswa',
      itemName: formItemName.trim(),
      brandSpec: formBrandSpec.trim(),
      category: formCategory,
      procurementYear: formProcurementYear.trim() || new Date().getFullYear().toString(),
      fundingSource: formFundingSource.trim() || 'DIPA Kemensos RI',
      totalQuantity: total,
      goodQuantity: good,
      damagedQuantity: damaged,
      damageSeverity: damaged === 0 ? 'tidak_ada' : formDamageSeverity === 'tidak_ada' ? 'ringan' : formDamageSeverity,
      damageStatus: damaged > 0 ? formDamageStatus.trim() : 'Kondisi Baik Sesuai SOP',
      gdriveLink: formGdriveLink.trim(),
      notes: formNotes.trim(),
      actionPlan: formActionPlan,
      inspectorName: formInspectorName.trim(),
      inspectionDate: formInspectionDate,
      createdAt: editingAssetId
        ? assets.find(a => a.id === editingAssetId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSaveAsset(newAsset);
    setIsModalOpen(false);
    onShowToast('Berhasil', `Data aset BMN "${newAsset.itemName}" (${cleanDormName}) berhasil disimpan.`, 'success');
  };

  // Handle Delete
  const handleDelete = async (asset: DormAsset) => {
    const ok = await onAskConfirm(
      'Hapus Aset Instansi',
      `Yakin ingin menghapus data inventaris "${asset.itemName}" (${asset.assetCode || asset.id}) dari ${asset.dormName}?`
    );
    if (ok) {
      onDeleteAsset(asset.id);
      onShowToast('Dihapus', 'Data aset berhasil dihapus.', 'info');
    }
  };

  // Handle Print Full BMN Report
  const handlePrintFullReport = async () => {
    try {
      await generateDormAssetsReportPDF(assets, selectedDorm, config, {
        inspectorName: formInspectorName || config.waliAsrama,
        printDate: new Date().toISOString().split('T')[0]
      });
      onShowToast('Cetak Berhasil', 'Dokumen Berita Acara & Rekapitulasi Aset telah diunduh.', 'success');
    } catch (error) {
      console.error(error);
      onShowToast('Gagal Cetak', 'Terjadi kendala saat membuat file PDF aset.', 'error');
    }
  };

  // Handle Print Single Damage Report
  const handlePrintSingleDamageReport = async (asset: DormAsset) => {
    try {
      await generateSingleDormAssetDamageReportPDF(asset, config);
      onShowToast('Cetak Berhasil', `Berita Acara Kerusakan ${asset.itemName} telah diunduh.`, 'success');
    } catch (error) {
      console.error(error);
      onShowToast('Gagal Cetak', 'Gagal mencetak Berita Acara Kerusakan.', 'error');
    }
  };

  // Handle Print Single Sticker PDF (100 x 60 mm)
  const handlePrintSingleSticker = async (asset: DormAsset) => {
    try {
      await generateSingleDormAssetStickerPDF(asset, config);
      onShowToast('Cetak Berhasil', `Label Stiker BMN "${asset.itemName}" (100x60mm) siap dicetak.`, 'success');
    } catch (error) {
      console.error(error);
      onShowToast('Gagal Cetak', 'Gagal membuat file PDF label stiker.', 'error');
    }
  };

  // Handle Print A4 Sticker Sheet (8 copies of this asset)
  const handlePrintStickerSheet = async (asset: DormAsset) => {
    try {
      await generateDormAssetStickerSheetPDF(asset, config, asset.itemName);
      onShowToast('Cetak Berhasil', `Lembar Stiker A4 (8 label) "${asset.itemName}" telah diunduh.`, 'success');
    } catch (error) {
      console.error(error);
      onShowToast('Gagal Cetak', 'Gagal membuat lembar stiker A4.', 'error');
    }
  };

  // Handle Print All Stickers for Selected Dormitory
  const handlePrintAllDormStickers = async () => {
    const targetAssets = selectedDorm === 'Semua' ? assets : assets.filter(a => a.dormName.toLowerCase() === selectedDorm.toLowerCase());
    if (targetAssets.length === 0) {
      onShowToast('Peringatan', 'Tidak ada data aset untuk dicetak stikernya.', 'warning');
      return;
    }
    try {
      await generateDormAssetStickerSheetPDF(targetAssets, config, selectedDorm);
      onShowToast('Cetak Berhasil', `Lembar Stiker A4 untuk ${targetAssets.length} aset (${selectedDorm}) telah diunduh.`, 'success');
    } catch (error) {
      console.error(error);
      onShowToast('Gagal Cetak', 'Gagal membuat lembar stiker aset.', 'error');
    }
  };

  // Handle Safe Direct Browser Print (Using isolated iframe with fallback)
  const handleBrowserPrintSticker = (asset: DormAsset) => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.zIndex = '-999';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        handlePrintSingleSticker(asset);
        return;
      }

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Label Stiker BMN - ${asset.itemName}</title>
            <style>
              @page { size: 100mm 60mm; margin: 0; }
              * { box-sizing: border-box; }
              body {
                margin: 0;
                padding: 3mm;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                background: #fff;
                color: #0f172a;
              }
              .sticker-box {
                border: 2px solid #0f172a;
                border-radius: 4px;
                padding: 6px 10px;
                width: 94mm;
                height: 54mm;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
              }
              .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 3px; margin-bottom: 4px; }
              .instansi { font-size: 7.5px; font-weight: bold; text-transform: uppercase; color: #334155; }
              .sekolah { font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #0f172a; }
              .kartu { font-size: 7px; font-weight: bold; text-transform: uppercase; color: #047857; margin-top: 1px; }
              .body-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex: 1; }
              .details { flex: 1; font-size: 8.5px; line-height: 1.25; }
              .field-label { font-size: 6.5px; font-weight: bold; color: #64748b; text-transform: uppercase; }
              .code-val { font-family: monospace; font-weight: 800; font-size: 9.5px; background: #f1f5f9; padding: 1px 4px; border-radius: 2px; }
              .item-name { font-weight: 800; font-size: 9.5px; color: #0f172a; }
              .qr-col { text-align: center; width: 75px; flex-shrink: 0; }
              .qr-col img { width: 68px; height: 68px; border: 1px solid #cbd5e1; padding: 2px; border-radius: 2px; }
              .qr-caption { font-size: 6px; font-family: monospace; color: #64748b; margin-top: 2px; font-weight: bold; }
              .footer { border-top: 1px solid #cbd5e1; padding-top: 2px; font-size: 6.5px; text-align: center; color: #64748b; font-style: italic; }
            </style>
          </head>
          <body>
            <div class="sticker-box">
              <div class="header">
                <div class="instansi">Kementerian Sosial Republik Indonesia</div>
                <div class="sekolah">Sekolah Rakyat Terpadu 31 Palembang</div>
                <div class="kartu">Kartu Kendali Inventaris Aset Asrama</div>
              </div>
              <div class="body-row">
                <div class="details">
                  <div>
                    <span class="field-label">KODE BMN / REGISTER:</span><br/>
                    <span class="code-val">${asset.assetCode || asset.id}</span>
                  </div>
                  <div style="margin-top: 3px;">
                    <span class="field-label">NAMA BARANG:</span><br/>
                    <span class="item-name">${asset.itemName}</span>
                  </div>
                  ${asset.brandSpec ? `<div style="margin-top: 2px; font-size: 7.5px; color: #334155;">Spek: ${asset.brandSpec}</div>` : ''}
                  <div style="margin-top: 3px;">
                    <span class="field-label">LOKASI PENEMPATAN:</span><br/>
                    <strong>${asset.dormName}</strong> (${asset.buildingBlock ? asset.buildingBlock + ' - ' : ''}${asset.roomNumber})
                  </div>
                  <div style="margin-top: 2px; font-size: 7.5px; color: #475569;">
                    Tahun: ${asset.procurementYear || '-'} | Sumber: ${asset.fundingSource || 'DIPA'}
                  </div>
                </div>
                <div class="qr-col">
                  <img src="${labelQrCodeUrl}" alt="QR" />
                  <div class="qr-caption">SCAN VERIFIKASI</div>
                </div>
              </div>
              <div class="footer">
                Barang Milik Negara / Sekolah Rakyat — Dilarang memindahkan tanpa izin Bagian Sarpras
              </div>
            </div>
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (printErr) {
          console.warn('Iframe print intercepted, downloading PDF instead:', printErr);
          handlePrintSingleSticker(asset);
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 1500);
        }
      }, 250);
    } catch (e) {
      console.error(e);
      handlePrintSingleSticker(asset);
    }
  };

  return (
    <div className="space-y-6" id="dorm-asset-tab">
      {/* Top Header Card - Professional Institutional Layout */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-emerald-700 rounded-xl text-white shadow-xs">
              <PackageCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800">
                  Inventaris & Pemantauan Sarana Prasarana Asrama
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                  Standar BMN Kemensos RI
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
                Pencatatan inventarisasi fisik barang milik negara/sekolah, nomor registrasi BMN, spesifikasi teknis, kondisi kelayakan (B/RR/RB), dokumentasi Google Drive, serta Berita Acara resmi.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Print Sticker Sheets for Selected Dorm */}
            <button
              onClick={handlePrintAllDormStickers}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg transition-colors border border-slate-200 shadow-2xs"
              title="Cetak Seluruh Stiker Label BMN pada Lembar A4 untuk Gedung yang Dipilih"
            >
              <QrCode className="w-4 h-4 text-emerald-700" />
              <span>Cetak Stiker A4 ({selectedDorm === 'Semua' ? 'Semua' : selectedDorm.slice(0, 15) + '...'})</span>
            </button>

            <button
              onClick={handlePrintFullReport}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 shadow-2xs"
              title="Cetak Berita Acara & Rekapitulasi Inventaris Aset Asrama (Landscape A4)"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Cetak Rekap BMN (PDF)</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Catat Aset / BMN Baru</span>
            </button>
          </div>
        </div>

        {/* Professional Dormitory Selection Bar (Manual & Dynamic Filter) */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-700" />
              Lokasi Gedung / Asrama ({allDormOptions.length} Unit Terdaftar):
            </span>
            <span className="text-[11px] text-slate-600 hidden sm:inline">
              *Pilihan nama asrama dapat disesuaikan manual atau dipilih dari standar instansi
            </span>
          </div>

          {/* Horizontal Dorm Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <button
              onClick={() => setSelectedDorm('Semua')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                selectedDorm === 'Semua'
                  ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>Semua Gedung / Asrama</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedDorm === 'Semua' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {assets.length}
              </span>
            </button>

            {allDormOptions.map(dorm => {
              const isSelected = selectedDorm.toLowerCase() === dorm.toLowerCase();
              const countInDorm = assets.filter(a => a.dormName.toLowerCase() === dorm.toLowerCase()).length;

              return (
                <button
                  key={dorm}
                  onClick={() => setSelectedDorm(dorm)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-emerald-700 text-white border-emerald-700 font-semibold shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                  title={dorm}
                >
                  <Building2 className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-200' : 'text-slate-400'}`} />
                  <span>{dorm}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-100 text-slate-500'}`}>
                    {countInDorm}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* KPI Stats Overview - Standar Instansi BMN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Barang & Unit */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Total Aset BMN Terdata</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stats.totalCount} <span className="text-sm font-normal text-slate-600">NIB</span></p>
            <p className="text-xs text-slate-600 mt-0.5">Kuantitas fisik: <strong>{stats.totalUnits}</strong> unit terpasang</p>
          </div>
          <div className="p-3 bg-slate-100 rounded-xl text-slate-700">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Kondisi Baik (B) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded">B</span>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Kondisi Baik / Layak</p>
            </div>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.goodUnits} <span className="text-sm font-normal text-slate-600">Unit</span></p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${stats.percentage}%` }}></div>
              </div>
              <span className="text-xs font-semibold text-emerald-800">{stats.percentage}% Layak</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700 border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Kondisi Rusak Ringan (RR) & Berat (RB) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 rounded">RR / RB</span>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Kondisi Rusak Fisik</p>
            </div>
            <p className={`text-2xl font-bold mt-1 ${stats.damagedUnits > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {stats.damagedUnits} <span className="text-sm font-normal text-slate-600">Unit</span>
            </p>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              RR (Ringan): {stats.lightDamage} | RS: {stats.mediumDamage} | RB (Berat): {stats.heavyDamage}
            </p>
          </div>
          <div className={`p-3 rounded-xl border ${stats.damagedUnits > 0 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Usulan Tindak Lanjut Sarpras */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Usulan Sarpras Instansi</p>
            <p className="text-xl font-bold text-amber-700 mt-1">
              {assets.filter(a => a.actionPlan !== 'Siap Digunakan (Layak)').length} <span className="text-sm font-normal text-slate-600">Item Tindakan</span>
            </p>
            <p className="text-xs text-slate-600 mt-0.5">Servis teknis & penggantian BMN</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-700 border border-amber-100">
            <Wrench className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kode BMN, nama barang, merk/spesifikasi, nomor kamar, rincian rusak..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-slate-800 placeholder-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="Semua">Semua Kategori Sarpras</option>
              {CATEGORY_OPTIONS.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Condition Filter */}
            <select
              value={conditionFilter}
              onChange={e => setConditionFilter(e.target.value as any)}
              className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="semua">Semua Kondisi Fisik</option>
              <option value="baik">Kondisi Baik / Layak (B)</option>
              <option value="rusak">Semua Yang Rusak (RR & RB)</option>
              <option value="rusak_ringan">Rusak Ringan (RR)</option>
              <option value="rusak_berat">Rusak Sedang / Berat (RB)</option>
            </select>

            {(searchQuery || categoryFilter !== 'Semua' || conditionFilter !== 'semua') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('Semua');
                  setConditionFilter('semua');
                }}
                className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                title="Reset Filter"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Asset Table - Standar Registrasi Instansi */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-sm">
              Buku Registrasi Inventaris Aset — {selectedDorm}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
              {filteredAssets.length} Data Aset
            </span>
          </div>
          <span className="text-xs text-slate-600 font-medium">
            Kementerian Sosial RI & Sekolah Rakyat Terpadu 31
          </span>
        </div>

        {filteredAssets.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <BedDouble className="w-7 h-7" />
            </div>
            <p className="text-base font-semibold text-slate-700">Belum ada data inventaris yang sesuai</p>
            <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
              Tidak ditemukan inventaris aset untuk filter gedung/kondisi yang dipilih. Silakan ubah filter atau catat barang baru.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Catat Aset Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">No</th>
                  <th className="py-3 px-4">Kode BMN & Lokasi Penempatan</th>
                  <th className="py-3 px-4">Nama Barang & Spesifikasi Teknis</th>
                  <th className="py-3 px-4">Kategori & Sumber Dana</th>
                  <th className="py-3 px-3 text-center w-14">Total</th>
                  <th className="py-3 px-3 text-center w-14 text-emerald-700">Baik</th>
                  <th className="py-3 px-3 text-center w-14 text-rose-600">Rusak</th>
                  <th className="py-3 px-4">Kondisi & Rincian Fisik</th>
                  <th className="py-3 px-4">Tindak Lanjut Sarpras</th>
                  <th className="py-3 px-3 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAssets.map((asset, index) => {
                  const hasDamage = asset.damagedQuantity > 0;
                  const severityBadge = asset.damageSeverity === 'berat'
                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                    : asset.damageSeverity === 'sedang'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : asset.damageSeverity === 'ringan'
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-200';

                  const severityText = asset.damageSeverity === 'berat'
                    ? 'Rusak Berat (RB)'
                    : asset.damageSeverity === 'sedang'
                    ? 'Rusak Sedang (RS)'
                    : asset.damageSeverity === 'ringan'
                    ? 'Rusak Ringan (RR)'
                    : 'Baik (B)';

                  return (
                    <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* No */}
                      <td className="py-3 px-3 text-center font-medium text-slate-500 text-xs align-top">
                        {index + 1}
                      </td>

                      {/* Kode BMN & Lokasi */}
                      <td className="py-3 px-4 align-top">
                        <div className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
                          {asset.assetCode || asset.id}
                        </div>
                        <div className="font-semibold text-slate-800 text-xs flex items-center gap-1 mt-1.5">
                          <Building2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>{asset.dormName}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{asset.buildingBlock ? `${asset.buildingBlock} — ` : ''}{asset.roomNumber || 'Kamar Siswa'}</span>
                        </div>
                      </td>

                      {/* Nama Barang & Spesifikasi Teknis */}
                      <td className="py-3 px-4 align-top">
                        <div className="font-semibold text-slate-900 text-sm">{asset.itemName}</div>
                        {asset.brandSpec ? (
                          <div className="text-xs text-slate-600 mt-0.5 font-normal leading-relaxed">
                            <span className="font-medium text-slate-600">Spesifikasi:</span> {asset.brandSpec}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-500 italic mt-0.5">Spesifikasi belum diisi</div>
                        )}
                      </td>

                      {/* Kategori & Sumber Dana */}
                      <td className="py-3 px-4 align-top">
                        <div className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium inline-block">
                          {asset.category}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-1 font-medium">
                          Thn: <strong>{asset.procurementYear || '-'}</strong> ({asset.fundingSource || 'DIPA'})
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3 px-3 text-center font-bold text-slate-800 align-top text-sm">
                        {asset.totalQuantity}
                      </td>

                      {/* Baik */}
                      <td className="py-3 px-3 text-center font-bold text-emerald-700 align-top text-sm">
                        {asset.goodQuantity}
                      </td>

                      {/* Rusak */}
                      <td className="py-3 px-3 text-center align-top">
                        <span className={`inline-flex items-center justify-center font-bold px-2 py-0.5 rounded-full text-xs ${
                          hasDamage ? 'bg-rose-100 text-rose-700' : 'text-slate-500'
                        }`}>
                          {asset.damagedQuantity}
                        </span>
                      </td>

                      {/* Kondisi & Rincian Fisik */}
                      <td className="py-3 px-4 max-w-xs align-top">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`px-2 py-0.5 text-[11px] font-bold rounded border ${severityBadge}`}>
                            {severityText}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-normal">
                          {hasDamage ? (
                            asset.damageStatus || 'Kerusakan fisik fasilitas asrama'
                          ) : (
                            <span className="text-emerald-700 italic">Sesuai SOP, kokoh & terawat baik.</span>
                          )}
                        </p>
                        {asset.notes && (
                          <p className="text-[11px] text-slate-600 mt-1 italic">
                            Catatan: {asset.notes}
                          </p>
                        )}
                        {asset.gdriveLink && (
                          <a
                            href={asset.gdriveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 hover:underline mt-1 font-medium"
                            title="Buka Folder Foto Dokumentasi Google Drive"
                          >
                            <FolderSymlink className="w-3 h-3" />
                            <span>Foto GDrive</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </td>

                      {/* Tindak Lanjut Sarpras */}
                      <td className="py-3 px-4 align-top">
                        <div className="text-xs font-semibold text-slate-800">
                          {asset.actionPlan}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-1">
                          Pendata: {asset.inspectorName || '-'}
                        </div>
                        <div className="text-[10px] text-slate-600">
                          Tgl: {formatDateIndonesian(asset.inspectionDate, false)}
                        </div>
                      </td>

                      {/* Aksi Instansi */}
                      <td className="py-3 px-3 text-center align-top">
                        <div className="flex items-center justify-center gap-1">
                          {/* Label Stiker QR BMN */}
                          <button
                            onClick={() => setLabelModalAsset(asset)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Lihat / Cetak Stiker Label BMN Aset"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          {/* Print Single Damage Ticket */}
                          {hasDamage && (
                            <button
                              onClick={() => handlePrintSingleDamageReport(asset)}
                              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Cetak Berita Acara Kerusakan (PDF)"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(asset)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Data Aset"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(asset)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Data Aset"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL FORM: CATAT / EDIT ASET (PROFESSIONAL INSTITUTIONAL ENTRY) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-700 rounded-xl text-white">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {editingAssetId ? 'Edit Data Inventaris Sarpras Asrama' : 'Form Pencatatan Aset Instansi (SOP BMN)'}
                  </h2>
                  <p className="text-xs text-slate-600">
                    Standar Pengelolaan Sarana Prasarana Sekolah Rakyat — Kementerian Sosial RI
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* SOP Quick Preset Pill Buttons (Only for new items) */}
              {!editingAssetId && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      Pilihan Cepat Standar Fasilitas SOP Sekolah Rakyat:
                    </span>
                    <span className="text-[11px] text-slate-600">Klik untuk isi otomatis</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {SOP_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className="px-2.5 py-1 text-xs font-medium bg-white hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 rounded-lg border border-slate-200 transition-colors shadow-2xs"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 1: LOKASI & PENETAPAN GEDUNG ASRAMA (MANUAL & FLEKSIBEL) */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-700" />
                    1. Identitas Lokasi & Gedung Asrama
                  </span>
                  {/* Toggle Mode: Pilihan Instansi vs Ketik Manual */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualDormInput(!isManualDormInput);
                      if (!isManualDormInput) {
                        // Switching to manual, keep existing value or allow typing
                      }
                    }}
                    className="text-xs text-emerald-800 hover:text-emerald-900 font-semibold underline flex items-center gap-1"
                  >
                    {isManualDormInput ? '← Pilih dari Rekomendasi Instansi' : '➕ Ketik Manual Nama Gedung / Asrama Baru'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* Nama Asrama / Gedung (Bisa Manual atau Dropdown Rekomendasi) */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nama Asrama / Gedung <span className="text-rose-500">*</span>
                    </label>

                    {isManualDormInput ? (
                      <div>
                        <input
                          type="text"
                          list="dorm-master-list"
                          value={formDormName}
                          onChange={e => setFormDormName(e.target.value)}
                          placeholder="Ketik manual nama gedung (e.g. Asrama Putra 3, Wisma Diponegoro, Rusunawa Lt. 2)"
                          className="w-full px-3 py-2 text-sm border-2 border-emerald-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white text-slate-800 font-medium"
                          required
                          autoFocus
                        />
                        <datalist id="dorm-master-list">
                          {allDormOptions.map(d => (
                            <option key={d} value={d} />
                          ))}
                        </datalist>
                        <span className="text-[11px] text-emerald-700 mt-1 block">
                          Mode input manual aktif. Anda bebas mengetik nama asrama/gedung apa pun.
                        </span>
                      </div>
                    ) : (
                      <select
                        value={formDormName}
                        onChange={e => {
                          if (e.target.value === '__MANUAL__') {
                            setIsManualDormInput(true);
                            setFormDormName('');
                          } else {
                            setFormDormName(e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white text-slate-800 font-medium"
                        required
                      >
                        <optgroup label="Standar Instansi / Kemensos RI">
                          {INSTITUTIONAL_DORM_PRESETS.map(dorm => (
                            <option key={dorm} value={dorm}>{dorm}</option>
                          ))}
                        </optgroup>
                        {customDorms.length > 0 && (
                          <optgroup label="Gedung / Asrama Tambahan Pengguna">
                            {customDorms.map(dorm => (
                              <option key={dorm} value={dorm}>{dorm}</option>
                            ))}
                          </optgroup>
                        )}
                        <option value="__MANUAL__" className="text-emerald-700 font-bold">
                          ➕ Ketik Manual Nama Gedung Lainnya...
                        </option>
                      </select>
                    )}
                  </div>

                  {/* Blok / Lantai */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Blok / Sayap / Lantai
                    </label>
                    <input
                      type="text"
                      list="block-list"
                      value={formBuildingBlock}
                      onChange={e => setFormBuildingBlock(e.target.value)}
                      placeholder="e.g. Lantai 1 / Sayap Timur"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white text-slate-800"
                    />
                    <datalist id="block-list">
                      {BLOCK_OPTIONS.map(b => (
                        <option key={b} value={b} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Nomor Ruangan / Kamar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nomor Ruangan / Kamar Siswa <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      list="room-list"
                      value={formRoomNumber}
                      onChange={e => setFormRoomNumber(e.target.value)}
                      placeholder="e.g. Kamar 01, Kamar 02, Area Sanitasi"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white text-slate-800"
                      required
                    />
                    <datalist id="room-list">
                      {ROOM_OPTIONS.map(r => (
                        <option key={r} value={r} />
                      ))}
                    </datalist>
                  </div>

                  {/* Kode Registrasi Aset / NIB */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Kode Registrasi BMN / NIB
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormAssetCode(generateInstitutionalAssetCode(formDormName, formCategory))}
                        className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold"
                      >
                        ⚡ Generate Otomatis
                      </button>
                    </div>
                    <div className="relative">
                      <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={formAssetCode}
                        onChange={e => setFormAssetCode(e.target.value)}
                        placeholder="e.g. BMN-ASR/PA1/2026/001"
                        className="w-full pl-9 pr-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white text-slate-800 font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: IDENTITAS BARANG & SPESIFIKASI BMN */}
              <div className="space-y-3.5">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-emerald-700" />
                  2. Identifikasi Barang & Spesifikasi Teknis
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nama Barang / Fasilitas Asrama <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formItemName}
                      onChange={e => setFormItemName(e.target.value)}
                      placeholder="misal: Ranjang Susun Besi, Kasur Busa Inoac"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Kategori Sarpras <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formCategory}
                      onChange={e => setFormCategory(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white text-slate-800"
                      required
                    >
                      {CATEGORY_OPTIONS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Spesifikasi Teknis / Merk / Bahan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Merk / Tipe / Spesifikasi Teknis Fisik (Standar BMN)
                  </label>
                  <input
                    type="text"
                    value={formBrandSpec}
                    onChange={e => setFormBrandSpec(e.target.value)}
                    placeholder="e.g. Pipa Besi Hollow 40x40 Cat Powder Coating Oven, Inoac Super Yellow D-23 (90x200x15)"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
                  />
                  <span className="text-[11px] text-slate-600 mt-1 block">
                    Cantumkan merk, bahan konstruksi, atau dimensi ukuran barang untuk pendataan instansi resmi.
                  </span>
                </div>

                {/* Tahun Perolehan & Sumber Dana */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Tahun Pengadaan / Perolehan
                    </label>
                    <input
                      type="number"
                      min="2010"
                      max="2035"
                      value={formProcurementYear}
                      onChange={e => setFormProcurementYear(e.target.value)}
                      placeholder="2025"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Sumber Anggaran / Dana Pengadaan
                    </label>
                    <input
                      type="text"
                      list="funding-list"
                      value={formFundingSource}
                      onChange={e => setFormFundingSource(e.target.value)}
                      placeholder="e.g. DIPA Kemensos RI, APBN, BOS"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
                    />
                    <datalist id="funding-list">
                      {FUNDING_OPTIONS.map(f => (
                        <option key={f} value={f} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>

              {/* SECTION 3: KUANTITAS & KONDISI FISIK STANDAR BMN */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  3. Kuantitas & Klasifikasi Kondisi Fisik BMN
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Jumlah Total */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Jumlah Total Unit <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formTotalQuantity}
                      onChange={e => setFormTotalQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 bg-white"
                      required
                    />
                    <span className="text-[11px] text-slate-600 mt-1 block">Total unit terpasang</span>
                  </div>

                  {/* Rusak Berapa */}
                  <div>
                    <label className="block text-xs font-medium text-rose-600 mb-1">
                      Jumlah Unit Rusak (RR/RB)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={formTotalQuantity}
                      value={formDamagedQuantity}
                      onChange={e => {
                        const val = Math.max(0, parseInt(e.target.value) || 0);
                        setFormDamagedQuantity(val);
                        if (val === 0) {
                          setFormDamageSeverity('tidak_ada');
                        } else if (formDamageSeverity === 'tidak_ada') {
                          setFormDamageSeverity('ringan');
                        }
                      }}
                      className="w-full px-3 py-2 text-sm font-bold border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-rose-700 bg-white"
                    />
                    <span className="text-[11px] text-slate-600 mt-1 block">Rusak fisik berapa unit</span>
                  </div>

                  {/* Kondisi Baik (Auto calculate) */}
                  <div>
                    <label className="block text-xs font-medium text-emerald-700 mb-1">
                      Kondisi Baik / Layak (B)
                    </label>
                    <div className="px-3 py-2 text-sm font-bold rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800">
                      {Math.max(0, formTotalQuantity - formDamagedQuantity)} Unit
                    </div>
                    <span className="text-[11px] text-slate-600 mt-1 block">Otomatis dihitung sistem</span>
                  </div>
                </div>
              </div>

              {/* Status Rusak Apa & Tingkat Kerusakan (Tampil saat ada rusak) */}
              {formDamagedQuantity > 0 && (
                <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200 space-y-3">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Rincian Kerusakan Fasilitas (Standar SOP Sarpras):
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-1">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Klasifikasi Kerusakan <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formDamageSeverity}
                        onChange={e => setFormDamageSeverity(e.target.value as any)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white text-slate-800 font-medium"
                      >
                        <option value="ringan">Rusak Ringan (RR - Masih bisa dipakai)</option>
                        <option value="sedang">Rusak Sedang (RS - Perlu servis tukang)</option>
                        <option value="berat">Rusak Berat (RB - Afkir / Penggantian baru)</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Rincian Kerusakan Fisik (Rusak Apa) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formDamageStatus}
                        onChange={e => setFormDamageStatus(e.target.value)}
                        placeholder="e.g. Palang tangga patah las, baut fondasi kendor, cover kasur sobek samping"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white text-slate-800"
                        required={formDamagedQuantity > 0}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Link GDrive Dokumentasi Foto Kerusakan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FolderSymlink className="w-4 h-4 text-blue-600" />
                    Tautan Google Drive (Foto Bukti Kerusakan Fisik / Kartu Kendali)
                  </span>
                  {formGdriveLink && (
                    <a
                      href={formGdriveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-[11px] font-medium flex items-center gap-0.5"
                    >
                      Buka Tautan <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </label>
                <input
                  type="url"
                  value={formGdriveLink}
                  onChange={e => setFormGdriveLink(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
                <span className="text-[11px] text-slate-600 mt-1 block">
                  Tempelkan URL folder Google Drive yang memuat foto detail kerusakan sarpras.
                </span>
              </div>

              {/* SECTION 4: TINDAK LANJUT & LEGALITAS PENDATAAN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Rencana Tindak Lanjut Sarpras <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formActionPlan}
                    onChange={e => setFormActionPlan(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white text-slate-800 font-medium"
                    required
                  >
                    {ACTION_PLAN_OPTIONS.map(plan => (
                      <option key={plan} value={plan}>{plan}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Petugas Pendata / Wali Asuh / Sarpras
                  </label>
                  <input
                    type="text"
                    value={formInspectorName}
                    onChange={e => setFormInspectorName(e.target.value)}
                    placeholder="Nama Petugas Pemeriksa"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
                  />
                </div>
              </div>

              {/* Catatan Tambahan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Catatan Tambahan & Rekomendasi Instansi
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Tambahkan catatan khusus teknis, estimasi perbaikan tukang, atau instruksi piket siswa..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-2xs"
                >
                  {editingAssetId ? 'Simpan Perubahan Aset' : 'Simpan Data Aset BMN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL STIKER LABEL BARCODE BMN RESMI */}
      {labelModalAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-sm text-slate-800">Label Inventaris Barang Milik Negara (BMN)</h3>
              </div>
              <button
                onClick={() => setLabelModalAsset(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Sticker Preview Card */}
            <div className="p-6">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Pratinjau Fisik Stiker (100 x 60 mm):</span>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Format Standar Inventaris
                </span>
              </div>

              <div
                id="printable-bmn-sticker"
                className="border-2 border-slate-800 p-4 rounded-lg bg-white shadow-xs font-sans text-slate-900 relative"
              >
                {/* Header Kop Label */}
                <div className="text-center border-b-2 border-slate-800 pb-2 mb-3">
                  <div className="text-[10px] font-bold tracking-wider uppercase text-slate-700">
                    KEMENTERIAN SOSIAL REPUBLIK INDONESIA
                  </div>
                  <div className="text-xs font-extrabold uppercase text-slate-900">
                    SEKOLAH RAKYAT TERPADU 31 PALEMBANG
                  </div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-emerald-800 mt-0.5">
                    KARTU KENDALI INVENTARIS ASET ASRAMA
                  </div>
                </div>

                {/* Content with QR */}
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1 text-[11px] leading-tight flex-1">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase block">KODE BMN / REGISTER</span>
                      <span className="font-mono font-extrabold text-xs text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                        {labelModalAsset.assetCode || labelModalAsset.id}
                      </span>
                    </div>

                    <div className="pt-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase block">NAMA BARANG</span>
                      <span className="font-bold text-slate-900 text-xs">{labelModalAsset.itemName}</span>
                    </div>

                    {labelModalAsset.brandSpec && (
                      <div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase block">SPESIFIKASI</span>
                        <span className="text-[10px] text-slate-700 line-clamp-1">{labelModalAsset.brandSpec}</span>
                      </div>
                    )}

                    <div className="pt-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase block">LOKASI PENEMPATAN</span>
                      <span className="text-[10px] font-bold text-slate-800">
                        {labelModalAsset.dormName}
                      </span>
                      <div className="text-[10px] text-slate-600">
                        {labelModalAsset.buildingBlock ? `${labelModalAsset.buildingBlock} - ` : ''}{labelModalAsset.roomNumber}
                      </div>
                    </div>

                    <div className="pt-1 text-[10px] text-slate-600">
                      Tahun: <strong>{labelModalAsset.procurementYear || '-'}</strong> | Sumber: <strong>{labelModalAsset.fundingSource || 'DIPA'}</strong>
                    </div>
                  </div>

                  {/* QR Code Container */}
                  <div className="shrink-0 flex flex-col items-center">
                    {labelQrCodeUrl ? (
                      <img
                        src={labelQrCodeUrl}
                        alt="QR Code Aset"
                        className="w-24 h-24 border border-slate-300 p-1 rounded bg-white"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                        Memuat QR...
                      </div>
                    )}
                    <span className="text-[8px] font-mono text-slate-500 mt-1 font-bold">SCAN VERIFIKASI</span>
                  </div>
                </div>

                {/* Footer Disclaimer */}
                <div className="border-t border-slate-300 mt-3 pt-1.5 text-center text-[8px] text-slate-500 italic">
                  Barang Milik Negara / Sekolah Rakyat — Dilarang memindahkan tanpa izin Bagian Sarpras
                </div>
              </div>

              {/* Opsi Metode Cetak Label Stiker */}
              <div className="mt-5 space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Pilih Format & Metode Cetak:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option 1: PDF Single 100x60mm */}
                  <button
                    type="button"
                    onClick={() => handlePrintSingleSticker(labelModalAsset)}
                    className="p-3 text-left rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 bg-white transition-all shadow-2xs group"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-800 group-hover:text-emerald-800">
                      <Download className="w-4 h-4 text-emerald-600" />
                      <span>Unduh PDF Stiker (100x60mm)</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      Format tunggal ukuran presisi 100x60mm, ideal untuk printer stiker khusus/thermal.
                    </p>
                  </button>

                  {/* Option 2: PDF A4 Sheet (8 labels) */}
                  <button
                    type="button"
                    onClick={() => handlePrintStickerSheet(labelModalAsset)}
                    className="p-3 text-left rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 bg-white transition-all shadow-2xs group"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-800 group-hover:text-blue-800">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <span>Cetak Lembar A4 (8 Stiker)</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      Format 8 label per lembar A4 dengan garis potong, pas untuk kertas stiker / Tom & Jerry.
                    </p>
                  </button>
                </div>

                {/* Option 3: Direct Browser Print */}
                <button
                  type="button"
                  onClick={() => handleBrowserPrintSticker(labelModalAsset)}
                  className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 bg-slate-50 transition-all flex items-center justify-center gap-2 text-xs font-semibold text-slate-700"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>Cetak Langsung ke Printer Browser (Dialog Cetak)</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setLabelModalAsset(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Selesai / Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
