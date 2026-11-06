/**
 * RuangEstimasi - Mesin Perhitungan Volume Deterministik
 *
 * Sesuai persyaratan:
 * - Tidak menggunakan `eval()`
 * - Deterministik & bebas dari halusinasi AI
 * - Mendeteksi pembagian nol dan parameter kosong
 * - Mendukung multi-komponen (sub-elemen seperti B1, B2, B3)
 * - Menangani dependensi antar parameter dan antar pekerjaan
 * - Menghasilkan status kalkulasi yang transparan:
 *   * Belum Diisi
 *   * Tidak Lengkap
 *   * Perlu Verifikasi
 *   * Terverifikasi
 */

import { CATALOG_WORK_ITEMS } from '../data/uscCatalog';
import { CalculationStatus, ProjectWorkItem } from '../types';

/**
 * Evaluasi ekspresi matematika sederhana secara aman tanpa eval()
 * Mendukung +, -, *, /, ^, kurung, dan variabel
 */
export function safeEvaluateMath(
  expression: string,
  variables: Record<string, number> = {}
): number {
  let sanitized = expression.trim();

  sanitized = sanitized.replace(/PI\(\)/gi, String(Math.PI)).replace(/PI/gi, String(Math.PI));

  const sortedKeys = Object.keys(variables).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    const val = variables[key];
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    sanitized = sanitized.replace(regex, String(val ?? 0));
  }

  const tokens: string[] = [];
  let i = 0;
  while (i < sanitized.length) {
    const ch = sanitized[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let numStr = '';
      while (i < sanitized.length && /[0-9.]/.test(sanitized[i])) {
        numStr += sanitized[i];
        i++;
      }
      tokens.push(numStr);
      continue;
    }
    if ('+-*/^()'.includes(ch)) {
      if (
        ch === '-' &&
        (tokens.length === 0 || '+-*/^('.includes(tokens[tokens.length - 1]))
      ) {
        let numStr = '-';
        i++;
        while (i < sanitized.length && /[0-9.]/.test(sanitized[i])) {
          numStr += sanitized[i];
          i++;
        }
        if (numStr === '-') {
          tokens.push('-1');
          tokens.push('*');
        } else {
          tokens.push(numStr);
        }
        continue;
      }
      tokens.push(ch);
      i++;
      continue;
    }
    i++;
  }

  const precedence: Record<string, number> = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
    '^': 3,
  };

  const outputQueue: string[] = [];
  const operatorStack: string[] = [];

  for (const token of tokens) {
    if (!isNaN(Number(token))) {
      outputQueue.push(token);
    } else if (token in precedence) {
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1] !== '(' &&
        precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]
      ) {
        outputQueue.push(operatorStack.pop()!);
      }
      operatorStack.push(token);
    } else if (token === '(') {
      operatorStack.push(token);
    } else if (token === ')') {
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1] !== '('
      ) {
        outputQueue.push(operatorStack.pop()!);
      }
      operatorStack.pop();
    }
  }

  while (operatorStack.length > 0) {
    outputQueue.push(operatorStack.pop()!);
  }

  const evalStack: number[] = [];
  for (const token of outputQueue) {
    if (!isNaN(Number(token))) {
      evalStack.push(Number(token));
    } else {
      const b = evalStack.pop();
      const a = evalStack.pop();
      if (a === undefined || b === undefined) return NaN;

      switch (token) {
        case '+':
          evalStack.push(a + b);
          break;
        case '-':
          evalStack.push(a - b);
          break;
        case '*':
          evalStack.push(a * b);
          break;
        case '/':
          if (b === 0) return NaN;
          evalStack.push(a / b);
          break;
        case '^':
          evalStack.push(Math.pow(a, b));
          break;
        default:
          return NaN;
      }
    }
  }

  const finalResult = evalStack.pop();
  return finalResult !== undefined && !isNaN(finalResult) ? finalResult : NaN;
}

/**
 * Hitung volume untuk satu item pekerjaan
 * Pekerjaan yang belum memiliki parameter lengkap tidak boleh menghasilkan volume final (volume = null).
 */
