/**
 * RuangEstimasi - Penyimpanan Proyek Terisolasi per Pengguna & Mesin Auto Quantity Takeoff
 * Mendukung:
 * - Isolasi data ketat per akun pengguna (Server Database `/api/projects` + Cloud Firestore + LocalStorage terisolasi per `userId`)
 * - Pembersihan otomatis data demo/seed lama (seperti 12,7 m; 6 m; 76,20 m²; 37,40 m) tanpa menghapus proyek valid pengguna
 * - Pemisahan tegas antara `USC_STANDARD_TEMPLATE` (Read-Only Global) dan `USER_PROJECT_DATA` (Terikat `userId` & `projectId`)
 * - Perhitungan panjang total Balok & Sloof berbasis penjumlahan segmen per grid (anti duplikasi pertemuan grid & anti keliling bangunan)
 * - Penggabungan lintas jenis gambar teknik (Denah Sloof/Balok/Kolom + Tabel Dimensi/Schedule & Detail Penulangan)
 * - Transparansi sumber halaman/jenis gambar dan badge status verifikasi (`Terbaca Jelas`, `Hasil Penggabungan`, `Perlu Verifikasi`, `Tidak Ditemukan`)
 */

import { CATALOG_WORK_ITEMS, USC_CATALOG_VERSION, USC_STANDARD_TEMPLATE } from '../data/uscCatalog';
import {
  AIAutoTakeoffSummary,
  AIBeamSloofSegment,
  AIDetectedRegion,
  AIExtractionItem,
  AIVerificationBadge,
  CatalogWorkItem,
  FloorItem,
  ParameterItem,
  ProjectData,
  ProjectWorkItem,
} from '../types';
import { recalculateAllProjectWorks, safeEvaluateMath } from './calculationEngine';
import { getCurrentSessionUser } from './authService';
import {
  auth,
  db,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  collection,
  OperationType,
  handleFirestoreError,
} from '../firebase';

export const DATA_ISOLATION_VERSION = '4.0.0-ISOLATED';

const LEGACY_STORAGE_KEY_PROJECTS = 'ruangrab_projects_v1';
const STORAGE_PREFIX_USER_PROJECTS = 'ruangrab_user_projects_v2_';
const STORAGE_PREFIX_ACTIVE_PROJECT = 'ruangrab_active_project_v2_';
const STORAGE_KEY_SIDEBAR_COLLAPSED = 'ruangrab_sidebar_collapsed_v1';
const STORAGE_PREFIX_DISABLED_CATALOG_IDS = 'ruangestimasi_disabled_catalog_v2_';
const STORAGE_PREFIX_CUSTOM_CATALOG_ITEMS = 'ruangestimasi_custom_catalog_v2_';

function resolveActiveUserId(explicitUserId?: string): string {
  if (explicitUserId && explicitUserId.trim() && explicitUserId !== 'default') {
    return explicitUserId.trim();
  }
  const sessionUser = getCurrentSessionUser();
  if (sessionUser?.uid) {
    return sessionUser.uid;
  }
  return 'anonymous';
}

/**
 * Daftar ID Katalog Pekerjaan Standar Global dari Referensi Gedung USC per Kelompok Lantai
 * Mencakup seluruh pekerjaan Persiapan, Struktural, Arsitektural, dan MEP dari katalog USC
 * (Hanya membawa nama, kategori, satuan, rumus, dan definisi parameter, TANPA nilai dimensi proyek USC)
 */
export const DEFAULT_UMUM_PONDASI_CATALOG_IDS: string[] = USC_STANDARD_TEMPLATE.filter(
  (item) => item.floorRule === 'umum' || item.floorRule === 'fondasi_saja'
).map((item) => item.id);

export const DEFAULT_LANTAI_1_CATALOG_IDS: string[] = USC_STANDARD_TEMPLATE.filter(
  (item) => item.floorRule === 'per_lantai'
).map((item) => item.id);

export const DEFAULT_LANTAI_ATAS_CATALOG_IDS: string[] = USC_STANDARD_TEMPLATE.filter(
  (item) => item.floorRule === 'per_lantai' || item.floorRule === 'atap_saja'
).map((item) => item.id);

/**
 * Ambil salinan bersih Template Standar Global USC (`USC_STANDARD_TEMPLATE`, Read-Only Deep Clone)
 * Memastikan perubahan pada proyek pengguna tidak pernah mengubah template standar global.
 */
export function getGlobalUscTemplate(): CatalogWorkItem[] {
  return USC_STANDARD_TEMPLATE.map((item) => ({
    ...item,
    parameters: item.parameters.map((p) => ({
      ...p,
      value: null,
      source: 'manual',
      sourceDocument: undefined,
      sourceInfo: undefined,
      verificationBadge: undefined,
      isVerified: false,
      conflict: null,
    })),
  }));
}

/**
 * Preferensi Sidebar Buka-Tutup (Desktop)
 */
export function loadSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_SIDEBAR_COLLAPSED) === 'true';
  } catch {
    return false;
  }
}

export function saveSidebarCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_SIDEBAR_COLLAPSED, collapsed ? 'true' : 'false');
  } catch {
    // ignore storage errors
  }
}

/**
 * Pengelolaan Katalog Bawaan yang Dinonaktifkan (Terisolasi per userId)
 */
export function loadDisabledCatalogIds(userId?: string): string[] {
  const uid = resolveActiveUserId(userId);
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX_DISABLED_CATALOG_IDS}${uid}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDisabledCatalogIds(ids: string[], userId?: string): void {
  const uid = resolveActiveUserId(userId);
  try {
    localStorage.setItem(`${STORAGE_PREFIX_DISABLED_CATALOG_IDS}${uid}`, JSON.stringify(ids));
  } catch (err) {
    console.error('Gagal menyimpan status katalog nonaktif:', err);
  }
}

/**
 * Pengelolaan Katalog Pekerjaan Kustom (Terisolasi per userId)
 */
export function loadCustomCatalogItems(userId?: string): CatalogWorkItem[] {
  const uid = resolveActiveUserId(userId);
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX_CUSTOM_CATALOG_ITEMS}${uid}`);
    if (!raw) return [];
    const parsed: CatalogWorkItem[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      ...item,
      isCustomCatalog: true,
      parameters: (item.parameters || []).map((p) => ({
        ...p,
        value: null,
      })),
      calculationMethod: (params: Record<string, number>) => {
        if (item.customFormula) {
          const res = safeEvaluateMath(item.customFormula, params);
          return isNaN(res) || !isFinite(res) ? null : res;
        }
        const keys = Object.keys(params);
        if (keys.length === 0) return null;
        return keys.reduce((acc, k) => acc * params[k], 1);
      },
    }));
  } catch {
    return [];
  }
}

export function saveCustomCatalogItems(items: CatalogWorkItem[], userId?: string): void {
  const uid = resolveActiveUserId(userId);
  try {
    const serializable = items.map(({ calculationMethod, ...rest }) => ({
      ...rest,
      parameters: (rest.parameters || []).map((p) => ({
        ...p,
        value: null,
      })),
      isCustomCatalog: true,
    }));
    localStorage.setItem(
      `${STORAGE_PREFIX_CUSTOM_CATALOG_ITEMS}${uid}`,
      JSON.stringify(serializable)
    );
  } catch (err) {
    console.error('Gagal menyimpan katalog kustom:', err);
  }
}

export function getAllCatalogItems(userId?: string): CatalogWorkItem[] {
  return [...getGlobalUscTemplate(), ...loadCustomCatalogItems(userId)];
}

/**
 * Buat pekerjaan proyek dari entri katalog untuk lantai tertentu
 * Seluruh parameter di-clone secara independen dengan nilai awal null agar modifikasi pada satu proyek
 * tidak pernah mengubah katalog global atau proyek lain.
 */
export function createProjectWorkFromCatalog(
  catalogId: string,
  floorId: string,
  initialParamValues: Record<string, number | null> = {},
  options?: {
    origin?: 'manual' | 'ai';
    aiVerificationStatus?: 'draft' | 'verified';
    verificationBadge?: AIVerificationBadge;
    sourceDocument?: string;
    sourceInfo?: string;
    identificationReason?: string;
    dedupKey?: string;
    elementLocation?: string;
    elementCode?: string;
    segments?: AIBeamSloofSegment[];
    userId?: string;
  }
): ProjectWorkItem | null {
  const allCatalog = getAllCatalogItems(options?.userId);
  const catalog = allCatalog.find((c) => c.id === catalogId);
  if (!catalog) return null;

  const params: ParameterItem[] = catalog.parameters.map((p) => {
    const hasInitial =
      initialParamValues !== undefined &&
      Object.prototype.hasOwnProperty.call(initialParamValues, p.id) &&
      initialParamValues[p.id] !== null &&
      initialParamValues[p.id] !== undefined;
    const val = hasInitial ? initialParamValues[p.id] : null; // Selalu bernilai null jika belum diisi
    return {
      ...p,
      value: val,
      source: hasInitial ? (options?.origin === 'ai' ? 'ai' : 'manual') : 'manual',
      sourceDocument: hasInitial ? options?.sourceDocument : undefined,
      sourceInfo: hasInitial ? options?.sourceInfo : undefined,
      verificationBadge:
        options?.origin === 'ai'
          ? hasInitial
            ? options?.verificationBadge || 'Terbaca Jelas'
            : p.required
            ? 'Tidak Ditemukan'
            : undefined
          : undefined,
      isVerified: hasInitial && options?.origin !== 'ai' ? true : false,
      conflict: null,
    };
  });

  const hasAnyFilledParam = params.some((p) => p.value !== null && p.value !== '');

  const item: ProjectWorkItem = {
    id: `work-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    catalogId: catalog.id,
    dedupKey: options?.dedupKey || `${floorId}::${catalog.id}`,
    name: catalog.name,
    category: catalog.category,
    subCategory: catalog.subCategory,
    floorId,
    elementLocation: options?.elementLocation,
    elementCode: options?.elementCode,
    segments: options?.segments ? options.segments.map((s) => ({ ...s })) : undefined,
    unit: catalog.defaultUnit,
    formulaDisplay: catalog.formulaDisplay,
    customFormula: catalog.customFormula,
    parameters: params,
    components: [],
    calculatedVolume: null,
    status: options?.origin === 'ai' ? 'Perlu Verifikasi' : 'Belum Diisi',
    origin: options?.origin || 'manual',
    aiVerificationStatus:
      options?.origin === 'ai'
        ? options?.aiVerificationStatus || 'draft'
        : hasAnyFilledParam
        ? options?.aiVerificationStatus || 'verified'
        : undefined,
    verificationBadge: options?.verificationBadge,
    sourceDocument: options?.sourceDocument,
    sourceInfo: options?.sourceInfo,
    identificationReason: options?.identificationReason,
    excelSheet: catalog.excelSheet,
    excelCell: catalog.excelCell,
    excelFormula: catalog.excelFormula,
    isActive: true,
    lastUpdated: new Date().toISOString(),
  };

  return item;
}

