/**
 * RuangEstimasi - Type Definitions
 * Platform AI Quantity Takeoff untuk membantu membaca gambar teknik, menghitung volume pekerjaan konstruksi, dan mengelola estimasi kuantitas proyek.
 */

export type WorkCategory = 'Persiapan Dll' | 'Struktural' | 'Arsitektural' | 'MEP';

export type UserAccountType = 'Student' | 'Estimator' | 'Other';

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  userType: UserAccountType;
  createdAt: string;
  updatedAt: string;
  authProvider?: 'email' | 'google';
}

export type CalculationStatus =
  | 'Terverifikasi'
  | 'Perlu Verifikasi'
  | 'Tidak Lengkap'
  | 'Belum Diisi'
  | 'Lengkap'
  | 'Belum Lengkap'
  | 'Perlu Input'
  | 'Draf AI: Perlu Verifikasi'
  | 'Draf AI — Perlu Verifikasi'
  | 'Rumus Perlu Dikonfigurasi'
  | 'Rumus Belum Dipetakan'
  | 'Kesalahan Perhitungan'
  | 'Tidak Digunakan';

export type AIVerificationBadge =
  | 'Terbaca Jelas'
  | 'Hasil Penggabungan'
  | 'Perlu Verifikasi'
  | 'Tidak Ditemukan';

export type AIExtractionErrorType =
  | 'api_error'
  | 'unreadable_file'
  | 'unsupported_format'
  | 'incomplete_extraction';

export type ParameterType = 'number' | 'text' | 'select';

export type DrawingUnit = 'mm' | 'cm' | 'm';

export type DrawingScale =
  | '1:20'
  | '1:50'
  | '1:75'
  | '1:100'
  | '1:150'
  | '1:200'
  | 'custom'
  | 'unknown';

/**
 * 16 Klasifikasi Standar Halaman / Bagian Gambar Teknik RuangEstimasi
 * (beserta dukungan alias untuk kompatibilitas mundur)
 */
export type EngineeringDrawingType =
  | 'Denah arsitektur'
  | 'Denah struktur'
  | 'Denah pondasi'
  | 'Denah kolom'
  | 'Denah balok'
  | 'Denah sloof'
  | 'Denah pembesian'
  | 'Gambar potongan'
  | 'Gambar tampak'
  | 'Detail konstruksi'
  | 'Detail penulangan'
  | 'Tabel dimensi atau schedule'
  | 'Gambar tangga'
  | 'Gambar atap'
  | 'Gambar MEP'
  | 'Tidak diketahui / perlu pemeriksaan manual'
  | 'Denah Arsitektur'
  | 'Denah Struktur'
  | 'Denah Kolom'
  | 'Denah Balok'
  | 'Denah Sloof'
  | 'Denah Pondasi'
  | 'Potongan Bangunan'
  | 'Tampak Bangunan'
  | 'Detail Tangga'
  | 'Detail Pondasi'
  | 'Detail Sambungan'
  | 'Detail Penulangan'
  | 'Tabel Dimensi dan Penulangan'
  | 'Detail Konstruksi Lainnya';

export const CANONICAL_DRAWING_TYPES: string[] = [
  'Denah arsitektur',
  'Denah struktur',
  'Denah pondasi',
  'Denah kolom',
  'Denah balok',
  'Denah sloof',
  'Denah pembesian',
  'Gambar potongan',
  'Gambar tampak',
  'Detail konstruksi',
  'Detail penulangan',
  'Tabel dimensi atau schedule',
  'Gambar tangga',
  'Gambar atap',
  'Gambar MEP',
  'Tidak diketahui / perlu pemeriksaan manual',
];

export interface AIDetectedRegion {
  pageNumber: number;
  drawingType: EngineeringDrawingType;
  title: string;
  identifiedFloor?: string;
  scale?: string;
  summary: string;
}

export interface AIBeamSloofSegment {
  id: string;
  elementCode: string; // Contoh: "S1", "S2", "B1", "B2"
  elementCategory: 'sloof' | 'balok';
  segmentName: string; // Contoh: "Segmen A–B"
  gridLocation: string; // Contoh: "As A–B / Grid 1"
  rawLength: number; // Nilai tertulis pada gambar (misal 300 cm atau 3.00 m)
  rawUnit: DrawingUnit;
  lengthMeters: number; // Panjang 1 segmen dalam meter (m)
  count: number; // Jumlah segmen identik pada jalur tersebut
  subtotalMeters: number; // lengthMeters * count
  pageNumber?: number;
  drawingType?: EngineeringDrawingType;
  drawingTitle?: string;
  identifiedFloor?: string;
  sourceInfo?: string;
}

export interface ParameterConflict {
  newValue: number;
  rawExtractedValue: number;
  rawUnit: DrawingUnit;
  sourceDocument: string;
  pageOrLocation?: string;
  sourceInfo?: string;
}

