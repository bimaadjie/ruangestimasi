/**
 * RuangEstimasi: Asisten Ekstraksi & Input Manual
 * Menampilkan kartu Asisten Ekstraksi berdampingan dengan kartu Input Manual.
 */

import React from 'react';
import {
  FileSpreadsheet,
  FileEdit,
  ScanText,
} from 'lucide-react';
import { FloorItem, ProjectWorkItem } from '../types';

interface AutoQuantityTakeoffSectionProps {
  floors: FloorItem[];
  activeFloorId: string;
  onOpenManualForm: (floorId: string) => void;
  onOpenDetailedModal: () => void;
  existingWorks: ProjectWorkItem[];
}

export const AutoQuantityTakeoffSection: React.FC<AutoQuantityTakeoffSectionProps> = ({
  floors,
  activeFloorId,
  onOpenManualForm,
  onOpenDetailedModal,
  existingWorks,
}) => {
  const activeDraftCount = existingWorks.filter(
    (w) => w.isActive && w.origin === 'ai' && w.aiVerificationStatus === 'draft'
  ).length;

  const targetFloor = floors.find((f) => f.id === activeFloorId) || floors[1] || floors[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 items-stretch">
      {/* Left Card: AI Takeoff Assistant */}
      <div className="apple-glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:shadow-[0_6px_20px_rgba(0,0,0,0.04)] transition-all group">
        <div>
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#0071E3] to-[#005bb5] text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <ScanText className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-semibold tracking-[-0.015em] text-slate-900 leading-tight">
                    Ekstraksi Denah (AI)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0071E3]/10 text-[#0071E3] tracking-wide">
                    Multi-Gambar
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                  Pindai denah arsitektur &amp; struktur untuk draf volume otomatis.
                </p>
              </div>
            </div>

            {activeDraftCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 shrink-0">
                {activeDraftCount} Draf AI
              </span>
            )}
          </div>
        </div>

        <div className="mt-3.5 pt-3 border-t border-black/[0.05]">
          <button
            type="button"
            onClick={onOpenDetailedModal}
            className="w-full py-2.5 px-4 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] active:bg-[#0062C4] text-white font-semibold text-xs transition shadow-2xs flex items-center justify-center gap-2 cursor-pointer apple-press min-h-[38px]"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Buka Asisten Ekstraksi</span>
          </button>
        </div>
      </div>

      {/* Right Card: Manual Input */}
      <div className="apple-glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:shadow-[0_6px_20px_rgba(0,0,0,0.04)] transition-all group">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-black/[0.05] text-slate-800 border border-black/[0.05] flex items-center justify-center shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
              <FileEdit className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-semibold tracking-[-0.015em] text-slate-900 leading-tight">
                  Input Manual
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/[0.04] text-slate-600">
                  {targetFloor?.name || 'Lantai 1'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                Pilih pekerjaan dari katalog standar atau kustom per lantai.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3.5 pt-3 border-t border-black/[0.05]">
          <button
            type="button"
            onClick={() => onOpenManualForm(activeFloorId)}
            className="w-full py-2.5 px-4 rounded-xl bg-black/[0.04] hover:bg-black/[0.08] active:bg-black/[0.12] text-slate-800 font-semibold text-xs border border-black/[0.06] transition shadow-2xs flex items-center justify-center cursor-pointer apple-press min-h-[38px]"
          >
            Buka Form Input
          </button>
        </div>
      </div>
    </div>
  );
};