/**
 * Buat daftar pekerjaan konstruksi standar lengkap dari Katalog Gedung USC untuk lantai tertentu
 * Seluruh parameter bernilai null, volume bernilai null, dan status awal "Belum Diisi".
 */
export function createDefaultWorksForFloor(
  floorId: string,
  floorLevel: number,
  totalFloors: number = 2
): ProjectWorkItem[] {
  let catalogIds: string[];
  if (floorId === 'fl-umum' || floorLevel === 0) {
    catalogIds = DEFAULT_UMUM_PONDASI_CATALOG_IDS;
  } else if (floorLevel === 1 && totalFloors > 1) {
    catalogIds = DEFAULT_LANTAI_1_CATALOG_IDS;
  } else {
    catalogIds = DEFAULT_LANTAI_ATAS_CATALOG_IDS;
  }

  const works: ProjectWorkItem[] = [];
  for (const catId of catalogIds) {
    const work = createProjectWorkFromCatalog(catId, floorId, {}, {
      origin: 'manual',
      dedupKey: `${floorId}::${catId}`,
    });
    if (work) {
      works.push(work);
    }
  }
  return works;
}

/**
 * Pemetaan kode elemen struktur (S.1, S1, S2, B1, B2, K1, K2, P1, J1, dll) ke catalogId RuangEstimasi
 * Menjaga agar kode elemen seperti B1 dan B2 tidak pernah tercampur.
 */
export function mapElementCodeToCatalogId(
  elementCode?: string,
  suggestedName?: string
): string | null {
  const code = (elementCode || '').toUpperCase().replace(/\s+/g, '');
  const name = (suggestedName || '').toLowerCase();

  // Sloof
  if (code === 'S.1' || code === 'S1' || code === 'SL1' || name.includes('sloof s1') || name.includes('sloof s.1')) {
    return 'str-sloof-beton';
  }
  if (code === 'S.2' || code === 'S2' || code === 'SL2' || name.includes('sloof s2') || name.includes('sloof s.2')) {
    return 'str-sloof-s2';
  }
  if (code === 'S.3' || code === 'S3' || code === 'SL3' || name.includes('sloof s3') || name.includes('sloof s.3')) {
    return 'str-sloof-s3';
  }
  if (code.startsWith('S') && name.includes('sloof')) {
    return 'str-sloof-beton';
  }

  // Balok (Pastikan B1, B2, B3, RB terpisah tegas)
  if (code === 'B.1' || code === 'B1' || code === 'BI1' || name.includes('balok b1') || name.includes('balok b.1')) {
    return 'str-balok-b1-beton';
  }
  if (code === 'B.2' || code === 'B2' || code === 'BA1' || name.includes('balok b2') || name.includes('balok b.2')) {
    return 'str-balok-b2-beton';
  }
  if (code === 'B.3' || code === 'B3' || name.includes('balok b3') || name.includes('balok b.3')) {
    return 'str-balok-b3-beton';
  }
  if (code === 'RB' || code === 'RB1' || name.includes('ring balok')) {
    return 'str-ring-balok';
  }
  if (name.includes('balok bordes')) {
    return 'str-balok-bordes';
  }
  if (name.includes('balok induk')) {
    return 'str-balok-induk';
  }
  if (name.includes('balok anak')) {
    return 'str-balok-anak';
  }

  // Kolom (Pastikan K1, K2, K3, KP terpisah tegas)
  if (code === 'K.1' || code === 'K1' || name.includes('kolom k1') || name.includes('kolom k.1')) {
    return 'str-kolom-k1-beton';
  }
  if (code === 'K.2' || code === 'K2' || name.includes('kolom k2') || name.includes('kolom k.2')) {
    return 'str-kolom-k2-beton';
  }
  if (code === 'K.3' || code === 'K3' || name.includes('kolom k3') || name.includes('kolom k.3')) {
    return 'str-kolom-k3-beton';
  }
  if (code === 'KP' || name.includes('kolom praktis')) {
    return 'str-kolom-praktis';
  }

  return null;
}

/**
 * Bangun string informasi sumber yang transparan untuk pengguna
 * Contoh: "Halaman 4, Denah Balok Lantai 1 (Grid As A-B)"
 */
export function formatAISourceInfo(item: {
  pageNumber?: number;
  drawingType?: string;
  drawingTitle?: string;
  pageOrLocation?: string;
  sourceInfo?: string;
  sourceDocument?: string;
}): string {
  if (item.sourceInfo && item.sourceInfo.trim()) {
    return item.sourceInfo.trim();
  }
  const parts: string[] = [];
  if (item.pageNumber) {
    parts.push(`Halaman ${item.pageNumber}`);
  }
  if (item.drawingType) {
    parts.push(item.drawingType);
  }
  if (item.drawingTitle && item.drawingTitle !== item.drawingType) {
    parts.push(item.drawingTitle);
  }
  if (item.pageOrLocation && !parts.some((p) => p.includes(item.pageOrLocation!))) {
    parts.push(item.pageOrLocation);
  }
  if (parts.length === 0) {
    return item.sourceDocument || 'Gambar Teknik';
  }
  return parts.join(', ');
}

/**
 * Pemetaan cerdas item ekstraksi AI ke catalogId dan parameterId RuangEstimasi
 */
