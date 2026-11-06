import React from 'react';
import { Box, Layers, Ruler, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { ProjectWorkItem } from '../types';
import { computeProjectSummaries, formatIndonesianNumber } from '../services/calculationEngine';

interface RecapCardsProps {
  works: ProjectWorkItem[];
  onApproveAllReadyDrafts?: () => void;
}

export const RecapCards: React.FC<RecapCardsProps> = ({ works, onApproveAllReadyDrafts }) => {
  const summaries = computeProjectSummaries(works);

  const stats = [
    {
      label: 'Volume Beton (Terverifikasi)',
      value: `${formatIndonesianNumber(summaries.totalBetonM3)} m³`,
      draftValue:
        summaries.draftBetonM3 > 0
          ? `+ ${formatIndonesianNumber(summaries.draftBetonM3)} m³ draf AI`
          : null,
      icon: Box,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50/80',
      borderColor: 'border-blue-100',
    },
    {
      label: 'Luas Pekerjaan (Terverifikasi)',
      value: `${formatIndonesianNumber(summaries.totalLuasM2)} m²`,
      draftValue:
        summaries.draftLuasM2 > 0
          ? `+ ${formatIndonesianNumber(summaries.draftLuasM2)} m² draf AI`
          : null,
      icon: Layers,
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-50/80',
      borderColor: 'border-indigo-100',
    },
    {
      label: 'Panjang Pekerjaan (Terverifikasi)',
      value: `${formatIndonesianNumber(summaries.totalPanjangM)} m`,
      draftValue:
        summaries.draftPanjangM > 0
          ? `+ ${formatIndonesianNumber(summaries.draftPanjangM)} m draf AI`
          : null,
      icon: Ruler,
      color: 'text-teal-700',
      bgColor: 'bg-teal-50/80',
      borderColor: 'border-teal-100',
    },
    {
      label: 'Jumlah Pekerjaan',
      value: `${summaries.totalWorks} item`,
      draftValue:
        summaries.draftWorksCount > 0
          ? `${summaries.draftWorksCount} draf AI menunggu verifikasi`
          : `${summaries.completedWorks} terverifikasi lengkap`,
      icon: FileText,
      color: 'text-slate-700',
      bgColor: 'bg-slate-100',
      borderColor: 'border-slate-200',
    },
  ];

  return (
    <div className="mt-7 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-slate-900">
            Rekap Total Volume Terverifikasi (Bangunan)
          </h4>
          <p className="text-xs text-slate-500">
            Hanya menjumlahkan pekerjaan yang sudah terverifikasi. Pekerjaan berstatus Draf AI dipisahkan hingga disetujui.
          </p>
        </div>

        {summaries.draftWorksCount > 0 && (
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl">
            <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="text-xs font-semibold text-indigo-900">
              {summaries.draftWorksCount} Draf AI ({summaries.readyDraftWorksCount} siap disetujui
              {summaries.incompleteDraftWorksCount > 0
                ? `, ${summaries.incompleteDraftWorksCount} belum lengkap`
                : ''}
              )
            </span>
            {summaries.readyDraftWorksCount > 0 && onApproveAllReadyDrafts && (
              <button
                onClick={onApproveAllReadyDrafts}
                className="ml-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Setujui ({summaries.readyDraftWorksCount})</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-3.5 hover:border-slate-300 transition"
            >
              <div
                className={`w-11 h-11 rounded-xl ${stat.bgColor} ${stat.borderColor} border flex items-center justify-center shrink-0`}
              >
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs text-slate-500 font-medium block truncate">
                  {stat.label}
                </span>
                <span className="text-base font-bold text-slate-900 font-mono tracking-tight block truncate">
                  {stat.value}
                </span>
                {stat.draftValue && (
                  <span className="text-[11px] font-semibold text-indigo-600 block truncate mt-0.5">
                    {stat.draftValue}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {summaries.conflictWorksCount > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>
            Terdapat <strong>{summaries.conflictWorksCount} pekerjaan</strong> dengan perbedaan dimensi antar gambar. Buka detail pekerjaan terkait untuk memilih dimensi yang digunakan.
          </span>
        </div>
      )}
    </div>
  );
};
