/**
 * RuangEstimasi: Modal Pemilihan Metode Input Pekerjaan
 * Menggabungkan Ekstraksi Denah AI dan Input Manual ke dalam satu dialog interaktif Apple-style.
 */

import React, { useState } from 'react';
import {
  X,
  ScanText,
  FileEdit,
  Sparkles,
  ArrowRight,
  Layers,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { FloorItem, ProjectWorkItem } from '../types';

interface AddWorkActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  floors: FloorItem[];
  activeFloorId?: string;
  onSelectAI: () => void;
  onSelectManual: (floorId: string) => void;
  existingWorks?: ProjectWorkItem[];
}

export const AddWorkActionModal: React.FC<AddWorkActionModalProps> = ({
  isOpen,
  onClose,
  floors,
  activeFloorId,
  onSelectAI,
  onSelectManual,
  existingWorks = [],
}) => {
  const [selectedFloor, setSelectedFloor] = useState<string>(
    activeFloorId || floors[1]?.id || floors[0]?.id || ''
  );

  if (!isOpen) return null;

  const draftAiCount = existingWorks.filter(
    (w) => w.isActive && w.origin === 'ai' && w.aiVerificationStatus === 'draft'
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Modal Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-black/[0.06] flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0071E3] to-[#005bb5] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                Tambah Pekerjaan ke Proyek
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih metode input volume yang ingin Anda gunakan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer apple-press"
            title="Tutup dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Cards */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Ekstraksi Denah AI */}
          <div
            onClick={() => {
              onClose();
              onSelectAI();
            }}
            className="group relative rounded-2xl border-2 border-transparent hover:border-[#0071E3] bg-gradient-to-b from-blue-50/50 to-white hover:from-blue-50/80 p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md apple-press"
          >
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#0071E3] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <ScanText className="w-6 h-6 text-white" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#0071E3]/10 text-[#0071E3] tracking-wide">
                  Rekomendasi Cepat
                </span>
              </div>

              <h4 className="text-base font-bold text-slate-900 tracking-tight group-hover:text-[#0071E3] transition-colors">
                Ekstraksi Denah (AI)
              </h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Pindai gambar denah arsitektur &amp; struktur (PDF, PNG, JPG). AI membaca dimensi tertulis dan menyusun draf volume otomatis.
              </p>

              {/* Feature Highlights */}
              <div className="mt-3.5 space-y-1.5 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0071E3] shrink-0" />
                  <span>Dukung PDF multi-halaman &amp; foto denah</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0071E3] shrink-0" />
                  <span>Deteksi grid as, sloof, balok &amp; dinding</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-blue-100/70 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#0071E3]">
                {draftAiCount > 0 ? `${draftAiCount} draf aktif` : 'Mulai pindai denah'}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-[#0071E3] px-3 py-1.5 rounded-xl shadow-2xs group-hover:bg-[#0077ED] transition-colors">
                <span>Buka AI</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>

          {/* Card 2: Input Manual dari Katalog */}
          <div className="group rounded-2xl border-2 border-transparent hover:border-slate-400 bg-slate-50/70 hover:bg-slate-50 p-5 flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-md">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 text-slate-800 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <FileEdit className="w-5 h-5 text-slate-700" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-200/80 text-slate-700">
                  Standar USC
                </span>
              </div>

              <h4 className="text-base font-bold text-slate-900 tracking-tight">
                Input Manual dari Katalog
              </h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Pilih satu atau banyak pekerjaan dari katalog standar (Pondasi, Dinding, Beton, Cat, Plafond) atau buat item kustom.
              </p>

              {/* Target Floor Selector */}
              <div className="mt-3.5">
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-slate-500" />
                  <span>Target Lantai:</span>
                </label>
                <select
                  value={selectedFloor}
                  onChange={(e) => setSelectedFloor(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 transition cursor-pointer"
                >
                  {floors.map((fl) => (
                    <option key={fl.id} value={fl.id}>
                      {fl.name} {fl.elevation ? `(${fl.elevation})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-slate-200/80 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">
                Pilih per kelompok lantai
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSelectManual(selectedFloor);
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-xl shadow-2xs transition cursor-pointer apple-press"
              >
                <span>Buka Form</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 border-t border-black/[0.06] text-center text-[11px] text-slate-500">
          Semua draf pekerjaan AI maupun input manual dapat diverifikasi dan disesuaikan rumusnya kapan saja.
        </div>
      </div>
    </div>
  );
};