function resolveCatalogMapping(item: AIExtractionItem): {
  mappings: {
    catalogId: string;
    parameterId: string;
    reason: string;
    elementCode?: string;
    verificationBadge?: AIVerificationBadge;
  }[];
} {
  const mappings: {
    catalogId: string;
    parameterId: string;
    reason: string;
    elementCode?: string;
    verificationBadge?: AIVerificationBadge;
  }[] = [];
  const workLower = (item.suggestedWorkName || '').toLowerCase();
  const paramLower = (item.parameterName || '').toLowerCase();
  const explicitCatId = (item.catalogId || '').trim();
  const explicitParamId = (item.parameterId || '').trim();

  // Prioritaskan kecocokan kode elemen (K1, K2, B1, B2, S1, S2) agar dimensi B2 tidak pernah masuk ke B1
  const codeMappedCatId = mapElementCodeToCatalogId(item.elementCode, item.suggestedWorkName);
  const candidateCatId =
    codeMappedCatId ||
    (explicitCatId && CATALOG_WORK_ITEMS.some((c) => c.id === explicitCatId) ? explicitCatId : null);

  if (candidateCatId && CATALOG_WORK_ITEMS.some((c) => c.id === candidateCatId)) {
    const cat = CATALOG_WORK_ITEMS.find((c) => c.id === candidateCatId)!;
    let resolvedParamId = explicitParamId;

    if (!cat.parameters.some((p) => p.id === resolvedParamId)) {
      if (paramLower.includes('panjang') || paramLower.includes('keliling') || paramLower.includes('bentang')) {
        resolvedParamId =
          cat.parameters.find((p) => p.id.includes('panjang') || p.id.includes('keliling'))?.id ||
          cat.parameters[0]?.id;
      } else if (paramLower.includes('lebar') || paramLower === 'l' || paramLower.includes('lebar (l)')) {
        resolvedParamId =
          cat.parameters.find((p) => p.id.includes('lebar'))?.id || cat.parameters[0]?.id;
      } else if (paramLower.includes('tebal') || paramLower.includes('sisi')) {
        resolvedParamId =
          cat.parameters.find((p) => p.id.includes('tebal') || p.id.includes('lebar'))?.id ||
          cat.parameters[0]?.id;
      } else if (
        paramLower.includes('tinggi') ||
        paramLower.includes('kedalaman') ||
        paramLower === 't' ||
        paramLower.includes('tinggi (t)')
      ) {
        resolvedParamId =
          cat.parameters.find((p) => p.id.includes('tinggi') || p.id.includes('kedalaman'))?.id ||
          cat.parameters[0]?.id;
      } else if (paramLower.includes('luas')) {
        resolvedParamId =
          cat.parameters.find((p) => p.id.includes('luas'))?.id || cat.parameters[0]?.id;
      } else if (paramLower.includes('jumlah') || paramLower.includes('titik') || paramLower.includes('batang')) {
        resolvedParamId =
          cat.parameters.find((p) => p.id.includes('jumlah'))?.id || cat.parameters[0]?.id;
      }
    }

    if (resolvedParamId && cat.parameters.some((p) => p.id === resolvedParamId)) {
      const badge: AIVerificationBadge =
        item.verificationBadge ||
        (item.confidence !== undefined && item.confidence < 0.8
          ? 'Perlu Verifikasi'
          : 'Terbaca Jelas');

      mappings.push({
        catalogId: candidateCatId,
        parameterId: resolvedParamId,
        reason: item.notes || `Teridentifikasi dari ${formatAISourceInfo(item)}`,
        elementCode: item.elementCode,
        verificationBadge: badge,
      });
      if (
        candidateCatId === 'prep-pembersihan-lahan' &&
        (resolvedParamId === 'panjang' || resolvedParamId === 'lebar')
      ) {
        mappings.push({
          catalogId: 'prep-bouwplank',
          parameterId: resolvedParamId,
          reason: `Dimensi batas bangunan (${formatAISourceInfo(item)}) untuk pengukuran & bouwplank`,
          verificationBadge: badge,
        });
      }
      return { mappings };
    }
  }

  // Fallback Pencocokan Berbasis Nama Pekerjaan & Parameter
  if (
    workLower.includes('pembersihan lahan') ||
    workLower.includes('dimensi bangunan') ||
    workLower.includes('luas lahan') ||
    workLower.includes('total bangunan')
  ) {
    const pid = paramLower.includes('lebar') ? 'lebar' : 'panjang';
    mappings.push({
      catalogId: 'prep-pembersihan-lahan',
      parameterId: pid,
      reason: `Dimensi terluar bangunan dari ${formatAISourceInfo(item)}`,
      verificationBadge: item.verificationBadge || 'Terbaca Jelas',
    });
    mappings.push({
      catalogId: 'prep-bouwplank',
      parameterId: pid,
      reason: `Dimensi keliling bangunan dari ${formatAISourceInfo(item)}`,
      verificationBadge: item.verificationBadge || 'Terbaca Jelas',
    });
    return { mappings };
  }

  if (workLower.includes('bouwplank')) {
    const pid = paramLower.includes('lebar') ? 'lebar' : 'panjang';
    mappings.push({
      catalogId: 'prep-bouwplank',
      parameterId: pid,
      reason: `Dimensi batas pengukuran bangunan dari ${formatAISourceInfo(item)}`,
      verificationBadge: item.verificationBadge || 'Terbaca Jelas',
    });
    return { mappings };
  }

  if (workLower.includes('sloof')) {
    let pid = 'panjang_total';
    if (paramLower.includes('lebar') || paramLower.includes('(l)')) pid = 'lebar';
    else if (paramLower.includes('tinggi') || paramLower.includes('(t)')) pid = 'tinggi';
    const catId = mapElementCodeToCatalogId(item.elementCode, item.suggestedWorkName) || 'str-sloof-beton';
    mappings.push({
      catalogId: catId,
      parameterId: pid,
      reason: `Elemen sloof pada ${formatAISourceInfo(item)}`,
      elementCode: item.elementCode || 'S1',
      verificationBadge: item.verificationBadge || 'Terbaca Jelas',
    });
    return { mappings };
  }

  if (
    workLower.includes('dinding bata') ||
    workLower.includes('hebel') ||
    workLower.includes('pasangan dinding') ||
    (workLower.includes('dinding') && !workLower.includes('keramik') && !workLower.includes('cat'))
  ) {
    let pid = 'panjang_keliling';
    if (paramLower.includes('tinggi')) pid = 'tinggi_dinding';
    else if (paramLower.includes('bukaan')) pid = 'luas_bukaan';
    mappings.push({
      catalogId: 'ars-dinding-bata-hebel',
      parameterId: pid,
      reason: `Garis pasangan dinding pada ${formatAISourceInfo(item)}`,
      verificationBadge: item.verificationBadge || 'Terbaca Jelas',
    });
    return { mappings };
  }

  if (
    workLower.includes('homogenous') ||
    workLower.includes('granit') ||
    workLower.includes('ht 60') ||
    workLower.includes('penutup lantai utama')
  ) {
    if (paramLower.includes('luas') || item.convertedUnit === 'm²') {
      mappings.push({
        catalogId: 'ars-homogenous-tile-60x60',
        parameterId: 'luas_lantai',
        reason: `Akumulasi luas lantai ruang utama pada ${formatAISourceInfo(item)}`,
        verificationBadge: item.verificationBadge || 'Terbaca Jelas',
      });
    }
    return { mappings };
  }

  if (
    workLower.includes('keramik lantai toilet') ||
    workLower.includes('lantai km') ||
    workLower.includes('lantai toilet') ||
    workLower.includes('anti-slip')
  ) {
    if (paramLower.includes('luas') || item.convertedUnit === 'm²') {
      mappings.push({
        catalogId: 'ars-keramik-toilet-antislip',
        parameterId: 'luas_total_toilet',
        reason: `Luas area lantai KM/WC pada ${formatAISourceInfo(item)}`,
        verificationBadge: item.verificationBadge || 'Terbaca Jelas',
      });
    }
    return { mappings };
  }

  if (workLower.includes('kolom')) {
    let pid = 'jumlah';
    if (paramLower.includes('lebar')) pid = 'lebar';
    else if (paramLower.includes('tebal') || paramLower.includes('sisi')) pid = 'tebal';
    else if (paramLower.includes('tinggi')) pid = 'tinggi';
    const catId = mapElementCodeToCatalogId(item.elementCode, item.suggestedWorkName) || 'str-kolom-k1-beton';
    mappings.push({
      catalogId: catId,
      parameterId: pid,
      reason: `Elemen struktur kolom pada ${formatAISourceInfo(item)}`,
      elementCode: item.elementCode,
      verificationBadge: item.verificationBadge || 'Terbaca Jelas',
    });
    return { mappings };
  }

  if (workLower.includes('balok')) {
    let pid = 'panjang_total';
    if (paramLower.includes('lebar')) pid = 'lebar';
    else if (paramLower.includes('tinggi')) pid = 'tinggi';
    const catId = mapElementCodeToCatalogId(item.elementCode, item.suggestedWorkName) || 'str-balok-b1-beton';
    mappings.push({
      catalogId: catId,
      parameterId: pid,
      reason: `Bentang balok pada ${formatAISourceInfo(item)}`,
      elementCode: item.elementCode,
      verificationBadge: item.verificationBadge || 'Terbaca Jelas',
    });
    return { mappings };
  }

  return { mappings };
}

/**
 * Mesin Auto Quantity Takeoff:
 * Menghubungkan hasil pembacaan AI (termasuk multi-region 16 jenis gambar, penjumlahan segmen balok/sloof,
 * dan pencocokan tabel dimensi) ke daftar pekerjaan proyek & parameter kalkulator.
 */
