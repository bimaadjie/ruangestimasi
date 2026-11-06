/**
 * Katalog Pekerjaan Konstruksi Standar RuangEstimasi (Sumber Referensi: RAB Gedung USC)
 *
 * ATURAN UTAMA TEMPLATE STANDAR GLOBAL:
 * 1. Menggunakan struktur lengkap katalog pekerjaan Gedung USC:
 *    - Kelompok Umum & Pondasi (Persiapan, Tanah & Urugan, Pondasi Batu Kali Type A & B,
 *      Pondasi Footplat Type A & B, Bore Pile, Lantai Kerja, Kolom Pedestal K1 & K2,
 *      Sloof S1/S2/S3/Kustom, MEP Umum & Landscape)
 *    - Kelompok Pekerjaan Lantai 1, Lantai 2, dan Lantai Lainnya (Struktural Kolom K1/K2/K3/Praktis/Kustom,
 *      Balok B1/B2/B3/Induk/Anak/Bordes/Latei/Ring Balok/Kustom, Pelat Lantai P1, Plat & Anak Tangga,
 *      Rangka & Penutup Atap, Arsitektural Dinding/Plesteran/Acian/Keramik/Granit/Homogenous Tile/Plafond/
 *      Pengecatan/Pintu P1-P4/Jendela J1-J4/Bouvenlight/Fasad/Railing, serta MEP Kelistrikan & Sanitasi)
 * 2. Seluruh nilai demonstrasi proyek USC telah dikosongkan:
 *    - Semua parameter memiliki `value: null`
 *    - Tidak ada dimensi, panjang, lebar, tinggi, tebal, jumlah elemen, luas, atau volume bawaan USC.
 */

import { CatalogWorkItem } from '../types';

export const USC_CATALOG_VERSION = '3.0.0-USC-FULL';