export function calculateWorkItemVolume(
  item: ProjectWorkItem,
  allProjectWorks: ProjectWorkItem[] = []
): { volume: number | null; status: CalculationStatus; message?: string } {
  if (!item.isActive) {
    return {
      volume: null,
      status: 'Tidak Digunakan',
      message: 'Pekerjaan dinonaktifkan oleh pengguna',
    };
  }

  // Cek apakah ada komponen sub-elemen
  if (item.components && item.components.length > 0) {
    let totalCompVolume = 0;
    let hasValidComp = false;

    for (const comp of item.components) {
      const p = comp.parameters;
      const panjang = Number(p['panjang']) || 0;
      const lebar = Number(p['lebar']) || 0;
      const tinggi = Number(p['tinggi']) || 0;
      const jumlah = Number(p['jumlah'] ?? 1) || 1;

      if (panjang > 0 && lebar > 0 && tinggi > 0) {
        const compVol = panjang * lebar * tinggi * jumlah;
        comp.computedVolume = compVol;
        totalCompVolume += compVol;
        hasValidComp = true;
      }
    }

    if (hasValidComp) {
      return { volume: totalCompVolume, status: 'Terverifikasi' };
    }
  }

  const catalogEntry = CATALOG_WORK_ITEMS.find((c) => c.id === item.catalogId);
  const isAiDraft = item.origin === 'ai' && item.aiVerificationStatus === 'draft';
  const hasConflict = item.parameters.some((p) => Boolean(p.conflict));

  const paramMap: Record<string, number> = {};
  const missingParams: string[] = [];
  let filledRequiredCount = 0;

  for (const p of item.parameters) {
    if (p.value !== null && p.value !== '' && !isNaN(Number(p.value))) {
      const numVal = Number(p.value);
      paramMap[p.id] = numVal;
      if (p.required && numVal > 0) {
        filledRequiredCount++;
      }
    } else if (p.required) {
      // Cek nilai turunan dari pekerjaan lain pada proyek yang sama
      if (p.id === 'volume_galian') {
        const galianWork = allProjectWorks.find(
          (w) =>
            w.isActive &&
            w.aiVerificationStatus !== 'draft' &&
            (w.catalogId?.includes('galian') || w.name.toLowerCase().includes('galian')) &&
            w.calculatedVolume !== null &&
            w.calculatedVolume > 0
        );
        if (galianWork && galianWork.calculatedVolume !== null) {
          paramMap[p.id] = galianWork.calculatedVolume;
          p.value = galianWork.calculatedVolume;
          p.source = 'derived';
          filledRequiredCount++;
          continue;
        }
      }

      if (p.id === 'luas_dinding_bersih') {
        const dindingWork = allProjectWorks.find(
          (w) =>
            w.isActive &&
            w.floorId === item.floorId &&
            w.aiVerificationStatus !== 'draft' &&
            (w.catalogId === 'ars-dinding-bata-hebel' || w.name.toLowerCase().includes('dinding bata')) &&
            w.calculatedVolume !== null &&
            w.calculatedVolume > 0
        );
        if (dindingWork && dindingWork.calculatedVolume !== null) {
          paramMap[p.id] = dindingWork.calculatedVolume;
          p.value = dindingWork.calculatedVolume;
          p.source = 'derived';
          filledRequiredCount++;
          continue;
        }
      }

      missingParams.push(p.label || p.name);
    }
  }

  if (missingParams.length > 0) {
    const missingList = missingParams.join(', ');
    if (filledRequiredCount === 0 && !isAiDraft) {
      return {
        volume: null,
        status: 'Belum Diisi',
        message: `Parameter belum diisi (${missingList}).`,
      };
    }

    return {
      volume: null,
      status: 'Tidak Lengkap',
      message: isAiDraft
        ? `Parameter "${missingList}" belum ditemukan pada gambar ini. Lengkapi secara manual atau unggah gambar potongan/detail.`
        : `Parameter "${missingList}" belum diisi.`,
    };
  }

  const finalizeStatus = (
    rawVol: number
  ): { volume: number; status: CalculationStatus; message?: string } => {
    const vol = Number(rawVol.toFixed(4));
    if (isAiDraft) {
      return {
        volume: vol,
        status: 'Perlu Verifikasi',
        message: hasConflict
          ? 'Terdapat perbedaan dimensi antar gambar (periksa konflik parameter sebelum menyetujui).'
          : 'Hasil pembacaan AI: periksa parameter lalu klik Setujui untuk masuk ke rekap volume terverifikasi.',
      };
    }

    if (hasConflict) {
      return {
        volume: vol,
        status: 'Perlu Verifikasi',
        message: 'Terdapat perbedaan dimensi dari gambar baru (tinjau parameter).',
      };
    }

    return {
      volume: vol,
      status: 'Terverifikasi',
      message: 'Parameter lengkap dan terverifikasi.',
    };
  };

  if (item.customFormula) {
    const customResult = safeEvaluateMath(item.customFormula, paramMap);
    if (isNaN(customResult) || !isFinite(customResult) || customResult <= 0) {
      return {
        volume: null,
        status: 'Tidak Lengkap',
        message: 'Masukkan nilai parameter positif untuk menghitung rumus.',
      };
    }
    return finalizeStatus(customResult);
  }

  if (catalogEntry) {
    try {
      const result = catalogEntry.calculationMethod(paramMap, item.components);
      if (result === null || isNaN(result) || result <= 0) {
        return {
          volume: null,
          status: filledRequiredCount > 0 ? 'Tidak Lengkap' : 'Belum Diisi',
          message: 'Parameter wajib belum lengkap.',
        };
      }

      if (!isFinite(result)) {
        return {
          volume: null,
          status: 'Kesalahan Perhitungan',
          message: 'Terjadi pembagian dengan nol atau nilai tak terhingga.',
        };
      }

      return finalizeStatus(result);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        volume: null,
        status: 'Kesalahan Perhitungan',
        message: errorMsg || 'Gagal menghitung rumus.',
      };
    }
  }

  const keys = Object.keys(paramMap);
  if (keys.length > 0) {
    const product = keys.reduce((acc, k) => acc * paramMap[k], 1);
    if (product > 0) {
      return finalizeStatus(product);
    }
  }

  return {
    volume: null,
    status: filledRequiredCount > 0 ? 'Tidak Lengkap' : 'Belum Diisi',
    message: 'Isi parameter perhitungan.',
  };
}