export function applyAutoQuantityTakeoff(
  project: ProjectData,
  extractionItems: AIExtractionItem[],
  targetFloorId: string,
  sourceDocument: string,
  meta?: {
    documentSummary?: string;
    drawingType?: 'arsitektur_denah' | 'struktur_denah' | 'potongan_detail' | 'lainnya';
    detectedRegions?: AIDetectedRegion[];
    segments?: AIBeamSloofSegment[];
    identifiedFloor?: string;
    identifiedScale?: string;
    forceIncludeRejected?: boolean;
    fromCache?: boolean;
    documentHash?: string;
  }
): {
  updatedProject: ProjectData;
  summary: AIAutoTakeoffSummary;
  affectedWorkIds: string[];
} {
  const rejectedKeys = new Set(project.rejectedDraftKeys || []);
  const updatedWorks = project.works.map((w) => ({
    ...w,
    parameters: w.parameters.map((p) => ({ ...p })),
  }));

  let createdDraftWorksCount = 0;
  let updatedExistingWorksCount = 0;
  let conflictCount = 0;
  const affectedWorkIds = new Set<string>();

  interface PendingParamUpdate {
    parameterId: string;
    convertedValue: number;
    rawExtractedValue: number;
    rawUnit: AIExtractionItem['rawUnit'];
    pageOrLocation?: string;
    sourceInfo: string;
    drawingType?: AIExtractionItem['drawingType'];
    drawingTitle?: string;
    identifiedFloor?: string;
    gridLocation?: string;
    pageNumber?: number;
    elementCode?: string;
    verificationBadge: AIVerificationBadge;
    reason: string;
  }

  const catalogUpdates = new Map<string, PendingParamUpdate[]>();
  const catalogSegments = new Map<string, AIBeamSloofSegment[]>();
  const catalogElementCode = new Map<string, string>();

  // 1. Jika terdapat rincian segmen Balok / Sloof (AIBeamSloofSegment[]),
  // deduplikasi titik pertemuan grid, kelompokkan berdasarkan kode elemen (B1, B2, S1, S2), dan jumlahkan panjang segmennya!
  if (Array.isArray(meta?.segments) && meta!.segments.length > 0) {
    const groupedByCat = new Map<string, AIBeamSloofSegment[]>();
    const seenSegmentKeys = new Set<string>();

    for (const seg of meta!.segments) {
      if (!seg || seg.subtotalMeters <= 0) continue;
      const cleanCode = (seg.elementCode || (seg.elementCategory === 'balok' ? 'B1' : 'S1'))
        .toUpperCase()
        .trim();
      const dedupSegKey = `${cleanCode}::${(seg.gridLocation || '').toLowerCase().trim()}::${(
        seg.segmentName || ''
      )
        .toLowerCase()
        .trim()}::${seg.subtotalMeters}`;

      if (seenSegmentKeys.has(dedupSegKey)) {
        continue; // Hindari penghitungan ganda pada segmen/pertemuan grid yang identik
      }
      seenSegmentKeys.add(dedupSegKey);

      const catId =
        mapElementCodeToCatalogId(
          cleanCode,
          seg.elementCategory === 'sloof' ? `Sloof ${cleanCode}` : `Balok ${cleanCode}`
        ) || (seg.elementCategory === 'sloof' ? 'str-sloof-beton' : 'str-balok-b1-beton');

      const arr = groupedByCat.get(catId) || [];
      arr.push({
        ...seg,
        elementCode: cleanCode,
        sourceInfo:
          seg.sourceInfo ||
          formatAISourceInfo({
            pageNumber: seg.pageNumber,
            drawingType: seg.drawingType,
            drawingTitle: seg.drawingTitle,
            pageOrLocation: seg.gridLocation,
            sourceDocument,
          }),
      });
      groupedByCat.set(catId, arr);
      catalogElementCode.set(catId, cleanCode);
    }

    for (const [catId, segList] of groupedByCat.entries()) {
      const totalLengthMeters = Number(
        segList.reduce((acc, s) => acc + (s.subtotalMeters || s.lengthMeters || 0), 0).toFixed(2)
      );
      catalogSegments.set(catId, segList);

      const firstSeg = segList[0];
      const segSourceInfo = `Halaman ${firstSeg?.pageNumber || 1}, ${
        firstSeg?.drawingType || 'Denah struktur'
      } (Penjumlahan ${segList.length} Segmen Grid ${firstSeg?.elementCode || ''})`;

      const updates = catalogUpdates.get(catId) || [];
      updates.push({
        parameterId: 'panjang_total',
        convertedValue: totalLengthMeters,
        rawExtractedValue: totalLengthMeters,
        rawUnit: 'm',
        pageOrLocation: `Penjumlahan ${segList.length} jalur segmen (${segList
          .map((s) => `${s.segmentName || s.gridLocation}: ${s.subtotalMeters} m`)
          .slice(0, 4)
          .join(', ')})`,
        sourceInfo: segSourceInfo,
        drawingType: firstSeg?.drawingType || 'Denah sloof',
        drawingTitle: firstSeg?.drawingTitle,
        identifiedFloor: firstSeg?.identifiedFloor,
        gridLocation: segList.map((s) => s.gridLocation).slice(0, 4).join(', '),
        pageNumber: firstSeg?.pageNumber || 1,
        elementCode: firstSeg?.elementCode,
        verificationBadge: 'Hasil Penggabungan',
        reason: `Dihitung dari penjumlahan ${segList.length} segmen ${
          firstSeg?.elementCode || ''
        } berdasarkan bentang grid gambar`,
      });
      catalogUpdates.set(catId, updates);
    }
  }

  let detectedToiletArea = 0;
  let detectedMainRoomArea = 0;
  const roomDims = new Map<string, { p?: number; l?: number; isToilet?: boolean }>();

  for (const item of extractionItems) {
    if (item.status === 'rejected' || item.isRecommendationOnly) continue;

    const val = item.userCorrection !== undefined ? item.userCorrection : item.convertedValue;
    if (val === null || val === undefined || isNaN(val) || val <= 0) continue;

    // Pastikan kita tidak mencampur dimensi denah arsitektur ke elemen struktur tanpa kode elemen yang cocok
    const itemSourceInfo = formatAISourceInfo(item);
    const { mappings } = resolveCatalogMapping(item);

    for (const m of mappings) {
      const existingList = catalogUpdates.get(m.catalogId) || [];
      const alreadyHasSegmentSum =
        m.parameterId === 'panjang_total' && catalogSegments.has(m.catalogId);

      if (alreadyHasSegmentSum) {
        if (item.userCorrection !== undefined) {
          const idx = existingList.findIndex((u) => u.parameterId === 'panjang_total');
          if (idx >= 0) {
            existingList[idx].convertedValue = item.userCorrection;
          }
        }
        continue;
      }

      // Cegah pencampuran dimensi kode elemen yang berbeda (misal B2 ke B1)
      const existingCode = catalogElementCode.get(m.catalogId);
      const incomingCode = (m.elementCode || item.elementCode || '').toUpperCase().trim();
      if (existingCode && incomingCode && existingCode !== incomingCode) {
        continue;
      }

      const isFromScheduleOrCombined =
        (item.drawingType || '').toLowerCase().includes('tabel') ||
        (item.drawingType || '').toLowerCase().includes('schedule') ||
        (item.drawingType || '').toLowerCase().includes('detail') ||
        catalogSegments.has(m.catalogId);

      const badge: AIVerificationBadge =
        item.verificationBadge ||
        (isFromScheduleOrCombined
          ? 'Hasil Penggabungan'
          : m.verificationBadge || 'Terbaca Jelas');

      existingList.push({
        parameterId: m.parameterId,
        convertedValue: val,
        rawExtractedValue: item.rawExtractedValue,
        rawUnit: item.rawUnit,
        pageOrLocation: item.pageOrLocation,
        sourceInfo: itemSourceInfo,
        drawingType: item.drawingType,
        drawingTitle: item.drawingTitle,
        identifiedFloor: item.identifiedFloor,
        gridLocation: item.gridLocation,
        pageNumber: item.pageNumber,
        elementCode: m.elementCode || item.elementCode,
        verificationBadge: badge,
        reason: m.reason,
      });
      catalogUpdates.set(m.catalogId, existingList);
      if (incomingCode) {
        catalogElementCode.set(m.catalogId, incomingCode);
      }
    }

    // Cek apakah ini dimensi ruang individual pada Denah Arsitektur
    const isArchDrawing =
      !item.drawingType ||
      item.drawingType.toLowerCase().includes('arsitektur') ||
      meta?.drawingType === 'arsitektur_denah';

    if (isArchDrawing) {
      const locKey = (item.pageOrLocation || item.suggestedWorkName || '').toLowerCase();
      const pName = (item.parameterName || '').toLowerCase();
      if (locKey && (pName.includes('panjang') || pName.includes('lebar'))) {
        const entry = roomDims.get(locKey) || {
          isToilet: locKey.includes('km') || locKey.includes('wc') || locKey.includes('toilet'),
        };
        if (pName.includes('panjang')) entry.p = val;
        if (pName.includes('lebar')) entry.l = val;
        roomDims.set(locKey, entry);
      }
    }
  }

  for (const [, dim] of roomDims.entries()) {
    if (dim.p && dim.l) {
      const area = Number((dim.p * dim.l).toFixed(2));
      if (dim.isToilet) {
        detectedToiletArea += area;
      } else {
        detectedMainRoomArea += area;
      }
    }
  }

  // Hanya tambahkan pekerjaan arsitektur jika gambar memang memuat Denah Arsitektur
  const isPureStructuralDrawing =
    meta?.drawingType === 'struktur_denah' &&
    !(meta?.detectedRegions || []).some((r) =>
      r.drawingType.toLowerCase().includes('arsitektur')
    );

  if (!isPureStructuralDrawing) {
    if (!catalogUpdates.has('ars-keramik-toilet-antislip') && detectedToiletArea > 0) {
      catalogUpdates.set('ars-keramik-toilet-antislip', [
        {
          parameterId: 'luas_total_toilet',
          convertedValue: Number(detectedToiletArea.toFixed(2)),
          rawExtractedValue: Number(detectedToiletArea.toFixed(2)),
          rawUnit: 'm',
          pageOrLocation: 'Ruang KM/WC',
          sourceInfo: 'Halaman 1, Denah arsitektur (Akumulasi Luas Ruang KM/WC)',
          drawingType: 'Denah arsitektur',
          verificationBadge: 'Hasil Penggabungan',
          reason: 'Dihitung dari dimensi Panjang × Lebar ruang KM/WC pada denah arsitektur',
        },
      ]);
    }

    if (!catalogUpdates.has('ars-homogenous-tile-60x60') && detectedMainRoomArea > 0) {
      catalogUpdates.set('ars-homogenous-tile-60x60', [
        {
          parameterId: 'luas_lantai',
          convertedValue: Number(detectedMainRoomArea.toFixed(2)),
          rawExtractedValue: Number(detectedMainRoomArea.toFixed(2)),
          rawUnit: 'm',
          pageOrLocation: 'Ruang Utama Denah',
          sourceInfo: 'Halaman 1, Denah arsitektur (Akumulasi Luas Ruang Utama)',
          drawingType: 'Denah arsitektur',
          verificationBadge: 'Hasil Penggabungan',
          reason: 'Dihitung dari akumulasi luas ruang utama pada denah arsitektur',
        },
      ]);
    }

    if (
      !catalogUpdates.has('ars-dinding-bata-hebel') &&
      catalogUpdates.has('prep-pembersihan-lahan') &&
      (meta?.drawingType === 'arsitektur_denah' || !meta?.drawingType)
    ) {
      const lahanParams = catalogUpdates.get('prep-pembersihan-lahan') || [];
      const pVal = lahanParams.find((x) => x.parameterId === 'panjang')?.convertedValue;
      const lVal = lahanParams.find((x) => x.parameterId === 'lebar')?.convertedValue;
      if (pVal && lVal) {
        const kelilingDasar = Number((2 * (pVal + lVal)).toFixed(2));
        catalogUpdates.set('ars-dinding-bata-hebel', [
          {
            parameterId: 'panjang_keliling',
            convertedValue: kelilingDasar,
            rawExtractedValue: kelilingDasar,
            rawUnit: 'm',
            pageOrLocation: 'Keliling Dinding Denah',
            sourceInfo: 'Halaman 1, Denah arsitektur (Estimasi Keliling Dinding)',
            drawingType: 'Denah arsitektur',
            verificationBadge: 'Perlu Verifikasi',
            reason:
              'Estimasi keliling dinding dari garis denah lantai (tinggi dinding menunggu gambar potongan/input manual)',
          },
        ]);
      }
    }
  }

  // Terapkan setiap pembaruan katalog ke pekerjaan proyek (Prioritaskan pekerjaan standar USC yang sudah ada!)
  const allCatalog = getAllCatalogItems(project.ownerUid);
  for (const [catalogId, paramUpdates] of catalogUpdates.entries()) {
    const catEntry = allCatalog.find((c) => c.id === catalogId);
    const segsForCat = catalogSegments.get(catalogId);
    const elemCode = catalogElementCode.get(catalogId);

    // Tentukan lantai yang tepat berdasarkan aturan lantai katalog USC
    const effectiveFloorId =
      catEntry?.floorRule === 'umum' || catEntry?.floorRule === 'fondasi_saja'
        ? updatedWorks.some((w) => w.isActive && w.floorId === targetFloorId && w.catalogId === catalogId)
          ? targetFloorId
          : 'fl-umum'
        : targetFloorId;

    const dedupKey = `${effectiveFloorId}::${catalogId}`;

    if (rejectedKeys.has(dedupKey) && !meta?.forceIncludeRejected) {
      continue;
    }

    // 1. Cari pekerjaan standar USC yang sudah tersedia pada proyek
    let existingWork = updatedWorks.find(
      (w) =>
        w.isActive &&
        (w.dedupKey === dedupKey ||
          (w.floorId === effectiveFloorId && w.catalogId === catalogId) ||
          (w.floorId === targetFloorId && w.catalogId === catalogId))
    );

    if (
      !existingWork &&
      (catEntry?.floorRule === 'umum' || catEntry?.floorRule === 'fondasi_saja')
    ) {
      existingWork = updatedWorks.find(
        (w) => w.isActive && w.floorId === 'fl-umum' && w.catalogId === catalogId
      );
    }

    if (existingWork) {
      const hadManualFilledParams =
        existingWork.origin === 'manual' &&
        existingWork.parameters.some(
          (p) => p.value !== null && p.value !== '' && p.source === 'manual'
        );

      let workModified = false;
      if (segsForCat && segsForCat.length > 0) {
        existingWork.segments = segsForCat;
        workModified = true;
      }
      if (elemCode) {
        existingWork.elementCode = elemCode;
      }

      for (const upd of paramUpdates) {
        const param = existingWork.parameters.find((p) => p.id === upd.parameterId);
        if (!param) continue;

        const currentVal =
          param.value !== null && param.value !== '' && !isNaN(Number(param.value))
            ? Number(param.value)
            : null;

        if (currentVal === null) {
          param.value = upd.convertedValue;
          param.source = 'ai';
          param.sourceDocument = sourceDocument;
          param.pageOrLocation = upd.pageOrLocation;
          param.sourceInfo = upd.sourceInfo;
          param.drawingType = upd.drawingType;
          param.drawingTitle = upd.drawingTitle;
          param.identifiedFloor = upd.identifiedFloor;
          param.gridLocation = upd.gridLocation;
          param.elementCode = upd.elementCode;
          param.pageNumber = upd.pageNumber;
          param.rawExtractedValue = upd.rawExtractedValue;
          param.rawUnit = upd.rawUnit;
          param.verificationBadge = upd.verificationBadge;
          param.isVerified = false;
          param.conflict = null;
          workModified = true;
        } else if (Math.abs(currentVal - upd.convertedValue) < 0.001) {
          param.sourceDocument = param.sourceDocument || sourceDocument;
          param.pageOrLocation = param.pageOrLocation || upd.pageOrLocation;
          param.sourceInfo = param.sourceInfo || upd.sourceInfo;
          param.drawingType = param.drawingType || upd.drawingType;
          param.drawingTitle = param.drawingTitle || upd.drawingTitle;
          param.pageNumber = param.pageNumber || upd.pageNumber;
          param.rawExtractedValue = param.rawExtractedValue ?? upd.rawExtractedValue;
          param.rawUnit = param.rawUnit ?? upd.rawUnit;
          param.verificationBadge = param.verificationBadge || upd.verificationBadge;
        } else {
          const isSameUnverifiedDoc =
            existingWork.origin === 'ai' &&
            existingWork.aiVerificationStatus === 'draft' &&
            !param.isVerified &&
            param.sourceDocument === sourceDocument;

          if (isSameUnverifiedDoc) {
            param.value = upd.convertedValue;
            param.rawExtractedValue = upd.rawExtractedValue;
            param.rawUnit = upd.rawUnit;
            param.pageOrLocation = upd.pageOrLocation;
            param.sourceInfo = upd.sourceInfo;
            param.drawingType = upd.drawingType;
            param.drawingTitle = upd.drawingTitle;
            param.pageNumber = upd.pageNumber;
            param.verificationBadge = upd.verificationBadge;
            param.conflict = null;
            workModified = true;
          } else {
            param.conflict = {
              newValue: upd.convertedValue,
              rawExtractedValue: upd.rawExtractedValue,
              rawUnit: upd.rawUnit,
              sourceDocument,
              pageOrLocation: upd.pageOrLocation,
              sourceInfo: upd.sourceInfo,
            };
            param.verificationBadge = 'Perlu Verifikasi';
            conflictCount++;
            workModified = true;
          }
        }
      }

      // Tandai parameter wajib yang belum ditemukan pada gambar dengan badge 'Tidak Ditemukan'
      for (const p of existingWork.parameters) {
        if (p.required && (p.value === null || p.value === '')) {
          p.verificationBadge = 'Tidak Ditemukan';
        }
      }

      if (workModified) {
        const firstUpdate = paramUpdates[0];
        const hasCombined = existingWork.parameters.some(
          (p) => p.verificationBadge === 'Hasil Penggabungan'
        );
        const hasMissing = existingWork.parameters.some(
          (p) => p.required && (p.value === null || p.value === '')
        );

        if (!hadManualFilledParams) {
          existingWork.origin = 'ai';
          existingWork.aiVerificationStatus = 'draft'; // Jangan pernah menandai otomatis sebagai 'verified'
          existingWork.sourceDocument = sourceDocument;
          existingWork.sourceInfo = firstUpdate?.sourceInfo;
          existingWork.verificationBadge = hasMissing
            ? 'Perlu Verifikasi'
            : hasCombined
            ? 'Hasil Penggabungan'
            : firstUpdate?.verificationBadge || 'Terbaca Jelas';
          existingWork.identificationReason =
            firstUpdate?.reason || 'Teridentifikasi dari analisis gambar AI';
          existingWork.elementLocation =
            existingWork.elementLocation || firstUpdate?.pageOrLocation;
        }
        existingWork.dedupKey = existingWork.dedupKey || `${existingWork.floorId}::${catalogId}`;
        existingWork.lastUpdated = new Date().toISOString();
        updatedExistingWorksCount++;
        affectedWorkIds.add(existingWork.id);
      }
    } else {
      // Hanya tambahkan pekerjaan baru jika elemen memang ditemukan di gambar tetapi belum ada pada daftar pekerjaan proyek
      const initialValues: Record<string, number | null> = {};

      if (catalogId === 'ars-dinding-bata-hebel') {
        const hasHeightInUpdates = paramUpdates.some((u) => u.parameterId === 'tinggi_dinding');
        if (!hasHeightInUpdates) {
          initialValues['tinggi_dinding'] = null;
        }
      }

      for (const upd of paramUpdates) {
        initialValues[upd.parameterId] = upd.convertedValue;
      }

      const firstUpdate = paramUpdates[0];
      const newWork = createProjectWorkFromCatalog(catalogId, effectiveFloorId, initialValues, {
        origin: 'ai',
        aiVerificationStatus: 'draft',
        verificationBadge: firstUpdate?.verificationBadge || 'Terbaca Jelas',
        sourceDocument,
        sourceInfo: firstUpdate?.sourceInfo,
        identificationReason: firstUpdate?.reason || 'Teridentifikasi dari analisis gambar AI',
        dedupKey,
        elementLocation: firstUpdate?.pageOrLocation,
        elementCode: elemCode,
        segments: segsForCat,
        userId: project.ownerUid,
      });

      if (newWork) {
        for (const upd of paramUpdates) {
          const p = newWork.parameters.find((param) => param.id === upd.parameterId);
          if (p) {
            p.source = 'ai';
            p.sourceDocument = sourceDocument;
            p.pageOrLocation = upd.pageOrLocation;
            p.sourceInfo = upd.sourceInfo;
            p.drawingType = upd.drawingType;
            p.drawingTitle = upd.drawingTitle;
            p.identifiedFloor = upd.identifiedFloor;
            p.gridLocation = upd.gridLocation;
            p.elementCode = upd.elementCode;
            p.pageNumber = upd.pageNumber;
            p.rawExtractedValue = upd.rawExtractedValue;
            p.rawUnit = upd.rawUnit;
            p.verificationBadge = upd.verificationBadge;
            p.isVerified = false;
          }
        }
        for (const p of newWork.parameters) {
          if (p.required && (p.value === null || p.value === '')) {
            p.verificationBadge = 'Tidak Ditemukan';
          }
        }

        updatedWorks.push(newWork);
        createdDraftWorksCount++;
        affectedWorkIds.add(newWork.id);
      }
    }
  }

  const recalculated = recalculateAllProjectWorks(updatedWorks);

  const incompleteWorksCount = recalculated.filter(
    (w) =>
      w.isActive &&
      w.origin === 'ai' &&
      w.aiVerificationStatus === 'draft' &&
      w.calculatedVolume === null
  ).length;

  // Susun daftar Rekomendasi Pekerjaan Lanjutan sesuai jenis gambar yang diunggah
  const recommendations: AIAutoTakeoffSummary['recommendations'] = [];
  const hasSloof = recalculated.some(
    (w) =>
      w.isActive &&
      (w.floorId === targetFloorId || w.floorId === 'fl-umum') &&
      (w.catalogId === 'str-sloof-beton' ||
        w.catalogId === 'str-sloof-s2' ||
        w.catalogId === 'str-sloof-s3') &&
      w.parameters.some((p) => p.value !== null)
  );
  const hasWall = recalculated.some(
    (w) =>
      w.isActive &&
      w.floorId === targetFloorId &&
      w.catalogId === 'ars-dinding-bata-hebel' &&
      w.parameters.some((p) => p.value !== null)
  );
  const hasToilet = recalculated.some(
    (w) =>
      w.isActive &&
      w.floorId === targetFloorId &&
      w.catalogId === 'ars-keramik-toilet-antislip' &&
      w.parameters.some((p) => p.value !== null)
  );

  if (hasSloof) {
    if (
      !recalculated.some(
        (w) =>
          w.isActive &&
          (w.floorId === targetFloorId || w.floorId === 'fl-umum') &&
          w.catalogId === 'str-sloof-bekisting' &&
          w.parameters.some((p) => p.value !== null)
      )
    ) {
      recommendations.push({
        catalogId: 'str-sloof-bekisting',
        name: 'Sloof - Bekisting Samping',
        category: 'Struktural',
        reason:
          'Rekomendasi pekerjaan bekisting dua sisi samping sloof mengikuti panjang total dan tinggi penampang sloof yang terdeteksi.',
      });
    }
    if (
      !recalculated.some(
        (w) =>
          w.isActive &&
          (w.floorId === targetFloorId || w.floorId === 'fl-umum') &&
          w.catalogId === 'str-sloof-tulangan' &&
          w.parameters.some((p) => p.value !== null)
      )
    ) {
      recommendations.push({
        catalogId: 'str-sloof-tulangan',
        name: 'Sloof - Pembesian Tulangan Pokok',
        category: 'Struktural',
        reason:
          'Rekomendasi pekerjaan pembesian tulangan memanjang sloof sesuai tabel penulangan sloof.',
      });
    }
  }

  if (hasWall) {
    if (
      !recalculated.some(
        (w) =>
          w.isActive &&
          w.floorId === targetFloorId &&
          w.catalogId === 'ars-plesteran-acian-15mm' &&
          w.parameters.some((p) => p.value !== null)
      )
    ) {
      recommendations.push({
        catalogId: 'ars-plesteran-acian-15mm',
        name: 'Plesteran & Acian Dinding',
        category: 'Arsitektural',
        reason:
          'Rekomendasi lanjutan karena terdeteksi pasangan dinding bata ringan pada lantai ini (2 × luas dinding bersih).',
      });
    }
    if (
      !recalculated.some(
        (w) =>
          w.isActive &&
          w.floorId === targetFloorId &&
          w.catalogId === 'ars-pengecatan-dinding-interior' &&
          w.parameters.some((p) => p.value !== null)
      )
    ) {
      recommendations.push({
        catalogId: 'ars-pengecatan-dinding-interior',
        name: 'Pengecatan Dinding Interior',
        category: 'Arsitektural',
        reason: 'Rekomendasi pekerjaan finishing cat dinding setelah pekerjaan plesteran dan acian.',
      });
    }
  }

  if (
    hasToilet &&
    !recalculated.some(
      (w) =>
        w.isActive &&
        w.floorId === targetFloorId &&
        w.catalogId === 'ars-keramik-dinding-toilet' &&
        w.parameters.some((p) => p.value !== null)
    )
  ) {
    recommendations.push({
      catalogId: 'ars-keramik-dinding-toilet',
      name: 'Pemasangan Keramik Dinding Toilet / KM',
      category: 'Arsitektural',
      reason: 'Rekomendasi pelapis dinding area basah karena terdeteksi ruang KM/WC pada denah.',
    });
  }

  const summary: AIAutoTakeoffSummary = {
    documentSummary: meta?.documentSummary || `Analisis dokumen ${sourceDocument}`,
    drawingType: meta?.drawingType || 'arsitektur_denah',
    detectedRegions: meta?.detectedRegions,
    segments: meta?.segments,
    identifiedFloor: meta?.identifiedFloor || targetFloorId,
    identifiedScale: meta?.identifiedScale || '1:100',
    extractedCount: extractionItems.length,
    createdDraftWorksCount,
    updatedExistingWorksCount,
    incompleteWorksCount,
    conflictCount,
    fromCache: meta?.fromCache,
    recommendations,
  };

  // Simpan riwayat pembacaan AI di dalam proyek aktif (terikat userId & projectId)
  const nextHistory = [...(project.aiTakeoffHistory || [])];
  if (meta?.documentHash) {
    const existingHistIdx = nextHistory.findIndex((h) => h.documentHash === meta.documentHash);
    const record = {
      documentHash: meta.documentHash,
      fileName: sourceDocument,
      analyzedAt: new Date().toISOString(),
      targetFloorId,
      summary,
      extractions: extractionItems,
      detectedRegions: meta?.detectedRegions || [],
      segments: meta?.segments || [],
    };
    if (existingHistIdx >= 0) {
      nextHistory[existingHistIdx] = record;
    } else {
      nextHistory.unshift(record);
    }
  }

  const updatedProject: ProjectData = {
    ...project,
    works: recalculated,
    aiTakeoffHistory: nextHistory.slice(0, 10),
    isolationVersion: DATA_ISOLATION_VERSION,
    updatedAt: new Date().toISOString(),
  };

  return {
    updatedProject,
    summary,
    affectedWorkIds: Array.from(affectedWorkIds),
  };
}

