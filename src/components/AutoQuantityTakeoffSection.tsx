/**
 * RuangEstimasi: Action Bar Tambah / Ekstraksi Pekerjaan
 * Menggabungkan opsi Ekstraksi Denah AI dan Input Manual ke dalam satu tombol aksi terpadu.
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  ScanText,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { FloorItem, ProjectWorkItem } from '../types';
import { AddWorkActionModal } from './AddWorkActionModal';

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
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const activeDraftCount = existingWorks.filter(
    (w) => w.isActive && w.origin === 'ai' && w.aiVerificationStatus === 'draft'
  ).length;

  return (
    <>
      <div className="apple-glass-card rounded-2xl p-3.5 sm:p-4 mb-5 flex flex-wrap items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-shadow">
        {/* Left: Icon & Description */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0071E3] to-[#005bb5] text-white flex items-center justify-center shadow-xs shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold tracking-tight text-slate-900 leading-tight">
                Input Pekerjaan &amp; Ekstraksi Denah
              </h3>
              {activeDraftCount > 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0071E3]/10 text-[#0071E3]">
                  <FileText className="w-3 h-3" />
                  <span>{activeDraftCount} Draf AI Siap Verifikasi</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/[0.04] text-slate-600">
                  AI + Katalog Standar USC
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              Pindai denah otomatis dengan AI atau input manual dari katalog pekerjaan standar.
            </p>
          </div>
        </div>

        {/* Right: Single Consolidated Primary Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] active:bg-[#0062C4] text-white text-xs font-bold shadow-xs transition cursor-pointer apple-press min-h-[38px]"
            title="Buka pilihan metode input pekerjaan"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah / Ekstraksi Pekerjaan</span>
            <ChevronRight className="w-3.5 h-3.5 text-white/80 -mr-0.5" />
          </button>
        </div>
      </div>

      {/* Action Dialog / Modal */}
      <AddWorkActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        floors={floors}
        activeFloorId={activeFloorId}
        onSelectAI={onOpenDetailedModal}
        onSelectManual={onOpenManualForm}
        existingWorks={existingWorks}
      />
    </>
  );
};
