import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  ScanLine,
  Check,
  AlertCircle,
  Loader2,
  RotateCcw,
  CheckCircle2,
  Ruler,
  Plus,
  Pencil,
  FileCheck2,
  Table2,
  FileText,
  Trash2,
  Database,
  Layers,
} from 'lucide-react';
import {
  AIAutoTakeoffSummary,
  AIBeamSloofSegment,
  AIDetectedRegion,
  AIExtractionErrorType,
  AIExtractionItem,
  AIVerificationBadge,
  CANONICAL_DRAWING_TYPES,
  DrawingScale,
  DrawingUnit,
  EngineeringDrawingType,
  FloorItem,
  ProjectWorkItem,
} from '../types';
import { formatIndonesianNumber } from '../services/calculationEngine';
import { formatAISourceInfo } from '../services/projectStorage';

interface AIAssistantModalProps {
  isOpen: boolean;
  userId: string;
  projectId: string;
  floors: FloorItem[];
  currentFloorId: string;
  onClose: () => void;
  onAutoTakeoff: (
    items: AIExtractionItem[],
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
  ) => {
    summary: AIAutoTakeoffSummary;
    affectedWorks: ProjectWorkItem[];
  };
  onAddRecommendationWork: (catalogId: string, floorId: string, reason: string) => void;
  onApproveDraftWork: (workId: string) => void;
  onRejectDraftWork?: (workId: string) => void;
  onApproveAllReadyDrafts: () => void;
  onOpenWorkDetail: (work: ProjectWorkItem) => void;
  existingWorks: ProjectWorkItem[];
}