/**
 * Proyek Default Bersih Menggunakan Struktur Katalog Gedung USC Lengkap (Tanpa Nilai Dimensi Demo USC)
 */
export function createDefaultUscProject(ownerUid?: string): ProjectData {
  return createNewProject('Proyek Baru', 2, '', ownerUid);
}

/**
 * Buat proyek baru lengkap dengan seluruh daftar pekerjaan standar dari Katalog Gedung USC per kelompok lantai
 * (Semua parameter kosong `null`, semua volume kosong `null`, status awal `Belum Diisi`, tidak ada data hasil AI sebelumnya)
 */
export function createNewProject(
  name: string = 'Proyek Baru',
  floorCount: number = 2,
  location: string = '',
  ownerUid?: string
): ProjectData {
  const safeFloorCount = Math.max(1, Math.floor(floorCount || 2));
  const floors: FloorItem[] = [
    {
      id: 'fl-umum',
      name: 'Umum & Pondasi',
      level: 0,
      elevation: '± 0.00 m',
      description: 'Pekerjaan persiapan, tanah, pondasi, kolom pedestal, dan sloof',
    },
  ];

  for (let i = 1; i <= safeFloorCount; i++) {
    floors.push({
      id: `fl-${i}`,
      name: `Lantai ${i}`,
      level: i,
      elevation: `+ ${(i - 1) * 4}.00 m`,
      description: `Elevasi lantai tingkat ${i}`,
    });
  }

  // Salin struktur pekerjaan standar dari Template Global USC untuk setiap lantai (seluruh parameter bernilai null)
  const defaultWorks: ProjectWorkItem[] = [];
  for (const floor of floors) {
    const floorWorks = createDefaultWorksForFloor(floor.id, floor.level, safeFloorCount);
    defaultWorks.push(...floorWorks);
  }

  return {
    id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ownerUid,
    name: name.trim() || 'Proyek Baru',
    location: location.trim(),
    description: `Kalkulator volume pekerjaan konstruksi (${safeFloorCount} lantai).`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    floorCount: safeFloorCount,
    floors,
    works: recalculateAllProjectWorks(defaultWorks),
    rejectedDraftKeys: [],
    catalogVersion: USC_CATALOG_VERSION,
    isolationVersion: DATA_ISOLATION_VERSION,
    aiTakeoffHistory: [],
  };
}

