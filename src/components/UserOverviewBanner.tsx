/**
 * RuangEstimasi: Ringkasan Akun & Proyek Pengguna
 * Menampilkan ringkasan akun, proyek aktif, dan status pekerjaan.
 */

import React from 'react';
import {
  FolderKanban,
  Plus,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { ProjectData, UserProfile } from '../types';

interface UserOverviewBannerProps {
  user: UserProfile;
  projects: ProjectData[];
  activeProject: ProjectData;
  onSelectProject: (projectId: string) => void;
  onOpenProjectModal: () => void;
}

export const UserOverviewBanner: React.FC<UserOverviewBannerProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onOpenProjectModal,
}) => {
  const verifiedWorksCount = activeProject.works.filter(
    (w) => w.isActive && w.calculatedVolume !== null && w.aiVerificationStatus !== 'draft'
  ).length;

  const draftAiCount = activeProject.works.filter(
    (w) => w.isActive && w.origin === 'ai' && w.aiVerificationStatus === 'draft'
  ).length;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-5 px-0.5">
      {/* Left: Project Selector & Status Chips */}
      <div className="flex items-center gap-2.5 flex-wrap text-xs">
        {projects.length > 1 ? (
          <select
            value={activeProject.id}
            onChange={(e) => onSelectProject(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-black/[0.08] bg-white text-xs font-semibold text-slate-800 shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20"
            title="Ganti Proyek Aktif"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.floorCount} Lantai)
              </option>
            ))}
          </select>
        ) : (
          <span className="text-xs font-semibold text-slate-700">
            {activeProject.name}
          </span>
        )}

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200/60 shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>{verifiedWorksCount} Terverifikasi</span>
        </span>

        {draftAiCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold border border-indigo-200/60 shadow-2xs">
            <FileText className="w-3.5 h-3.5" />
            <span>{draftAiCount} Draf AI</span>
          </span>
        )}
      </div>

      {/* Right: Quick Manage Projects Button */}
      <button
        type="button"
        onClick={onOpenProjectModal}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-black/[0.04] hover:bg-black/[0.08] text-slate-700 text-xs font-medium transition cursor-pointer apple-press min-h-[32px]"
      >
        <FolderKanban className="w-3.5 h-3.5 text-[#0071E3]" />
        <span>Kelola Proyek ({projects.length})</span>
        <Plus className="w-3 h-3 text-slate-400" />
      </button>
    </div>
  );
};
