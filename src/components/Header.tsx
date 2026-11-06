import React, { useState, useEffect } from 'react';
import {
  Layers,
  Pencil,
  Check,
  Plus,
  Save,
  Download,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  UserCog,
} from 'lucide-react';
import { ProjectData, UserProfile } from '../types';
import { getInitials } from '../services/authService';

interface HeaderProps {
  user: UserProfile;
  project: ProjectData;
  onUpdateProjectName: (newName: string) => void;
  onOpenFloors: () => void;
  onNewProject: () => void;
  onSaveProject: () => void;
  onExportExcel: () => void;
  onOpenMobileMenu: () => void;
  onOpenUserProfile: () => void;
  onLogout: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
  isSaving?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  project,
  onUpdateProjectName,
  onOpenFloors,
  onNewProject,
  onSaveProject,
  onExportExcel,
  onOpenMobileMenu,
  onOpenUserProfile,
  onLogout,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
  isSaving,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(project.name);

  useEffect(() => {
    setTitleInput(project.name);
  }, [project.name]);

  const handleTitleSubmit = () => {
    if (titleInput.trim()) {
      onUpdateProjectName(titleInput.trim());
    } else {
      setTitleInput(project.name);
    }
    setIsEditingTitle(false);
  };

  const formattedDate = new Date(project.createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 apple-glass border-b border-black/[0.08] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Mobile Toggle + Project Title & Quick Meta */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 rounded-xl bg-black/[0.04] hover:bg-black/[0.08] text-slate-700 transition shrink-0 cursor-pointer apple-press"
              aria-label="Buka Menu Navigasi"
              title="Buka Menu Navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>

            {onToggleSidebarCollapse && (
              <button
                onClick={onToggleSidebarCollapse}
                className="hidden md:inline-flex p-2 rounded-xl bg-black/[0.04] hover:bg-black/[0.08] text-slate-600 transition shrink-0 cursor-pointer apple-press"
                title={isSidebarCollapsed ? 'Lebarkan Sidebar Menu' : 'Ciutkan Sidebar Menu'}
                aria-label={isSidebarCollapsed ? 'Lebarkan Sidebar Menu' : 'Ciutkan Sidebar Menu'}
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
            )}

            <div className="min-w-0 flex items-center gap-3 flex-wrap">
              {isEditingTitle ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                    className="text-lg font-bold tracking-tight text-slate-900 bg-white border border-[#0071E3] rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20"
                    autoFocus
                  />
                  <button
                    onClick={handleTitleSubmit}
                    className="p-1.5 rounded-lg bg-[#0071E3] text-white hover:bg-[#0077ED] transition cursor-pointer apple-press"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-[-0.025em] truncate">
                    {project.name}
                  </h1>
                  <button
                    onClick={() => {
                      setTitleInput(project.name);
                      setIsEditingTitle(true);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition shrink-0 cursor-pointer apple-press"
                    title="Ubah Nama Proyek"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Compact Meta Badges */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={onOpenFloors}
                  title="Kelola Lantai Proyek"
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-slate-700 font-medium transition cursor-pointer apple-press"
                >
                  <Layers className="w-3 h-3 text-[#0071E3]" />
                  <span>{project.floorCount} Lantai</span>
                </button>
                <span className="text-[11px] text-slate-400">
                  · {project.works.filter((w) => w.isActive).length} Pekerjaan
                </span>
                <span className="text-[11px] text-slate-400 hidden lg:inline">
                  · {formattedDate}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions & User Avatar */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              onClick={onNewProject}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-black/[0.04] hover:bg-black/[0.08] rounded-xl transition cursor-pointer apple-press min-h-[34px]"
            >
              <Plus className="w-3.5 h-3.5" />
              Proyek
            </button>
            <button
              onClick={onSaveProject}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-black/[0.04] hover:bg-black/[0.08] rounded-xl transition cursor-pointer apple-press min-h-[34px]"
            >
              <Save className="w-3.5 h-3.5 text-[#0071E3]" />
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button
              onClick={onExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0071E3] hover:bg-[#0077ED] active:bg-[#0062C4] rounded-xl transition shadow-2xs cursor-pointer apple-press min-h-[34px]"
            >
              <Download className="w-3.5 h-3.5" />
              Ekspor Excel
            </button>

            <div className="h-5 w-px bg-black/[0.08] mx-0.5 hidden sm:block" />

            {/* User Profile Pill & Logout (Apple Style Chip) */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenUserProfile}
                title="Pengaturan Profil Akun"
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-black/[0.03] hover:bg-black/[0.06] border border-black/[0.06] transition cursor-pointer apple-press"
              >
                <div className="w-6 h-6 rounded-full bg-[#0071E3] text-white flex items-center justify-center text-[10px] font-bold shadow-2xs shrink-0">
                  {getInitials(user.fullName)}
                </div>
                <div className="text-left hidden md:block max-w-[120px]">
                  <span className="text-xs font-semibold text-slate-800 block leading-tight truncate">
                    {user.fullName}
                  </span>
                  <span className="text-[10px] text-[#0071E3] font-medium block leading-none truncate">
                    {user.userType}
                  </span>
                </div>
                <UserCog className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              <button
                type="button"
                onClick={onLogout}
                title="Keluar dari Akun (Logout)"
                className="p-2 rounded-full bg-black/[0.03] hover:bg-rose-50 hover:text-rose-600 text-slate-500 border border-black/[0.06] transition cursor-pointer apple-press"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
