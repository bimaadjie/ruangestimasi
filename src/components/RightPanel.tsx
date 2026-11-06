import React from 'react';
import {
  Building,
  Download,
  FileCheck2,
  Layers,
  Ruler,
  Info,
} from 'lucide-react';
import { ProjectData } from '../types';
import { computeProjectSummaries, formatIndonesianNumber } from '../services/calculationEngine';

interface RightPanelProps {
  project: ProjectData;
  onExportExcel: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  project,
  onExportExcel,
}) => {
  const summaries = computeProjectSummaries(project.works);
  const activeCount = project.works.filter((w) => w.isActive).length;
  const isAllComplete = activeCount > 0 && summaries.pendingWorks === 0;

  return (
    <div className="space-y-5">
      {/* 1. Ringkasan Proyek Card */}
      <div className="apple-glass-card rounded-3xl p-5 transition-all">
        <h4 className="text-sm font-semibold tracking-[-0.015em] text-slate-900 mb-3.5 flex items-center justify-between">
          <span>Ringkasan Proyek</span>
          <span
            className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full border ${
              isAllComplete
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                : 'bg-[#0071E3]/10 text-[#0071E3] border-[#0071E3]/20'
            }`}
          >
            {isAllComplete ? 'Kalkulasi Lengkap' : 'Dalam Proses'}
          </span>
        </h4>

        <div className="flex items-center gap-3.5 py-1">
          {/* Building Illustration Vector */}
          <div className="w-14 h-14 rounded-2xl bg-[#0071E3]/10 border border-[#0071E3]/15 flex items-center justify-center shrink-0 overflow-hidden relative text-[#0071E3] shadow-2xs">
            <Building className="w-7 h-7 stroke-[1.5]" />
          </div>

          <div className="space-y-0.5 text-xs min-w-0 flex-1">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">Nama Proyek</span>
              <span className="font-semibold text-slate-900 block truncate tracking-tight">
                {project.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <span>{project.floorCount} Lantai</span>
              <span>·</span>
              <span>{activeCount} Pekerjaan</span>
            </div>
          </div>
        </div>

        {/* Quick Summary Breakdown */}
        <div className="mt-4 pt-3.5 border-t border-black/[0.06] space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Terverifikasi Lengkap:</span>
            </span>
            <strong className="font-medium text-slate-900">{summaries.completedWorks} item</strong>
          </div>

          {summaries.draftWorksCount > 0 && (
            <div className="flex items-center justify-between text-[#0071E3] bg-[#0071E3]/[0.08] px-2.5 py-1 rounded-xl">
              <span>Draf AI Menunggu Verifikasi:</span>
              <strong className="font-semibold">{summaries.draftWorksCount} item</strong>
            </div>
          )}

          {summaries.pendingWorks > 0 && (
            <div className="flex items-center justify-between text-amber-800 bg-amber-500/10 px-2.5 py-1 rounded-xl">
              <span>Perlu Input / Belum Lengkap:</span>
              <strong className="font-semibold">{summaries.pendingWorks} item</strong>
            </div>
          )}
        </div>

        {/* Primary CTA Export Button */}
        <button
          onClick={onExportExcel}
          className="w-full mt-4 py-3 px-4 min-h-[44px] rounded-2xl bg-[#0071E3] hover:bg-[#0077ED] active:bg-[#0062C4] text-white font-semibold text-xs transition shadow-2xs flex items-center justify-center gap-2 cursor-pointer apple-press"
        >
          <Download className="w-4 h-4" />
          <span>Ekspor Excel (.xlsx)</span>
        </button>
      </div>

      {/* 2. Panduan & Tips Ringkas */}
      <div className="apple-glass-card rounded-3xl p-4 text-xs space-y-2.5 transition-all">
        <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs tracking-tight">
          <Info className="w-3.5 h-3.5 text-[#0071E3] shrink-0" />
          <span>Tips Cepat</span>
        </div>

        {summaries.draftWorksCount > 0 && (
          <p className="text-amber-800 bg-amber-500/10 border border-amber-500/20 rounded-xl px-2.5 py-1.5 text-[11px] leading-snug">
            Setujui draf AI agar volumenya masuk ke rekap total proyek.
          </p>
        )}

        <div className="text-[11px] text-slate-500 space-y-1.5">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Tambah pekerjaan langsung per lantai.</span>
          </div>
          <div className="flex items-center gap-2">
            <Ruler className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Dimensi cm otomatis dikonversi ke meter (300 cm = 3 m).</span>
          </div>
        </div>
      </div>
    </div>
  );
};
