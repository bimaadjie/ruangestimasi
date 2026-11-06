import React, { useState, useEffect } from 'react';
import {
  X,
  Calculator,
  Info,
  Save,
  ScanLine,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Ruler,
  Table2,
  RotateCcw,
} from 'lucide-react';
import { AIVerificationBadge, ProjectWorkItem, ParameterItem } from '../types';
import { calculateWorkItemVolume, formatIndonesianNumber } from '../services/calculationEngine';

interface WorkDetailModalProps {
  isOpen: boolean;
  work: ProjectWorkItem | null;
  floorName?: string;
  onClose: () => void;
  onSaveWork: (updatedWork: ProjectWorkItem) => void;
  onRejectDraftWork?: (workId: string) => void;
}

export const WorkDetailModal: React.FC<WorkDetailModalProps> = ({
  isOpen,
  work,
  floorName,
  onClose,
  onSaveWork,
  onRejectDraftWork,
}) => {
  if (!isOpen || !work) return null;

  const [workName, setWorkName] = useState<string>(work.name);
  const [localParams, setLocalParams] = useState<ParameterItem[]>([]);
  const [activeTab, setActiveTab] = useState<'params' | 'formula' | 'source'>('params');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (work) {
      setWorkName(work.name);
      setLocalParams(JSON.parse(JSON.stringify(work.parameters || [])));
      setValidationError(null);
    }
  }, [work]);

  const handleParamChange = (id: string, rawInput: string) => {
    setValidationError(null);
    const trimmed = rawInput.trim();

    if (trimmed === '') {
      // Jangan pernah menganggap input kosong sebagai angka nol!
      setLocalParams((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                value: null,
                source: 'manual',
                verificationBadge: undefined,
                isVerified: true,
                conflict: null,
              }
            : p
        )
      );
      return;
    }

    const num = Number(trimmed);
    if (isNaN(num) || num < 0) {
      setValidationError('Nilai parameter harus berupa angka positif yang valid.');
      return;
    }

    setLocalParams((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              value: num,
              source: 'manual',
              verificationBadge: undefined,
              isVerified: true,
              conflict: null,
            }
          : p
      )
    );
  };

  const handleResolveConflict = (paramId: string, useNewValue: boolean) => {
    setLocalParams((prev) =>
      prev.map((p) => {
        if (p.id !== paramId || !p.conflict) return p;
        if (useNewValue) {
          return {
            ...p,
            value: p.conflict.newValue,
            rawExtractedValue: p.conflict.rawExtractedValue,
            rawUnit: p.conflict.rawUnit,
            sourceDocument: p.conflict.sourceDocument,
            pageOrLocation: p.conflict.pageOrLocation,
            sourceInfo: p.conflict.sourceInfo || p.sourceInfo,
            source: 'ai',
            verificationBadge: 'Terbaca Jelas',
            isVerified: true,
            conflict: null,
          };
        }
        return {
          ...p,
          isVerified: true,
          conflict: null,
        };
      })
    );
  };

  const renderBadgePill = (badge?: AIVerificationBadge) => {
    if (!badge) return null;
    switch (badge) {
      case 'Terbaca Jelas':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
            Terbaca Jelas
          </span>
        );
      case 'Hasil Penggabungan':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
            Hasil Penggabungan
          </span>
        );
      case 'Tidak Ditemukan':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
            Tidak Ditemukan
          </span>
        );
      case 'Perlu Verifikasi':
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
            Perlu Verifikasi
          </span>
        );
    }
  };

  // Hitung live volume preview secara real-time saat parameter diubah
  const previewWork: ProjectWorkItem = {
    ...work,
    parameters: localParams,
  };
  const liveCalcResult = calculateWorkItemVolume(previewWork);

  const handleSave = (approveAiDraft: boolean = false) => {
    for (const p of localParams) {
      if (p.value !== null && p.value !== '' && (isNaN(Number(p.value)) || Number(p.value) < 0)) {
        setValidationError(`Parameter "${p.label || p.name}" harus berisi angka positif yang valid.`);
        return;
      }
      if (p.required && p.value !== null && p.value !== '' && Number(p.value) <= 0) {
        setValidationError(`Parameter wajib "${p.label || p.name}" harus lebih besar dari 0.`);
        return;
      }
    }

    const updatedParams = localParams.map((p) => ({
      ...p,
      isVerified: approveAiDraft ? true : p.isVerified,
      conflict: approveAiDraft ? null : p.conflict,
    }));

    const updated: ProjectWorkItem = {
      ...work,
      name: workName.trim() || work.name,
      parameters: updatedParams,
      aiVerificationStatus: approveAiDraft ? 'verified' : work.aiVerificationStatus,
      lastUpdated: new Date().toISOString(),
    };
    onSaveWork(updated);
    onClose();
  };

  const isAiDraft = work.origin === 'ai' && work.aiVerificationStatus === 'draft';
  const hasMissingRequired = localParams.some(
    (p) =>
      p.required &&
      (p.value === null || p.value === '' || isNaN(Number(p.value)) || Number(p.value) <= 0)
  );

  // Bangun substitusi rumus contoh
  const substitutionParts = localParams
    .filter((p) => p.value !== null && p.value !== '')
    .map((p) => `${p.label || p.name} = ${p.value} ${p.unit}`);

  const hasSegments = Array.isArray(work.segments) && work.segments.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-2xs">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900">{work.name}</h3>
                {work.elementCode && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-800">
                    Kode: {work.elementCode}
                  </span>
                )}
                {renderBadgePill(work.verificationBadge)}
                {isAiDraft && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                    <FileText className="w-2.5 h-2.5" />
                    Draf AI: Perlu Verifikasi
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {work.category} · {floorName || work.floorId}
                {work.elementLocation ? ` · Lokasi: ${work.elementLocation}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex items-center px-6 border-b border-slate-100 text-xs font-semibold gap-6 shrink-0 bg-white">
          <button
            onClick={() => setActiveTab('params')}
            className={`py-3 border-b-2 transition cursor-pointer ${
              activeTab === 'params'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Form Parameter Dimensi
          </button>
          <button
            onClick={() => setActiveTab('formula')}
            className={`py-3 border-b-2 transition cursor-pointer ${
              activeTab === 'formula'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Rumus &amp; Rincian Segmen
          </button>
          <button
            onClick={() => setActiveTab('source')}
            className={`py-3 border-b-2 transition cursor-pointer ${
              activeTab === 'source'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sumber &amp; Verifikasi
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {activeTab === 'params' && (
            <div className="space-y-4">
              {/* Editable Work Name Field */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/90">
                <label
                  htmlFor="edit-work-name-input"
                  className="text-xs font-bold text-slate-800 block mb-1.5"
                >
                  Nama Pekerjaan (Proyek Ini)
                </label>
                <input
                  id="edit-work-name-input"
                  type="text"
                  value={workName}
                  onChange={(e) => setWorkName(e.target.value)}
                  placeholder="Masukkan nama pekerjaan..."
                  className="w-full px-3.5 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  Mengubah nama pekerjaan di proyek ini tidak mengubah template standar USC global.
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Lengkapi parameter ukuran di bawah ini secara vertikal:</span>
                <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                  Satuan Volume: {work.unit}
                </span>
              </div>

              {/* Vertical Parameter Input Cards */}
              <div className="space-y-3.5">
                {localParams.map((param) => {
                  const isEmptyRequired =
                    param.required &&
                    (param.value === null ||
                      param.value === '' ||
                      isNaN(Number(param.value)) ||
                      Number(param.value) <= 0);

                  const defaultPlaceholder =
                    param.placeholder ||
                    `Masukkan ${(param.label || param.name).toLowerCase()} (${param.unit})`;

                  return (
                    <div
                      key={param.id}
                      className={`p-4 rounded-xl border transition ${
                        param.conflict
                          ? 'bg-rose-50/60 border-rose-300'
                          : isEmptyRequired
                          ? 'bg-amber-50/40 border-amber-300'
                          : 'bg-slate-50/70 border-slate-200/90'
                      }`}
                    >
                      {/* 1. Label Parameter di Atas Input */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <label
                          htmlFor={`param-input-${param.id}`}
                          className="text-xs font-bold text-slate-900 flex items-center gap-1"
                        >
                          <span>{param.label || param.name}</span>
                          <span className="text-slate-500 font-normal">({param.unit})</span>
                          {param.required && (
                            <span className="text-rose-600 font-bold ml-0.5" title="Parameter Wajib">
                              *
                            </span>
                          )}
                        </label>

                        {/* Badge Status Parameter */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {renderBadgePill(param.verificationBadge)}

                          {param.source === 'ai' && param.value !== null && param.value !== '' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-100/90 px-2 py-0.5 rounded-md">
                              <ScanLine className="w-2.5 h-2.5" />
                              Terbaca AI
                              {param.rawExtractedValue !== undefined && param.rawUnit
                                ? ` (${param.rawExtractedValue} ${param.rawUnit})`
                                : ''}
                            </span>
                          ) : param.value !== null && param.value !== '' ? (
                            <span className="text-[10px] font-medium text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                              Terisi ({param.value} {param.unit})
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                              {param.required ? 'Wajib Diisi: Belum Ada Nilai' : 'Opsional (Kosong)'}
                            </span>
                          )}

                          {param.drawingType && (
                            <span className="text-[10px] font-medium text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                              {param.drawingType}
                              {param.pageNumber ? ` (Hal. ${param.pageNumber})` : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 2. Kotak Input Vertikal Penuh dengan Satuan Jelas */}
                      <div className="relative flex items-center">
                        <input
                          id={`param-input-${param.id}`}
                          type="number"
                          min="0"
                          step="any"
                          placeholder={defaultPlaceholder}
                          value={param.value ?? ''}
                          onChange={(e) => handleParamChange(param.id, e.target.value)}
                          className={`w-full pl-3.5 pr-16 py-2.5 text-sm font-mono font-bold bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-slate-900 placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 ${
                            isEmptyRequired ? 'border-amber-400' : 'border-slate-300'
                          }`}
                        />
                        <div className="absolute right-2 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 pointer-events-none">
                          {param.unit}
                        </div>
                      </div>

                      {(param.sourceInfo || param.pageOrLocation) && (
                        <p className="text-[11px] text-slate-600 mt-1.5 flex items-center gap-1">
                          <Ruler className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>
                            Sumber Gambar:{' '}
                            <strong>{param.sourceInfo || param.pageOrLocation}</strong>
                          </span>
                        </p>
                      )}

                      {/* Conflict Resolution Box if another drawing has a different value */}
                      {param.conflict && (
                        <div className="mt-3 pt-2.5 border-t border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                          <div className="flex items-start gap-1.5 text-rose-800">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                            <span>
                              Dokumen <strong>{param.conflict.sourceDocument}</strong> mencantumkan
                              nilai berbeda:{' '}
                              <strong>
                                {param.conflict.newValue} {param.unit}
                              </strong>{' '}
                              (tertulis {param.conflict.rawExtractedValue} {param.conflict.rawUnit})
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleResolveConflict(param.id, false)}
                              className="px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold transition cursor-pointer"
                            >
                              Pertahankan ({param.value})
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResolveConflict(param.id, true)}
                              className="px-2.5 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 font-semibold transition cursor-pointer"
                            >
                              Gunakan Nilai Baru ({param.conflict.newValue})
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Tabel Rincian Segmen Balok / Sloof (Jika ada) */}
              {hasSegments && (
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-950">
                      <Table2 className="w-4 h-4 text-blue-600" />
                      <span>Rincian Penjumlahan Segmen ({work.segments!.length} Jalur Segmen)</span>
                    </div>
                    <span className="text-[11px] font-semibold text-blue-700">
                      Total Panjang ={' '}
                      {formatIndonesianNumber(
                        work.segments!.reduce((acc, s) => acc + (s.subtotalMeters || 0), 0)
                      )}{' '}
                      m
                    </span>
                  </div>
                  <div className="border border-blue-200/80 rounded-lg overflow-hidden bg-white">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                          <th className="py-2 px-2.5">Tipe</th>
                          <th className="py-2 px-2.5">Segmen</th>
                          <th className="py-2 px-2.5">Lokasi Grid</th>
                          <th className="py-2 px-2.5 text-right">Panjang (m)</th>
                          <th className="py-2 px-2.5 text-center">Jml</th>
                          <th className="py-2 px-2.5 text-right">Subtotal (m)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {work.segments!.map((seg) => (
                          <tr key={seg.id} className="hover:bg-slate-50/70">
                            <td className="py-1.5 px-2.5 font-mono font-bold text-blue-800">
                              {seg.elementCode}
                            </td>
                            <td className="py-1.5 px-2.5 text-slate-800">{seg.segmentName}</td>
                            <td className="py-1.5 px-2.5 font-mono text-slate-600">
                              {seg.gridLocation}
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-mono">
                              {formatIndonesianNumber(seg.lengthMeters)}
                            </td>
                            <td className="py-1.5 px-2.5 text-center font-mono">{seg.count || 1}</td>
                            <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">
                              {formatIndonesianNumber(seg.subtotalMeters)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Rumus & Hasil Perhitungan Otomatis di Bawah Form */}
              <div className="p-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
                    Rumus Perhitungan Pekerjaan
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900 block">
                    Volume = {work.formulaDisplay || 'Perkalian Parameter'}
                  </span>
                  {substitutionParts.length > 0 && (
                    <span className="text-[11px] font-mono text-slate-600 block">
                      {substitutionParts.join(' · ')}
                    </span>
                  )}
                </div>

                <div className="text-left sm:text-right shrink-0 bg-white px-4 py-2.5 rounded-xl border border-blue-200 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Hasil Volume Otomatis
                  </span>
                  <span
                    className={`text-base font-mono font-bold block ${
                      liveCalcResult.volume !== null ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {liveCalcResult.volume !== null
                      ? `${formatIndonesianNumber(liveCalcResult.volume)} ${work.unit}`
                      : 'Menunggu Parameter Wajib'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'formula' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100">
                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block mb-1">
                  Rumus Perhitungan Volume
                </span>
                <p className="text-sm font-bold text-blue-950 font-mono">
                  {work.formulaDisplay || 'V = perkalian parameter'}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Substitusi Nilai Parameter
                </span>
                <p className="font-mono text-slate-800 leading-relaxed">
                  {substitutionParts.length > 0
                    ? substitutionParts.join(' ; ')
                    : 'Belum ada parameter yang diinput.'}
                </p>
              </div>

              {hasSegments && (
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Tabel Rincian Segmen Balok / Sloof
                  </span>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                          <th className="py-2 px-3">Tipe</th>
                          <th className="py-2 px-3">Segmen</th>
                          <th className="py-2 px-3">Lokasi Grid</th>
                          <th className="py-2 px-3 text-right">Panjang (m)</th>
                          <th className="py-2 px-3 text-center">Jml</th>
                          <th className="py-2 px-3 text-right">Subtotal (m)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {work.segments!.map((seg) => (
                          <tr key={seg.id}>
                            <td className="py-2 px-3 font-mono font-bold text-blue-700">
                              {seg.elementCode}
                            </td>
                            <td className="py-2 px-3">{seg.segmentName}</td>
                            <td className="py-2 px-3 font-mono text-slate-600">
                              {seg.gridLocation}
                            </td>
                            <td className="py-2 px-3 text-right font-mono">
                              {formatIndonesianNumber(seg.lengthMeters)}
                            </td>
                            <td className="py-2 px-3 text-center font-mono">{seg.count || 1}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold">
                              {formatIndonesianNumber(seg.subtotalMeters)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Volume Terhitung Saat Ini
                  </span>
                  <span className="text-xl font-bold text-emerald-950 font-mono">
                    {liveCalcResult.volume !== null
                      ? `${formatIndonesianNumber(liveCalcResult.volume)} ${work.unit}`
                      : 'Menunggu parameter lengkap'}
                  </span>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                  {liveCalcResult.status}
                </span>
              </div>
            </div>
          )}

          {activeTab === 'source' && (
            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Asal Pekerjaan</span>
                  <span className="font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
                    {work.origin === 'ai' ? 'Otomatis dari Analisis Gambar AI' : 'Input / Katalog Proyek'}
                  </span>
                </div>
                {work.sourceDocument && (
                  <p className="text-slate-600 text-[11px] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    Dokumen Sumber: <strong>{work.sourceDocument}</strong>
                  </p>
                )}
                {work.sourceInfo && (
                  <p className="text-slate-700 text-[11px]">
                    Halaman &amp; Jenis Gambar: <strong>{work.sourceInfo}</strong>
                  </p>
                )}
                {work.identificationReason && (
                  <p className="text-slate-500 text-[11px]">
                    Alasan Identifikasi: {work.identificationReason}
                  </p>
                )}
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block mb-0.5">Status Verifikasi Estimator</span>
                  <span className="font-bold text-slate-900 block text-sm">
                    {isAiDraft
                      ? 'Draf AI: Menunggu Persetujuan Pengguna'
                      : 'Terverifikasi (Masuk ke Rekap Volume Final)'}
                  </span>
                </div>
                {renderBadgePill(work.verificationBadge)}
              </div>

              {liveCalcResult.message && (
                <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/80 text-amber-900 text-xs">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p>{liveCalcResult.message}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/40 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Batal
            </button>

            {isAiDraft && onRejectDraftWork && (
              <button
                type="button"
                onClick={() => {
                  onRejectDraftWork(work.id);
                  onClose();
                }}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Tolak Usulan AI</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSave(false)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition shadow-2xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-blue-600" />
              <span>Simpan Parameter</span>
            </button>

            {isAiDraft && !hasMissingRequired && (
              <button
                onClick={() => handleSave(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Simpan &amp; Setujui Draf AI</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