const PROGRESS_STEPS = [
  'Memvalidasi format & menyiapkan dokumen gambar teknik...',
  'Mengklasifikasikan halaman ke dalam 16 jenis gambar teknik...',
  'Mengekstrak segmen grid Balok/Sloof & mencocokkan Tabel Dimensi/Schedule...',
  'Memetakan ke Katalog Standar USC & menghitung volume kalkulator...',
];

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  userId,
  projectId,
  floors,
  currentFloorId,
  onClose,
  onAutoTakeoff,
  onAddRecommendationWork,
  onApproveDraftWork,
  onRejectDraftWork,
  onApproveAllReadyDrafts,
  onOpenWorkDetail,
  existingWorks,
}) => {
  if (!isOpen) return null;

  const [selectedUnit, setSelectedUnit] = useState<DrawingUnit>('cm');
  const [selectedScale, setSelectedScale] = useState<DrawingScale>('1:100');
  const [customScaleDenom, setCustomScaleDenom] = useState<number>(125);
  const [selectedFloorId, setSelectedFloorId] = useState<string>(
    currentFloorId || floors.find((f) => f.id === 'fl-1')?.id || floors[0]?.id || 'fl-1'
  );
  const [pageSelection, setPageSelection] = useState<string>('all');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progressStepIndex, setProgressStepIndex] = useState<number>(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<AIExtractionErrorType | null>(null);
  const [isServerBusy, setIsServerBusy] = useState<boolean>(false);
  const [modelUsedInfo, setModelUsedInfo] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);

  const [takeoffSummary, setTakeoffSummary] = useState<AIAutoTakeoffSummary | null>(null);
  const [extractions, setExtractions] = useState<AIExtractionItem[]>([]);
  const [detectedRegions, setDetectedRegions] = useState<AIDetectedRegion[]>([]);
  const [segments, setSegments] = useState<AIBeamSloofSegment[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Record<string, boolean>>({});
  const [resultTab, setResultTab] = useState<
    'drafts' | 'segments' | 'dimensions' | 'recommendations'
  >('drafts');
  const [addedRecIds, setAddedRecIds] = useState<Record<string, boolean>>({});

  // Animasi tahapan progres selama pembacaan AI berlangsung
  useEffect(() => {
    if (!isLoading) {
      setProgressStepIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setProgressStepIndex((prev) => (prev < PROGRESS_STEPS.length - 1 ? prev + 1 : prev));
    }, 2200);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Helper konversi dimensi matematika murni (tanpa perkalian skala dua kali)
  const computeConvertedValue = (
    rawVal: number,
    unit: DrawingUnit,
    detectedUnit?: string
  ): { value: number; convertedUnit: string } => {
    if (rawVal == null || isNaN(rawVal)) return { value: 0, convertedUnit: 'm' };
    const cleanDetected = (detectedUnit || '').toLowerCase().trim();
    if (cleanDetected === 'm²' || cleanDetected === 'm2') {
      return { value: Number(rawVal.toFixed(4)), convertedUnit: 'm²' };
    }
    if (
      cleanDetected === 'unit' ||
      cleanDetected === 'titik' ||
      cleanDetected === 'buah' ||
      cleanDetected === 'btg' ||
      cleanDetected === 'kg/m'
    ) {
      return { value: Number(rawVal), convertedUnit: cleanDetected };
    }
    if (cleanDetected === 'm' || cleanDetected === 'meter') {
      return { value: Number(rawVal.toFixed(4)), convertedUnit: 'm' };
    }
    if (cleanDetected === 'mm') {
      return { value: Number((rawVal / 1000).toFixed(4)), convertedUnit: 'm' };
    }
    if (cleanDetected === 'cm') {
      return { value: Number((rawVal / 100).toFixed(4)), convertedUnit: 'm' };
    }
    if (unit === 'mm') return { value: Number((rawVal / 1000).toFixed(4)), convertedUnit: 'm' };
    if (unit === 'cm') return { value: Number((rawVal / 100).toFixed(4)), convertedUnit: 'm' };
    return { value: Number(rawVal.toFixed(4)), convertedUnit: 'm' };
  };

  const handleUnitSettingChange = (newUnit: DrawingUnit) => {
    setSelectedUnit(newUnit);
    if (extractions.length > 0 && selectedFile) {
      const updatedItems = extractions.map((item) => {
        const { value, convertedUnit } = computeConvertedValue(
          item.rawExtractedValue,
          newUnit,
          item.explicitUnitOnDrawing
        );
        return {
          ...item,
          rawUnit: newUnit,
          convertedValue: item.userCorrection !== undefined ? item.userCorrection : value,
          convertedUnit,
        };
      });
      setExtractions(updatedItems);

      const res = onAutoTakeoff(
        updatedItems.filter((i) => selectedItemIds[i.id] && i.status !== 'rejected'),
        selectedFloorId,
        selectedFile.name,
        {
          documentSummary: takeoffSummary?.documentSummary,
          drawingType: takeoffSummary?.drawingType,
          detectedRegions,
          segments,
          identifiedFloor: takeoffSummary?.identifiedFloor,
          identifiedScale: takeoffSummary?.identifiedScale,
        }
      );
      setTakeoffSummary(res.summary);
    }
  };

  const handleFileSelect = (file: File) => {
    setFileError(null);
    setAnalysisError(null);
    setErrorType(null);
    setIsServerBusy(false);

    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|png|jpe?g|webp)$/i)) {
      setErrorType('unsupported_format');
      setFileError(
        'Format file tidak didukung. Harap unggah file gambar teknik berformat PDF, JPG, JPEG, atau PNG.'
      );
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorType('unreadable_file');
      setFileError('Ukuran file melebihi batas maksimal 15 MB.');
      return;
    }

    setSelectedFile(file);
  };

  const runAnalysisWithBase64 = async (
    base64Data: string,
    mimeType: string,
    fileName: string,
    overrideFloorId?: string,
    forceRefresh: boolean = false
  ) => {
    if (isLoading) return;
    setIsLoading(true);
    setProgressStepIndex(0);
    setAnalysisError(null);
    setErrorType(null);
    setIsServerBusy(false);

    const activeTargetFloorId = overrideFloorId || selectedFloorId;

    try {
      const targetFloorObj = floors.find((f) => f.id === activeTargetFloorId);
      const scaleText =
        selectedScale === 'custom'
          ? `1:${customScaleDenom}`
          : selectedScale === 'unknown'
          ? 'Tidak Diketahui'
          : selectedScale;

      const response = await fetch('/api/gemini/extract-dimensions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          userId,
          projectId,
          targetFloorId: activeTargetFloorId,
          fileBase64: base64Data,
          mimeType,
          fileName,
          floorName: targetFloorObj ? targetFloorObj.name : 'Lantai 1',
          unitSetting: selectedUnit,
          scaleSetting: scaleText,
          pageSelection,
          forceRefresh,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      let resJson: any = null;

      if (contentType.includes('application/json')) {
        try {
          resJson = await response.json();
        } catch (jsonErr) {
          console.error('[RuangEstimasi] Gagal parsing JSON respons:', jsonErr);
        }
      }

      if (!response.ok || !resJson || !resJson.success) {
        const detectedErrType: AIExtractionErrorType =
          resJson?.errorType ||
          (response.status === 503 || resJson?.isBusy
            ? 'api_error'
            : response.status === 415
            ? 'unsupported_format'
            : 'unreadable_file');
        setErrorType(detectedErrType);

        if (response.status === 503 || resJson?.isBusy) {
          setIsServerBusy(true);
          setAnalysisError(
            'Layanan AI sedang mengalami beban tinggi (503). Dokumen belum berhasil dianalisis. Silakan coba kembali beberapa saat lagi.'
          );
        } else if (response.status === 413) {
          setAnalysisError(
            'Ukuran file dokumen terlalu besar. Harap unggah file yang lebih ringkas (di bawah 15 MB).'
          );
        } else if (resJson?.error) {
          setAnalysisError(resJson.error);
        } else {
          setAnalysisError(
            `Koneksi server gagal (Kode status: ${response.status}). Periksa koneksi atau coba beberapa saat lagi.`
          );
        }
        return;
      }

      const rawData = resJson.data;
      setModelUsedInfo(resJson.modelUsed || 'gemini-3-flash-preview');
      setIsFromCache(Boolean(resJson.fromCache));

      // 1. Parse detectedRegions (16 Klasifikasi Jenis Gambar Teknik)
      const parsedRegions: AIDetectedRegion[] = Array.isArray(rawData.detectedRegions)
        ? rawData.detectedRegions.map((r: any, idx: number) => ({
            pageNumber: Number(r.pageNumber) || idx + 1,
            drawingType: (r.drawingType || 'Detail konstruksi') as EngineeringDrawingType,
            title: r.title || `Bagian Gambar ${idx + 1}`,
            identifiedFloor: r.identifiedFloor || rawData.identifiedFloor || targetFloorObj?.name,
            scale: r.scale || rawData.identifiedScale || scaleText,
            summary: r.summary || '',
          }))
        : [];
      setDetectedRegions(parsedRegions);

      // 2. Parse segments (Rincian Segmen Balok & Sloof)
      const parsedSegments: AIBeamSloofSegment[] = Array.isArray(rawData.segments)
        ? rawData.segments.map((s: any, idx: number) => {
            const count = Math.max(1, Number(s.count) || 1);
            const lengthMeters = Number(s.lengthMeters) || 0;
            const subtotalMeters =
              Number(s.subtotalMeters) || Number((lengthMeters * count).toFixed(2));
            const pageNum = Number(s.pageNumber) || 1;
            const dType = (s.drawingType as EngineeringDrawingType) || 'Denah sloof';
            return {
              id: `seg-${Date.now()}-${idx}`,
              elementCode: (s.elementCode || 'S1').toUpperCase(),
              elementCategory: s.elementCategory === 'balok' ? 'balok' : 'sloof',
              segmentName: s.segmentName || `Segmen ${idx + 1}`,
              gridLocation: s.gridLocation || '-',
              rawLength: Number(s.rawLength) || lengthMeters,
              rawUnit: (s.rawUnit as DrawingUnit) || 'm',
              lengthMeters: Number(lengthMeters.toFixed(2)),
              count,
              subtotalMeters: Number(subtotalMeters.toFixed(2)),
              pageNumber: pageNum,
              drawingType: dType,
              drawingTitle: s.drawingTitle,
              identifiedFloor: s.identifiedFloor,
              sourceInfo:
                s.sourceInfo || `Halaman ${pageNum}, ${dType} (${s.gridLocation || 'Grid'})`,
            };
          })
        : [];
      setSegments(parsedSegments);

      if (
        (Array.isArray(rawData.items) && rawData.items.length > 0) ||
        parsedSegments.length > 0
      ) {
        const initialSelected: Record<string, boolean> = {};
        const parsedItems: AIExtractionItem[] = (rawData.items || []).map(
          (item: any, idx: number) => {
            const id = `ai-item-${Date.now()}-${idx}`;
            const rawVal = Number(item.rawExtractedValue) || 0;
            const explicitUnit = item.detectedUnit;
            const { value: converted, convertedUnit } = computeConvertedValue(
              rawVal,
              selectedUnit,
              explicitUnit
            );
            initialSelected[id] = true;

            const pageNum = Number(item.pageNumber) || 1;
            const dType = (item.drawingType as EngineeringDrawingType) || 'Denah struktur';
            const srcInfo = formatAISourceInfo({
              pageNumber: pageNum,
              drawingType: dType,
              drawingTitle: item.drawingTitle,
              pageOrLocation: item.pageOrLocation || item.gridLocation,
              sourceInfo: item.sourceInfo,
              sourceDocument: fileName,
            });

            const badge: AIVerificationBadge =
              item.verificationBadge ||
              (item.confidence !== undefined && item.confidence < 0.8
                ? 'Perlu Verifikasi'
                : 'Terbaca Jelas');

            return {
              id,
              pageNumber: pageNum,
              drawingType: dType,
              drawingTitle: item.drawingTitle,
              identifiedFloor: item.identifiedFloor,
              gridLocation: item.gridLocation,
              elementCode: item.elementCode,
              targetCategory: item.targetCategory || 'Struktural',
              suggestedWorkName: item.suggestedWorkName || 'Pekerjaan Terdeteksi',
              catalogId: item.catalogId,
              parameterId: item.parameterId,
              parameterName: item.parameterName || 'Dimensi',
              rawExtractedValue: rawVal,
              rawUnit: selectedUnit,
              explicitUnitOnDrawing: explicitUnit,
              convertedValue: converted,
              convertedUnit,
              confidence: item.confidence ?? 0.95,
              verificationBadge: badge,
              sourceDocument: fileName,
              pageOrLocation: item.pageOrLocation || item.gridLocation || 'Gambar Teknik',
              sourceInfo: srcInfo,
              notes: item.notes || 'Angka dimensi tertulis pada gambar.',
              status: 'approved',
            };
          }
        );

        setExtractions(parsedItems);
        setSelectedItemIds(initialSelected);

        // Jalankan Auto Quantity Takeoff ke Kalkulator
        const takeoffResult = onAutoTakeoff(parsedItems, activeTargetFloorId, fileName, {
          documentSummary: rawData.documentSummary || `Analisis ${fileName}`,
          drawingType: rawData.drawingType || 'struktur_denah',
          detectedRegions: parsedRegions,
          segments: parsedSegments,
          identifiedFloor: rawData.identifiedFloor || targetFloorObj?.name || 'Lantai 1',
          identifiedScale: rawData.identifiedScale || scaleText,
          fromCache: Boolean(resJson.fromCache),
          documentHash: resJson.documentHash,
        });

        setTakeoffSummary(takeoffResult.summary);
        setResultTab('drafts');
      } else {
        setExtractions([]);
        setErrorType('incomplete_extraction');
        setAnalysisError(
          'Gambar terdeteksi namun tidak ditemukan angka dimensi tertulis yang cukup jelas untuk diekstrak secara otomatis. Silakan periksa resolusi gambar atau gunakan Input Manual.'
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorType('api_error');
      setAnalysisError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async (forceRefresh: boolean = false) => {
    if (!selectedFile) {
      setFileError('Silakan pilih file gambar denah atau PDF terlebih dahulu.');
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onload = async () => {
      const base64Data = reader.result as string;
      await runAnalysisWithBase64(
        base64Data,
        selectedFile.type || 'application/pdf',
        selectedFile.name,
        undefined,
        forceRefresh
      );
    };
  };

  const handleLoadSampleDrawing = async (
    assetPath: string,
    sampleName: string,
    defaultScale: DrawingScale,
    preferUmumFloor: boolean
  ) => {
    if (isLoading) return;
    setFileError(null);
    setAnalysisError(null);
    setErrorType(null);
    setSelectedScale(defaultScale);

    let floorIdToUse = selectedFloorId;
    if (preferUmumFloor) {
      const umumFloor = floors.find((f) => f.id === 'fl-umum');
      if (umumFloor) {
        floorIdToUse = umumFloor.id;
        setSelectedFloorId(umumFloor.id);
      }
    }

    try {
      setIsLoading(true);
      const res = await fetch(assetPath);
      if (!res.ok) throw new Error(`File contoh (${sampleName}) tidak ditemukan.`);
      const blob = await res.blob();
      const sampleFile = new File([blob], sampleName, { type: 'application/pdf' });
      setSelectedFile(sampleFile);

      const reader = new FileReader();
      reader.readAsDataURL(sampleFile);
      reader.onload = async () => {
        setIsLoading(false);
        const base64Data = reader.result as string;
        await runAnalysisWithBase64(base64Data, 'application/pdf', sampleName, floorIdToUse, false);
      };
    } catch (err: unknown) {
      setIsLoading(false);
      setFileError(err instanceof Error ? err.message : 'Gagal memuat contoh PDF.');
    }
  };

  const handleEditConvertedValue = (id: string, newConvertedVal: string) => {
    const val = Number(newConvertedVal);
    const updated = extractions.map((item) =>
      item.id === id
        ? {
            ...item,
            convertedValue: isNaN(val) ? item.convertedValue : val,
            userCorrection: isNaN(val) ? undefined : val,
            status: 'approved' as const,
          }
        : item
    );
    setExtractions(updated);

    if (selectedFile) {
      const res = onAutoTakeoff(
        updated.filter((i) => selectedItemIds[i.id] && i.status !== 'rejected'),
        selectedFloorId,
        selectedFile.name,
        {
          documentSummary: takeoffSummary?.documentSummary,
          drawingType: takeoffSummary?.drawingType,
          detectedRegions,
          segments,
          identifiedFloor: takeoffSummary?.identifiedFloor,
          identifiedScale: takeoffSummary?.identifiedScale,
        }
      );
      setTakeoffSummary(res.summary);
    }
  };

  const handleToggleExtractionStatus = (id: string, nextStatus: 'approved' | 'rejected') => {
    const updated = extractions.map((item) =>
      item.id === id ? { ...item, status: nextStatus } : item
    );
    setExtractions(updated);
    setSelectedItemIds((prev) => ({
      ...prev,
      [id]: nextStatus === 'approved',
    }));

    if (selectedFile) {
      const res = onAutoTakeoff(
        updated.filter((i) => i.status !== 'rejected'),
        selectedFloorId,
        selectedFile.name,
        {
          documentSummary: takeoffSummary?.documentSummary,
          drawingType: takeoffSummary?.drawingType,
          detectedRegions,
          segments,
          identifiedFloor: takeoffSummary?.identifiedFloor,
          identifiedScale: takeoffSummary?.identifiedScale,
        }
      );
      setTakeoffSummary(res.summary);
    }
  };

  // Daftar pekerjaan AI pada lantai tujuan saat ini (termasuk Umum & Pondasi jika menganalisis sloof/pondasi)
  const currentFloorAiWorks = existingWorks.filter(
    (w) =>
      w.isActive &&
      (w.floorId === selectedFloorId || w.floorId === 'fl-umum') &&
      w.origin === 'ai'
  );
  const currentFloorName =
    floors.find((f) => f.id === selectedFloorId)?.name || selectedFloorId;

  const totalSegmentsLength = segments.reduce((acc, s) => acc + (s.subtotalMeters || 0), 0);

  // Kelompokkan segmen berdasarkan kode elemen (B1, B2, S1, S2) untuk transparansi pemeriksaan
  const segmentsByElementCode: Record<string, AIBeamSloofSegment[]> = {};
  for (const seg of segments) {
    const code = seg.elementCode || 'S1';
    if (!segmentsByElementCode[code]) {
      segmentsByElementCode[code] = [];
    }
    segmentsByElementCode[code].push(seg);
  }

  const renderBadge = (badge?: AIVerificationBadge) => {
    switch (badge) {
      case 'Terbaca Jelas':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Terbaca Jelas
          </span>
        );
      case 'Hasil Penggabungan':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            Hasil Penggabungan
          </span>
        );
      case 'Tidak Ditemukan':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            Tidak Ditemukan
          </span>
        );
      case 'Perlu Verifikasi':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            Perlu Verifikasi
          </span>
        );
    }
  };

  const getErrorTypeLabel = (type: AIExtractionErrorType | null) => {
    switch (type) {
      case 'api_error':
        return 'Gangguan Koneksi / Kuota Layanan AI (API Error)';
      case 'unreadable_file':
        return 'File Tidak Terbaca atau Rusak';
      case 'unsupported_format':
        return 'Format File Tidak Didukung';
      case 'incomplete_extraction':
        return 'Informasi Dimensi pada Gambar Tidak Cukup';
      default:
        return 'Status Layanan AI';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/70 to-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900">
                  Asisten Ekstraksi: Auto Quantity Takeoff
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  16 Klasifikasi Gambar &amp; Segmen Struktur
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Klasifikasi gambar kerja, penjumlahan segmen balok/sloof per grid, pencocokan schedule penulangan, dan pemetaan ke pekerjaan standar USC.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* TAHAP 1: PENGATURAN DOKUMEN */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-900 text-xs">
                  Tahap 1: Pengaturan Satuan Dimensi, Skala, Lantai Tujuan, &amp; Halaman
                </h4>
              </div>
              <span className="text-[11px] text-slate-500">
                Konversi otomatis ke meter (m) tanpa mengalikan skala dua kali
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* 1. Satuan Dimensi Gambar */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Satuan Dimensi Gambar *
                </label>
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                  {(['mm', 'cm', 'm'] as DrawingUnit[]).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => handleUnitSettingChange(unit)}
                      className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                        selectedUnit === unit
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {unit.toUpperCase()}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                  Contoh: <strong>40 cm</strong> &rarr; <strong>0,40 m</strong>.
                </p>
              </div>

              {/* 2. Skala Gambar */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Skala Gambar</label>
                <select
                  value={selectedScale}
                  onChange={(e) => setSelectedScale(e.target.value as DrawingScale)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1:20">1:20 (Detail)</option>
                  <option value="1:50">1:50 (Denah / Potongan)</option>
                  <option value="1:75">1:75</option>
                  <option value="1:100">1:100 (Standar Denah)</option>
                  <option value="1:150">1:150</option>
                  <option value="1:200">1:200 (Denah Struktur / Sloof)</option>
                  <option value="custom">Lainnya...</option>
                  <option value="unknown">Tidak Diketahui</option>
                </select>

                {selectedScale === 'custom' && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="font-bold text-slate-700">1 :</span>
                    <input
                      type="number"
                      placeholder="125"
                      value={customScaleDenom}
                      onChange={(e) => setCustomScaleDenom(Number(e.target.value) || 100)}
                      className="w-full px-2 py-1 rounded-lg border border-slate-300 font-bold text-slate-900"
                    />
                  </div>
                )}
              </div>

              {/* 3. Lantai Tujuan */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Lantai Tujuan *</label>
                <select
                  value={selectedFloorId}
                  onChange={(e) => setSelectedFloorId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} {f.elevation ? `(${f.elevation})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                  Terhubung ke pekerjaan standar USC lantai ini.
                </p>
              </div>

              {/* 4. Fokus Halaman PDF */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Halaman PDF (Opsional)
                </label>
                <input
                  type="text"
                  value={pageSelection === 'all' ? '' : pageSelection}
                  onChange={(e) =>
                    setPageSelection(e.target.value.trim() === '' ? 'all' : e.target.value)
                  }
                  placeholder="Semua halaman (atau mis. 1-3)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:font-normal placeholder:text-slate-400"
                />
                <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                  Kosongkan untuk membaca seluruh halaman.
                </p>
              </div>
            </div>

            {/* Daftar 16 Jenis Gambar yang Dikenali */}
            <details className="text-[11px] text-slate-600 pt-1">
              <summary className="cursor-pointer font-semibold text-blue-700 hover:text-blue-800 select-none">
                Lihat 16 Klasifikasi Jenis Gambar Teknik yang Didukung ({CANONICAL_DRAWING_TYPES.length} Jenis)
              </summary>
              <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-slate-200/70">
                {CANONICAL_DRAWING_TYPES.map((dt) => (
                  <span
                    key={dt}
                    className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10px] font-medium"
                  >
                    {dt}
                  </span>
                ))}
              </div>
            </details>
          </div>

          {/* TAHAP 2: UNGGAH DOKUMEN & ANALISIS AI */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="font-bold text-slate-800 block">
                Tahap 2: Unggah File Gambar Kerja (PDF / JPG / JPEG / PNG)
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    handleLoadSampleDrawing(
                      '/assets/aistudio/Gedung_USC_A4-16_202766c9.pdf',
                      'Gedung USC A4-16.pdf',
                      '1:200',
                      true
                    )
                  }
                  disabled={isLoading}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                >
                  Uji Denah Sloof &amp; Schedule S.1 (Gedung USC A4-16.pdf)
                </button>
              </div>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/20 hover:bg-blue-50/40 rounded-xl p-4 text-center cursor-pointer transition flex items-center justify-center gap-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-left text-xs min-w-0 flex-1">
                <span className="font-semibold text-slate-900 block truncate">
                  {selectedFile
                    ? selectedFile.name
                    : 'Klik untuk memilih file PDF gambar kerja / denah / potongan / schedule struktur'}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {selectedFile
                    ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Terikat pada proyek ini`
                    : 'Format didukung: PDF, JPG, JPEG, PNG (maks. 15 MB)'}
                </span>
              </div>
              {selectedFile && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Berkas Siap
                </span>
              )}
            </div>

            {fileError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <div>
                  <span className="font-bold block">{getErrorTypeLabel(errorType)}:</span>
                  <span>{fileError}</span>
                </div>
              </div>
            )}

            {/* Indikator Progres Pembacaan Bertahap */}
            {isLoading && (
              <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>{PROGRESS_STEPS[progressStepIndex]}</span>
                  </span>
                  <span className="font-mono text-[11px] text-blue-700">
                    Tahap {progressStepIndex + 1}/{PROGRESS_STEPS.length}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-500"
                    style={{
                      width: `${((progressStepIndex + 1) / PROGRESS_STEPS.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500">
                Hasil ekstraksi disimpan khusus untuk akun &amp; proyek aktif ini (tidak mengirim ulang halaman yang sama).
              </span>
              <div className="flex items-center gap-2 shrink-0">
                {takeoffSummary && selectedFile && !isLoading && (
                  <button
                    type="button"
                    onClick={() => handleAnalyze(true)}
                    className="px-3.5 py-2.5 font-semibold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                    title="Paksa baca ulang dokumen ke server AI (abaikan cache)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Baca Ulang</span>
                  </button>
                )}

                <button
                  onClick={() => handleAnalyze(false)}
                  disabled={!selectedFile || isLoading}
                  className="px-6 py-2.5 font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl transition shadow-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menganalisis Dokumen...</span>
                    </>
                  ) : (
                    <>
                      <ScanLine className="w-4 h-4" />
                      <span>Mulai Analisis AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ERROR & BUSY HANDLING DENGAN PEMISAHAN 4 JENIS ERROR */}
          {analysisError && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">{getErrorTypeLabel(errorType)}</span>
                  <p className="mt-0.5 leading-relaxed text-slate-700">{analysisError}</p>
                </div>
              </div>

              {(isServerBusy || errorType === 'api_error') && (
                <button
                  onClick={() => handleAnalyze(true)}
                  disabled={isLoading}
                  className="px-3.5 py-1.5 bg-white border border-amber-300 text-amber-900 font-bold rounded-xl hover:bg-amber-100/70 transition shrink-0 flex items-center gap-1.5 shadow-2xs self-end sm:self-auto cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Coba Lagi</span>
                </button>
              )}
            </div>
          )}

          {/* TAHAP 3–5: RINGKASAN AUTO QUANTITY TAKEOFF */}
          {takeoffSummary && (
            <div className="space-y-4">
              {/* Banner Ringkasan Hasil Otomatis */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 via-blue-50/70 to-indigo-50/60 border border-blue-200 rounded-2xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-slate-900 text-xs">
                      Analisis selesai. Ditemukan {takeoffSummary.extractedCount} parameter
                      {segments.length > 0 ? ` & ${segments.length} jalur segmen struktur` : ''},{' '}
                      {takeoffSummary.updatedExistingWorksCount > 0
                        ? `diisi ke ${takeoffSummary.updatedExistingWorksCount} pekerjaan standar USC`
                        : ''}{' '}
                      {takeoffSummary.createdDraftWorksCount > 0
                        ? `(dan +${takeoffSummary.createdDraftWorksCount} pekerjaan baru)`
                        : ''}{' '}
                      pada {currentFloorName}.
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isFromCache && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                        <Database className="w-3 h-3" />
                        Cache Proyek
                      </span>
                    )}
                    {modelUsedInfo && (
                      <span className="text-[10px] font-mono text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-100">
                        {modelUsedInfo}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-600">
                  {takeoffSummary.documentSummary} · Lantai Teridentifikasi:{' '}
                  <strong>{takeoffSummary.identifiedFloor}</strong> · Skala:{' '}
                  <strong>{takeoffSummary.identifiedScale}</strong>
                </p>

                {/* Klasifikasi Multi-Jenis Gambar yang Terdeteksi */}
                {detectedRegions.length > 0 && (
                  <div className="pt-2 border-t border-blue-200/60 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 block">
                      Klasifikasi Halaman &amp; Bagian Gambar Teknik ({detectedRegions.length} Bagian):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {detectedRegions.map((reg, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-white/90 border border-blue-200/80 flex items-start gap-2.5"
                        >
                          <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                                Halaman {reg.pageNumber} · {reg.drawingType}
                              </span>
                              {reg.identifiedFloor && (
                                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                                  {reg.identifiedFloor}
                                </span>
                              )}
                              {reg.scale && (
                                <span className="text-[10px] font-mono text-slate-500">
                                  Skala {reg.scale}
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-slate-900 block mt-0.5 truncate">
                              {reg.title}
                            </span>
                            <span className="text-[11px] text-slate-600 block line-clamp-2">
                              {reg.summary}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sub-Navigation Tabs for Results */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
                <button
                  onClick={() => setResultTab('drafts')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    resultTab === 'drafts'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Pekerjaan USC Terhubung ({currentFloorAiWorks.length})
                </button>
                {segments.length > 0 && (
                  <button
                    onClick={() => setResultTab('segments')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      resultTab === 'segments'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                    }`}
                  >
                    <Table2 className="w-3.5 h-3.5" />
                    <span>
                      Rincian Segmen Balok / Sloof ({segments.length} Segmen ={' '}
                      {formatIndonesianNumber(totalSegmentsLength)} m)
                    </span>
                  </button>
                )}
                <button
                  onClick={() => setResultTab('dimensions')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    resultTab === 'dimensions'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tabel Dimensi &amp; Sumber ({extractions.length})
                </button>
                <button
                  onClick={() => setResultTab('recommendations')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    resultTab === 'recommendations'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Rekomendasi Lanjutan ({takeoffSummary.recommendations.length})
                </button>
              </div>

              {/* TAB 1: PEKERJAAN USC TERHUBUNG DI KALKULATOR */}
              {resultTab === 'drafts' && (
                <div className="space-y-2.5">
                  {currentFloorAiWorks.map((work) => {
                    const isDraft = work.aiVerificationStatus === 'draft';
                    const isIncomplete = work.calculatedVolume === null;
                    const hasConflict = work.parameters.some((p) => Boolean(p.conflict));
                    const workFloor = floors.find((f) => f.id === work.floorId);

                    return (
                      <div
                        key={work.id}
                        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          hasConflict
                            ? 'bg-rose-50/40 border-rose-200'
                            : isIncomplete
                            ? 'bg-amber-50/40 border-amber-200'
                            : isDraft
                            ? 'bg-blue-50/20 border-blue-200'
                            : 'bg-emerald-50/20 border-emerald-200'
                        }`}
                      >
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-slate-900">{work.name}</span>
                            {work.elementCode && (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                                Kode: {work.elementCode}
                              </span>
                            )}
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                              {workFloor?.name || work.floorId} · {work.category}
                            </span>
                            {renderBadge(work.verificationBadge)}
                            {isDraft ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                Menunggu Verifikasi Estimator
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                Disetujui (Terverifikasi)
                              </span>
                            )}
                          </div>

                          {/* Sumber Halaman & Jenis Gambar */}
                          {work.sourceInfo && (
                            <p className="text-[11px] text-blue-800 font-medium flex items-center gap-1">
                              <FileText className="w-3 h-3 text-blue-600 shrink-0" />
                              <span>Sumber: {work.sourceInfo}</span>
                            </p>
                          )}

                          {/* Parameter & Badge per Parameter */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {work.parameters.map((p) => (
                              <span
                                key={p.id}
                                className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                                  p.value !== null && p.value !== ''
                                    ? 'bg-white border-slate-200 text-slate-800'
                                    : 'bg-rose-50 border-rose-200 text-rose-800 font-semibold'
                                }`}
                              >
                                {p.label || p.name}:{' '}
                                {p.value !== null && p.value !== ''
                                  ? `${p.value} ${p.unit}`
                                  : 'Tidak Ditemukan (Kosong)'}
                              </span>
                            ))}
                          </div>

                          {work.segments && work.segments.length > 0 && (
                            <p className="text-[11px] text-indigo-700 font-semibold">
                              Panjang Total ({work.elementCode || 'Struktur'}) ={' '}
                              {formatIndonesianNumber(
                                work.segments.reduce((acc, s) => acc + (s.subtotalMeters || 0), 0)
                              )}{' '}
                              m (dari penjumlahan {work.segments.length} segmen grid).
                            </p>
                          )}

                          {work.statusMessage && (
                            <p
                              className={`text-[11px] ${
                                isIncomplete ? 'text-amber-800 font-medium' : 'text-slate-500'
                              }`}
                            >
                              {work.statusMessage}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <div className="text-right mr-1">
                            <span className="text-[10px] text-slate-400 block">Volume Usulan AI</span>
                            <span className="font-mono font-bold text-sm text-slate-900">
                              {work.calculatedVolume !== null
                                ? `${formatIndonesianNumber(work.calculatedVolume)} ${work.unit}`
                                : 'Menunggu Parameter'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => onOpenWorkDetail(work)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>{isIncomplete ? 'Lengkapi' : 'Edit'}</span>
                          </button>

                          {isDraft && !isIncomplete && !hasConflict && (
                            <button
                              type="button"
                              onClick={() => onApproveDraftWork(work.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Setujui</span>
                            </button>
                          )}

                          {isDraft && onRejectDraftWork && (
                            <button
                              type="button"
                              onClick={() => onRejectDraftWork(work.id)}
                              title="Tolak usulan AI pada pekerjaan ini"
                              className="p-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {currentFloorAiWorks.length === 0 && (
                    <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                      Belum ada pekerjaan hasil pembacaan AI pada lantai ini.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: RINCIAN PENJUMLAHAN SEGMEN BALOK / SLOOF PER KODE ELEMEN */}
              {resultTab === 'segments' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-blue-950 block">
                        Rincian Penjumlahan Segmen Balok &amp; Sloof Berdasarkan Grid
                      </span>
                      <span className="text-[11px] text-slate-600">
                        Panjang total setiap kode elemen (B1, B2, S1, S2) dihitung dari penjumlahan segmen antar grid tanpa duplikasi pertemuan as dan tanpa menggunakan keliling bangunan.
                      </span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-white border border-blue-200 font-mono font-bold text-blue-900">
                      Total Seluruh Segmen = {formatIndonesianNumber(totalSegmentsLength)} m
                    </div>
                  </div>

                  {Object.entries(segmentsByElementCode).map(([elemCode, elemSegs]) => {
                    const elemTotal = elemSegs.reduce(
                      (acc, s) => acc + (s.subtotalMeters || 0),
                      0
                    );
                    return (
                      <div
                        key={elemCode}
                        className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white"
                      >
                        <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-blue-600" />
                            <span className="font-bold text-slate-900">
                              Kode Elemen: <span className="font-mono text-blue-700">{elemCode}</span>
                            </span>
                            <span className="text-[11px] text-slate-500">
                              ({elemSegs.length} segmen teridentifikasi)
                            </span>
                          </div>
                          <span className="font-mono font-bold text-blue-800 bg-white px-2.5 py-0.5 rounded border border-blue-200">
                            Total Panjang {elemCode} = {formatIndonesianNumber(elemTotal)} m
                          </span>
                        </div>

                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                              <th className="py-2 px-3">Segmen / Bentang</th>
                              <th className="py-2 px-3">Lokasi Grid / As</th>
                              <th className="py-2 px-3">Sumber Halaman &amp; Gambar</th>
                              <th className="py-2 px-3 text-right">Panjang Bentang (m)</th>
                              <th className="py-2 px-2 text-center">Jml Jalur</th>
                              <th className="py-2 px-3 text-right">Subtotal (m)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {elemSegs.map((seg) => (
                              <tr key={seg.id} className="hover:bg-slate-50/70">
                                <td className="py-2 px-3 font-medium text-slate-900">
                                  {seg.segmentName}
                                </td>
                                <td className="py-2 px-3 font-mono text-slate-600">
                                  {seg.gridLocation}
                                </td>
                                <td className="py-2 px-3 text-[11px] text-slate-600">
                                  {seg.sourceInfo ||
                                    `Halaman ${seg.pageNumber || 1}, ${seg.drawingType || 'Denah'}`}
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-slate-800">
                                  {formatIndonesianNumber(seg.lengthMeters)} m
                                </td>
                                <td className="py-2 px-2 text-center font-mono text-slate-600">
                                  {seg.count}
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                                  {formatIndonesianNumber(seg.subtotalMeters)} m
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 3: TABEL DIMENSI TERBACA & SUMBER HALAMAN */}
              {resultTab === 'dimensions' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3">Parameter &amp; Kode Elemen</th>
                        <th className="py-2.5 px-3">Sumber Halaman &amp; Jenis Gambar</th>
                        <th className="py-2.5 px-2 text-center">Status Baca</th>
                        <th className="py-2.5 px-3 text-right">Nilai Tertulis</th>
                        <th className="py-2.5 px-3 text-right w-36">Nilai Kalkulator</th>
                        <th className="py-2.5 px-3 text-center">Keputusan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {extractions.map((item) => {
                        const isRejected = item.status === 'rejected';
                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-slate-50/60 ${
                              isRejected ? 'opacity-50 bg-slate-50' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-900">
                                  {item.parameterName}
                                </span>
                                {item.elementCode && (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[10px] font-bold">
                                    {item.elementCode}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 block">
                                {item.suggestedWorkName} ({item.targetCategory})
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="text-[11px] font-semibold text-blue-800 block">
                                {item.sourceInfo ||
                                  `Halaman ${item.pageNumber || 1}, ${
                                    item.drawingType || 'Gambar Kerja'
                                  }`}
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                {item.notes}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              {renderBadge(item.verificationBadge)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">
                              {item.rawExtractedValue} {item.explicitUnitOnDrawing || item.rawUnit}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <input
                                  type="number"
                                  step="any"
                                  disabled={isRejected}
                                  value={
                                    item.userCorrection !== undefined
                                      ? item.userCorrection
                                      : item.convertedValue
                                  }
                                  onChange={(e) =>
                                    handleEditConvertedValue(item.id, e.target.value)
                                  }
                                  className="w-20 px-2 py-1 text-right text-xs font-mono font-bold border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                                />
                                <span className="text-slate-600 font-semibold w-6 text-left">
                                  {item.convertedUnit}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleToggleExtractionStatus(item.id, 'approved')}
                                  className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                                    !isRejected
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-100 text-slate-600 hover:bg-emerald-50'
                                  }`}
                                >
                                  Terima
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleExtractionStatus(item.id, 'rejected')}
                                  className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                                    isRejected
                                      ? 'bg-rose-600 text-white'
                                      : 'bg-slate-100 text-slate-600 hover:bg-rose-50'
                                  }`}
                                >
                                  Tolak
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

              {/* TAB 4: REKOMENDASI PEKERJAAN LANJUTAN */}
              {resultTab === 'recommendations' && (
                <div className="space-y-2.5">
                  <p className="text-[11px] text-slate-500">
                    Pekerjaan berikut merupakan pekerjaan ikutan/lanjutan yang lazim menyertai elemen pada gambar:
                  </p>
                  {takeoffSummary.recommendations.map((rec) => {
                    const isAdded = Boolean(addedRecIds[rec.catalogId]);
                    return (
                      <div
                        key={rec.catalogId}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{rec.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-semibold">
                              {rec.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{rec.reason}</p>
                        </div>

                        <button
                          type="button"
                          disabled={isAdded}
                          onClick={() => {
                            onAddRecommendationWork(rec.catalogId, selectedFloorId, rec.reason);
                            setAddedRecIds((prev) => ({ ...prev, [rec.catalogId]: true }));
                          }}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition cursor-pointer ${
                            isAdded
                              ? 'bg-emerald-100 text-emerald-800 cursor-default'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Ditambahkan</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Hubungkan ke Kalkulator</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}

                  {takeoffSummary.recommendations.length === 0 && (
                    <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                      Tidak ada rekomendasi pekerjaan tambahan untuk gambar ini.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition cursor-pointer"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2.5">
            {currentFloorAiWorks.some(
              (w) => w.aiVerificationStatus === 'draft' && w.calculatedVolume !== null
            ) && (
              <button
                type="button"
                onClick={onApproveAllReadyDrafts}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition cursor-pointer"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Setujui Semua Draf yang Lengkap</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs cursor-pointer"
            >
              <Table2 className="w-4 h-4" />
              <span>Lihat Pekerjaan di Kalkulator</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