export interface ParameterItem {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  value: number | string | null;
  unit: string;
  type?: ParameterType;
  required?: boolean;
  source?: 'manual' | 'ai' | 'derived' | 'reference';
  sourceDocument?: string;
  pageOrLocation?: string;
  sourceInfo?: string; // Contoh: "Halaman 4, Denah Balok Lantai 1"
  drawingType?: EngineeringDrawingType;
  drawingTitle?: string;
  identifiedFloor?: string;
  gridLocation?: string;
  elementCode?: string;
  pageNumber?: number;
  rawExtractedValue?: number;
  rawUnit?: DrawingUnit;
  verificationBadge?: AIVerificationBadge;
  isVerified?: boolean;
  conflict?: ParameterConflict | null;
  notes?: string;
  excelCellRef?: string; // Metadata internal
}

export interface WorkComponent {
  id: string;
  name: string;
  parameters: Record<string, number | null>;
  formulaText?: string;
  computedVolume?: number | null;
}

export interface CatalogWorkItem {
  id: string;
  code?: string;
  name: string;
  category: WorkCategory;
  subCategory?: string;
  floorRule: 'umum' | 'per_lantai' | 'atap_saja' | 'fondasi_saja';
  description: string;
  defaultUnit: string;
  formulaDisplay: string;
  customFormula?: string;
  isCustomCatalog?: boolean;
  excelSheet: string; // Metadata internal
  excelCell: string; // Metadata internal
  excelFormula?: string; // Metadata internal
  parameters: ParameterItem[];
  defaultComponents?: WorkComponent[];
  calculationMethod: (params: Record<string, number>, components?: WorkComponent[]) => number | null;
  verificationStatus: CalculationStatus;
  verificationNotes?: string;
  hasExternalRef?: boolean;
}

export interface ProjectWorkItem {
  id: string;
  catalogId?: string;
  dedupKey?: string; // Kunci stabil pencegahan duplikasi (floorId + catalogId + elementCode)
  name: string;
  category: WorkCategory;
  subCategory?: string;
  floorId: string; // "fl-umum" atau floorId
  elementLocation?: string; // Lokasi / As / Ruang dari gambar
  elementCode?: string; // Kode elemen struktur (misal: S1, B1, K1)
  segments?: AIBeamSloofSegment[]; // Rincian segmen jika pekerjaan berupa Balok / Sloof
  unit: string;
  formulaDisplay: string;
  parameters: ParameterItem[];
  components: WorkComponent[];
  calculatedVolume: number | null;
  status: CalculationStatus;
  statusMessage?: string;
  origin?: 'manual' | 'ai';
  aiVerificationStatus?: 'draft' | 'verified' | 'rejected';
  verificationBadge?: AIVerificationBadge;
  sourceDocument?: string;
  sourceInfo?: string;
  identificationReason?: string;
  excelSheet?: string; // Metadata internal
  excelCell?: string; // Metadata internal
  excelFormula?: string; // Metadata internal
  customFormula?: string;
  notes?: string;
  isActive: boolean;
  lastUpdated?: string;
}

export interface FloorItem {
  id: string;
  name: string; // e.g. "Lantai 1", "Lantai 2", "Umum & Pondasi"
  level: number;
  elevation?: string;
  description?: string;
}

export interface AITakeoffHistoryRecord {
  documentHash: string;
  fileName: string;
  analyzedAt: string;
  targetFloorId: string;
  summary: AIAutoTakeoffSummary;
  extractions: AIExtractionItem[];
  detectedRegions: AIDetectedRegion[];
  segments: AIBeamSloofSegment[];
}

export interface ProjectData {
  id: string;
  ownerUid?: string;
  name: string;
  location?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  floorCount: number;
  floors: FloorItem[];
  works: ProjectWorkItem[];
  rejectedDraftKeys?: string[];
  catalogVersion: string;
  isolationVersion?: string;
  aiTakeoffHistory?: AITakeoffHistoryRecord[];
}

export interface AIExtractionItem {
  id: string;
  targetCategory: string;
  suggestedWorkName: string;
  elementCode?: string; // Kode elemen pada gambar (S1, B1, K1, P1, J1, dll)
  drawingType?: EngineeringDrawingType;
  drawingTitle?: string;
  identifiedFloor?: string;
  gridLocation?: string;
  pageNumber?: number;
  catalogId?: string;
  parameterId?: string;
  parameterName: string;
  rawExtractedValue: number;
  rawUnit: DrawingUnit;
  explicitUnitOnDrawing?: string;
  convertedValue: number;
  convertedUnit: string;
  confidence: number;
  verificationBadge?: AIVerificationBadge;
  sourceDocument: string;
  pageOrLocation?: string;
  sourceInfo?: string; // Contoh: "Halaman 4, Denah Balok Lantai 1"
  notes?: string;
  userCorrection?: number;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  targetWorkId?: string;
  targetParamId?: string;
  isRecommendationOnly?: boolean;
}

export interface AIAutoTakeoffSummary {
  documentSummary: string;
  drawingType: 'arsitektur_denah' | 'struktur_denah' | 'potongan_detail' | 'lainnya';
  detectedRegions?: AIDetectedRegion[];
  segments?: AIBeamSloofSegment[];
  identifiedFloor: string;
  identifiedScale: string;
  extractedCount: number;
  createdDraftWorksCount: number;
  updatedExistingWorksCount: number;
  incompleteWorksCount: number;
  conflictCount: number;
  fromCache?: boolean;
  recommendations: {
    catalogId: string;
    name: string;
    category: WorkCategory;
    reason: string;
  }[];
}