/**
 * Deteksi apakah suatu pekerjaan atau parameter mengandung nilai demo/seed lama yang bocor
 * (contoh: Panjang lahan 12,7 m; Lebar lahan 6 m; Volume pembersihan lahan 76,20 m²; Panjang bouwplank 37,40 m;
 * atau pembacaan AI lama dari seed yang bocor sebelum `DATA_ISOLATION_VERSION`).
 */
function isLeakedLegacyDemoWork(work: ProjectWorkItem, isPreIsolation: boolean): boolean {
  if (!isPreIsolation) return false;

  // Cek apakah berasal dari dokumen sampel demo yang bocor lintas akun sebelum isolasi v4
  if (
    work.sourceDocument &&
    (work.sourceDocument.includes('rencana 1-Model') ||
      work.sourceDocument.includes('Gedung USC'))
  ) {
    return true;
  }

  // Cek nilai spesifik 12.7 m & 6 m (76.20 m² / 37.40 m) yang dilaporkan bocor dari seed/demo lama
  const pVal = Number(work.parameters?.find((p) => p.id === 'panjang')?.value);
  const lVal = Number(work.parameters?.find((p) => p.id === 'lebar')?.value);
  if (Math.abs(pVal - 12.7) < 0.01 && Math.abs(lVal - 6) < 0.01) {
    return true;
  }

  const kelilingVal = Number(work.parameters?.find((p) => p.id === 'panjang_keliling')?.value);
  if (Math.abs(kelilingVal - 37.4) < 0.01) {
    return true;
  }

  if (
    work.calculatedVolume !== null &&
    (Math.abs(work.calculatedVolume - 76.2) < 0.01 ||
      Math.abs(work.calculatedVolume - 37.4) < 0.01)
  ) {
    return true;
  }

  // Jika pekerjaan berstatus origin === 'ai' dari state sebelum isolasi v4
  if (work.origin === 'ai') {
    return true;
  }

  return false;
}