export const CATALOG_WORK_ITEMS: CatalogWorkItem[] = [
  // ==========================================
  // I. PEKERJAAN PERSIAPAN & UMUM (UMUM & PONDASI)
  // ==========================================
  {
    id: 'prep-pembersihan-lahan',
    code: 'PER-01',
    name: 'Pembersihan Lahan',
    category: 'Persiapan Dll',
    subCategory: 'I. Pekerjaan Persiapan',
    floorRule: 'umum',
    description: 'Pembersihan dan perataan area lahan sebelum memulai pekerjaan konstruksi.',
    defaultUnit: 'm²',
    formulaDisplay: 'Panjang × Lebar',
    excelSheet: 'Volume Persiapan Dll',
    excelCell: 'J8',
    excelFormula: '=G9*G10',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang', name: 'panjang', label: 'Panjang Lahan', placeholder: 'Masukkan panjang lahan (m)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar Lahan', placeholder: 'Masukkan lebar lahan (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang'];
      const l = params['lebar'];
      if (p == null || l == null || isNaN(p) || isNaN(l)) return null;
      return p * l;
    },
  },
  {
    id: 'prep-pagar-sementara',
    code: 'PER-02',
    name: 'Pemasangan Pagar Sementara Proyek',
    category: 'Persiapan Dll',
    subCategory: 'I. Pekerjaan Persiapan',
    floorRule: 'umum',
    description: 'Pemasangan pagar pengaman sementara mengelilingi area tapak proyek.',
    defaultUnit: 'm',
    formulaDisplay: '2 × (Panjang + Lebar)',
    excelSheet: 'Volume Persiapan Dll',
    excelCell: 'G18',
    excelFormula: '=(G15+G16)*2',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang', name: 'panjang', label: 'Panjang Area Pagar', placeholder: 'Masukkan panjang area (m)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar Area Pagar', placeholder: 'Masukkan lebar area (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang'];
      const l = params['lebar'];
      if (p == null || l == null || isNaN(p) || isNaN(l)) return null;
      return 2 * (p + l);
    },
  },
  {
    id: 'prep-bouwplank',
    code: 'PER-03',
    name: 'Pekerjaan Bouwplank & Pengukuran',
    category: 'Persiapan Dll',
    subCategory: 'I. Pekerjaan Persiapan',
    floorRule: 'umum',
    description: 'Pemasangan papan duga (bouwplank) dan penentuan titik as bangunan.',
    defaultUnit: 'm',
    formulaDisplay: '2 × (Panjang + Lebar)',
    excelSheet: 'Volume Persiapan Dll',
    excelCell: 'J20',
    excelFormula: '=(G21+G22)*2',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang', name: 'panjang', label: 'Panjang Bangunan', placeholder: 'Masukkan panjang bangunan (m)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar Bangunan', placeholder: 'Masukkan lebar bangunan (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang'];
      const l = params['lebar'];
      if (p == null || l == null || isNaN(p) || isNaN(l)) return null;
      return 2 * (p + l);
    },
  },
  {
    id: 'prep-gudang-alat',
    code: 'PER-04',
    name: 'Pembuatan Gudang Alat & Direksikeet',
    category: 'Persiapan Dll',
    subCategory: 'I. Pekerjaan Persiapan',
    floorRule: 'umum',
    description: 'Pembuatan gudang material, peralatan, dan kantor lapangan sementara.',
    defaultUnit: 'm²',
    formulaDisplay: 'Panjang × Lebar',
    excelSheet: 'Volume Persiapan Dll',
    excelCell: 'H30',
    excelFormula: '=G27*G28',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang', name: 'panjang', label: 'Panjang Bangunan Sementara', placeholder: 'Masukkan panjang (m)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar Bangunan Sementara', placeholder: 'Masukkan lebar (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang'];
      const l = params['lebar'];
      if (p == null || l == null || isNaN(p) || isNaN(l)) return null;
      return p * l;
    },
  },

  // ==========================================
  // II. PEKERJAAN STRUKTURAL - TANAH & URUGAN (UMUM & PONDASI)
  // ==========================================
  {
    id: 'str-galian-tanah-biasa-1m',
    code: 'STR-TNH-01',
    name: 'Penggalian Tanah Biasa Sedalam 1 m (Pondasi Batu Belah)',
    category: 'Struktural',
    subCategory: 'I. Pekerjaan Tanah dan Urugan',
    floorRule: 'fondasi_saja',
    description: 'Galian tanah jalur pondasi batu belah/kali penampang trapesium atau persegi.',
    defaultUnit: 'm³',
    formulaDisplay: '0.5 × (Lebar Bawah + Lebar Atas) × Kedalaman × Panjang Total',
    excelSheet: 'Volume Struktural',
    excelCell: 'U14',
    excelFormula: '=M14*(1/2*(K14+I14))*S14',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'lebar_bawah', name: 'lebar_bawah', label: 'Lebar Bawah Galian', placeholder: 'Masukkan lebar bawah (m)', value: null, unit: 'm', required: true },
      { id: 'lebar_atas', name: 'lebar_atas', label: 'Lebar Atas Galian', placeholder: 'Masukkan lebar atas (m)', value: null, unit: 'm', required: true },
      { id: 'kedalaman', name: 'kedalaman', label: 'Kedalaman Galian', placeholder: 'Masukkan kedalaman (m)', value: null, unit: 'm', required: true },
      { id: 'panjang_total', name: 'panjang_total', label: 'Panjang Total Galian', placeholder: 'Masukkan panjang total jalur (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const lb = params['lebar_bawah'];
      const la = params['lebar_atas'];
      const t = params['kedalaman'];
      const s = params['panjang_total'];
      if (lb == null || la == null || t == null || s == null) return null;
      return t * (0.5 * (lb + la)) * s;
    },
  },
  {
    id: 'str-galian-pondasi-footplat',
    code: 'STR-TNH-02',
    name: 'Penggalian Tanah Biasa Sedalam 2 m (Pondasi Footplat Type B)',
    category: 'Struktural',
    subCategory: 'I. Pekerjaan Tanah dan Urugan',
    floorRule: 'fondasi_saja',
    description: 'Galian tanah setempat untuk titik pondasi telapak (footplat Type B).',
    defaultUnit: 'm³',
    formulaDisplay: 'Panjang × Lebar × Kedalaman × Jumlah Titik',
    excelSheet: 'Volume Struktural',
    excelCell: 'U18',
    excelFormula: '=O18*M18*K18*I18',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang', name: 'panjang', label: 'Panjang Galian Tapak', placeholder: 'Masukkan panjang galian (m)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar Galian Tapak', placeholder: 'Masukkan lebar galian (m)', value: null, unit: 'm', required: true },
      { id: 'kedalaman', name: 'kedalaman', label: 'Kedalaman Galian', placeholder: 'Masukkan kedalaman (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah', name: 'jumlah', label: 'Jumlah Titik Pondasi', placeholder: 'Masukkan jumlah titik', value: null, unit: 'titik', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang'];
      const l = params['lebar'];
      const t = params['kedalaman'];
      const n = params['jumlah'];
      if (p == null || l == null || t == null || n == null) return null;
      return p * l * t * n;
    },
  },
  {
    id: 'str-galian-tanah-3m-footplat-a',
    code: 'STR-TNH-03',
    name: 'Penggalian Tanah Sedalam 3 m (Pondasi Footplat Type A)',
    category: 'Struktural',
    subCategory: 'I. Pekerjaan Tanah dan Urugan',
    floorRule: 'fondasi_saja',
    description: 'Galian tanah dalam untuk titik pondasi telapak utama (footplat Type A).',
    defaultUnit: 'm³',
    formulaDisplay: 'Panjang × Lebar × Kedalaman × Jumlah Titik',
    excelSheet: 'Volume Struktural',
    excelCell: 'U20',
    excelFormula: '=O20*M20*K20*I20',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang', name: 'panjang', label: 'Panjang Galian Tapak', placeholder: 'Masukkan panjang galian (m)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar Galian Tapak', placeholder: 'Masukkan lebar galian (m)', value: null, unit: 'm', required: true },
      { id: 'kedalaman', name: 'kedalaman', label: 'Kedalaman Galian', placeholder: 'Masukkan kedalaman (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah', name: 'jumlah', label: 'Jumlah Titik Pondasi', placeholder: 'Masukkan jumlah titik', value: null, unit: 'titik', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang'];
      const l = params['lebar'];
      const t = params['kedalaman'];
      const n = params['jumlah'];
      if (p == null || l == null || t == null || n == null) return null;
      return p * l * t * n;
    },
  },
  {
    id: 'str-urugan-kembali-tanah',
    code: 'STR-TNH-04',
    name: 'Pengurugan Kembali Galian Tanah Pondasi Batu Belah',
    category: 'Struktural',
    subCategory: 'I. Pekerjaan Tanah dan Urugan',
    floorRule: 'fondasi_saja',
    description: 'Pengurugan kembali tanah hasil galian di sisi lubang pondasi batu belah.',
    defaultUnit: 'm³',
    formulaDisplay: 'Volume Galian Total ÷ 3',
    excelSheet: 'Volume Struktural',
    excelCell: 'U22',
    excelFormula: '=U16/3',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'volume_galian', name: 'volume_galian', label: 'Volume Galian Tanah Total', placeholder: 'Masukkan total volume galian (m³)', value: null, unit: 'm³', required: true },
    ],
    calculationMethod: (params) => {
      const v = params['volume_galian'];
      if (v == null || isNaN(v)) return null;
      return v / 3;
    },
  },
  {
    id: 'str-urugan-kembali-footplat',
    code: 'STR-TNH-05',
    name: 'Pengurugan Kembali Galian Tanah Pondasi Footplat',
    category: 'Struktural',
    subCategory: 'I. Pekerjaan Tanah dan Urugan',
    floorRule: 'fondasi_saja',
    description: 'Pengurugan kembali tanah galian pada titik pondasi footplat.',
    defaultUnit: 'm³',
    formulaDisplay: 'Volume Galian Footplat ÷ 3',
    excelSheet: 'Volume Struktural',
    excelCell: 'U23',
    excelFormula: '=U21/3',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'volume_galian_footplat', name: 'volume_galian_footplat', label: 'Volume Galian Footplat', placeholder: 'Masukkan volume galian footplat (m³)', value: null, unit: 'm³', required: true },
    ],
    calculationMethod: (params) => {
      const v = params['volume_galian_footplat'];
      if (v == null || isNaN(v)) return null;
      return v / 3;
    },
  },
  {
    id: 'str-urugan-tanah-peninggian',
    code: 'STR-TNH-06',
    name: 'Pengurugan Tanah Peninggian Lantai',
    category: 'Struktural',
    subCategory: 'I. Pekerjaan Tanah dan Urugan',
    floorRule: 'fondasi_saja',
    description: 'Urugan tanah padat untuk peninggian elevasi lantai dasar bangunan.',
    defaultUnit: 'm³',
    formulaDisplay: 'Panjang × Lebar × Tebal Urugan',
    excelSheet: 'Volume Struktural',
    excelCell: 'U24',
    excelFormula: '=I24*K24*M24',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang', name: 'panjang', label: 'Panjang Area Urugan', placeholder: 'Masukkan panjang area (m)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar Area Urugan', placeholder: 'Masukkan lebar area (m)', value: null, unit: 'm', required: true },
      { id: 'tebal', name: 'tebal', label: 'Tebal Peninggian Tanah', placeholder: 'Masukkan tebal urugan (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang'];
      const l = params['lebar'];
      const t = params['tebal'];
      if (p == null || l == null || t == null) return null;
      return p * l * t;
    },
  },
  {
    id: 'str-urugan-pasir-bawah-pondasi',
    code: 'STR-TNH-07',
    name: 'Pengurugan Pasir Urug Bawah Pondasi',
    category: 'Struktural',
    subCategory: 'I. Pekerjaan Tanah dan Urugan',
    floorRule: 'fondasi_saja',
    description: 'Lapisan pasir urug padat di bawah pondasi batu belah dan pondasi tapak.',
    defaultUnit: 'm³',
    formulaDisplay: 'Panjang × Lebar × Tebal Pasir',
    excelSheet: 'Volume Struktural',
    excelCell: 'U26',
    excelFormula: '=M26*K26*I26',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang', name: 'panjang', label: 'Panjang Jalur / Total Lebar Pondasi', placeholder: 'Masukkan panjang (m)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar Lapisan Pasir', placeholder: 'Masukkan lebar (m)', value: null, unit: 'm', required: true },
      { id: 'tebal', name: 'tebal', label: 'Tebal Urugan Pasir', placeholder: 'Masukkan tebal pasir (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang'];
      const l = params['lebar'];
      const t = params['tebal'];
      if (p == null || l == null || t == null) return null;
      return p * l * t;
    },
  },
  {
    id: 'str-urugan-pasir-bawah-lantai',
    code: 'STR-TNH-08',
    name: 'Pengurugan Pasir Urug Bawah Lantai',
    category: 'Struktural',
    subCategory: 'I. Pekerjaan Tanah dan Urugan',
    floorRule: 'fondasi_saja',
    description: 'Lapisan pasir alas di bawah lantai dasar bangunan.',
    defaultUnit: 'm³',
    formulaDisplay: 'Panjang × Lebar × Tebal Pasir',
    excelSheet: 'Volume Struktural',
    excelCell: 'U30',
    excelFormula: '=I30*K30*M30',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang', name: 'panjang', label: 'Panjang Area Lantai', placeholder: 'Masukkan panjang lantai (m)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar Area Lantai', placeholder: 'Masukkan lebar lantai (m)', value: null, unit: 'm', required: true },
      { id: 'tebal', name: 'tebal', label: 'Tebal Pasir Bawah Lantai', placeholder: 'Masukkan tebal pasir (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang'];
      const l = params['lebar'];
      const t = params['tebal'];
      if (p == null || l == null || t == null) return null;
      return p * l * t;
    },
  },

  // ==========================================
  // III. PEKERJAAN STRUKTURAL - PONDASI (UMUM & PONDASI)
  // ==========================================
  {
    id: 'str-pasangan-batu-belah-1sp6pp',
    code: 'STR-PON-01',
    name: 'Pemasangan Pondasi Batu Belah Campuran 1SP : 6PP Type A',
    category: 'Struktural',
    subCategory: 'II. Pekerjaan Pondasi',
    floorRule: 'fondasi_saja',
    description: 'Pasangan pondasi menerus batu kali/belah Type A penampang trapesium.',
    defaultUnit: 'm³',
    formulaDisplay: 'Tinggi × 0.5 × (Lebar Atas + Lebar Bawah) × Panjang Total',
    excelSheet: 'Volume Struktural',
    excelCell: 'U32',
    excelFormula: '=I32*(1/2*(K32+M32))*S32',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Pondasi', placeholder: 'Masukkan tinggi pondasi (m)', value: null, unit: 'm', required: true },
      { id: 'lebar_atas', name: 'lebar_atas', label: 'Lebar Atas Pondasi', placeholder: 'Masukkan lebar atas (m)', value: null, unit: 'm', required: true },
      { id: 'lebar_bawah', name: 'lebar_bawah', label: 'Lebar Bawah Pondasi', placeholder: 'Masukkan lebar bawah (m)', value: null, unit: 'm', required: true },
      { id: 'panjang_total', name: 'panjang_total', label: 'Panjang Total Jalur Pondasi', placeholder: 'Masukkan panjang total (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const t = params['tinggi'];
      const la = params['lebar_atas'];
      const lb = params['lebar_bawah'];
      const s = params['panjang_total'];
      if (t == null || la == null || lb == null || s == null) return null;
      return t * (0.5 * (la + lb)) * s;
    },
  },
  {
    id: 'str-pasangan-batu-belah-type-b',
    code: 'STR-PON-02',
    name: 'Pemasangan Pondasi Batu Belah Campuran 1SP : 6PP Type B',
    category: 'Struktural',
    subCategory: 'II. Pekerjaan Pondasi',
    floorRule: 'fondasi_saja',
    description: 'Pasangan pondasi menerus batu kali/belah Type B penampang trapesium.',
    defaultUnit: 'm³',
    formulaDisplay: 'Tinggi × 0.5 × (Lebar Atas + Lebar Bawah) × Panjang Total',
    excelSheet: 'Volume Struktural',
    excelCell: 'U33',
    excelFormula: '=I33*(1/2*(K33+M33))*S33',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Pondasi', placeholder: 'Masukkan tinggi pondasi (m)', value: null, unit: 'm', required: true },
      { id: 'lebar_atas', name: 'lebar_atas', label: 'Lebar Atas Pondasi', placeholder: 'Masukkan lebar atas (m)', value: null, unit: 'm', required: true },
      { id: 'lebar_bawah', name: 'lebar_bawah', label: 'Lebar Bawah Pondasi', placeholder: 'Masukkan lebar bawah (m)', value: null, unit: 'm', required: true },
      { id: 'panjang_total', name: 'panjang_total', label: 'Panjang Total Jalur Pondasi', placeholder: 'Masukkan panjang total (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const t = params['tinggi'];
      const la = params['lebar_atas'];
      const lb = params['lebar_bawah'];
      const s = params['panjang_total'];
      if (t == null || la == null || lb == null || s == null) return null;
      return t * (0.5 * (la + lb)) * s;
    },
  },
  {
    id: 'str-pondasi-footplat-beton',
    code: 'STR-PON-03',
    name: 'Pekerjaan Pondasi Footplat Type A - Beton K-350',
    category: 'Struktural',
    subCategory: 'II. Pekerjaan Pondasi',
    floorRule: 'fondasi_saja',
    description: 'Volume beton telapak pondasi footplat Type A (bagian miring limas + blok bawah).',
    defaultUnit: 'm³',
    formulaDisplay: '[(Lebar Alas + Lebar Atas)/2 × Lebar Alas × Tebal Limas × Jml] + [Lebar Alas² × Tebal Alas × Jml]',
    excelSheet: 'Volume Struktural',
    excelCell: 'U44',
    excelFormula: '=SUM(U42:U43)',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'lebar_alas', name: 'lebar_alas', label: 'Lebar Sisi Alas Tapak', placeholder: 'Masukkan lebar alas (m)', value: null, unit: 'm', required: true },
      { id: 'lebar_atas', name: 'lebar_atas', label: 'Lebar Sisi Atas Limas', placeholder: 'Masukkan lebar atas (m)', value: null, unit: 'm', required: true },
      { id: 'tebal_limas', name: 'tebal_limas', label: 'Tebal Bagian Miring Limas', placeholder: 'Masukkan tebal limas (m)', value: null, unit: 'm', required: true },
      { id: 'tebal_alas', name: 'tebal_alas', label: 'Tebal Blok Alas Bawah', placeholder: 'Masukkan tebal alas (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah_titik', name: 'jumlah_titik', label: 'Jumlah Titik Pondasi', placeholder: 'Masukkan jumlah titik', value: null, unit: 'titik', required: true },
    ],
    calculationMethod: (params) => {
      const ia = params['lebar_alas'];
      const ja = params['lebar_atas'];
      const t1 = params['tebal_limas'];
      const t2 = params['tebal_alas'];
      const jml = params['jumlah_titik'];
      if (ia == null || ja == null || t1 == null || t2 == null || jml == null) return null;
      const vBagian1 = ((ia + ja) / 2) * ia * t1 * jml;
      const vBagian2 = ia * ia * t2 * jml;
      return vBagian1 + vBagian2;
    },
  },
  {
    id: 'str-pondasi-footplat-tulangan',
    code: 'STR-PON-04',
    name: 'Pekerjaan Pondasi Footplat Type A - Pembesian Tulangan Atas & Bawah',
    category: 'Struktural',
    subCategory: 'II. Pekerjaan Pondasi',
    floorRule: 'fondasi_saja',
    description: 'Berat besi tulangan anyaman atas dan bawah pondasi footplat Type A.',
    defaultUnit: 'kg',
    formulaDisplay: '2 × [(Panjang / Jarak) × Jml × Berat Jenis × (Panjang + 2×Kait)]',
    excelSheet: 'Volume Struktural',
    excelCell: 'U45',
    excelFormula: '=(I45/0.15)*O45*T45*(((K45-0.08)+(M45-0.08)*2))',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_bentang', name: 'panjang_bentang', label: 'Panjang Bentang Telapak', placeholder: 'Masukkan panjang bentang (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi_tekukan', name: 'tinggi_tekukan', label: 'Tinggi Tekukan Kait', placeholder: 'Masukkan tinggi kait (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah_titik', name: 'jumlah_titik', label: 'Jumlah Titik Pondasi', placeholder: 'Masukkan jumlah titik', value: null, unit: 'titik', required: true },
      { id: 'jarak_sengkang', name: 'jarak_sengkang', label: 'Jarak Antar Tulangan', placeholder: 'Masukkan jarak tulangan (m)', value: null, unit: 'm', required: true },
      { id: 'berat_jenis', name: 'berat_jenis', label: 'Berat Besi per Meter', placeholder: 'Masukkan berat jenis besi (kg/m)', value: null, unit: 'kg/m', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_bentang'];
      const m = params['tinggi_tekukan'];
      const n = params['jumlah_titik'];
      const s = params['jarak_sengkang'];
      const bj = params['berat_jenis'];
      if (p == null || m == null || n == null || s == null || bj == null || s <= 0) return null;
      const satuLapis = (p / s) * n * bj * ((p - 0.08) + (m - 0.08) * 2);
      return satuLapis * 2;
    },
  },
  {
    id: 'str-pondasi-footplat-bekisting',
    code: 'STR-PON-05',
    name: 'Pekerjaan Pondasi Footplat Type A - Bekisting',
    category: 'Struktural',
    subCategory: 'II. Pekerjaan Pondasi',
    floorRule: 'fondasi_saja',
    description: 'Luas bekisting 4 sisi tegak telapak pondasi footplat Type A.',
    defaultUnit: 'm²',
    formulaDisplay: '4 × Sisi Telapak × Tinggi Sisi × Jumlah Titik',
    excelSheet: 'Volume Struktural',
    excelCell: 'U47',
    excelFormula: '=K47*M47*Q47',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'sisi', name: 'sisi', label: 'Panjang Sisi Telapak', placeholder: 'Masukkan panjang sisi (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Sisi Bekisting', placeholder: 'Masukkan tinggi bekisting (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah_titik', name: 'jumlah_titik', label: 'Jumlah Titik Pondasi', placeholder: 'Masukkan jumlah titik', value: null, unit: 'titik', required: true },
    ],
    calculationMethod: (params) => {
      const s = params['sisi'];
      const t = params['tinggi'];
      const n = params['jumlah_titik'];
      if (s == null || t == null || n == null) return null;
      return s * t * 4 * n;
    },
  },
  {
    id: 'str-pondasi-footplat-f2-beton',
    code: 'STR-PON-06',
    name: 'Pekerjaan Pondasi Footplat Type B - Beton K-350',
    category: 'Struktural',
    subCategory: 'II. Pekerjaan Pondasi',
    floorRule: 'fondasi_saja',
    description: 'Volume beton telapak pondasi footplat Type B (bagian miring limas + blok bawah).',
    defaultUnit: 'm³',
    formulaDisplay: '[(Lebar Alas + Lebar Atas)/2 × Lebar Alas × Tebal Limas × Jml] + [Lebar Alas² × Tebal Alas × Jml]',
    excelSheet: 'Volume Struktural',
    excelCell: 'U37',
    excelFormula: '=SUM(U35:U36)',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'lebar_alas', name: 'lebar_alas', label: 'Lebar Sisi Alas Tapak', placeholder: 'Masukkan lebar alas (m)', value: null, unit: 'm', required: true },
      { id: 'lebar_atas', name: 'lebar_atas', label: 'Lebar Sisi Atas Limas', placeholder: 'Masukkan lebar atas (m)', value: null, unit: 'm', required: true },
      { id: 'tebal_limas', name: 'tebal_limas', label: 'Tebal Bagian Miring Limas', placeholder: 'Masukkan tebal limas (m)', value: null, unit: 'm', required: true },
      { id: 'tebal_alas', name: 'tebal_alas', label: 'Tebal Blok Alas Bawah', placeholder: 'Masukkan tebal alas (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah_titik', name: 'jumlah_titik', label: 'Jumlah Titik Pondasi', placeholder: 'Masukkan jumlah titik', value: null, unit: 'titik', required: true },
    ],
    calculationMethod: (params) => {
      const ia = params['lebar_alas'];
      const ja = params['lebar_atas'];
      const t1 = params['tebal_limas'];
      const t2 = params['tebal_alas'];
      const jml = params['jumlah_titik'];
      if (ia == null || ja == null || t1 == null || t2 == null || jml == null) return null;
      const vBagian1 = ((ia + ja) / 2) * ia * t1 * jml;
      const vBagian2 = ia * ia * t2 * jml;
      return vBagian1 + vBagian2;
    },
  },
  {
    id: 'str-pondasi-footplat-f2-tulangan',
    code: 'STR-PON-07',
    name: 'Pekerjaan Pondasi Footplat Type B - Pembesian Tulangan Atas & Bawah',
    category: 'Struktural',
    subCategory: 'II. Pekerjaan Pondasi',
    floorRule: 'fondasi_saja',
    description: 'Berat besi tulangan anyaman atas dan bawah pondasi footplat Type B.',
    defaultUnit: 'kg',
    formulaDisplay: '2 × [(Panjang / Jarak) × Jml × Berat Jenis × (Panjang + 2×Kait)]',
    excelSheet: 'Volume Struktural',
    excelCell: 'U38',
    excelFormula: '=(I38/0.15)*O38*T38*(((K38-0.08)+(M38-0.08)*2))',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_bentang', name: 'panjang_bentang', label: 'Panjang Bentang Telapak', placeholder: 'Masukkan panjang bentang (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi_tekukan', name: 'tinggi_tekukan', label: 'Tinggi Tekukan Kait', placeholder: 'Masukkan tinggi kait (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah_titik', name: 'jumlah_titik', label: 'Jumlah Titik Pondasi', placeholder: 'Masukkan jumlah titik', value: null, unit: 'titik', required: true },
      { id: 'jarak_sengkang', name: 'jarak_sengkang', label: 'Jarak Antar Tulangan', placeholder: 'Masukkan jarak tulangan (m)', value: null, unit: 'm', required: true },
      { id: 'berat_jenis', name: 'berat_jenis', label: 'Berat Besi per Meter', placeholder: 'Masukkan berat jenis besi (kg/m)', value: null, unit: 'kg/m', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_bentang'];
      const m = params['tinggi_tekukan'];
      const n = params['jumlah_titik'];
      const s = params['jarak_sengkang'];
      const bj = params['berat_jenis'];
      if (p == null || m == null || n == null || s == null || bj == null || s <= 0) return null;
      const satuLapis = (p / s) * n * bj * ((p - 0.08) + (m - 0.08) * 2);
      return satuLapis * 2;
    },
  },
  {
    id: 'str-pondasi-footplat-f2-bekisting',
    code: 'STR-PON-08',
    name: 'Pekerjaan Pondasi Footplat Type B - Bekisting',
    category: 'Struktural',
    subCategory: 'II. Pekerjaan Pondasi',
    floorRule: 'fondasi_saja',
    description: 'Luas bekisting 4 sisi tegak telapak pondasi footplat Type B.',
    defaultUnit: 'm²',
    formulaDisplay: '4 × Sisi Telapak × Tinggi Sisi × Jumlah Titik',
    excelSheet: 'Volume Struktural',
    excelCell: 'U40',
    excelFormula: '=K40*M40*Q40',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'sisi', name: 'sisi', label: 'Panjang Sisi Telapak', placeholder: 'Masukkan panjang sisi (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Sisi Bekisting', placeholder: 'Masukkan tinggi bekisting (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah_titik', name: 'jumlah_titik', label: 'Jumlah Titik Pondasi', placeholder: 'Masukkan jumlah titik', value: null, unit: 'titik', required: true },
    ],
    calculationMethod: (params) => {
      const s = params['sisi'];
      const t = params['tinggi'];
      const n = params['jumlah_titik'];
      if (s == null || t == null || n == null) return null;
      return s * t * 4 * n;
    },
  },
  {
    id: 'str-lantai-kerja-pondasi',
    code: 'STR-PON-09',
    name: 'Lantai Kerja Bawah Pondasi Footplat',
    category: 'Struktural',
    subCategory: 'II. Pekerjaan Pondasi',
    floorRule: 'fondasi_saja',
    description: 'Beton lantai kerja (lean concrete) di bawah telapak pondasi footplat.',
    defaultUnit: 'm³',
    formulaDisplay: 'Panjang × Lebar × Tebal Lantai Kerja × Jumlah Titik',
    excelSheet: 'Volume Struktural',
    excelCell: 'U53',
    excelFormula: '=I52*K52*M52*O52',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang', name: 'panjang', label: 'Panjang Lantai Kerja', placeholder: 'Masukkan panjang (m)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar Lantai Kerja', placeholder: 'Masukkan lebar (m)', value: null, unit: 'm', required: true },
      { id: 'tebal', name: 'tebal', label: 'Tebal Lantai Kerja', placeholder: 'Masukkan tebal lantai kerja (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah_titik', name: 'jumlah_titik', label: 'Jumlah Titik Pondasi', placeholder: 'Masukkan jumlah titik', value: null, unit: 'titik', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang'];
      const l = params['lebar'];
      const t = params['tebal'];
      const n = params['jumlah_titik'];
      if (p == null || l == null || t == null || n == null) return null;
      return p * l * t * n;
    },
  },

  // ==========================================
  // IV. PEKERJAAN STRUKTURAL - KOLOM PEDESTAL & SLOOF (UMUM & PONDASI)
  // ==========================================
  {
    id: 'str-kolom-pedestal-k1-beton',
    code: 'STR-PED-01',
    name: 'Kolom Pedestal Type K1 - Beton K-350',
    category: 'Struktural',
    subCategory: 'III. Struktur Kolom Pedestal & Sloof',
    floorRule: 'fondasi_saja',
    description: 'Beton kolom pedestal tipe K1 dari atas pondasi footplat hingga sloof.',
    defaultUnit: 'm³',
    formulaDisplay: 'Lebar × Tebal × Tinggi Pedestal × Jumlah Titik',
    excelSheet: 'Volume Struktural',
    excelCell: 'U55',
    excelFormula: '=I55*K55*M55*O55',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'lebar', name: 'lebar', label: 'Lebar Penampang Pedestal', placeholder: 'Masukkan lebar (m)', value: null, unit: 'm', required: true },
      { id: 'tebal', name: 'tebal', label: 'Tebal Penampang Pedestal', placeholder: 'Masukkan tebal (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Kolom Pedestal', placeholder: 'Masukkan tinggi pedestal (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah', name: 'jumlah', label: 'Jumlah Titik Pedestal', placeholder: 'Masukkan jumlah titik', value: null, unit: 'titik', required: true },
    ],
    calculationMethod: (params) => {
      const l = params['lebar'];
      const t = params['tebal'];
      const h = params['tinggi'];
      const n = params['jumlah'];
      if (l == null || t == null || h == null || n == null) return null;
      return l * t * h * n;
    },
  },
  {
    id: 'str-kolom-pedestal-k1-tulangan',
    code: 'STR-PED-02',
    name: 'Kolom Pedestal Type K1 - Pembesian Tulangan Pokok',
    category: 'Struktural',
    subCategory: 'III. Struktur Kolom Pedestal & Sloof',
    floorRule: 'fondasi_saja',
    description: 'Pembesian tulangan pokok memanjang kolom pedestal K1.',
    defaultUnit: 'kg',
    formulaDisplay: 'Tinggi Pedestal × Jumlah Titik × Jumlah Batang × Berat Jenis',
    excelSheet: 'Volume Struktural',
    excelCell: 'U56',
    excelFormula: '=T56*O56*M56*Q56',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Kolom Pedestal', placeholder: 'Masukkan tinggi pedestal (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah', name: 'jumlah', label: 'Jumlah Titik Pedestal', placeholder: 'Masukkan jumlah titik', value: null, unit: 'titik', required: true },
      { id: 'jumlah_batang', name: 'jumlah_batang', label: 'Jumlah Batang per Kolom', placeholder: 'Masukkan jumlah batang (btg)', value: null, unit: 'btg', required: true },
      { id: 'berat_jenis', name: 'berat_jenis', label: 'Berat Besi per Meter', placeholder: 'Masukkan berat jenis besi (kg/m)', value: null, unit: 'kg/m', required: true },
    ],
    calculationMethod: (params) => {
      const h = params['tinggi'];
      const n = params['jumlah'];
      const q = params['jumlah_batang'];
      const bj = params['berat_jenis'];
      if (h == null || n == null || q == null || bj == null) return null;
      return h * n * q * bj;
    },
  },
  {
    id: 'str-kolom-pedestal-k1-begel',
    code: 'STR-PED-03',
    name: 'Kolom Pedestal Type K1 - Pembesian Begel / Sengkang',
    category: 'Struktural',
    subCategory: 'III. Struktur Kolom Pedestal & Sloof',
    floorRule: 'fondasi_saja',
    description: 'Pembesian sengkang/begel kolom pedestal K1.',
    defaultUnit: 'kg',
    formulaDisplay: '2 × (Lebar + Tebal) × (Tinggi / Jarak Begel) × Jumlah Titik × Berat Jenis',
    excelSheet: 'Volume Struktural',
    excelCell: 'U57',
    excelFormula: '=(I57+K57)*2*(M57/0.15)*O57*T57',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'lebar', name: 'lebar', label: 'Lebar Penampang Pedestal', placeholder: 'Masukkan lebar (m)', value: null, unit: 'm', required: true },
      { id: 'tebal', name: 'tebal', label: 'Tebal Penampang Pedestal', placeholder: 'Masukkan tebal (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Pedestal', placeholder: 'Masukkan tinggi (m)', value: null, unit: 'm', required: true },
      { id: 'jarak_begel', name: 'jarak_begel', label: 'Jarak Sengkang / Begel', placeholder: 'Masukkan jarak begel (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah', name: 'jumlah', label: 'Jumlah Titik Pedestal', placeholder: 'Masukkan jumlah titik', value: null, unit: 'titik', required: true },
      { id: 'berat_jenis', name: 'berat_jenis', label: 'Berat Besi per Meter', placeholder: 'Masukkan berat jenis (kg/m)', value: null, unit: 'kg/m', required: true },
    ],
    calculationMethod: (params) => {
      const l = params['lebar'];
      const k = params['tebal'];
      const m = params['tinggi'];
      const s = params['jarak_begel'];
      const o = params['jumlah'];
      const t = params['berat_jenis'];
      if (l == null || k == null || m == null || s == null || o == null || t == null || s <= 0) return null;
      return (l + k) * 2 * (m / s) * o * t;
    },
  },
  {
    id: 'str-kolom-pedestal-k1-bekisting',
    code: 'STR-PED-04',
    name: 'Kolom Pedestal Type K1 - Bekisting',
    category: 'Struktural',
    subCategory: 'III. Struktur Kolom Pedestal & Sloof',
    floorRule: 'fondasi_saja',
    description: 'Pemasangan bekisting 4 sisi kolom pedestal K1.',
    defaultUnit: 'm²',
    formulaDisplay: '2 × (Lebar + Tebal) × Tinggi × Jumlah Titik',
    excelSheet: 'Volume Struktural',
    excelCell: 'U58',
    excelFormula: '=(I58*Q58*O58*M58)+(K58*Q58*O58*M58)',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'lebar', name: 'lebar', label: 'Lebar Penampang Pedestal', placeholder: 'Masukkan lebar (m)', value: null, unit: 'm', required: true },
      { id: 'tebal', name: 'tebal', label: 'Tebal Penampang Pedestal', placeholder: 'Masukkan tebal (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Pedestal', placeholder: 'Masukkan tinggi (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah', name: 'jumlah', label: 'Jumlah Titik Pedestal', placeholder: 'Masukkan jumlah titik', value: null, unit: 'titik', required: true },
    ],
    calculationMethod: (params) => {
      const l = params['lebar'];
      const t = params['tebal'];
      const h = params['tinggi'];
      const n = params['jumlah'];
      if (l == null || t == null || h == null || n == null) return null;
      return 2 * (l + t) * h * n;
    },
  },
  {
    id: 'str-kolom-pedestal-k2-beton',
    code: 'STR-PED-05',
    name: 'Kolom Pedestal Type K2 - Beton K-350',
    category: 'Struktural',
    subCategory: 'III. Struktur Kolom Pedestal & Sloof',
    floorRule: 'fondasi_saja',
    description: 'Beton kolom pedestal tipe K2 dari atas pondasi footplat hingga sloof.',
    defaultUnit: 'm³',
    formulaDisplay: 'Lebar × Tebal × Tinggi Pedestal × Jumlah Titik',
    excelSheet: 'Volume Struktural',
    excelCell: 'U60',
    excelFormula: '=I60*K60*M60*O60',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'lebar', name: 'lebar', label: 'Lebar Penampang Pedestal', placeholder: 'Masukkan lebar (m)', value: null, unit: 'm', required: true },
      { id: 'tebal', name: 'tebal', label: 'Tebal Penampang Pedestal', placeholder: 'Masukkan tebal (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Kolom Pedestal', placeholder: 'Masukkan tinggi pedestal (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah', name: 'jumlah', label: 'Jumlah Titik Pedestal', placeholder: 'Masukkan jumlah titik', value: null, unit: 'titik', required: true },
    ],
    calculationMethod: (params) => {
      const l = params['lebar'];
      const t = params['tebal'];
      const h = params['tinggi'];
      const n = params['jumlah'];
      if (l == null || t == null || h == null || n == null) return null;
      return l * t * h * n;
    },
  },
  {
    id: 'str-kolom-pedestal-k2-tulangan',
    code: 'STR-PED-06',
    name: 'Kolom Pedestal Type K2 - Pembesian Tulangan Pokok',
    category: 'Struktural',
    subCategory: 'III. Struktur Kolom Pedestal & Sloof',
    floorRule: 'fondasi_saja',
    description: 'Pembesian tulangan pokok memanjang kolom pedestal K2.',
    defaultUnit: 'kg',
    formulaDisplay: 'Tinggi Pedestal × Jumlah Titik × Jumlah Batang × Berat Jenis',
    excelSheet: 'Volume Struktural',
    excelCell: 'U61',
    excelFormula: '=T61*O61*M61*Q61',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Kolom Pedestal', placeholder: 'Masukkan tinggi pedestal (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah', name: 'jumlah', label: 'Jumlah Titik Pedestal', placeholder: 'Masukkan jumlah titik', value: null, unit: 'titik', required: true },
      { id: 'jumlah_batang', name: 'jumlah_batang', label: 'Jumlah Batang per Kolom', placeholder: 'Masukkan jumlah batang (btg)', value: null, unit: 'btg', required: true },
      { id: 'berat_jenis', name: 'berat_jenis', label: 'Berat Besi per Meter', placeholder: 'Masukkan berat jenis besi (kg/m)', value: null, unit: 'kg/m', required: true },
    ],
    calculationMethod: (params) => {
      const h = params['tinggi'];
      const n = params['jumlah'];
      const q = params['jumlah_batang'];
      const bj = params['berat_jenis'];
      if (h == null || n == null || q == null || bj == null) return null;
      return h * n * q * bj;
    },
  },
  {
    id: 'str-kolom-pedestal-k2-begel',
    code: 'STR-PED-07',
    name: 'Kolom Pedestal Type K2 - Pembesian Begel / Sengkang',
    category: 'Struktural',
    subCategory: 'III. Struktur Kolom Pedestal & Sloof',
    floorRule: 'fondasi_saja',
    description: 'Pembesian sengkang/begel kolom pedestal K2.',
    defaultUnit: 'kg',
    formulaDisplay: '2 × (Lebar + Tebal) × (Tinggi / Jarak Begel) × Jumlah Titik × Berat Jenis',
    excelSheet: 'Volume Struktural',
    excelCell: 'U62',
    excelFormula: '=(I62+K62)*2*(M62/0.15)*O62*T62',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'lebar', name: 'lebar', label: 'Lebar Penampang Pedestal', placeholder: 'Masukkan lebar (m)', value: null, unit: 'm', required: true },
      { id: 'tebal', name: 'tebal', label: 'Tebal Penampang Pedestal', placeholder: 'Masukkan tebal (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Pedestal', placeholder: 'Masukkan tinggi (m)', value: null, unit: 'm', required: true },
      { id: 'jarak_begel', name: 'jarak_begel', label: 'Jarak Sengkang / Begel', placeholder: 'Masukkan jarak begel (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah', name: 'jumlah', label: 'Jumlah Titik Pedestal', placeholder: 'Masukkan jumlah titik', value: null, unit: 'titik', required: true },
      { id: 'berat_jenis', name: 'berat_jenis', label: 'Berat Besi per Meter', placeholder: 'Masukkan berat jenis (kg/m)', value: null, unit: 'kg/m', required: true },
    ],
    calculationMethod: (params) => {
      const l = params['lebar'];
      const k = params['tebal'];
      const m = params['tinggi'];
      const s = params['jarak_begel'];
      const o = params['jumlah'];
      const t = params['berat_jenis'];
      if (l == null || k == null || m == null || s == null || o == null || t == null || s <= 0) return null;
      return (l + k) * 2 * (m / s) * o * t;
    },
  },
  {
    id: 'str-kolom-pedestal-k2-bekisting',
    code: 'STR-PED-08',
    name: 'Kolom Pedestal Type K2 - Bekisting',
    category: 'Struktural',
    subCategory: 'III. Struktur Kolom Pedestal & Sloof',
    floorRule: 'fondasi_saja',
    description: 'Pemasangan bekisting 4 sisi kolom pedestal K2.',
    defaultUnit: 'm²',
    formulaDisplay: '2 × (Lebar + Tebal) × Tinggi × Jumlah Titik',
    excelSheet: 'Volume Struktural',
    excelCell: 'U63',
    excelFormula: '=(I63*Q63*O63*M63)+(K63*Q63*O63*M63)',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'lebar', name: 'lebar', label: 'Lebar Penampang Pedestal', placeholder: 'Masukkan lebar (m)', value: null, unit: 'm', required: true },
      { id: 'tebal', name: 'tebal', label: 'Tebal Penampang Pedestal', placeholder: 'Masukkan tebal (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Pedestal', placeholder: 'Masukkan tinggi (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah', name: 'jumlah', label: 'Jumlah Titik Pedestal', placeholder: 'Masukkan jumlah titik', value: null, unit: 'titik', required: true },
    ],
    calculationMethod: (params) => {
      const l = params['lebar'];
      const t = params['tebal'];
      const h = params['tinggi'];
      const n = params['jumlah'];
      if (l == null || t == null || h == null || n == null) return null;
      return 2 * (l + t) * h * n;
    },
  },
  {
    id: 'str-sloof-beton',
    code: 'STR-SLF-01',
    name: 'Sloof S1 - Beton K-350',
    category: 'Struktural',
    subCategory: 'III. Struktur Kolom Pedestal & Sloof',
    floorRule: 'fondasi_saja',
    description: 'Pekerjaan beton struktur balok sloof tipe S1 (panjang total dari penjumlahan segmen sloof).',
    defaultUnit: 'm³',
    formulaDisplay: 'Panjang Total × Lebar × Tinggi',
    excelSheet: 'Volume Struktural',
    excelCell: 'U65',
    excelFormula: '=I65*K65*M65',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_total', name: 'panjang_total', label: 'Panjang Total Sloof', placeholder: 'Masukkan panjang total seluruh segmen (m)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar Penampang Sloof', placeholder: 'Masukkan lebar sloof (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Penampang Sloof', placeholder: 'Masukkan tinggi sloof (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_total'];
      const l = params['lebar'];
      const t = params['tinggi'];
      if (p == null || l == null || t == null || isNaN(p) || isNaN(l) || isNaN(t)) return null;
      return p * l * t;
    },
  },
  {
    id: 'str-sloof-s2',
    code: 'STR-SLF-02',
    name: 'Sloof S2 - Beton K-350',
    category: 'Struktural',
    subCategory: 'III. Struktur Kolom Pedestal & Sloof',
    floorRule: 'fondasi_saja',
    description: 'Pekerjaan beton struktur balok sloof tipe S2 (panjang total dari penjumlahan segmen sloof).',
    defaultUnit: 'm³',
    formulaDisplay: 'Panjang Total × Lebar × Tinggi',
    excelSheet: 'Volume Struktural',
    excelCell: 'U65',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_total', name: 'panjang_total', label: 'Panjang Total Sloof', placeholder: 'Masukkan panjang total seluruh segmen (m)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar Penampang Sloof', placeholder: 'Masukkan lebar sloof (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Penampang Sloof', placeholder: 'Masukkan tinggi sloof (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_total'];
      const l = params['lebar'];
      const t = params['tinggi'];
      if (p == null || l == null || t == null || isNaN(p) || isNaN(l) || isNaN(t)) return null;
      return p * l * t;
    },
  },
  {
    id: 'str-sloof-s3',
    code: 'STR-SLF-03',
    name: 'Sloof S3 - Beton K-350',
    category: 'Struktural',
    subCategory: 'III. Struktur Kolom Pedestal & Sloof',
    floorRule: 'fondasi_saja',
    description: 'Pekerjaan beton struktur balok sloof tipe S3 (panjang total dari penjumlahan segmen sloof).',
    defaultUnit: 'm³',
    formulaDisplay: 'Panjang Total × Lebar × Tinggi',
    excelSheet: 'Volume Struktural',
    excelCell: 'U65',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_total', name: 'panjang_total', label: 'Panjang Total Sloof', placeholder: 'Masukkan panjang total seluruh segmen (m)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar Penampang Sloof', placeholder: 'Masukkan lebar sloof (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Penampang Sloof', placeholder: 'Masukkan tinggi sloof (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_total'];
      const l = params['lebar'];
      const t = params['tinggi'];
      if (p == null || l == null || t == null || isNaN(p) || isNaN(l) || isNaN(t)) return null;
      return p * l * t;
    },
  },
  {
    id: 'str-sloof-kustom',
    code: 'STR-SLF-04',
    name: 'Sloof Kustom - Beton',
    category: 'Struktural',
    subCategory: 'III. Struktur Kolom Pedestal & Sloof',
    floorRule: 'fondasi_saja',
    description: 'Pekerjaan beton sloof dengan dimensi penampang sesuai spesifikasi gambar proyek.',
    defaultUnit: 'm³',
    formulaDisplay: 'Panjang Total × Lebar × Tinggi',
    excelSheet: 'Volume Struktural',
    excelCell: 'U65',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_total', name: 'panjang_total', label: 'Panjang Total Sloof', placeholder: 'Masukkan panjang total (m)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar Penampang Sloof', placeholder: 'Masukkan lebar sloof (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Penampang Sloof', placeholder: 'Masukkan tinggi sloof (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_total'];
      const l = params['lebar'];
      const t = params['tinggi'];
      if (p == null || l == null || t == null || isNaN(p) || isNaN(l) || isNaN(t)) return null;
      return p * l * t;
    },
  },
  {
    id: 'str-sloof-tulangan',
    code: 'STR-SLF-05',
    name: 'Sloof - Pembesian Tulangan Pokok',
    category: 'Struktural',
    subCategory: 'III. Struktur Kolom Pedestal & Sloof',
    floorRule: 'fondasi_saja',
    description: 'Pembesian tulangan memanjang sloof berdasarkan jumlah batang dan berat jenis besi.',
    defaultUnit: 'kg',
    formulaDisplay: 'Panjang Total × Jumlah Batang × Berat Jenis Besi',
    excelSheet: 'Volume Struktural',
    excelCell: 'U66',
    excelFormula: '=I66*Q66*T66',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_total', name: 'panjang_total', label: 'Panjang Total Sloof', placeholder: 'Masukkan panjang total sloof (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah_batang', name: 'jumlah_batang', label: 'Jumlah Batang Tulangan', placeholder: 'Masukkan jumlah batang besi (btg)', value: null, unit: 'btg', required: true },
      { id: 'berat_jenis', name: 'berat_jenis', label: 'Berat Besi per Meter', placeholder: 'Masukkan berat jenis besi (kg/m)', value: null, unit: 'kg/m', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_total'];
      const q = params['jumlah_batang'];
      const bj = params['berat_jenis'];
      if (p == null || q == null || bj == null || isNaN(p) || isNaN(q) || isNaN(bj)) return null;
      return p * q * bj;
    },
  },
  {
    id: 'str-sloof-begel',
    code: 'STR-SLF-06',
    name: 'Sloof - Pembesian Begel / Sengkang',
    category: 'Struktural',
    subCategory: 'III. Struktur Kolom Pedestal & Sloof',
    floorRule: 'fondasi_saja',
    description: 'Pembesian begel/sengkang balok sloof.',
    defaultUnit: 'kg',
    formulaDisplay: '(Panjang Total / Jarak Begel) × 2 × (Lebar + Tinggi) × Berat Jenis',
    excelSheet: 'Volume Struktural',
    excelCell: 'U67',
    excelFormula: '=I67/0.15*((K67+M67)*2)*T67',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_total', name: 'panjang_total', label: 'Panjang Total Sloof', placeholder: 'Masukkan panjang total sloof (m)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar Penampang Sloof', placeholder: 'Masukkan lebar sloof (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Penampang Sloof', placeholder: 'Masukkan tinggi sloof (m)', value: null, unit: 'm', required: true },
      { id: 'jarak_begel', name: 'jarak_begel', label: 'Jarak Begel / Sengkang', placeholder: 'Masukkan jarak begel (m)', value: null, unit: 'm', required: true },
      { id: 'berat_jenis', name: 'berat_jenis', label: 'Berat Besi per Meter', placeholder: 'Masukkan berat jenis besi (kg/m)', value: null, unit: 'kg/m', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_total'];
      const l = params['lebar'];
      const t = params['tinggi'];
      const s = params['jarak_begel'];
      const bj = params['berat_jenis'];
      if (p == null || l == null || t == null || s == null || bj == null || s <= 0) return null;
      return (p / s) * 2 * (l + t) * bj;
    },
  },
  {
    id: 'str-sloof-bekisting',
    code: 'STR-SLF-07',
    name: 'Sloof - Bekisting Samping',
    category: 'Struktural',
    subCategory: 'III. Struktur Kolom Pedestal & Sloof',
    floorRule: 'fondasi_saja',
    description: 'Pemasangan bekisting dua sisi samping balok sloof.',
    defaultUnit: 'm²',
    formulaDisplay: 'Panjang Total × Tinggi Sisi × 2 Sisi',
    excelSheet: 'Volume Struktural',
    excelCell: 'U69',
    excelFormula: '=I69*K69*Q69',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_total', name: 'panjang_total', label: 'Panjang Total Sloof', placeholder: 'Masukkan panjang total sloof (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Sisi Sloof', placeholder: 'Masukkan tinggi sloof (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_total'];
      const t = params['tinggi'];
      if (p == null || t == null || isNaN(p) || isNaN(t)) return null;
      return p * t * 2;
    },
  },

  // ==========================================
  // V. PEKERJAAN STRUKTURAL - KOLOM PER LANTAI
  // ==========================================
  {
    id: 'str-kolom-k1-beton',
    code: 'STR-KLM-01',
    name: 'Kolom Type K1 - Beton K-350',
    category: 'Struktural',
    subCategory: 'IV. Struktur Kolom',
    floorRule: 'per_lantai',
    description: 'Pekerjaan beton kolom struktur utama tipe K1 sesuai dimensi pada gambar.',
    defaultUnit: 'm³',
    formulaDisplay: 'Lebar × Tebal × Tinggi Kolom × Jumlah Kolom',
    excelSheet: 'Volume Struktural',
    excelCell: 'U71',
    excelFormula: '=I71*K71*M71*O71',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'lebar', name: 'lebar', label: 'Lebar Penampang Kolom', placeholder: 'Masukkan lebar kolom (m)', value: null, unit: 'm', required: true },
      { id: 'tebal', name: 'tebal', label: 'Tebal / Panjang Sisi Kolom', placeholder: 'Masukkan tebal kolom (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Kolom', placeholder: 'Masukkan tinggi kolom (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah', name: 'jumlah', label: 'Jumlah Titik Kolom', placeholder: 'Masukkan jumlah kolom (titik)', value: null, unit: 'titik', required: true },
    ],
    calculationMethod: (params) => {
      const l = params['lebar'];
      const t = params['tebal'];
      const h = params['tinggi'];
      const n = params['jumlah'];
      if (l == null || t == null || h == null || n == null) return null;
      return l * t * h * n;
    },
  },
  {
    id: 'str-kolom-k1-tulangan',
    code: 'STR-KLM-02',
    name: 'Kolom Type K1 - Pembesian Tulangan Pokok',
    category: 'Struktural',
    subCategory: 'IV. Struktur Kolom',
    floorRule: 'per_lantai',
    description: 'Besi tulangan memanjang kolom struktur K1.',
    defaultUnit: 'kg',
    formulaDisplay: 'Tinggi × Jumlah Titik × Jumlah Batang × Berat Jenis',
    excelSheet: 'Volume Struktural',
    excelCell: 'U72',
    excelFormula: '=T72*O72*M72*Q72',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Kolom', placeholder: 'Masukkan tinggi kolom (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah', name: 'jumlah', label: 'Jumlah Titik Kolom', placeholder: 'Masukkan jumlah titik kolom', value: null, unit: 'titik', required: true },
      { id: 'jumlah_batang', name: 'jumlah_batang', label: 'Jumlah Batang per Kolom', placeholder: 'Masukkan jumlah batang besi (btg)', value: null, unit: 'btg', required: true },
      { id: 'berat_jenis', name: 'berat_jenis', label: 'Berat Besi per Meter', placeholder: 'Masukkan berat jenis besi (kg/m)', value: null, unit: 'kg/m', required: true },
    ],
    calculationMethod: (params) => {
      const h = params['tinggi'];
      const n = params['jumlah'];
      const q = params['jumlah_batang'];
      const bj = params['berat_jenis'];
      if (h == null || n == null || q == null || bj == null) return null;
      return h * n * q * bj;
    },
  },
  {
    id: 'str-kolom-k1-begel',
    code: 'STR-KLM-03',
    name: 'Kolom Type K1 - Pembesian Begel / Sengkang',
    category: 'Struktural',
    subCategory: 'IV. Struktur Kolom',
    floorRule: 'per_lantai',
    description: 'Pembesian sengkang/begel kolom struktur K1.',
    defaultUnit: 'kg',
    formulaDisplay: '2 × (Lebar + Tebal) × (Tinggi / Jarak Begel) × Jumlah Titik × Berat Jenis',
    excelSheet: 'Volume Struktural',
    excelCell: 'U73',
    excelFormula: '=(I73+K73)*2*(M73/0.15)*O73*T73',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'lebar', name: 'lebar', label: 'Lebar Penampang Kolom', placeholder: 'Masukkan lebar kolom (m)', value: null, unit: 'm', required: true },
      { id: 'tebal', name: 'tebal', label: 'Tebal Penampang Kolom', placeholder: 'Masukkan tebal kolom (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Kolom', placeholder: 'Masukkan tinggi kolom (m)', value: null, unit: 'm', required: true },
      { id: 'jarak_begel', name: 'jarak_begel', label: 'Jarak Begel / Sengkang', placeholder: 'Masukkan jarak begel (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah', name: 'jumlah', label: 'Jumlah Titik Kolom', placeholder: 'Masukkan jumlah titik kolom', value: null, unit: 'titik', required: true },
      { id: 'berat_jenis', name: 'berat_jenis', label: 'Berat Besi per Meter', placeholder: 'Masukkan berat jenis besi (kg/m)', value: null, unit: 'kg/m', required: true },
    ],
    calculationMethod: (params) => {
      const l = params['lebar'];
      const k = params['tebal'];
      const m = params['tinggi'];
      const s = params['jarak_begel'];
      const o = params['jumlah'];
      const t = params['berat_jenis'];
      if (l == null || k == null || m == null || s == null || o == null || t == null || s <= 0) return null;
      return (l + k) * 2 * (m / s) * o * t;
    },
  },
  {
    id: 'str-kolom-k1-bekisting',
    code: 'STR-KLM-04',
    name: 'Kolom Type K1 - Bekisting',
    category: 'Struktural',
    subCategory: 'IV. Struktur Kolom',
    floorRule: 'per_lantai',
    description: 'Pemasangan bekisting 4 sisi permukaan kolom struktur K1.',
    defaultUnit: 'm²',
    formulaDisplay: '2 × (Lebar + Tebal) × Tinggi × Jumlah Titik',
    excelSheet: 'Volume Struktural',
    excelCell: 'U75',
    excelFormula: '=(I75*Q75*O75*M75)+(K75*Q75*O75*M75)',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'lebar', name: 'lebar', label: 'Lebar Penampang Kolom', placeholder: 'Masukkan lebar kolom (m)', value: null, unit: 'm', required: true },
      { id: 'tebal', name: 'tebal', label: 'Tebal Penampang Kolom', placeholder: 'Masukkan tebal kolom (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Bersih Kolom', placeholder: 'Masukkan tinggi kolom (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah', name: 'jumlah', label: 'Jumlah Titik Kolom', placeholder: 'Masukkan jumlah titik kolom', value: null, unit: 'titik', required: true },
    ],
    calculationMethod: (params) => {
      const l = params['lebar'];
      const t = params['tebal'];
      const h = params['tinggi'];
      const n = params['jumlah'];
      if (l == null || t == null || h == null || n == null) return null;
      return 2 * (l + t) * h * n;
    },
  },
  {
    id: 'str-kolom-k2-beton',
    code: 'STR-KLM-05',
    name: 'Kolom Type K2 - Beton K-350',
    category: 'Struktural',
    subCategory: 'IV. Struktur Kolom',
    floorRule: 'per_lantai',
    description: 'Pekerjaan beton kolom struktur tipe K2 sesuai dimensi pada gambar.',
    defaultUnit: 'm³',
    formulaDisplay: 'Lebar × Tebal × Tinggi Kolom × Jumlah Kolom',
    excelSheet: 'Volume Struktural',
    excelCell: 'U77',
    excelFormula: '=I77*K77*M77*O77',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'lebar', name: 'lebar', label: 'Lebar Penampang Kolom', placeholder: 'Masukkan lebar kolom (m)', value: null, unit: 'm', required: true },
      { id: 'tebal', name: 'tebal', label: 'Tebal / Panjang Sisi Kolom', placeholder: 'Masukkan tebal kolom (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Kolom', placeholder: 'Masukkan tinggi kolom (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah', name: 'jumlah', label: 'Jumlah Titik Kolom', placeholder: 'Masukkan jumlah kolom (titik)', value: null, unit: 'titik', required: true },
    ],
    calculationMethod: (params) => {
      const l = params['lebar'];
      const t = params['tebal'];
      const h = params['tinggi'];
      const n = params['jumlah'];
      if (l == null || t == null || h == null || n == null) return null;
      return l * t * h * n;
    },
  },
  {
    id: 'str-kolom-k2-tulangan',
    code: 'STR-KLM-06',
    name: 'Kolom Type K2 - Pembesian Tulangan Pokok',
    category: 'Struktural',
    subCategory: 'IV. Struktur Kolom',
    floorRule: 'per_lantai',
    description: 'Besi tulangan memanjang kolom struktur K2.',
    defaultUnit: 'kg',
    formulaDisplay: 'Tinggi × Jumlah Titik × Jumlah Batang × Berat Jenis',
    excelSheet: 'Volume Struktural',
    excelCell: 'U78',
    excelFormula: '=T78*O78*M78*Q78',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Kolom', placeholder: 'Masukkan tinggi kolom (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah', name: 'jumlah', label: 'Jumlah Titik Kolom', placeholder: 'Masukkan jumlah titik kolom', value: null, unit: 'titik', required: true },
      { id: 'jumlah_batang', name: 'jumlah_batang', label: 'Jumlah Batang per Kolom', placeholder: 'Masukkan jumlah batang besi (btg)', value: null, unit: 'btg', required: true },
      { id: 'berat_jenis', name: 'berat_jenis', label: 'Berat Besi per Meter', placeholder: 'Masukkan berat jenis besi (kg/m)', value: null, unit: 'kg/m', required: true },
    ],
    calculationMethod: (params) => {
      const h = params['tinggi'];
      const n = params['jumlah'];
      const q = params['jumlah_batang'];
      const bj = params['berat_jenis'];
      if (h == null || n == null || q == null || bj == null) return null;
      return h * n * q * bj;
    },
  },
  {
    id: 'str-kolom-k2-begel',
    code: 'STR-KLM-07',
    name: 'Kolom Type K2 - Pembesian Begel / Sengkang',
    category: 'Struktural',
    subCategory: 'IV. Struktur Kolom',
    floorRule: 'per_lantai',
    description: 'Pembesian sengkang/begel kolom struktur K2.',
    defaultUnit: 'kg',
    formulaDisplay: '2 × (Lebar + Tebal) × (Tinggi / Jarak Begel) × Jumlah Titik × Berat Jenis',
    excelSheet: 'Volume Struktural',
    excelCell: 'U79',
    excelFormula: '=(I79+K79)*2*(M79/0.15)*O79*T79',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'lebar', name: 'lebar', label: 'Lebar Penampang Kolom', placeholder: 'Masukkan lebar kolom (m)', value: null, unit: 'm', required: true },
      { id: 'tebal', name: 'tebal', label: 'Tebal Penampang Kolom', placeholder: 'Masukkan tebal kolom (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Kolom', placeholder: 'Masukkan tinggi kolom (m)', value: null, unit: 'm', required: true },
      { id: 'jarak_begel', name: 'jarak_begel', label: 'Jarak Begel / Sengkang', placeholder: 'Masukkan jarak begel (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah', name: 'jumlah', label: 'Jumlah Titik Kolom', placeholder: 'Masukkan jumlah titik kolom', value: null, unit: 'titik', required: true },
      { id: 'berat_jenis', name: 'berat_jenis', label: 'Berat Besi per Meter', placeholder: 'Masukkan berat jenis besi (kg/m)', value: null, unit: 'kg/m', required: true },
    ],
    calculationMethod: (params) => {
      const l = params['lebar'];
      const k = params['tebal'];
      const m = params['tinggi'];
      const s = params['jarak_begel'];
      const o = params['jumlah'];
      const t = params['berat_jenis'];
      if (l == null || k == null || m == null || s == null || o == null || t == null || s <= 0) return null;
      return (l + k) * 2 * (m / s) * o * t;
    },
  },
  {
    id: 'str-kolom-k2-bekisting',
    code: 'STR-KLM-08',
    name: 'Kolom Type K2 - Bekisting',
    category: 'Struktural',
    subCategory: 'IV. Struktur Kolom',
    floorRule: 'per_lantai',
    description: 'Pemasangan bekisting 4 sisi permukaan kolom struktur K2.',
    defaultUnit: 'm²',
    formulaDisplay: '2 × (Lebar + Tebal) × Tinggi × Jumlah Titik',
    excelSheet: 'Volume Struktural',
    excelCell: 'U81',
    excelFormula: '=(I81*Q81*O81*M81)+(K81*Q81*O81*M81)',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'lebar', name: 'lebar', label: 'Lebar Penampang Kolom', placeholder: 'Masukkan lebar kolom (m)', value: null, unit: 'm', required: true },
      { id: 'tebal', name: 'tebal', label: 'Tebal Penampang Kolom', placeholder: 'Masukkan tebal kolom (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Bersih Kolom', placeholder: 'Masukkan tinggi kolom (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah', name: 'jumlah', label: 'Jumlah Titik Kolom', placeholder: 'Masukkan jumlah titik kolom', value: null, unit: 'titik', required: true },
    ],
    calculationMethod: (params) => {
      const l = params['lebar'];
      const t = params['tebal'];
      const h = params['tinggi'];
      const n = params['jumlah'];
      if (l == null || t == null || h == null || n == null) return null;
      return 2 * (l + t) * h * n;
    },
  },
  {
    id: 'str-kolom-k3-beton',
    code: 'STR-KLM-09',
    name: 'Kolom Type K3 - Beton K-350',
    category: 'Struktural',
    subCategory: 'IV. Struktur Kolom',
    floorRule: 'per_lantai',
    description: 'Pekerjaan beton kolom struktur tipe K3 sesuai dimensi pada gambar.',
    defaultUnit: 'm³',
    formulaDisplay: 'Lebar × Tebal × Tinggi Kolom × Jumlah Kolom',
    excelSheet: 'Volume Struktural',
    excelCell: 'U77',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'lebar', name: 'lebar', label: 'Lebar Penampang Kolom', placeholder: 'Masukkan lebar kolom (m)', value: null, unit: 'm', required: true },
      { id: 'tebal', name: 'tebal', label: 'Tebal / Panjang Sisi Kolom', placeholder: 'Masukkan tebal kolom (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Kolom', placeholder: 'Masukkan tinggi kolom (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah', name: 'jumlah', label: 'Jumlah Titik Kolom', placeholder: 'Masukkan jumlah kolom (titik)', value: null, unit: 'titik', required: true },
    ],
    calculationMethod: (params) => {
      const l = params['lebar'];
      const t = params['tebal'];
      const h = params['tinggi'];
      const n = params['jumlah'];
      if (l == null || t == null || h == null || n == null) return null;
      return l * t * h * n;
    },
  },
  {
    id: 'str-kolom-praktis',
    code: 'STR-KLM-10',
    name: 'Kolom Praktis Uk. 15 x 15 cm',
    category: 'Struktural',
    subCategory: 'IV. Struktur Kolom',
    floorRule: 'per_lantai',
    description: 'Kolom praktis pengaku pasangan dinding bata ringan.',
    defaultUnit: 'm\'',
    formulaDisplay: 'Tinggi Kolom Praktis × Jumlah Titik',
    excelSheet: 'Volume Struktural',
    excelCell: 'U82',
    excelFormula: '=M82*O82',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi per Kolom Praktis', placeholder: 'Masukkan tinggi kolom (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah', name: 'jumlah', label: 'Jumlah Titik Kolom Praktis', placeholder: 'Masukkan jumlah titik', value: null, unit: 'titik', required: true },
    ],
    calculationMethod: (params) => {
      const t = params['tinggi'];
      const n = params['jumlah'];
      if (t == null || n == null || isNaN(t) || isNaN(n)) return null;
      return t * n;
    },
  },
  {
    id: 'str-kolom-kustom',
    code: 'STR-KLM-11',
    name: 'Kolom Struktur Kustom - Beton',
    category: 'Struktural',
    subCategory: 'IV. Struktur Kolom',
    floorRule: 'per_lantai',
    description: 'Pekerjaan beton kolom struktur dengan ukuran penampang kustom.',
    defaultUnit: 'm³',
    formulaDisplay: 'Lebar × Tebal × Tinggi Kolom × Jumlah Kolom',
    excelSheet: 'Volume Struktural',
    excelCell: 'U71',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'lebar', name: 'lebar', label: 'Lebar Penampang Kolom', placeholder: 'Masukkan lebar kolom (m)', value: null, unit: 'm', required: true },
      { id: 'tebal', name: 'tebal', label: 'Tebal / Panjang Sisi Kolom', placeholder: 'Masukkan tebal kolom (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Kolom', placeholder: 'Masukkan tinggi kolom (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah', name: 'jumlah', label: 'Jumlah Titik Kolom', placeholder: 'Masukkan jumlah kolom (titik)', value: null, unit: 'titik', required: true },
    ],
    calculationMethod: (params) => {
      const l = params['lebar'];
      const t = params['tebal'];
      const h = params['tinggi'];
      const n = params['jumlah'];
      if (l == null || t == null || h == null || n == null) return null;
      return l * t * h * n;
    },
  },

  // ==========================================
  // VI. PEKERJAAN STRUKTURAL - BALOK PER LANTAI
  // ==========================================
  {
    id: 'str-balok-b1-beton',
    code: 'STR-BLK-01',
    name: 'Balok Type B1 - Beton K-350',
    category: 'Struktural',
    subCategory: 'V. Struktur Balok',
    floorRule: 'per_lantai',
    description: 'Pekerjaan beton balok struktur utama tipe B1 (panjang total dari penjumlahan segmen balok).',
    defaultUnit: 'm³',
    formulaDisplay: 'Panjang Total × Lebar × Tinggi',
    excelSheet: 'Volume Struktural',
    excelCell: 'U85',
    excelFormula: '=I85*K85*M85',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_total', name: 'panjang_total', label: 'Panjang Total Balok B1', placeholder: 'Masukkan panjang total segmen balok (m)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar Penampang Balok', placeholder: 'Masukkan lebar balok (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Penampang Balok', placeholder: 'Masukkan tinggi balok (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_total'];
      const l = params['lebar'];
      const t = params['tinggi'];
      if (p == null || l == null || t == null) return null;
      return p * l * t;
    },
  },
  {
    id: 'str-balok-b1-tulangan',
    code: 'STR-BLK-02',
    name: 'Balok Type B1 - Pembesian Tulangan Pokok',
    category: 'Struktural',
    subCategory: 'V. Struktur Balok',
    floorRule: 'per_lantai',
    description: 'Pembesian tulangan memanjang balok struktur B1.',
    defaultUnit: 'kg',
    formulaDisplay: 'Panjang Total × Jumlah Batang × Berat Jenis',
    excelSheet: 'Volume Struktural',
    excelCell: 'U86',
    excelFormula: '=T86*Q86*I86',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_total', name: 'panjang_total', label: 'Panjang Total Balok', placeholder: 'Masukkan panjang total balok (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah_batang', name: 'jumlah_batang', label: 'Jumlah Batang Besi', placeholder: 'Masukkan jumlah batang (btg)', value: null, unit: 'btg', required: true },
      { id: 'berat_jenis', name: 'berat_jenis', label: 'Berat Besi per Meter', placeholder: 'Masukkan berat jenis besi (kg/m)', value: null, unit: 'kg/m', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_total'];
      const q = params['jumlah_batang'];
      const bj = params['berat_jenis'];
      if (p == null || q == null || bj == null) return null;
      return p * q * bj;
    },
  },
  {
    id: 'str-balok-b1-begel',
    code: 'STR-BLK-03',
    name: 'Balok Type B1 - Pembesian Begel / Sengkang',
    category: 'Struktural',
    subCategory: 'V. Struktur Balok',
    floorRule: 'per_lantai',
    description: 'Pembesian begel/sengkang balok struktur B1.',
    defaultUnit: 'kg',
    formulaDisplay: '(Panjang Total / Jarak Begel) × 2 × (Lebar + Tinggi) × Berat Jenis',
    excelSheet: 'Volume Struktural',
    excelCell: 'U87',
    excelFormula: '=(I87/0.15)*((K87+M87)*2)*T87',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_total', name: 'panjang_total', label: 'Panjang Total Balok B1', placeholder: 'Masukkan panjang total balok (m)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar Penampang Balok', placeholder: 'Masukkan lebar balok (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Penampang Balok', placeholder: 'Masukkan tinggi balok (m)', value: null, unit: 'm', required: true },
      { id: 'jarak_begel', name: 'jarak_begel', label: 'Jarak Begel / Sengkang', placeholder: 'Masukkan jarak begel (m)', value: null, unit: 'm', required: true },
      { id: 'berat_jenis', name: 'berat_jenis', label: 'Berat Besi per Meter', placeholder: 'Masukkan berat jenis besi (kg/m)', value: null, unit: 'kg/m', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_total'];
      const l = params['lebar'];
      const t = params['tinggi'];
      const s = params['jarak_begel'];
      const bj = params['berat_jenis'];
      if (p == null || l == null || t == null || s == null || bj == null || s <= 0) return null;
      return (p / s) * 2 * (l + t) * bj;
    },
  },
  {
    id: 'str-balok-b1-bekisting',
    code: 'STR-BLK-04',
    name: 'Balok Type B1 - Bekisting',
    category: 'Struktural',
    subCategory: 'V. Struktur Balok',
    floorRule: 'per_lantai',
    description: 'Bekisting 2 sisi samping dan 1 sisi bawah balok struktur B1.',
    defaultUnit: 'm²',
    formulaDisplay: '(Panjang × Tinggi × 2) + (Panjang × Lebar)',
    excelSheet: 'Volume Struktural',
    excelCell: 'U89',
    excelFormula: '=(I89*M89*Q89)+(I89*K89*1)',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_total', name: 'panjang_total', label: 'Panjang Total Balok', placeholder: 'Masukkan panjang total balok (m)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar Penampang Balok', placeholder: 'Masukkan lebar balok (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Penampang Balok', placeholder: 'Masukkan tinggi balok (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_total'];
      const l = params['lebar'];
      const t = params['tinggi'];
      if (p == null || l == null || t == null) return null;
      return p * t * 2 + p * l;
    },
  },
  {
    id: 'str-balok-b2-beton',
    code: 'STR-BLK-05',
    name: 'Balok Type B2 - Beton K-350',
    category: 'Struktural',
    subCategory: 'V. Struktur Balok',
    floorRule: 'per_lantai',
    description: 'Pekerjaan beton balok struktur tipe B2 (panjang total dari penjumlahan segmen balok).',
    defaultUnit: 'm³',
    formulaDisplay: 'Panjang Total × Lebar × Tinggi',
    excelSheet: 'Volume Struktural',
    excelCell: 'U91',
    excelFormula: '=I91*K91*M91',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_total', name: 'panjang_total', label: 'Panjang Total Balok B2', placeholder: 'Masukkan panjang total segmen balok (m)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar Penampang Balok', placeholder: 'Masukkan lebar balok (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Penampang Balok', placeholder: 'Masukkan tinggi balok (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_total'];
      const l = params['lebar'];
      const t = params['tinggi'];
      if (p == null || l == null || t == null) return null;
      return p * l * t;
    },
  },
  {
    id: 'str-balok-b2-tulangan',
    code: 'STR-BLK-06',
    name: 'Balok Type B2 - Pembesian Tulangan Pokok',
    category: 'Struktural',
    subCategory: 'V. Struktur Balok',
    floorRule: 'per_lantai',
    description: 'Pembesian tulangan memanjang balok struktur B2.',
    defaultUnit: 'kg',
    formulaDisplay: 'Panjang Total × Jumlah Batang × Berat Jenis',
    excelSheet: 'Volume Struktural',
    excelCell: 'U92',
    excelFormula: '=T92*Q92*I92',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_total', name: 'panjang_total', label: 'Panjang Total Balok B2', placeholder: 'Masukkan panjang total balok (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah_batang', name: 'jumlah_batang', label: 'Jumlah Batang Besi', placeholder: 'Masukkan jumlah batang (btg)', value: null, unit: 'btg', required: true },
      { id: 'berat_jenis', name: 'berat_jenis', label: 'Berat Besi per Meter', placeholder: 'Masukkan berat jenis besi (kg/m)', value: null, unit: 'kg/m', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_total'];
      const q = params['jumlah_batang'];
      const bj = params['berat_jenis'];
      if (p == null || q == null || bj == null) return null;
      return p * q * bj;
    },
  },
  {
    id: 'str-balok-b2-begel',
    code: 'STR-BLK-07',
    name: 'Balok Type B2 - Pembesian Begel / Sengkang',
    category: 'Struktural',
    subCategory: 'V. Struktur Balok',
    floorRule: 'per_lantai',
    description: 'Pembesian begel/sengkang balok struktur B2.',
    defaultUnit: 'kg',
    formulaDisplay: '(Panjang Total / Jarak Begel) × 2 × (Lebar + Tinggi) × Berat Jenis',
    excelSheet: 'Volume Struktural',
    excelCell: 'U93',
    excelFormula: '=(I93/0.15)*((K93+M93)*2)*T93',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_total', name: 'panjang_total', label: 'Panjang Total Balok B2', placeholder: 'Masukkan panjang total balok (m)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar Penampang Balok', placeholder: 'Masukkan lebar balok (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Penampang Balok', placeholder: 'Masukkan tinggi balok (m)', value: null, unit: 'm', required: true },
      { id: 'jarak_begel', name: 'jarak_begel', label: 'Jarak Begel / Sengkang', placeholder: 'Masukkan jarak begel (m)', value: null, unit: 'm', required: true },
      { id: 'berat_jenis', name: 'berat_jenis', label: 'Berat Besi per Meter', placeholder: 'Masukkan berat jenis besi (kg/m)', value: null, unit: 'kg/m', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_total'];
      const l = params['lebar'];
      const t = params['tinggi'];
      const s = params['jarak_begel'];
      const bj = params['berat_jenis'];
      if (p == null || l == null || t == null || s == null || bj == null || s <= 0) return null;
      return (p / s) * 2 * (l + t) * bj;
    },
  },
  {
    id: 'str-balok-b2-bekisting',
    code: 'STR-BLK-08',
    name: 'Balok Type B2 - Bekisting',
    category: 'Struktural',
    subCategory: 'V. Struktur Balok',
    floorRule: 'per_lantai',
    description: 'Bekisting 2 sisi samping dan 1 sisi bawah balok struktur B2.',
    defaultUnit: 'm²',
    formulaDisplay: '(Panjang × Tinggi × 2) + (Panjang × Lebar)',
    excelSheet: 'Volume Struktural',
    excelCell: 'U95',
    excelFormula: '=(I95*M95*Q95)+(I95*K95*1)',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_total', name: 'panjang_total', label: 'Panjang Total Balok B2', placeholder: 'Masukkan panjang total balok (m)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar Penampang Balok', placeholder: 'Masukkan lebar balok (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Penampang Balok', placeholder: 'Masukkan tinggi balok (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_total'];
      const l = params['lebar'];
      const t = params['tinggi'];
      if (p == null || l == null || t == null) return null;
      return p * t * 2 + p * l;
    },
  },
  {
    id: 'str-balok-b3-beton',
    code: 'STR-BLK-09',
    name: 'Balok Type B2 Kantilever / B3 - Beton K-350',
    category: 'Struktural',
    subCategory: 'V. Struktur Balok',
    floorRule: 'per_lantai',
    description: 'Pekerjaan beton balok struktur kantilever / tipe B3.',
    defaultUnit: 'm³',
    formulaDisplay: 'Panjang Total × Lebar × Tinggi',
    excelSheet: 'Volume Struktural',
    excelCell: 'U161',
    excelFormula: '=I161*K161*M161',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_total', name: 'panjang_total', label: 'Panjang Total Balok B3', placeholder: 'Masukkan panjang total segmen balok (m)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar Penampang Balok', placeholder: 'Masukkan lebar balok (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Penampang Balok', placeholder: 'Masukkan tinggi balok (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_total'];
      const l = params['lebar'];
      const t = params['tinggi'];
      if (p == null || l == null || t == null) return null;
      return p * l * t;
    },
  },
  {
    id: 'str-balok-latei',
    code: 'STR-BLK-10',
    name: 'Balok Latei / Lintel Uk. 15 x 25 cm - Beton K-350',
    category: 'Struktural',
    subCategory: 'V. Struktur Balok',
    floorRule: 'per_lantai',
    description: 'Beton balok latei penahan beban di atas bukaan kusen pintu dan jendela.',
    defaultUnit: 'm³',
    formulaDisplay: 'Panjang Total × Lebar × Tinggi',
    excelSheet: 'Volume Struktural',
    excelCell: 'U102',
    excelFormula: '=I102*K102*M102',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_total', name: 'panjang_total', label: 'Panjang Total Balok Latei', placeholder: 'Masukkan panjang total (m)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar Balok Latei', placeholder: 'Masukkan lebar (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Balok Latei', placeholder: 'Masukkan tinggi (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_total'];
      const l = params['lebar'];
      const t = params['tinggi'];
      if (p == null || l == null || t == null) return null;
      return p * l * t;
    },
  },
  {
    id: 'str-balok-latei-tulangan',
    code: 'STR-BLK-11',
    name: 'Balok Latei / Lintel - Pembesian Tulangan Pokok',
    category: 'Struktural',
    subCategory: 'V. Struktur Balok',
    floorRule: 'per_lantai',
    description: 'Pembesian tulangan pokok balok latei.',
    defaultUnit: 'kg',
    formulaDisplay: 'Panjang Total × Jumlah Batang × Berat Jenis',
    excelSheet: 'Volume Struktural',
    excelCell: 'U103',
    excelFormula: '=T103*Q103*I103',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_total', name: 'panjang_total', label: 'Panjang Total Balok Latei', placeholder: 'Masukkan panjang total (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah_batang', name: 'jumlah_batang', label: 'Jumlah Batang Besi', placeholder: 'Masukkan jumlah batang (btg)', value: null, unit: 'btg', required: true },
      { id: 'berat_jenis', name: 'berat_jenis', label: 'Berat Besi per Meter', placeholder: 'Masukkan berat jenis (kg/m)', value: null, unit: 'kg/m', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_total'];
      const q = params['jumlah_batang'];
      const bj = params['berat_jenis'];
      if (p == null || q == null || bj == null) return null;
      return p * q * bj;
    },
  },
  {
    id: 'str-balok-latei-bekisting',
    code: 'STR-BLK-12',
    name: 'Balok Latei / Lintel - Bekisting',
    category: 'Struktural',
    subCategory: 'V. Struktur Balok',
    floorRule: 'per_lantai',
    description: 'Bekisting 2 sisi samping dan 1 sisi bawah balok latei.',
    defaultUnit: 'm²',
    formulaDisplay: '(Panjang × Tinggi × 2) + (Panjang × Lebar)',
    excelSheet: 'Volume Struktural',
    excelCell: 'U106',
    excelFormula: '=(I106*M106*Q106)+(I106*K106*1)',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_total', name: 'panjang_total', label: 'Panjang Total Balok Latei', placeholder: 'Masukkan panjang total (m)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar Balok Latei', placeholder: 'Masukkan lebar (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Balok Latei', placeholder: 'Masukkan tinggi (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_total'];
      const l = params['lebar'];
      const t = params['tinggi'];
      if (p == null || l == null || t == null) return null;
      return p * t * 2 + p * l;
    },
  },
  {
    id: 'str-balok-bordes',
    code: 'STR-BLK-13',
    name: 'Balok Bordes Tangga Uk. 15 x 25 cm - Beton K-350',
    category: 'Struktural',
    subCategory: 'V. Struktur Balok',
    floorRule: 'per_lantai',
    description: 'Pekerjaan beton balok penumpu pelat bordes tangga.',
    defaultUnit: 'm³',
    formulaDisplay: 'Panjang Total × Lebar × Tinggi',
    excelSheet: 'Volume Struktural',
    excelCell: 'U108',
    excelFormula: '=I108*K108*M108',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_total', name: 'panjang_total', label: 'Panjang Total Balok Bordes', placeholder: 'Masukkan panjang total (m)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar Balok Bordes', placeholder: 'Masukkan lebar balok (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Balok Bordes', placeholder: 'Masukkan tinggi balok (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_total'];
      const l = params['lebar'];
      const t = params['tinggi'];
      if (p == null || l == null || t == null) return null;
      return p * l * t;
    },
  },
  {
    id: 'str-balok-bordes-tulangan',
    code: 'STR-BLK-14',
    name: 'Balok Bordes Tangga - Pembesian Tulangan Pokok',
    category: 'Struktural',
    subCategory: 'V. Struktur Balok',
    floorRule: 'per_lantai',
    description: 'Pembesian tulangan pokok balok bordes tangga.',
    defaultUnit: 'kg',
    formulaDisplay: 'Panjang Total × Jumlah Batang × Berat Jenis',
    excelSheet: 'Volume Struktural',
    excelCell: 'U109',
    excelFormula: '=T109*Q109*I109',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_total', name: 'panjang_total', label: 'Panjang Total Balok Bordes', placeholder: 'Masukkan panjang total (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah_batang', name: 'jumlah_batang', label: 'Jumlah Batang Besi', placeholder: 'Masukkan jumlah batang (btg)', value: null, unit: 'btg', required: true },
      { id: 'berat_jenis', name: 'berat_jenis', label: 'Berat Besi per Meter', placeholder: 'Masukkan berat jenis (kg/m)', value: null, unit: 'kg/m', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_total'];
      const q = params['jumlah_batang'];
      const bj = params['berat_jenis'];
      if (p == null || q == null || bj == null) return null;
      return p * q * bj;
    },
  },
  {
    id: 'str-balok-bordes-bekisting',
    code: 'STR-BLK-15',
    name: 'Balok Bordes Tangga - Bekisting',
    category: 'Struktural',
    subCategory: 'V. Struktur Balok',
    floorRule: 'per_lantai',
    description: 'Bekisting 2 sisi samping dan 1 sisi bawah balok bordes tangga.',
    defaultUnit: 'm²',
    formulaDisplay: '(Panjang × Tinggi × 2) + (Panjang × Lebar)',
    excelSheet: 'Volume Struktural',
    excelCell: 'U112',
    excelFormula: '=(I112*M112*Q112)+(I112*K112*1)',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_total', name: 'panjang_total', label: 'Panjang Total Balok Bordes', placeholder: 'Masukkan panjang total (m)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar Balok Bordes', placeholder: 'Masukkan lebar (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Balok Bordes', placeholder: 'Masukkan tinggi (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_total'];
      const l = params['lebar'];
      const t = params['tinggi'];
      if (p == null || l == null || t == null) return null;
      return p * t * 2 + p * l;
    },
  },
  {
    id: 'str-balok-induk',
    code: 'STR-BLK-16',
    name: 'Balok Induk - Beton',
    category: 'Struktural',
    subCategory: 'V. Struktur Balok',
    floorRule: 'per_lantai',
    description: 'Pekerjaan beton balok induk utama antar kolom struktur.',
    defaultUnit: 'm³',
    formulaDisplay: 'Panjang Total × Lebar × Tinggi',
    excelSheet: 'Volume Struktural',
    excelCell: 'U85',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_total', name: 'panjang_total', label: 'Panjang Total Balok Induk', placeholder: 'Masukkan panjang total (m)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar Balok Induk', placeholder: 'Masukkan lebar balok (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Balok Induk', placeholder: 'Masukkan tinggi balok (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_total'];
      const l = params['lebar'];
      const t = params['tinggi'];
      if (p == null || l == null || t == null) return null;
      return p * l * t;
    },
  },
  {
    id: 'str-balok-anak',
    code: 'STR-BLK-17',
    name: 'Balok Anak - Beton',
    category: 'Struktural',
    subCategory: 'V. Struktur Balok',
    floorRule: 'per_lantai',
    description: 'Pekerjaan beton balok anak pembagi bentang pelat lantai.',
    defaultUnit: 'm³',
    formulaDisplay: 'Panjang Total × Lebar × Tinggi',
    excelSheet: 'Volume Struktural',
    excelCell: 'U91',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_total', name: 'panjang_total', label: 'Panjang Total Balok Anak', placeholder: 'Masukkan panjang total (m)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar Balok Anak', placeholder: 'Masukkan lebar balok (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Balok Anak', placeholder: 'Masukkan tinggi balok (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_total'];
      const l = params['lebar'];
      const t = params['tinggi'];
      if (p == null || l == null || t == null) return null;
      return p * l * t;
    },
  },
  {
    id: 'str-ring-balok',
    code: 'STR-BLK-18',
    name: 'Ring Balok - Beton',
    category: 'Struktural',
    subCategory: 'V. Struktur Balok',
    floorRule: 'per_lantai',
    description: 'Pekerjaan beton ring balok pengikat atas pasangan dinding.',
    defaultUnit: 'm³',
    formulaDisplay: 'Panjang Total × Lebar × Tinggi',
    excelSheet: 'Volume Struktural',
    excelCell: 'U85',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_total', name: 'panjang_total', label: 'Panjang Total Ring Balok', placeholder: 'Masukkan panjang total (m)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar Ring Balok', placeholder: 'Masukkan lebar ring balok (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Ring Balok', placeholder: 'Masukkan tinggi ring balok (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_total'];
      const l = params['lebar'];
      const t = params['tinggi'];
      if (p == null || l == null || t == null) return null;
      return p * l * t;
    },
  },
  {
    id: 'str-balok-kustom',
    code: 'STR-BLK-19',
    name: 'Balok Struktur Kustom - Beton',
    category: 'Struktural',
    subCategory: 'V. Struktur Balok',
    floorRule: 'per_lantai',
    description: 'Pekerjaan beton balok dengan dimensi penampang sesuai spesifikasi gambar.',
    defaultUnit: 'm³',
    formulaDisplay: 'Panjang Total × Lebar × Tinggi',
    excelSheet: 'Volume Struktural',
    excelCell: 'U85',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_total', name: 'panjang_total', label: 'Panjang Total Balok', placeholder: 'Masukkan panjang total (m)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar Penampang Balok', placeholder: 'Masukkan lebar balok (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Penampang Balok', placeholder: 'Masukkan tinggi balok (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_total'];
      const l = params['lebar'];
      const t = params['tinggi'];
      if (p == null || l == null || t == null) return null;
      return p * l * t;
    },
  },

  // ==========================================
  // VII. PEKERJAAN STRUKTURAL - PELAT, TANGGA, ATAP
  // ==========================================
  {
    id: 'str-pelat-lantai-beton',
    code: 'STR-PLT-01',
    name: 'Plat Lantai P1 Tebal 12 cm - Beton K-350',
    category: 'Struktural',
    subCategory: 'VI. Struktur Pelat Lantai & Tangga',
    floorRule: 'per_lantai',
    description: 'Volume beton pelat lantai setelah dikurangi luas bukaan/void.',
    defaultUnit: 'm³',
    formulaDisplay: '((Panjang Pelat × Lebar Pelat) − Luas Void) × Tebal Pelat',
    excelSheet: 'Volume Struktural',
    excelCell: 'U124',
    excelFormula: '=((I124*K124)-1.155-11.8845-7.6237-69.525)*M124',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_bangunan', name: 'panjang_bangunan', label: 'Panjang Pelat Lantai', placeholder: 'Masukkan panjang pelat (m)', value: null, unit: 'm', required: true },
      { id: 'lebar_bangunan', name: 'lebar_bangunan', label: 'Lebar Pelat Lantai', placeholder: 'Masukkan lebar pelat (m)', value: null, unit: 'm', required: true },
      { id: 'luas_bukaan', name: 'luas_bukaan', label: 'Total Luas Bukaan / Void', placeholder: 'Masukkan luas void jika ada (m²)', value: null, unit: 'm²', required: false },
      { id: 'tebal_pelat', name: 'tebal_pelat', label: 'Tebal Pelat Lantai', placeholder: 'Masukkan tebal pelat (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_bangunan'];
      const l = params['lebar_bangunan'];
      const voidArea = params['luas_bukaan'] || 0;
      const t = params['tebal_pelat'];
      if (p == null || l == null || t == null) return null;
      const luasBersih = Math.max(0, p * l - voidArea);
      return luasBersih * t;
    },
  },
  {
    id: 'str-pelat-lantai-tulangan',
    code: 'STR-PLT-02',
    name: 'Plat Lantai P1 - Pembesian Tulangan Melintang & Memanjang',
    category: 'Struktural',
    subCategory: 'VI. Struktur Pelat Lantai & Tangga',
    floorRule: 'per_lantai',
    description: 'Pembesian tulangan 2 arah (melintang & memanjang) pelat lantai.',
    defaultUnit: 'kg',
    formulaDisplay: '2 × ((Panjang / Jarak) × Lapis × Berat Jenis × Lebar)',
    excelSheet: 'Volume Struktural',
    excelCell: 'U127',
    excelFormula: '=I127/0.15*Q127*T127*K127',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_bangunan', name: 'panjang_bangunan', label: 'Panjang Pelat Lantai', placeholder: 'Masukkan panjang pelat (m)', value: null, unit: 'm', required: true },
      { id: 'lebar_bangunan', name: 'lebar_bangunan', label: 'Lebar Pelat Lantai', placeholder: 'Masukkan lebar pelat (m)', value: null, unit: 'm', required: true },
      { id: 'jarak_tulangan', name: 'jarak_tulangan', label: 'Jarak Antar Tulangan', placeholder: 'Masukkan jarak tulangan (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah_lapis', name: 'jumlah_lapis', label: 'Jumlah Lapis Anyaman', placeholder: 'Masukkan jumlah lapis (misal 2)', value: null, unit: 'lapis', required: true },
      { id: 'berat_jenis', name: 'berat_jenis', label: 'Berat Besi per Meter', placeholder: 'Masukkan berat jenis (kg/m)', value: null, unit: 'kg/m', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_bangunan'];
      const l = params['lebar_bangunan'];
      const s = params['jarak_tulangan'];
      const q = params['jumlah_lapis'];
      const bj = params['berat_jenis'];
      if (p == null || l == null || s == null || q == null || bj == null || s <= 0) return null;
      return 2 * ((p / s) * q * bj * l);
    },
  },
  {
    id: 'str-pelat-lantai-bekisting',
    code: 'STR-PLT-03',
    name: 'Plat Lantai P1 - Bekisting Bawah',
    category: 'Struktural',
    subCategory: 'VI. Struktur Pelat Lantai & Tangga',
    floorRule: 'per_lantai',
    description: 'Bekisting bawah pelat lantai berdasarkan luas bersih lantai.',
    defaultUnit: 'm²',
    formulaDisplay: '(Panjang Pelat × Lebar Pelat) − Luas Void/Bukaan',
    excelSheet: 'Volume Struktural',
    excelCell: 'U133',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_bangunan', name: 'panjang_bangunan', label: 'Panjang Pelat Lantai', placeholder: 'Masukkan panjang pelat (m)', value: null, unit: 'm', required: true },
      { id: 'lebar_bangunan', name: 'lebar_bangunan', label: 'Lebar Pelat Lantai', placeholder: 'Masukkan lebar pelat (m)', value: null, unit: 'm', required: true },
      { id: 'luas_bukaan', name: 'luas_bukaan', label: 'Total Luas Bukaan / Void', placeholder: 'Masukkan luas void jika ada (m²)', value: null, unit: 'm²', required: false },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_bangunan'];
      const l = params['lebar_bangunan'];
      const voidArea = params['luas_bukaan'] || 0;
      if (p == null || l == null) return null;
      return Math.max(0, p * l - voidArea);
    },
  },
  {
    id: 'str-plat-tangga-beton',
    code: 'STR-TGG-01',
    name: 'Plat Tangga & Plat Bordes - Beton K-350',
    category: 'Struktural',
    subCategory: 'VI. Struktur Pelat Lantai & Tangga',
    floorRule: 'per_lantai',
    description: 'Volume beton pelat miring tangga dan pelat bordes.',
    defaultUnit: 'm³',
    formulaDisplay: '(Panjang Miring × Lebar Tangga × Tebal Plat) + (Luas Bordes × Tebal Bordes)',
    excelSheet: 'Volume Struktural',
    excelCell: 'U119',
    excelFormula: '=M119*K119*I119*O119',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_miring', name: 'panjang_miring', label: 'Panjang Miring Tangga', placeholder: 'Masukkan panjang miring tangga (m)', value: null, unit: 'm', required: true },
      { id: 'lebar_tangga', name: 'lebar_tangga', label: 'Lebar Tangga', placeholder: 'Masukkan lebar tangga (m)', value: null, unit: 'm', required: true },
      { id: 'tebal_plat', name: 'tebal_plat', label: 'Tebal Plat Tangga', placeholder: 'Masukkan tebal plat tangga (m)', value: null, unit: 'm', required: true },
      { id: 'luas_bordes', name: 'luas_bordes', label: 'Luas Pelat Bordes', placeholder: 'Masukkan luas bordes (m²)', value: null, unit: 'm²', required: false },
      { id: 'tebal_bordes', name: 'tebal_bordes', label: 'Tebal Pelat Bordes', placeholder: 'Masukkan tebal bordes (m)', value: null, unit: 'm', required: false },
    ],
    calculationMethod: (params) => {
      const pm = params['panjang_miring'];
      const l = params['lebar_tangga'];
      const tp = params['tebal_plat'];
      const lb = params['luas_bordes'] || 0;
      const tb = params['tebal_bordes'] || tp || 0;
      if (pm == null || l == null || tp == null) return null;
      return pm * l * tp + lb * tb;
    },
  },
  {
    id: 'str-tangga-beton',
    code: 'STR-TGG-02',
    name: 'Anak Tangga & Bordes - Beton K-350',
    category: 'Struktural',
    subCategory: 'VI. Struktur Pelat Lantai & Tangga',
    floorRule: 'per_lantai',
    description: 'Volume beton anak tangga (optrede/antrede) dan pelat bordes.',
    defaultUnit: 'm³',
    formulaDisplay: '[(0.5 × Antrede × Optrede) × Jml Anak Tangga × Lebar] + (Luas Bordes × Tebal Bordes)',
    excelSheet: 'Volume Struktural',
    excelCell: 'U114',
    excelFormula: '=(1/2*0.27*0.16)*12*K114*Q114*O114',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'antrede', name: 'antrede', label: 'Lebar Pijakan (Antrede)', placeholder: 'Masukkan lebar antrede (m)', value: null, unit: 'm', required: true },
      { id: 'optrede', name: 'optrede', label: 'Tinggi Tanjakan (Optrede)', placeholder: 'Masukkan tinggi optrede (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah_anak_tangga', name: 'jumlah_anak_tangga', label: 'Jumlah Anak Tangga', placeholder: 'Masukkan jumlah trap (bh)', value: null, unit: 'bh', required: true },
      { id: 'lebar_tangga', name: 'lebar_tangga', label: 'Lebar Tangga', placeholder: 'Masukkan lebar tangga (m)', value: null, unit: 'm', required: true },
      { id: 'luas_bordes', name: 'luas_bordes', label: 'Luas Pelat Bordes', placeholder: 'Masukkan luas bordes (m²)', value: null, unit: 'm²', required: false },
      { id: 'tebal_bordes', name: 'tebal_bordes', label: 'Tebal Pelat Bordes', placeholder: 'Masukkan tebal bordes (m)', value: null, unit: 'm', required: false },
    ],
    calculationMethod: (params) => {
      const a = params['antrede'];
      const o = params['optrede'];
      const n = params['jumlah_anak_tangga'];
      const w = params['lebar_tangga'];
      const lb = params['luas_bordes'] || 0;
      const tb = params['tebal_bordes'] || 0;
      if (a == null || o == null || n == null || w == null) return null;
      const vAnakTangga = 0.5 * a * o * n * w;
      const vBordes = lb * tb;
      return vAnakTangga + vBordes;
    },
  },
  {
    id: 'str-tangga-tulangan',
    code: 'STR-TGG-03',
    name: 'Tangga & Bordes - Pembesian Tulangan',
    category: 'Struktural',
    subCategory: 'VI. Struktur Pelat Lantai & Tangga',
    floorRule: 'per_lantai',
    description: 'Pembesian tulangan pelat tangga, anak tangga, dan bordes.',
    defaultUnit: 'kg',
    formulaDisplay: '(Lebar Tangga / Jarak) × (Antrede + Optrede) × Jumlah Trap × Berat Jenis',
    excelSheet: 'Volume Struktural',
    excelCell: 'U115',
    excelFormula: '=K115/0.15*(0.27+0.16)*12*O115*Q115',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'lebar_tangga', name: 'lebar_tangga', label: 'Lebar Tangga', placeholder: 'Masukkan lebar tangga (m)', value: null, unit: 'm', required: true },
      { id: 'jarak_tulangan', name: 'jarak_tulangan', label: 'Jarak Tulangan', placeholder: 'Masukkan jarak tulangan (m)', value: null, unit: 'm', required: true },
      { id: 'antrede', name: 'antrede', label: 'Lebar Antrede', placeholder: 'Masukkan lebar antrede (m)', value: null, unit: 'm', required: true },
      { id: 'optrede', name: 'optrede', label: 'Tinggi Optrede', placeholder: 'Masukkan tinggi optrede (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah_anak_tangga', name: 'jumlah_anak_tangga', label: 'Jumlah Anak Tangga', placeholder: 'Masukkan jumlah trap (bh)', value: null, unit: 'bh', required: true },
      { id: 'berat_jenis', name: 'berat_jenis', label: 'Berat Besi per Meter', placeholder: 'Masukkan berat jenis (kg/m)', value: null, unit: 'kg/m', required: true },
    ],
    calculationMethod: (params) => {
      const l = params['lebar_tangga'];
      const s = params['jarak_tulangan'];
      const a = params['antrede'];
      const o = params['optrede'];
      const n = params['jumlah_anak_tangga'];
      const bj = params['berat_jenis'];
      if (l == null || s == null || a == null || o == null || n == null || bj == null || s <= 0) return null;
      return (l / s) * (a + o) * n * bj;
    },
  },
  {
    id: 'str-tangga-bekisting',
    code: 'STR-TGG-04',
    name: 'Tangga & Bordes - Bekisting',
    category: 'Struktural',
    subCategory: 'VI. Struktur Pelat Lantai & Tangga',
    floorRule: 'per_lantai',
    description: 'Bekisting pelat miring tangga, anak tangga, dan bordes.',
    defaultUnit: 'm²',
    formulaDisplay: '(Panjang Miring × Lebar Tangga) + Luas Bordes',
    excelSheet: 'Volume Struktural',
    excelCell: 'U117',
    excelFormula: '=K117*(0.27+0.16)*12*O117*Q117',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_miring', name: 'panjang_miring', label: 'Panjang Miring Tangga', placeholder: 'Masukkan panjang miring (m)', value: null, unit: 'm', required: true },
      { id: 'lebar_tangga', name: 'lebar_tangga', label: 'Lebar Tangga', placeholder: 'Masukkan lebar tangga (m)', value: null, unit: 'm', required: true },
      { id: 'luas_bordes', name: 'luas_bordes', label: 'Luas Bordes', placeholder: 'Masukkan luas bordes (m²)', value: null, unit: 'm²', required: false },
    ],
    calculationMethod: (params) => {
      const pm = params['panjang_miring'];
      const l = params['lebar_tangga'];
      const lb = params['luas_bordes'] || 0;
      if (pm == null || l == null) return null;
      return pm * l + lb;
    },
  },
  {
    id: 'str-atap-baja-ringan',
    code: 'STR-ATP-01',
    name: 'Pemasangan Rangka Atap Baja Ringan C.75.75 & Reng',
    category: 'Struktural',
    subCategory: 'VII. Pekerjaan Atap dan Penutup Atap',
    floorRule: 'atap_saja',
    description: 'Rangka kuda-kuda dan reng baja ringan C.75.75.',
    defaultUnit: 'm²',
    formulaDisplay: 'Panjang Bidang Atap × Lebar Kemiringan Atap',
    excelSheet: 'Volume Struktural',
    excelCell: 'U329',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_atap', name: 'panjang_atap', label: 'Panjang Bidang Atap', placeholder: 'Masukkan panjang atap (m)', value: null, unit: 'm', required: true },
      { id: 'lebar_atap', name: 'lebar_atap', label: 'Lebar Kemiringan Atap', placeholder: 'Masukkan lebar miring atap (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_atap'];
      const l = params['lebar_atap'];
      if (p == null || l == null) return null;
      return p * l;
    },
  },
  {
    id: 'str-atap-penutup-alderon',
    code: 'STR-ATP-02',
    name: 'Pemasangan Penutup Atap Alderon',
    category: 'Struktural',
    subCategory: 'VII. Pekerjaan Atap dan Penutup Atap',
    floorRule: 'atap_saja',
    description: 'Pemasangan penutup atap sesuai luas bidang miring atap.',
    defaultUnit: 'm²',
    formulaDisplay: 'Luas Bidang Penutup Atap',
    excelSheet: 'Volume Struktural',
    excelCell: 'U330',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'luas_bidang', name: 'luas_bidang', label: 'Luas Bidang Penutup Atap', placeholder: 'Masukkan luas bidang atap (m²)', value: null, unit: 'm²', required: true },
    ],
    calculationMethod: (params) => {
      const a = params['luas_bidang'];
      if (a == null || isNaN(a)) return null;
      return a;
    },
  },
  {
    id: 'str-atap-lisplank-grc',
    code: 'STR-ATP-03',
    name: 'Pemasangan Lisplank GRC Tebal 23.5 cm',
    category: 'Struktural',
    subCategory: 'VII. Pekerjaan Atap dan Penutup Atap',
    floorRule: 'atap_saja',
    description: 'Pemasangan papan lisplank GRC sepanjang tepi atap.',
    defaultUnit: 'm\'',
    formulaDisplay: 'Panjang Total Keliling Lisplank Atap',
    excelSheet: 'Volume Struktural',
    excelCell: 'U337',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_lisplank', name: 'panjang_lisplank', label: 'Panjang Total Lisplank', placeholder: 'Masukkan panjang lisplank (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_lisplank'];
      if (p == null || isNaN(p)) return null;
      return p;
    },
  },

  // ==========================================
  // VIII. PEKERJAAN ARSITEKTURAL PER LANTAI
  // ==========================================
  {
    id: 'ars-dinding-bata-hebel',
    code: 'ARS-DND-01',
    name: 'Pemasangan Dinding Bata Ringan (Hebel)',
    category: 'Arsitektural',
    subCategory: 'A. Pekerjaan Pasangan Dinding dan Plesteran',
    floorRule: 'per_lantai',
    description: 'Pasangan dinding bata ringan dihitung dari panjang keliling dikali tinggi dinding dikurangi bukaan.',
    defaultUnit: 'm²',
    formulaDisplay: '(Panjang Keliling Dinding × Tinggi Dinding) − Luas Bukaan',
    excelSheet: 'Volume Arsitektural',
    excelCell: 'U31',
    excelFormula: '=M16*I16-SUM(U17:U29)',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_keliling', name: 'panjang_keliling', label: 'Panjang Total Garis Dinding', placeholder: 'Masukkan total panjang dinding (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi_dinding', name: 'tinggi_dinding', label: 'Tinggi Dinding', placeholder: 'Masukkan tinggi bersih dinding (m)', value: null, unit: 'm', required: true },
      { id: 'luas_bukaan', name: 'luas_bukaan', label: 'Total Luas Bukaan Pintu / Jendela', placeholder: 'Masukkan luas bukaan jika ada (m²)', value: null, unit: 'm²', required: false },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_keliling'];
      const t = params['tinggi_dinding'];
      const b = params['luas_bukaan'] || 0;
      if (p == null || isNaN(p) || t == null || isNaN(t)) return null;
      return Math.max(0, p * t - b);
    },
  },
  {
    id: 'ars-plesteran-acian-15mm',
    code: 'ARS-DND-02',
    name: 'Pemasangan Plesteran 1SP : 6PP Tebal 15 mm',
    category: 'Arsitektural',
    subCategory: 'A. Pekerjaan Pasangan Dinding dan Plesteran',
    floorRule: 'per_lantai',
    description: 'Plesteran dua sisi permukaan dinding bata ringan dikurangi area keramik/panel dinding.',
    defaultUnit: 'm²',
    formulaDisplay: '(Luas Bersih Dinding × 2 Sisi) − Luas Keramik Dinding − Luas Panel',
    excelSheet: 'Volume Arsitektural',
    excelCell: 'U33',
    excelFormula: '=(U31*2)-U38-U36-U35-U37',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'luas_dinding_bersih', name: 'luas_dinding_bersih', label: 'Luas Dinding Bata Bersih', placeholder: 'Masukkan luas bersih dinding (m²)', value: null, unit: 'm²', required: true },
      { id: 'luas_keramik_toilet', name: 'luas_keramik_toilet', label: 'Pengurangan Area Keramik Dinding', placeholder: 'Masukkan luas keramik dinding (m²)', value: null, unit: 'm²', required: false },
      { id: 'luas_panel_ornamen', name: 'luas_panel_ornamen', label: 'Pengurangan Area Panel / Ornamen', placeholder: 'Masukkan luas panel (m²)', value: null, unit: 'm²', required: false },
    ],
    calculationMethod: (params) => {
      const a = params['luas_dinding_bersih'];
      const kt = params['luas_keramik_toilet'] || 0;
      const po = params['luas_panel_ornamen'] || 0;
      if (a == null || isNaN(a)) return null;
      return Math.max(0, a * 2 - kt - po);
    },
  },
  {
    id: 'ars-acian-dinding',
    code: 'ARS-DND-03',
    name: 'Pemasangan Acian Dinding',
    category: 'Arsitektural',
    subCategory: 'A. Pekerjaan Pasangan Dinding dan Plesteran',
    floorRule: 'per_lantai',
    description: 'Pekerjaan acian permukaan dinding yang telah diplester.',
    defaultUnit: 'm²',
    formulaDisplay: 'Luas Bidang Plesteran Dinding (2 × Luas Dinding Bersih)',
    excelSheet: 'Volume Arsitektural',
    excelCell: 'U34',
    excelFormula: '=U33',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'luas_dinding_bersih', name: 'luas_dinding_bersih', label: 'Luas Dinding Bata Bersih', placeholder: 'Masukkan luas bersih dinding (m²)', value: null, unit: 'm²', required: true },
      { id: 'luas_keramik_toilet', name: 'luas_keramik_toilet', label: 'Pengurangan Area Keramik Dinding', placeholder: 'Masukkan luas keramik dinding (m²)', value: null, unit: 'm²', required: false },
    ],
    calculationMethod: (params) => {
      const a = params['luas_dinding_bersih'];
      const kt = params['luas_keramik_toilet'] || 0;
      if (a == null || isNaN(a)) return null;
      return Math.max(0, a * 2 - kt);
    },
  },
  {
    id: 'ars-keramik-dinding-toilet',
    code: 'ARS-DND-04',
    name: 'Pemasangan Keramik Dinding Toilet Polished Uk. 25x40 cm (F5)',
    category: 'Arsitektural',
    subCategory: 'A. Pekerjaan Pasangan Dinding dan Plesteran',
    floorRule: 'per_lantai',
    description: 'Pasangan keramik dinding area basah toilet/kamar mandi.',
    defaultUnit: 'm²',
    formulaDisplay: 'Keliling Dinding Toilet × Tinggi Pasangan Keramik',
    excelSheet: 'Volume Arsitektural',
    excelCell: 'U35',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'keliling_toilet', name: 'keliling_toilet', label: 'Total Keliling Dinding Toilet', placeholder: 'Masukkan keliling toilet (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi_keramik', name: 'tinggi_keramik', label: 'Tinggi Pasangan Keramik', placeholder: 'Masukkan tinggi pasangan keramik (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['keliling_toilet'];
      const t = params['tinggi_keramik'];
      if (p == null || t == null || isNaN(p) || isNaN(t)) return null;
      return p * t;
    },
  },
  {
    id: 'ars-bata-rooster',
    code: 'ARS-DND-05',
    name: 'Pemasangan Bata Rooster Dinding',
    category: 'Arsitektural',
    subCategory: 'A. Pekerjaan Pasangan Dinding dan Plesteran',
    floorRule: 'per_lantai',
    description: 'Pemasangan bata rooster ventilasi/fasad dinding.',
    defaultUnit: 'm²',
    formulaDisplay: 'Panjang Bidang Rooster × Tinggi Bidang × Jumlah Titik',
    excelSheet: 'Volume Arsitektural',
    excelCell: 'U36',
    excelFormula: '=U17',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang', name: 'panjang', label: 'Panjang Bidang Rooster', placeholder: 'Masukkan panjang (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Bidang Rooster', placeholder: 'Masukkan tinggi (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah', name: 'jumlah', label: 'Jumlah Titik Bidang', placeholder: 'Masukkan jumlah titik', value: null, unit: 'titik', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang'];
      const t = params['tinggi'];
      const n = params['jumlah'];
      if (p == null || t == null || n == null) return null;
      return p * t * n;
    },
  },
  {
    id: 'ars-panel-finishing-dinding',
    code: 'ARS-DND-06',
    name: 'Pemasangan Panel Finishing Kayu & Batu Alam Dinding',
    category: 'Arsitektural',
    subCategory: 'A. Pekerjaan Pasangan Dinding dan Plesteran',
    floorRule: 'per_lantai',
    description: 'Pemasangan panel ornamen kayu atau batu alam pada dinding.',
    defaultUnit: 'm²',
    formulaDisplay: 'Panjang Bidang Panel × Tinggi Bidang Panel',
    excelSheet: 'Volume Arsitektural',
    excelCell: 'U38',
    excelFormula: '=I38*M38',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang', name: 'panjang', label: 'Panjang Bidang Panel', placeholder: 'Masukkan panjang (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi Bidang Panel', placeholder: 'Masukkan tinggi (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang'];
      const t = params['tinggi'];
      if (p == null || t == null) return null;
      return p * t;
    },
  },
  {
    id: 'ars-granit-lantai-60x60',
    code: 'ARS-LNT-01',
    name: 'Pemasangan Granit Uk. 60 x 60 cm Motif Marble (A)',
    category: 'Arsitektural',
    subCategory: 'B. Pekerjaan Pemasangan Penutup Lantai',
    floorRule: 'per_lantai',
    description: 'Pemasangan penutup lantai granit motif marble.',
    defaultUnit: 'm²',
    formulaDisplay: 'Panjang Area × Lebar Area',
    excelSheet: 'Volume Arsitektural',
    excelCell: 'U41',
    excelFormula: '=I41*K41',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang', name: 'panjang', label: 'Panjang Area Granit', placeholder: 'Masukkan panjang (m)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar Area Granit', placeholder: 'Masukkan lebar (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang'];
      const l = params['lebar'];
      if (p == null || l == null) return null;
      return p * l;
    },
  },
  {
    id: 'ars-homogenous-tile-60x60',
    code: 'ARS-LNT-02',
    name: 'Pemasangan Homogenous Tile Uk. 60 x 60 cm Warna Putih Gloss (B)',
    category: 'Arsitektural',
    subCategory: 'B. Pekerjaan Pemasangan Penutup Lantai',
    floorRule: 'per_lantai',
    description: 'Pemasangan penutup lantai ruang utama berdasarkan luas bersih ruangan.',
    defaultUnit: 'm²',
    formulaDisplay: 'Luas Bersih Lantai Ruangan',
    excelSheet: 'Volume Arsitektural',
    excelCell: 'U42',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'luas_lantai', name: 'luas_lantai', label: 'Luas Bersih Lantai Utama', placeholder: 'Masukkan luas lantai (m²)', value: null, unit: 'm²', required: true },
    ],
    calculationMethod: (params) => {
      const a = params['luas_lantai'];
      if (a == null || isNaN(a)) return null;
      return a;
    },
  },
  {
    id: 'ars-keramik-toilet-antislip',
    code: 'ARS-LNT-03',
    name: 'Pemasangan Keramik Toilet Uk. 40 x 40 cm Anti-Slip (C)',
    category: 'Arsitektural',
    subCategory: 'B. Pekerjaan Pemasangan Penutup Lantai',
    floorRule: 'per_lantai',
    description: 'Pemasangan keramik lantai anti-slip pada area kamar mandi/WC.',
    defaultUnit: 'm²',
    formulaDisplay: 'Total Luas Lantai Toilet',
    excelSheet: 'Volume Arsitektural',
    excelCell: 'U43',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'luas_total_toilet', name: 'luas_total_toilet', label: 'Total Luas Lantai Toilet / KM', placeholder: 'Masukkan luas lantai toilet (m²)', value: null, unit: 'm²', required: true },
    ],
    calculationMethod: (params) => {
      const a = params['luas_total_toilet'];
      if (a == null || isNaN(a)) return null;
      return a;
    },
  },
  {
    id: 'ars-keramik-tangga',
    code: 'ARS-LNT-04',
    name: 'Pemasangan Keramik Tangga Uk. 30 x 30 cm Motif Kayu (D)',
    category: 'Arsitektural',
    subCategory: 'B. Pekerjaan Pemasangan Penutup Lantai',
    floorRule: 'per_lantai',
    description: 'Penutup lantai pijakan anak tangga dan bordes.',
    defaultUnit: 'm²',
    formulaDisplay: '(Lebar Pijakan × Lebar Tangga × Jumlah Trap) + Luas Bordes',
    excelSheet: 'Volume Arsitektural',
    excelCell: 'U44',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'lebar_pijakan', name: 'lebar_pijakan', label: 'Lebar Pijakan (Antrede)', placeholder: 'Masukkan lebar antrede (m)', value: null, unit: 'm', required: true },
      { id: 'lebar_tangga', name: 'lebar_tangga', label: 'Lebar Tangga', placeholder: 'Masukkan lebar tangga (m)', value: null, unit: 'm', required: true },
      { id: 'jumlah_trap', name: 'jumlah_trap', label: 'Jumlah Trap Anak Tangga', placeholder: 'Masukkan jumlah trap (buah)', value: null, unit: 'buah', required: true },
      { id: 'luas_bordes', name: 'luas_bordes', label: 'Luas Bordes Tangga', placeholder: 'Masukkan luas bordes (m²)', value: null, unit: 'm²', required: false },
    ],
    calculationMethod: (params) => {
      const a = params['lebar_pijakan'];
      const w = params['lebar_tangga'];
      const n = params['jumlah_trap'];
      const b = params['luas_bordes'] || 0;
      if (a == null || w == null || n == null) return null;
      return a * w * n + b;
    },
  },
  {
    id: 'ars-lantai-beton-acian',
    code: 'ARS-LNT-05',
    name: 'Pekerjaan Lantai Beton Finishing Acian',
    category: 'Arsitektural',
    subCategory: 'B. Pekerjaan Pemasangan Penutup Lantai',
    floorRule: 'per_lantai',
    description: 'Pekerjaan rabat lantai beton dengan finishing acian halus.',
    defaultUnit: 'm²',
    formulaDisplay: 'Panjang Area × Lebar Area',
    excelSheet: 'Volume Arsitektural',
    excelCell: 'U45',
    excelFormula: '=34*36',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang', name: 'panjang', label: 'Panjang Area Lantai', placeholder: 'Masukkan panjang (m)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar Area Lantai', placeholder: 'Masukkan lebar (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang'];
      const l = params['lebar'];
      if (p == null || l == null) return null;
      return p * l;
    },
  },
  {
    id: 'ars-pengecatan-dinding-eksterior',
    code: 'ARS-CAT-01',
    name: 'Pengecatan Dinding Finishing Cat Putih Eksterior',
    category: 'Arsitektural',
    subCategory: 'C. Pekerjaan Pengecatan',
    floorRule: 'per_lantai',
    description: 'Pengecatan dinding tampak luar tahan cuaca.',
    defaultUnit: 'm²',
    formulaDisplay: 'Panjang Dinding Luar × Tinggi Dinding',
    excelSheet: 'Volume Arsitektural',
    excelCell: 'U48',
    excelFormula: '=M48*I48',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_dinding_luar', name: 'panjang_dinding_luar', label: 'Panjang Dinding Luar', placeholder: 'Masukkan panjang dinding luar (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi_dinding', name: 'tinggi_dinding', label: 'Tinggi Dinding Luar', placeholder: 'Masukkan tinggi dinding (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_dinding_luar'];
      const t = params['tinggi_dinding'];
      if (p == null || t == null || isNaN(p) || isNaN(t)) return null;
      return p * t;
    },
  },
  {
    id: 'ars-pengecatan-dinding-interior',
    code: 'ARS-CAT-02',
    name: 'Pengecatan Dinding Finishing Cat Interior',
    category: 'Arsitektural',
    subCategory: 'C. Pekerjaan Pengecatan',
    floorRule: 'per_lantai',
    description: 'Pengecatan permukaan dinding dalam ruangan.',
    defaultUnit: 'm²',
    formulaDisplay: 'Luas Bersih Dinding Interior',
    excelSheet: 'Volume Arsitektural',
    excelCell: 'U49',
    excelFormula: '=M49*I49-U30',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'luas_dinding', name: 'luas_dinding', label: 'Luas Dinding Interior', placeholder: 'Masukkan luas dinding dalam (m²)', value: null, unit: 'm²', required: true },
    ],
    calculationMethod: (params) => {
      const a = params['luas_dinding'];
      if (a == null || isNaN(a)) return null;
      return a;
    },
  },
  {
    id: 'ars-pengecatan-plafond',
    code: 'ARS-CAT-03',
    name: 'Pengecatan Plafond Gypsum',
    category: 'Arsitektural',
    subCategory: 'C. Pekerjaan Pengecatan',
    floorRule: 'per_lantai',
    description: 'Pengecatan permukaan langit-langit plafond gypsum.',
    defaultUnit: 'm²',
    formulaDisplay: 'Luas Bidang Plafond Gypsum',
    excelSheet: 'Volume Arsitektural',
    excelCell: 'U50',
    excelFormula: '=K50*I50',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'luas_plafond', name: 'luas_plafond', label: 'Luas Plafond yang Dicat', placeholder: 'Masukkan luas plafond (m²)', value: null, unit: 'm²', required: true },
    ],
    calculationMethod: (params) => {
      const a = params['luas_plafond'];
      if (a == null || isNaN(a)) return null;
      return a;
    },
  },
  {
    id: 'ars-plafond-gypsum',
    code: 'ARS-PLF-01',
    name: 'Pekerjaan Pemasangan Plafond Gypsum 120 x 240 t = 10 mm & Rangka Hollow',
    category: 'Arsitektural',
    subCategory: 'D. Pekerjaan Plafond',
    floorRule: 'per_lantai',
    description: 'Pemasangan langit-langit plafond gypsum beserta rangka metal hollow.',
    defaultUnit: 'm²',
    formulaDisplay: 'Luas Bersih Langit-langit Ruangan',
    excelSheet: 'Volume Arsitektural',
    excelCell: 'U54',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'luas_plafond', name: 'luas_plafond', label: 'Luas Bersih Plafond', placeholder: 'Masukkan luas plafond (m²)', value: null, unit: 'm²', required: true },
    ],
    calculationMethod: (params) => {
      const a = params['luas_plafond'];
      if (a == null || isNaN(a)) return null;
      return a;
    },
  },
  {
    id: 'ars-list-gypsum',
    code: 'ARS-PLF-02',
    name: 'Pekerjaan List Gypsum 10 cm',
    category: 'Arsitektural',
    subCategory: 'D. Pekerjaan Plafond',
    floorRule: 'per_lantai',
    description: 'List profil tepi pertemuan dinding dan plafon.',
    defaultUnit: 'm\'',
    formulaDisplay: 'Panjang Total Keliling Plafond',
    excelSheet: 'Volume Arsitektural',
    excelCell: 'U55',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_keliling', name: 'panjang_keliling', label: 'Panjang Total List Plafond', placeholder: 'Masukkan panjang keliling (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const l = params['panjang_keliling'];
      if (l == null || isNaN(l)) return null;
      return l;
    },
  },
  {
    id: 'ars-pintu-p1-lengkap',
    code: 'ARS-PNT-01',
    name: 'Pemasangan Pintu Type P1 Lengkap (Kusen, Daun Pintu, Kaca & Aksesoris)',
    category: 'Arsitektural',
    subCategory: 'E. Pekerjaan Pintu dan Jendela',
    floorRule: 'per_lantai',
    description: 'Unit pintu utama Type P1 lengkap dengan kusen aluminium, daun pintu, kaca, handle, engsel, dan kunci.',
    defaultUnit: 'unit',
    formulaDisplay: 'Jumlah Unit Pintu P1',
    excelSheet: 'Volume Arsitektural',
    excelCell: 'O58',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'jumlah_unit', name: 'jumlah_unit', label: 'Jumlah Unit Pintu P1', placeholder: 'Masukkan jumlah unit', value: null, unit: 'unit', required: true },
    ],
    calculationMethod: (params) => {
      const n = params['jumlah_unit'];
      if (n == null || isNaN(n)) return null;
      return n;
    },
  },
  {
    id: 'ars-pintu-p2-lengkap',
    code: 'ARS-PNT-02',
    name: 'Pemasangan Pintu Type P2 Lengkap (Kusen, Daun Pintu, Kaca & Aksesoris)',
    category: 'Arsitektural',
    subCategory: 'E. Pekerjaan Pintu dan Jendela',
    floorRule: 'per_lantai',
    description: 'Unit pintu ruangan Type P2 lengkap dengan kusen aluminium, daun pintu, kaca, handle, engsel, dan kunci.',
    defaultUnit: 'unit',
    formulaDisplay: 'Jumlah Unit Pintu P2',
    excelSheet: 'Volume Arsitektural',
    excelCell: 'O69',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'jumlah_unit', name: 'jumlah_unit', label: 'Jumlah Unit Pintu P2', placeholder: 'Masukkan jumlah unit', value: null, unit: 'unit', required: true },
    ],
    calculationMethod: (params) => {
      const n = params['jumlah_unit'];
      if (n == null || isNaN(n)) return null;
      return n;
    },
  },
  {
    id: 'ars-pintu-p3-lengkap',
    code: 'ARS-PNT-03',
    name: 'Pemasangan Pintu Type P3 Lengkap (Kusen, Daun Pintu, Kaca & Aksesoris)',
    category: 'Arsitektural',
    subCategory: 'E. Pekerjaan Pintu dan Jendela',
    floorRule: 'per_lantai',
    description: 'Unit pintu ruangan Type P3 lengkap dengan kusen aluminium, daun pintu, kaca, handle, engsel, dan kunci.',
    defaultUnit: 'unit',
    formulaDisplay: 'Jumlah Unit Pintu P3',
    excelSheet: 'Volume Arsitektural',
    excelCell: 'O80',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'jumlah_unit', name: 'jumlah_unit', label: 'Jumlah Unit Pintu P3', placeholder: 'Masukkan jumlah unit', value: null, unit: 'unit', required: true },
    ],
    calculationMethod: (params) => {
      const n = params['jumlah_unit'];
      if (n == null || isNaN(n)) return null;
      return n;
    },
  },
  {
    id: 'ars-pintu-p4-lengkap',
    code: 'ARS-PNT-04',
    name: 'Pemasangan Pintu Type P4 Lengkap (Kusen, Daun Pintu Toilet & Aksesoris)',
    category: 'Arsitektural',
    subCategory: 'E. Pekerjaan Pintu dan Jendela',
    floorRule: 'per_lantai',
    description: 'Unit pintu toilet/KM Type P4 lengkap dengan kusen aluminium, daun pintu, kaca boven, handle, engsel, dan kunci.',
    defaultUnit: 'unit',
    formulaDisplay: 'Jumlah Unit Pintu P4',
    excelSheet: 'Volume Arsitektural',
    excelCell: 'O91',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'jumlah_unit', name: 'jumlah_unit', label: 'Jumlah Unit Pintu P4', placeholder: 'Masukkan jumlah unit', value: null, unit: 'unit', required: true },
    ],
    calculationMethod: (params) => {
      const n = params['jumlah_unit'];
      if (n == null || isNaN(n)) return null;
      return n;
    },
  },
  {
    id: 'ars-jendela-j1-lengkap',
    code: 'ARS-JND-01',
    name: 'Pemasangan Jendela Type J1 Lengkap (Kusen, Daun Jendela, Kaca & Aksesoris)',
    category: 'Arsitektural',
    subCategory: 'E. Pekerjaan Pintu dan Jendela',
    floorRule: 'per_lantai',
    description: 'Unit jendela Type J1 lengkap kusen aluminium, daun jendela, kaca 5 mm, rambucis, dan engsel.',
    defaultUnit: 'unit',
    formulaDisplay: 'Jumlah Unit Jendela J1',
    excelSheet: 'Volume Arsitektural',
    excelCell: 'O102',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'jumlah_unit', name: 'jumlah_unit', label: 'Jumlah Unit Jendela J1', placeholder: 'Masukkan jumlah unit', value: null, unit: 'unit', required: true },
    ],
    calculationMethod: (params) => {
      const n = params['jumlah_unit'];
      if (n == null || isNaN(n)) return null;
      return n;
    },
  },
  {
    id: 'ars-jendela-j2-lengkap',
    code: 'ARS-JND-02',
    name: 'Pemasangan Jendela Type J2 Lengkap (Kusen, Daun Jendela, Kaca & Aksesoris)',
    category: 'Arsitektural',
    subCategory: 'E. Pekerjaan Pintu dan Jendela',
    floorRule: 'per_lantai',
    description: 'Unit jendela Type J2 lengkap kusen aluminium, daun jendela, kaca 5 mm, rambucis, dan engsel.',
    defaultUnit: 'unit',
    formulaDisplay: 'Jumlah Unit Jendela J2',
    excelSheet: 'Volume Arsitektural',
    excelCell: 'O113',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'jumlah_unit', name: 'jumlah_unit', label: 'Jumlah Unit Jendela J2', placeholder: 'Masukkan jumlah unit', value: null, unit: 'unit', required: true },
    ],
    calculationMethod: (params) => {
      const n = params['jumlah_unit'];
      if (n == null || isNaN(n)) return null;
      return n;
    },
  },
  {
    id: 'ars-jendela-j3-lengkap',
    code: 'ARS-JND-03',
    name: 'Pemasangan Jendela Type J3 Lengkap (Kusen, Daun Jendela, Kaca & Aksesoris)',
    category: 'Arsitektural',
    subCategory: 'E. Pekerjaan Pintu dan Jendela',
    floorRule: 'per_lantai',
    description: 'Unit jendela Type J3 lengkap kusen aluminium, daun jendela, kaca 5 mm, rambucis, dan engsel.',
    defaultUnit: 'unit',
    formulaDisplay: 'Jumlah Unit Jendela J3',
    excelSheet: 'Volume Arsitektural',
    excelCell: 'O124',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'jumlah_unit', name: 'jumlah_unit', label: 'Jumlah Unit Jendela J3', placeholder: 'Masukkan jumlah unit', value: null, unit: 'unit', required: true },
    ],
    calculationMethod: (params) => {
      const n = params['jumlah_unit'];
      if (n == null || isNaN(n)) return null;
      return n;
    },
  },
  {
    id: 'ars-jendela-j4-lengkap',
    code: 'ARS-JND-04',
    name: 'Pemasangan Jendela Type J4 Lengkap (Kusen, Daun Jendela, Kaca & Aksesoris)',
    category: 'Arsitektural',
    subCategory: 'E. Pekerjaan Pintu dan Jendela',
    floorRule: 'per_lantai',
    description: 'Unit jendela besar Type J4 lengkap kusen aluminium, daun jendela, kaca 5 mm, rambucis, dan engsel.',
    defaultUnit: 'unit',
    formulaDisplay: 'Jumlah Unit Jendela J4',
    excelSheet: 'Volume Arsitektural',
    excelCell: 'O136',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'jumlah_unit', name: 'jumlah_unit', label: 'Jumlah Unit Jendela J4', placeholder: 'Masukkan jumlah unit', value: null, unit: 'unit', required: true },
    ],
    calculationMethod: (params) => {
      const n = params['jumlah_unit'];
      if (n == null || isNaN(n)) return null;
      return n;
    },
  },
  {
    id: 'ars-bouvenlight-lengkap',
    code: 'ARS-JND-05',
    name: 'Pemasangan Bouvenlight (BV) Lengkap (Kusen Aluminium & Kaca)',
    category: 'Arsitektural',
    subCategory: 'E. Pekerjaan Pintu dan Jendela',
    floorRule: 'per_lantai',
    description: 'Unit ventilasi bouvenlight lengkap dengan kusen aluminium dan kaca bening 5 mm.',
    defaultUnit: 'unit',
    formulaDisplay: 'Jumlah Unit Bouvenlight',
    excelSheet: 'Volume Arsitektural',
    excelCell: 'O149',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'jumlah_unit', name: 'jumlah_unit', label: 'Jumlah Unit Bouvenlight', placeholder: 'Masukkan jumlah unit', value: null, unit: 'unit', required: true },
    ],
    calculationMethod: (params) => {
      const n = params['jumlah_unit'];
      if (n == null || isNaN(n)) return null;
      return n;
    },
  },
  {
    id: 'ars-fasad-acp-grc',
    code: 'ARS-FSD-01',
    name: 'Pekerjaan Fasad Bangunan (ACP, GRC Cetak & Kisi Aluminium)',
    category: 'Arsitektural',
    subCategory: 'F. Pekerjaan Fasad & Lain-lain',
    floorRule: 'per_lantai',
    description: 'Pemasangan penutup fasad ACP, list GRC cetak, dan ornamen tampak bangunan.',
    defaultUnit: 'm²',
    formulaDisplay: 'Panjang Bidang Fasad × Tinggi Bidang Fasad',
    excelSheet: 'Volume Struktural',
    excelCell: 'U465',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_fasad', name: 'panjang_fasad', label: 'Panjang Bidang Fasad', placeholder: 'Masukkan panjang bidang (m)', value: null, unit: 'm', required: true },
      { id: 'tinggi_fasad', name: 'tinggi_fasad', label: 'Tinggi / Lebar Bidang Fasad', placeholder: 'Masukkan tinggi/lebar bidang (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_fasad'];
      const t = params['tinggi_fasad'];
      if (p == null || t == null) return null;
      return p * t;
    },
  },
  {
    id: 'ars-railing-tangga',
    code: 'ARS-FSD-02',
    name: 'Pekerjaan Railing Tangga & Void',
    category: 'Arsitektural',
    subCategory: 'F. Pekerjaan Fasad & Lain-lain',
    floorRule: 'per_lantai',
    description: 'Pemasangan pegangan railing tangga dan pengaman tepian tangga/void.',
    defaultUnit: 'm\'',
    formulaDisplay: 'Panjang Total Jalur Railing',
    excelSheet: 'Volume Struktural',
    excelCell: 'U506',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_railing', name: 'panjang_railing', label: 'Panjang Jalur Railing Tangga', placeholder: 'Masukkan panjang railing (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_railing'];
      if (p == null || isNaN(p)) return null;
      return p;
    },
  },
  {
    id: 'ars-landscape-rumput',
    code: 'ARS-LND-01',
    name: 'Pekerjaan Landscape Penanaman Rumput Gajah Mini & Batu Koral',
    category: 'Arsitektural',
    subCategory: 'G. Pekerjaan Landscape',
    floorRule: 'umum',
    description: 'Penataan taman, penanaman rumput gajah mini, dan batu koral putih halus.',
    defaultUnit: 'm²',
    formulaDisplay: 'Luas Area Taman & Landscape',
    excelSheet: 'Volume Struktural',
    excelCell: 'U502',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'luas_taman', name: 'luas_taman', label: 'Luas Area Landscape / Taman', placeholder: 'Masukkan luas area taman (m²)', value: null, unit: 'm²', required: true },
    ],
    calculationMethod: (params) => {
      const a = params['luas_taman'];
      if (a == null || isNaN(a)) return null;
      return a;
    },
  },

  // ==========================================
  // IX. PEKERJAAN MEP (KELISTRIKAN & SANITASI)
  // ==========================================
  {
    id: 'mep-titik-lampu',
    code: 'MEP-ELC-01',
    name: 'Pemasangan Titik Lampu & Instalasi Penerangan (LED 12W, 7W, 4W, TL 40W)',
    category: 'MEP',
    subCategory: 'Pekerjaan Kelistrikan',
    floorRule: 'per_lantai',
    description: 'Pemasangan titik instalasi penerangan dan armatur lampu sesuai tipe pada denah.',
    defaultUnit: 'titik',
    formulaDisplay: 'Penjumlahan Seluruh Titik Lampu',
    excelSheet: 'Volume Persiapan Dll',
    excelCell: 'G34',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'lampu_led_12w', name: 'lampu_led_12w', label: 'Jumlah Lampu LED 12W (Utama)', placeholder: 'Masukkan jumlah titik', value: null, unit: 'bh', required: true },
      { id: 'lampu_led_7w', name: 'lampu_led_7w', label: 'Jumlah Lampu LED 7W (Downlight)', placeholder: 'Masukkan jumlah titik (opsional)', value: null, unit: 'bh', required: false },
      { id: 'lampu_led_4w', name: 'lampu_led_4w', label: 'Jumlah Lampu LED 4W (Sorot/Taman)', placeholder: 'Masukkan jumlah titik (opsional)', value: null, unit: 'bh', required: false },
      { id: 'lampu_tl_40w', name: 'lampu_tl_40w', label: 'Jumlah Lampu TL 40W', placeholder: 'Masukkan jumlah titik (opsional)', value: null, unit: 'bh', required: false },
    ],
    calculationMethod: (params) => {
      const l1 = params['lampu_led_12w'];
      const l2 = params['lampu_led_7w'] || 0;
      const l3 = params['lampu_led_4w'] || 0;
      const l4 = params['lampu_tl_40w'] || 0;
      if (l1 == null && l2 === 0 && l3 === 0 && l4 === 0) return null;
      return (l1 || 0) + l2 + l3 + l4;
    },
  },
  {
    id: 'mep-stop-kontak',
    code: 'MEP-ELC-02',
    name: 'Pemasangan Stop Kontak Dinding',
    category: 'MEP',
    subCategory: 'Pekerjaan Kelistrikan',
    floorRule: 'per_lantai',
    description: 'Pemasangan titik instalasi dan stop kontak dinding.',
    defaultUnit: 'titik',
    formulaDisplay: 'Jumlah Titik Stop Kontak',
    excelSheet: 'Volume Persiapan Dll',
    excelCell: 'G35',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'jumlah_titik', name: 'jumlah_titik', label: 'Jumlah Titik Stop Kontak', placeholder: 'Masukkan jumlah titik', value: null, unit: 'titik', required: true },
    ],
    calculationMethod: (params) => {
      const n = params['jumlah_titik'];
      if (n == null || isNaN(n)) return null;
      return n;
    },
  },
  {
    id: 'mep-saklar-lampu',
    code: 'MEP-ELC-03',
    name: 'Pemasangan Saklar Tunggal & Saklar Ganda',
    category: 'MEP',
    subCategory: 'Pekerjaan Kelistrikan',
    floorRule: 'per_lantai',
    description: 'Pemasangan unit saklar tunggal dan saklar ganda lampu penerangan.',
    defaultUnit: 'titik',
    formulaDisplay: 'Jumlah Saklar Tunggal + Jumlah Saklar Ganda',
    excelSheet: 'Volume Persiapan Dll',
    excelCell: 'G36',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'saklar_tunggal', name: 'saklar_tunggal', label: 'Jumlah Saklar Tunggal', placeholder: 'Masukkan jumlah titik', value: null, unit: 'bh', required: true },
      { id: 'saklar_ganda', name: 'saklar_ganda', label: 'Jumlah Saklar Ganda', placeholder: 'Masukkan jumlah titik (opsional)', value: null, unit: 'bh', required: false },
    ],
    calculationMethod: (params) => {
      const s1 = params['saklar_tunggal'];
      const s2 = params['saklar_ganda'] || 0;
      if (s1 == null && s2 === 0) return null;
      return (s1 || 0) + s2;
    },
  },
  {
    id: 'mep-sanitasi-kloset',
    code: 'MEP-SAN-01',
    name: 'Pemasangan Kloset Duduk / Jongkok & Urinoir',
    category: 'MEP',
    subCategory: 'Pekerjaan Sanitasi',
    floorRule: 'per_lantai',
    description: 'Pemasangan unit kloset dan urinoir pada ruang toilet/kamar mandi.',
    defaultUnit: 'unit',
    formulaDisplay: 'Jumlah Kloset + Jumlah Urinoir',
    excelSheet: 'Volume Persiapan Dll',
    excelCell: 'G45',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'jumlah_kloset', name: 'jumlah_kloset', label: 'Jumlah Unit Kloset', placeholder: 'Masukkan jumlah unit kloset', value: null, unit: 'unit', required: true },
      { id: 'jumlah_urinoir', name: 'jumlah_urinoir', label: 'Jumlah Unit Urinoir', placeholder: 'Masukkan jumlah urinoir (opsional)', value: null, unit: 'unit', required: false },
    ],
    calculationMethod: (params) => {
      const k = params['jumlah_kloset'];
      const u = params['jumlah_urinoir'] || 0;
      if (k == null && u === 0) return null;
      return (k || 0) + u;
    },
  },
  {
    id: 'mep-sanitasi-wastafel',
    code: 'MEP-SAN-02',
    name: 'Pemasangan Wastafel Lengkap Keran & Sifon',
    category: 'MEP',
    subCategory: 'Pekerjaan Sanitasi',
    floorRule: 'per_lantai',
    description: 'Pemasangan unit wastafel cuci tangan beserta perlengkapannya.',
    defaultUnit: 'unit',
    formulaDisplay: 'Jumlah Unit Wastafel',
    excelSheet: 'Volume Persiapan Dll',
    excelCell: 'G49',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'jumlah_unit', name: 'jumlah_unit', label: 'Jumlah Unit Wastafel', placeholder: 'Masukkan jumlah unit', value: null, unit: 'unit', required: true },
    ],
    calculationMethod: (params) => {
      const n = params['jumlah_unit'];
      if (n == null || isNaN(n)) return null;
      return n;
    },
  },
  {
    id: 'mep-sanitasi-kran-air',
    code: 'MEP-SAN-03',
    name: 'Pemasangan Kran Air Bersih & Floor Drain',
    category: 'MEP',
    subCategory: 'Pekerjaan Sanitasi',
    floorRule: 'per_lantai',
    description: 'Pemasangan unit kran air bersih dan saringan pembuangan lantai (floor drain).',
    defaultUnit: 'buah',
    formulaDisplay: 'Jumlah Buah Kran Air',
    excelSheet: 'Volume Persiapan Dll',
    excelCell: 'G50',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'jumlah_kran', name: 'jumlah_kran', label: 'Jumlah Kran Air', placeholder: 'Masukkan jumlah buah', value: null, unit: 'buah', required: true },
    ],
    calculationMethod: (params) => {
      const n = params['jumlah_kran'];
      if (n == null || isNaN(n)) return null;
      return n;
    },
  },
  {
    id: 'mep-pipa-pvc-air-bersih',
    code: 'MEP-SAN-04',
    name: 'Pemasangan Pipa PVC Air Bersih (Ø 1/2" - 1")',
    category: 'MEP',
    subCategory: 'Pekerjaan Sanitasi',
    floorRule: 'per_lantai',
    description: 'Instalasi jaringan pipa distribusi air bersih.',
    defaultUnit: 'm',
    formulaDisplay: 'Panjang Total Jalur Pipa',
    excelSheet: 'Volume Persiapan Dll',
    excelCell: 'G58',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_pipa', name: 'panjang_pipa', label: 'Panjang Jalur Pipa Air Bersih', placeholder: 'Masukkan panjang pipa (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_pipa'];
      if (p == null || isNaN(p)) return null;
      return p;
    },
  },
  {
    id: 'mep-pipa-pvc-air-kotor-4in',
    code: 'MEP-SAN-05',
    name: 'Pemasangan Pipa PVC Air Kotor & Limbah (Ø 3" - 4")',
    category: 'MEP',
    subCategory: 'Pekerjaan Sanitasi',
    floorRule: 'per_lantai',
    description: 'Instalasi pipa pembuangan air kotor dan limbah.',
    defaultUnit: 'm',
    formulaDisplay: 'Panjang Total Jalur Pipa',
    excelSheet: 'Volume Persiapan Dll',
    excelCell: 'G60',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'panjang_pipa', name: 'panjang_pipa', label: 'Panjang Jalur Pipa Air Kotor', placeholder: 'Masukkan panjang pipa (m)', value: null, unit: 'm', required: true },
    ],
    calculationMethod: (params) => {
      const p = params['panjang_pipa'];
      if (p == null || isNaN(p)) return null;
      return p;
    },
  },
  {
    id: 'mep-septic-tank-biotank',
    code: 'MEP-SAN-06',
    name: 'Pemasangan Bio Septic Tank & Sumur Resapan',
    category: 'MEP',
    subCategory: 'Pekerjaan Sanitasi',
    floorRule: 'umum',
    description: 'Pemasangan unit bio septic tank dan sumur resapan.',
    defaultUnit: 'unit',
    formulaDisplay: 'Jumlah Unit Septic Tank',
    excelSheet: 'Volume Persiapan Dll',
    excelCell: 'G52',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'jumlah_unit', name: 'jumlah_unit', label: 'Jumlah Unit Biotank', placeholder: 'Masukkan jumlah unit', value: null, unit: 'unit', required: true },
    ],
    calculationMethod: (params) => {
      const n = params['jumlah_unit'];
      if (n == null || isNaN(n)) return null;
      return n;
    },
  },
  {
    id: 'mep-bak-kontrol',
    code: 'MEP-SAN-07',
    name: 'Pembuatan Bak Kontrol Saluran Uk. 60 x 60 cm',
    category: 'MEP',
    subCategory: 'Pekerjaan Sanitasi',
    floorRule: 'umum',
    description: 'Pembuatan bak kontrol pasangan bata saluran drainase/air kotor.',
    defaultUnit: 'unit',
    formulaDisplay: 'Jumlah Unit Bak Kontrol',
    excelSheet: 'Volume Persiapan Dll',
    excelCell: 'F68',
    verificationStatus: 'Belum Diisi',
    parameters: [
      { id: 'jumlah_unit', name: 'jumlah_unit', label: 'Jumlah Unit Bak Kontrol', placeholder: 'Masukkan jumlah unit', value: null, unit: 'unit', required: true },
    ],
    calculationMethod: (params) => {
      const n = params['jumlah_unit'];
      if (n == null || isNaN(n)) return null;
      return n;
    },
  },
];

/**
 * Alias eksplisit untuk Template Standar Global RuangEstimasi berbasis Katalog Gedung USC
 */
export const USC_STANDARD_TEMPLATE: ReadonlyArray<CatalogWorkItem> = CATALOG_WORK_ITEMS;