/**
 * Hitung ulang seluruh daftar pekerjaan dalam proyek dengan penanganan dependensi
 */
export function recalculateAllProjectWorks(works: ProjectWorkItem[]): ProjectWorkItem[] {
  let updatedWorks = [...works];

  for (let pass = 0; pass < 2; pass++) {
    updatedWorks = updatedWorks.map((work) => {
      const { volume, status, message } = calculateWorkItemVolume(work, updatedWorks);
      return {
        ...work,
        calculatedVolume: volume,
        status,
        statusMessage: message,
      };
    });
  }

  return updatedWorks;
}

/**
 * Format angka ke standar Indonesia (titik untuk ribuan, koma untuk desimal)
 */
export function formatIndonesianNumber(
  val: number | null | undefined,
  decimals: number = 2
): string {
  if (val === null || val === undefined || isNaN(val)) return '-';
  const parts = val.toFixed(decimals).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return decimals > 0 && parts[1] ? `${intPart},${parts[1]}` : intPart;
}

export interface CategoryVolumeSummary {
  category: string;
  count: number;
  completedCount: number;
  totalVolumeM3: number;
  totalAreaM2: number;
  totalLengthM: number;
  totalUnits: number;
}

export function computeProjectSummaries(works: ProjectWorkItem[]) {
  const activeWorks = works.filter((w) => w.isActive);

  let totalBetonM3 = 0;
  let totalLuasM2 = 0;
  let totalPanjangM = 0;
  let totalItemsCompleted = 0;
  let totalItemsPending = 0;

  let unfilledWorksCount = 0;
  let incompleteWorksCount = 0;
  let draftWorksCount = 0;
  let readyDraftWorksCount = 0;
  let incompleteDraftWorksCount = 0;
  let draftBetonM3 = 0;
  let draftLuasM2 = 0;
  let draftPanjangM = 0;
  let conflictWorksCount = 0;

  for (const w of activeWorks) {
    const isAiDraft = w.origin === 'ai' && w.aiVerificationStatus === 'draft';
    const hasConflict = w.parameters.some((p) => Boolean(p.conflict));
    if (hasConflict) {
      conflictWorksCount++;
    }

    const vol = w.calculatedVolume;
    const u = w.unit.toLowerCase().trim();

    if (w.status === 'Belum Diisi' || w.status === 'Perlu Input') {
      unfilledWorksCount++;
    } else if (w.status === 'Tidak Lengkap' || w.status === 'Belum Lengkap') {
      incompleteWorksCount++;
    }

    if (isAiDraft) {
      draftWorksCount++;
      totalItemsPending++;
      if (vol !== null && !isNaN(vol) && vol > 0) {
        readyDraftWorksCount++;
        if (u === 'm3' || u === 'm³') {
          draftBetonM3 += vol;
        } else if (u === 'm2' || u === 'm²') {
          draftLuasM2 += vol;
        } else if (u === 'm' || u === "m'" || u === 'm1') {
          draftPanjangM += vol;
        }
      } else {
        incompleteDraftWorksCount++;
      }
      continue;
    }

    const isVerifiedComplete =
      (w.status === 'Terverifikasi' || w.status === 'Lengkap') &&
      vol !== null &&
      !isNaN(vol) &&
      vol > 0;

    if (isVerifiedComplete) {
      totalItemsCompleted++;
      if (u === 'm3' || u === 'm³') {
        totalBetonM3 += vol;
      } else if (u === 'm2' || u === 'm²') {
        totalLuasM2 += vol;
      } else if (u === 'm' || u === "m'" || u === 'm1') {
        totalPanjangM += vol;
      }
    } else {
      totalItemsPending++;
    }
  }

  return {
    totalWorks: activeWorks.length,
    completedWorks: totalItemsCompleted,
    pendingWorks: totalItemsPending,
    unfilledWorksCount,
    incompleteWorksCount,
    totalBetonM3,
    totalLuasM2,
    totalPanjangM,
    draftWorksCount,
    readyDraftWorksCount,
    incompleteDraftWorksCount,
    draftBetonM3,
    draftLuasM2,
    draftPanjangM,
    conflictWorksCount,
  };
}