/**
 * Migrasi & Pemulihan Non-Destruktif Proyek ke Template Standar USC Lengkap & Isolasi v4:
 * 1. Menolak proyek milik pengguna lain (`project.ownerUid && project.ownerUid !== userId`).
 * 2. Membersihkan nilai demonstrasi lama (`12.7`, `6`, `76.20`, `37.40`, `source === 'reference'`, atau hasil AI bocor sebelum v4) menjadi `null` dan status `Belum Diisi`.
 * 3. Mempertahankan proyek valid milik pengguna serta input manual pengguna.
 * 4. Memastikan seluruh pekerjaan standar Katalog USC tersedia pada setiap lantai proyek.
 */
export function migrateProjectToFullUscTemplate(
  project: ProjectData,
  userId?: string
): { project: ProjectData; wasMigrated: boolean; isForeignProject?: boolean } {
  // Jika proyek ini milik akun lain, tolak agar tidak pernah bocor ke akun yang sedang login!
  if (userId && project.ownerUid && project.ownerUid !== userId) {
    return {
      project,
      wasMigrated: false,
      isForeignProject: true,
    };
  }

  const isLegacyDemoProject =
    project.id === 'proj-gedung-usc' || project.name?.trim() === 'Gedung USC';
  const isPreIsolation = project.isolationVersion !== DATA_ISOLATION_VERSION;
  const needsTemplateUpgrade =
    project.catalogVersion !== USC_CATALOG_VERSION ||
    isPreIsolation ||
    !Array.isArray(project.works) ||
    project.works.length === 0 ||
    isLegacyDemoProject;

  const safeFloorCount = Math.max(1, project.floorCount || 2);
  let floors: FloorItem[] =
    Array.isArray(project.floors) && project.floors.length > 0
      ? project.floors.map((f) => ({ ...f }))
      : [];

  if (!floors.some((f) => f.id === 'fl-umum' || f.level === 0)) {
    floors = [
      {
        id: 'fl-umum',
        name: 'Umum & Pondasi',
        level: 0,
        elevation: '± 0.00 m',
        description: 'Pekerjaan persiapan, tanah, pondasi, kolom pedestal, dan sloof',
      },
      ...floors,
    ];
  }

  if (floors.filter((f) => f.id !== 'fl-umum' && f.level > 0).length === 0) {
    for (let i = 1; i <= safeFloorCount; i++) {
      floors.push({
        id: `fl-${i}`,
        name: `Lantai ${i}`,
        level: i,
        elevation: `+ ${(i - 1) * 4}.00 m`,
        description: `Elevasi lantai tingkat ${i}`,
      });
    }
  }

  const uscMap = new Map<string, CatalogWorkItem>(
    USC_STANDARD_TEMPLATE.map((item) => [item.id, item])
  );

  let cleanedAnyDemoValue = false;

  // Salin & bersihkan pekerjaan yang sudah ada tanpa menghapus pekerjaan kustom atau input manual valid pengguna
  const preservedWorks: ProjectWorkItem[] = (project.works || []).map((w) => {
    const catEntry = w.catalogId ? uscMap.get(w.catalogId) : undefined;
    const isLeakedWork = isLegacyDemoProject || isLeakedLegacyDemoWork(w, isPreIsolation);

    const cleanedParams: ParameterItem[] = (w.parameters || []).map((p) => {
      const isOldDemoParam =
        isLeakedWork ||
        p.source === 'reference' ||
        (isPreIsolation && p.source === 'ai');

      if (isOldDemoParam) {
        if (p.value !== null) cleanedAnyDemoValue = true;
        return {
          ...p,
          value: null,
          source: 'manual',
          sourceDocument: undefined,
          sourceInfo: undefined,
          drawingType: undefined,
          drawingTitle: undefined,
          pageNumber: undefined,
          rawExtractedValue: undefined,
          rawUnit: undefined,
          verificationBadge: undefined,
          isVerified: false,
          conflict: null,
        };
      }
      return { ...p };
    });

    const hasAnyValue = cleanedParams.some((p) => p.value !== null && p.value !== '');

    return {
      ...w,
      name: catEntry && !w.name ? catEntry.name : w.name,
      category: w.category || catEntry?.category || 'Struktural',
      subCategory: w.subCategory || catEntry?.subCategory,
      unit: w.unit || catEntry?.defaultUnit || 'm³',
      formulaDisplay: w.formulaDisplay || catEntry?.formulaDisplay || '',
      excelSheet: w.excelSheet || catEntry?.excelSheet,
      excelCell: w.excelCell || catEntry?.excelCell,
      excelFormula: w.excelFormula || catEntry?.excelFormula,
      segments: isLeakedWork ? undefined : w.segments,
      elementCode: isLeakedWork ? undefined : w.elementCode,
      elementLocation: isLeakedWork ? undefined : w.elementLocation,
      sourceDocument: isLeakedWork ? undefined : w.sourceDocument,
      sourceInfo: isLeakedWork ? undefined : w.sourceInfo,
      identificationReason: isLeakedWork ? undefined : w.identificationReason,
      verificationBadge: isLeakedWork ? undefined : w.verificationBadge,
      parameters: cleanedParams,
      calculatedVolume: hasAnyValue ? w.calculatedVolume : null,
      status: hasAnyValue ? w.status : 'Belum Diisi',
      origin: isLeakedWork ? 'manual' : w.origin || 'manual',
      aiVerificationStatus:
        !isLeakedWork && w.origin === 'ai'
          ? w.aiVerificationStatus || 'draft'
          : hasAnyValue
          ? w.aiVerificationStatus
          : undefined,
    };
  });

  if (!needsTemplateUpgrade && !cleanedAnyDemoValue) {
    return {
      project: {
        ...project,
        ownerUid: userId || project.ownerUid,
        isolationVersion: DATA_ISOLATION_VERSION,
        floors,
        works: recalculateAllProjectWorks(preservedWorks),
      },
      wasMigrated: false,
    };
  }

  // Pulihkan seluruh pekerjaan standar Katalog USC yang belum ada pada setiap lantai proyek
  const mergedWorks: ProjectWorkItem[] = [...preservedWorks];
  for (const floor of floors) {
    const existingCatIdsOnFloor = new Set(
      mergedWorks
        .filter((w) => w.floorId === floor.id && w.catalogId)
        .map((w) => w.catalogId!)
    );

    const standardFloorWorks = createDefaultWorksForFloor(
      floor.id,
      floor.level,
      floors.filter((f) => f.id !== 'fl-umum').length || safeFloorCount
    );

    for (const stdWork of standardFloorWorks) {
      if (stdWork.catalogId && !existingCatIdsOnFloor.has(stdWork.catalogId)) {
        mergedWorks.push(stdWork);
        existingCatIdsOnFloor.add(stdWork.catalogId);
      }
    }
  }

  const finalProject: ProjectData = {
    ...project,
    id: isLegacyDemoProject ? `proj-${Date.now()}-usc` : project.id,
    ownerUid: userId || project.ownerUid,
    name: isLegacyDemoProject ? 'Proyek Baru' : project.name,
    floors,
    floorCount: floors.filter((f) => f.id !== 'fl-umum').length || safeFloorCount,
    works: recalculateAllProjectWorks(mergedWorks),
    catalogVersion: USC_CATALOG_VERSION,
    isolationVersion: DATA_ISOLATION_VERSION,
    aiTakeoffHistory: isPreIsolation ? [] : project.aiTakeoffHistory || [],
    updatedAt: new Date().toISOString(),
  };

  return {
    project: finalProject,
    wasMigrated: true,
  };
}

/**
 * Sinkronisasi proyek milik pengguna ke Server Backend (`/api/projects`) dengan validasi kepemilikan `userId`
 */
export async function syncProjectsToServer(
  userId: string,
  projects: ProjectData[]
): Promise<void> {
  if (!userId || userId === 'default' || userId === 'anonymous') return;
  try {
    await fetch('/api/projects/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        userId,
        projects: projects.map((p) => ({
          ...p,
          ownerUid: userId,
          isolationVersion: DATA_ISOLATION_VERSION,
        })),
      }),
    });
  } catch (err) {
    console.warn('[RuangEstimasi Storage] Sinkronisasi server tertunda:', err);
  }
}

export async function fetchProjectsFromServer(userId: string): Promise<ProjectData[] | null> {
  if (!userId || userId === 'default' || userId === 'anonymous') return null;
  try {
    const resp = await fetch(`/api/projects?userId=${encodeURIComponent(userId)}`, {
      method: 'GET',
      headers: {
        'x-user-id': userId,
      },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!data.success || !Array.isArray(data.projects)) return null;

    const migrated: ProjectData[] = [];
    let anyMigrated = false;
    for (const rawProj of data.projects) {
      const { project: mp, wasMigrated, isForeignProject } = migrateProjectToFullUscTemplate(
        rawProj,
        userId
      );
      if (isForeignProject) continue;
      if (wasMigrated) anyMigrated = true;
      migrated.push(mp);
    }

    if (anyMigrated && migrated.length > 0) {
      syncProjectsToServer(userId, migrated).catch(() => {});
    }
    return migrated;
  } catch {
    return null;
  }
}

export async function deleteProjectFromServer(
  userId: string,
  projectId: string
): Promise<boolean> {
  if (!userId || userId === 'default' || userId === 'anonymous') return false;
  try {
    const resp = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });
    return resp.ok;
  } catch {
    return false;
  }
}

/**
 * Sinkronisasi proyek milik pengguna ke Cloud Firestore jika pengguna login melalui Firebase Auth
 */
export async function syncProjectsToFirestore(userId: string, projects: ProjectData[]): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return;
  for (const proj of projects) {
    if (proj.ownerUid && proj.ownerUid !== userId) continue;
    const path = `users/${userId}/projects/${proj.id}`;
    try {
      await setDoc(
        doc(db, 'users', userId, 'projects', proj.id),
        {
          id: proj.id,
          ownerUid: userId,
          name: proj.name,
          location: proj.location || '',
          description: proj.description || '',
          floorCount: proj.floorCount,
          floors: proj.floors,
          works: JSON.parse(JSON.stringify(proj.works || [])),
          rejectedDraftKeys: proj.rejectedDraftKeys || [],
          catalogVersion: proj.catalogVersion || USC_CATALOG_VERSION,
          isolationVersion: DATA_ISOLATION_VERSION,
          aiTakeoffHistory: JSON.parse(JSON.stringify(proj.aiTakeoffHistory || [])),
          createdAt: proj.createdAt,
          updatedAt: proj.updatedAt,
        },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}

export async function deleteProjectFromFirestore(userId: string, projectId: string): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return;
  const path = `users/${userId}/projects/${projectId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'projects', projectId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function fetchProjectsFromFirestore(userId: string): Promise<ProjectData[] | null> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return null;
  const path = `users/${userId}/projects`;
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'projects'));
    if (snap.empty) return [];
    const loaded: ProjectData[] = [];
    let anyMigrated = false;
    snap.forEach((docSnap) => {
      const data = docSnap.data() as ProjectData;
      const { project: migratedProj, wasMigrated, isForeignProject } =
        migrateProjectToFullUscTemplate(data, userId);
      if (isForeignProject) return;
      if (wasMigrated) anyMigrated = true;
      loaded.push(migratedProj);
    });
    if (anyMigrated && loaded.length > 0) {
      syncProjectsToFirestore(userId, loaded).catch(() => {});
    }
    return loaded;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return null;
  }
}

/**
 * Muat semua proyek milik pengguna tertentu dari penyimpanan terisolasi.
 * - Menghapus key global legacy `ruangrab_projects_v1` agar tidak pernah bocor lintas akun.
 * - Membersihkan data demo lama (12,7 m; 6 m; 76,20 m²; 37,40 m) tanpa menghapus proyek valid pengguna.
 */
export function loadAllProjects(userId: string = 'default'): ProjectData[] {
  const cleanUid = resolveActiveUserId(userId);
  const userKey = `${STORAGE_PREFIX_USER_PROJECTS}${cleanUid}`;

  try {
    // Hapus key global legacy yang tidak memiliki pemisahan userId agar tidak pernah menyalin data antar akun!
    try {
      if (localStorage.getItem(LEGACY_STORAGE_KEY_PROJECTS)) {
        localStorage.removeItem(LEGACY_STORAGE_KEY_PROJECTS);
      }
    } catch {
      // ignore
    }

    const rawUser = localStorage.getItem(userKey);
    if (rawUser) {
      const parsed: ProjectData[] = JSON.parse(rawUser);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let anyMigrated = false;
        const migratedList: ProjectData[] = [];

        for (const p of parsed) {
          const { project: migratedProj, wasMigrated, isForeignProject } =
            migrateProjectToFullUscTemplate(p, cleanUid);
          if (isForeignProject) {
            anyMigrated = true;
            continue;
          }
          if (wasMigrated) anyMigrated = true;
          migratedList.push(migratedProj);
        }

        if (migratedList.length > 0) {
          if (anyMigrated) {
            saveAllProjects(migratedList, cleanUid);
          }
          return migratedList;
        }
      }
    }

    // Buat proyek baru khusus untuk pengguna ini dengan daftar pekerjaan standar USC lengkap & seluruh parameter kosong (null)
    const freshProject = createNewProject('Proyek Baru', 2, '', cleanUid);
    saveAllProjects([freshProject], cleanUid);
    setActiveProjectId(freshProject.id, cleanUid);
    return [freshProject];
  } catch (err) {
    console.error('Gagal memuat proyek pengguna, membuat proyek baru:', err);
    const freshProject = createNewProject('Proyek Baru', 2, '', cleanUid);
    return [freshProject];
  }
}

/**
 * Simpan seluruh daftar proyek pengguna ke LocalStorage terisolasi, Server Backend, dan Cloud Firestore
 */
export function saveAllProjects(projects: ProjectData[], userId: string = 'default'): boolean {
  const cleanUid = resolveActiveUserId(userId);
  const userKey = `${STORAGE_PREFIX_USER_PROJECTS}${cleanUid}`;
  try {
    const ownedProjects = projects
      .filter((p) => !p.ownerUid || p.ownerUid === cleanUid)
      .map((p) => ({
        ...p,
        ownerUid: cleanUid,
        isolationVersion: DATA_ISOLATION_VERSION,
      }));

    localStorage.setItem(userKey, JSON.stringify(ownedProjects));

    // Sinkronkan ke Server Backend (/api/projects/sync)
    syncProjectsToServer(cleanUid, ownedProjects).catch(() => {});

    // Sinkronkan ke Cloud Firestore jika pengguna terautentikasi di Firebase
    if (auth.currentUser && auth.currentUser.uid === cleanUid) {
      syncProjectsToFirestore(cleanUid, ownedProjects).catch((e) =>
        console.warn('Sinkronisasi Firestore tertunda:', e)
      );
    }
    return true;
  } catch (err) {
    console.error('Gagal menyimpan proyek ke LocalStorage:', err);
    return false;
  }
}

/**
 * Dapatkan ID proyek aktif untuk pengguna
 */
export function getActiveProjectId(userId: string = 'default'): string {
  const cleanUid = resolveActiveUserId(userId);
  try {
    return localStorage.getItem(`${STORAGE_PREFIX_ACTIVE_PROJECT}${cleanUid}`) || '';
  } catch {
    return '';
  }
}

/**
 * Set ID proyek aktif untuk pengguna
 */
export function setActiveProjectId(id: string, userId: string = 'default'): void {
  const cleanUid = resolveActiveUserId(userId);
  try {
    localStorage.setItem(`${STORAGE_PREFIX_ACTIVE_PROJECT}${cleanUid}`, id);
  } catch (err) {
    console.error('Gagal menyimpan ID proyek aktif:', err);
  }
}
