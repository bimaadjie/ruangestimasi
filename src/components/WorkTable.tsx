import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Clock,
  Copy,
  Trash2,
  Layers,
  ScanLine,
  Check,
  Pencil,
  AlertTriangle,
  FileText,
  RotateCcw,
  CheckSquare,
  Square,
  Maximize2,
  Minimize2,
  FolderOpen,
  Folder,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { AIVerificationBadge, FloorItem, ProjectWorkItem, WorkCategory } from '../types';
import { formatIndonesianNumber } from '../services/calculationEngine';

interface WorkTableProps {
  projectId?: string;
  userId?: string;
  works: ProjectWorkItem[];
  floors: FloorItem[];
  onOpenWorkDetail: (work: ProjectWorkItem) => void;
  onOpenAddWork: (floorId?: string) => void;
  onDeleteWork: (workId: string) => void;
  onDeleteMultipleWorks?: (workIds: string[]) => void;
  onRestoreDeletedWorks?: () => void;
  recentlyDeletedCount?: number;
  onRestoreStandardFloorWorks?: (floorId: string) => void;
  onDuplicateWork: (work: ProjectWorkItem) => void;
  onToggleActive: (workId: string) => void;
  onApproveDraftWork?: (workId: string) => void;
  onApproveAllReadyDrafts?: () => void;
  activeStatusFilter?: 'all' | 'ai_draft' | 'incomplete';
  onStatusFilterChange?: (filter: 'all' | 'ai_draft' | 'incomplete') => void;
}

const CANONICAL_CATEGORIES: WorkCategory[] = [
  'Persiapan Dll',
  'Struktural',
  'Arsitektural',
  'MEP',
];

export const WorkTable: React.FC<WorkTableProps> = ({
  projectId = 'default',
  userId = 'default',
  works,
  floors,
  onOpenWorkDetail,
  onOpenAddWork,
  onDeleteWork,
  onDeleteMultipleWorks,
  onRestoreDeletedWorks,
  recentlyDeletedCount = 0,
  onRestoreStandardFloorWorks,
  onDuplicateWork,
  onToggleActive,
  onApproveDraftWork,
  onApproveAllReadyDrafts,
  activeStatusFilter = 'all',
  onStatusFilterChange,
}) => {
  const [selectedFloorTab, setSelectedFloorTab] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [localStatusFilter, setLocalStatusFilter] = useState<
    'all' | 'belum_diisi' | 'tidak_lengkap' | 'perlu_verifikasi' | 'terverifikasi'
  >('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [collapsedFloors, setCollapsedFloors] = useState<Record<string, boolean>>({});
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState<boolean>(false);
  const filterPopoverRef = React.useRef<HTMLDivElement>(null);

  // Close filter popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterPopoverRef.current &&
        !filterPopoverRef.current.contains(event.target as Node)
      ) {
        setIsFilterPopoverOpen(false);
      }
    };
    if (isFilterPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterPopoverOpen]);

  // State laci/accordion kategori per lantai: key = `${floorId}::${category}`
  // Disimpan secara terpisah per (userId, projectId) agar status buka/tutup setiap lantai tetap terjaga independen
  const accordionStorageKey = `ruangestimasi_accordion_v1_${userId}_${projectId}`;
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(accordionStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {
      // ignore
    }
    return {};
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(accordionStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setOpenCategories(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }
    setOpenCategories({});
  }, [accordionStorageKey]);

  const updateOpenCategories = (
    updater: (prev: Record<string, boolean>) => Record<string, boolean>
  ) => {
    setOpenCategories((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(accordionStorageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [workToDelete, setWorkToDelete] = useState<ProjectWorkItem | null>(null);

  const [selectedWorkIds, setSelectedWorkIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState<boolean>(false);

  const categories: string[] = ['Semua', 'Persiapan Dll', 'Struktural', 'Arsitektural', 'MEP'];

  const toggleFloorCollapse = (floorId: string) => {
    setCollapsedFloors((prev) => ({
      ...prev,
      [floorId]: !prev[floorId],
    }));
  };

  /**
   * Buka/tutup satu laci kategori pada satu lantai secara independen.
   * Membuka/menutup kategori ini TIDAK mengubah status kategori lain maupun lantai lain.
   */
  const toggleCategoryDrawer = (floorId: string, category: WorkCategory) => {
    const key = `${floorId}::${category}`;
    updateOpenCategories((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  /**
   * Tombol "Show All" untuk membuka seluruh kategori pada lantai tertentu (atau lantai yang sedang dilihat)
   */
  const handleShowAllForFloor = (floorId: string) => {
    setCollapsedFloors((prev) => ({
      ...prev,
      [floorId]: false,
    }));
    updateOpenCategories((prev) => {
      const next = { ...prev };
      for (const cat of CANONICAL_CATEGORIES) {
        next[`${floorId}::${cat}`] = true;
      }
      return next;
    });
  };

  /**
   * Tombol "Minimalis" untuk menutup seluruh kategori pada lantai tertentu (atau lantai yang sedang dilihat)
   * sehingga hanya bar kategori yang terlihat rapi.
   */
  const handleMinimalisForFloor = (floorId: string) => {
    setCollapsedFloors((prev) => ({
      ...prev,
      [floorId]: false,
    }));
    updateOpenCategories((prev) => {
      const next = { ...prev };
      for (const cat of CANONICAL_CATEGORIES) {
        next[`${floorId}::${cat}`] = false;
      }
      return next;
    });
  };

  /**
   * Tombol "Show All" / "Minimalis" pada toolbar utama untuk lantai yang sedang dilihat
   */
  const handleToolbarShowAll = () => {
    const targetFloors =
      selectedFloorTab === 'ALL'
        ? floors.map((f) => f.id)
        : [selectedFloorTab];

    setCollapsedFloors((prev) => {
      const next = { ...prev };
      targetFloors.forEach((fid) => {
        next[fid] = false;
      });
      return next;
    });

    updateOpenCategories((prev) => {
      const next = { ...prev };
      for (const fid of targetFloors) {
        for (const cat of CANONICAL_CATEGORIES) {
          next[`${fid}::${cat}`] = true;
        }
      }
      return next;
    });
  };

  const handleToolbarMinimalis = () => {
    const targetFloors =
      selectedFloorTab === 'ALL'
        ? floors.map((f) => f.id)
        : [selectedFloorTab];

    setCollapsedFloors((prev) => {
      const next = { ...prev };
      targetFloors.forEach((fid) => {
        next[fid] = false;
      });
      return next;
    });

    updateOpenCategories((prev) => {
      const next = { ...prev };
      for (const fid of targetFloors) {
        for (const cat of CANONICAL_CATEGORIES) {
          next[`${fid}::${cat}`] = false;
        }
      }
      return next;
    });
  };

  const toggleSelectWork = (workId: string) => {
    setSelectedWorkIds((prev) => {
      const next = new Set(prev);
      if (next.has(workId)) {
        next.delete(workId);
      } else {
        next.add(workId);
      }
      return next;
    });
  };

  const toggleSelectGroupWorks = (groupWorks: ProjectWorkItem[]) => {
    if (groupWorks.length === 0) return;
    const allSelected = groupWorks.every((w) => selectedWorkIds.has(w.id));
    setSelectedWorkIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        groupWorks.forEach((w) => next.delete(w.id));
      } else {
        groupWorks.forEach((w) => next.add(w.id));
      }
      return next;
    });
  };

  // Hitung statistik Draf AI aktif
  const activeDraftWorks = works.filter(
    (w) =>
      w.isActive &&
      (w.aiVerificationStatus === 'draft' ||
        w.status === 'Perlu Verifikasi' ||
        w.status === 'Draf AI: Perlu Verifikasi' ||
        w.status === 'Draf AI — Perlu Verifikasi')
  );
  const readyDraftWorks = activeDraftWorks.filter((w) => w.calculatedVolume !== null);
  const incompleteDraftWorks = activeDraftWorks.filter((w) => w.calculatedVolume === null);

  const activeFilterCount =
    (selectedCategory !== 'Semua' ? 1 : 0) +
    (localStatusFilter !== 'all' ? 1 : 0);

  const getStatusFilterLabel = (status: string) => {
    switch (status) {
      case 'belum_diisi':
        return 'Belum Diisi';
      case 'tidak_lengkap':
        return 'Tidak Lengkap';
      case 'perlu_verifikasi':
        return 'Perlu Verifikasi';
      case 'terverifikasi':
        return 'Terverifikasi';
      default:
        return 'Semua Status';
    }
  };

  // Filter works by floor tab, category, status filter, and search text
  const filteredWorks = works.filter((w) => {
    const matchFloor = selectedFloorTab === 'ALL' || w.floorId === selectedFloorTab;
    const matchCategory = selectedCategory === 'Semua' || w.category === selectedCategory;

    const isBelumDiisi = w.status === 'Belum Diisi' || w.status === 'Perlu Input';
    const isTidakLengkap = w.status === 'Tidak Lengkap' || w.status === 'Belum Lengkap';
    const isPerluVerifikasi =
      w.status === 'Perlu Verifikasi' ||
      w.status === 'Draf AI: Perlu Verifikasi' ||
      w.status === 'Draf AI — Perlu Verifikasi' ||
      w.aiVerificationStatus === 'draft' ||
      w.parameters.some((p) => Boolean(p.conflict));
    const isTerverifikasi =
      (w.status === 'Terverifikasi' || w.status === 'Lengkap') &&
      w.calculatedVolume !== null &&
      w.aiVerificationStatus !== 'draft';

    let matchStatus = true;
    if (localStatusFilter === 'belum_diisi') {
      matchStatus = isBelumDiisi;
    } else if (localStatusFilter === 'tidak_lengkap') {
      matchStatus = isTidakLengkap;
    } else if (localStatusFilter === 'perlu_verifikasi') {
      matchStatus = isPerluVerifikasi;
    } else if (localStatusFilter === 'terverifikasi') {
      matchStatus = isTerverifikasi;
    } else if (activeStatusFilter === 'ai_draft') {
      matchStatus = isPerluVerifikasi;
    } else if (activeStatusFilter === 'incomplete') {
      matchStatus = isBelumDiisi || isTidakLengkap;
    }

    const matchSearch =
      searchQuery.trim() === '' ||
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.elementCode && w.elementCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (w.formulaDisplay && w.formulaDisplay.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (w.elementLocation && w.elementLocation.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (w.sourceDocument && w.sourceDocument.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchFloor && matchCategory && matchStatus && matchSearch;
  });

  // Group works by floor
  const visibleFloors =
    selectedFloorTab === 'ALL'
      ? floors
      : floors.filter((f) => f.id === selectedFloorTab);

  const worksByFloor: Record<string, ProjectWorkItem[]> = {};
  for (const floor of floors) {
    worksByFloor[floor.id] = [];
  }

  for (const work of filteredWorks) {
    if (!worksByFloor[work.floorId]) {
      worksByFloor[work.floorId] = [];
    }
    worksByFloor[work.floorId].push(work);
  }

  const renderVerificationBadgePill = (badge?: AIVerificationBadge) => {
    if (!badge) return null;
    switch (badge) {
      case 'Terbaca Jelas':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            Terbaca Jelas
          </span>
        );
      case 'Hasil Penggabungan':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
            Hasil Penggabungan
          </span>
        );
      case 'Perlu Verifikasi':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
            Perlu Verifikasi
          </span>
        );
      case 'Tidak Ditemukan':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
            Tidak Ditemukan
          </span>
        );
      default:
        return null;
    }
  };

  // Helper status badge
  const renderStatusBadge = (work: ProjectWorkItem) => {
    const hasConflict = work.parameters.some((p) => Boolean(p.conflict));
    if (hasConflict) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
          Perlu Verifikasi (Konflik)
        </span>
      );
    }

    switch (work.status) {
      case 'Terverifikasi':
      case 'Lengkap':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
            Terverifikasi
          </span>
        );
      case 'Perlu Verifikasi':
      case 'Draf AI: Perlu Verifikasi':
      case 'Draf AI — Perlu Verifikasi':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <FileText className="w-3 h-3 text-blue-600 shrink-0" />
            Perlu Verifikasi
          </span>
        );
      case 'Tidak Lengkap':
      case 'Belum Lengkap':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
            <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
            Tidak Lengkap
          </span>
        );
      case 'Belum Diisi':
      case 'Perlu Input':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
            Belum Diisi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            {work.status}
          </span>
        );
    }
  };

  const getCategoryBadgeClass = (cat: WorkCategory) => {
    switch (cat) {
      case 'Persiapan Dll':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Struktural':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Arsitektural':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'MEP':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getCategoryDrawerStyle = (cat: WorkCategory, isOpen: boolean) => {
    switch (cat) {
      case 'Persiapan Dll':
        return isOpen
          ? 'bg-blue-50/70 border-l-4 border-l-blue-600 text-blue-950'
          : 'bg-white hover:bg-blue-50/40 border-l-4 border-l-blue-400 text-slate-800';
      case 'Struktural':
        return isOpen
          ? 'bg-indigo-50/70 border-l-4 border-l-indigo-600 text-indigo-950'
          : 'bg-white hover:bg-indigo-50/40 border-l-4 border-l-indigo-400 text-slate-800';
      case 'Arsitektural':
        return isOpen
          ? 'bg-teal-50/70 border-l-4 border-l-teal-600 text-teal-950'
          : 'bg-white hover:bg-teal-50/40 border-l-4 border-l-teal-400 text-slate-800';
      case 'MEP':
        return isOpen
          ? 'bg-purple-50/70 border-l-4 border-l-purple-600 text-purple-950'
          : 'bg-white hover:bg-purple-50/40 border-l-4 border-l-purple-400 text-slate-800';
      default:
        return 'bg-white hover:bg-slate-50 border-l-4 border-l-slate-400 text-slate-800';
    }
  };

  return (
    <div
      id="work-table-container"
      className="apple-glass-card rounded-3xl overflow-hidden scroll-mt-6 transition-all"
    >
      {/* Undo Restore Banner (only when items were recently deleted) */}
      {recentlyDeletedCount > 0 && onRestoreDeletedWorks && (
        <div className="px-5 py-2.5 bg-amber-500/[0.08] border-b border-black/[0.06] flex items-center justify-between gap-2.5 text-xs">
          <span className="text-amber-950 font-medium text-[11px]">
            {recentlyDeletedCount} pekerjaan baru saja dihapus.
          </span>
          <button
            type="button"
            onClick={onRestoreDeletedWorks}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white hover:bg-slate-50 text-amber-900 border border-black/[0.08] font-semibold text-[11px] transition shrink-0 shadow-2xs cursor-pointer apple-press"
          >
            <RotateCcw className="w-3 h-3 text-amber-700" />
            <span>Pulihkan ({recentlyDeletedCount})</span>
          </button>
        </div>
      )}

      {/* AI Draft Banner when unverified AI works exist */}
      {activeDraftWorks.length > 0 && (
        <div className="px-5 py-3.5 bg-blue-50/70 border-b border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <ScanLine className="w-4 h-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-xs font-bold text-blue-950">
                  {activeDraftWorks.length} Pekerjaan Hasil Analisis AI Menunggu Verifikasi
                </h4>
                {readyDraftWorks.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                    {readyDraftWorks.length} Siap Disetujui
                  </span>
                )}
                {incompleteDraftWorks.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800">
                    {incompleteDraftWorks.length} Tidak Lengkap
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Periksa sumber halaman, jenis gambar, dan rincian segmen pada pekerjaan terkait sebelum menyetujui ke rekap volume final.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {readyDraftWorks.length > 0 && onApproveAllReadyDrafts && (
              <button
                type="button"
                onClick={onApproveAllReadyDrafts}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-2xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Setujui Semua yang Lengkap ({readyDraftWorks.length})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bulk Selection Action Bar */}
      {selectedWorkIds.size > 0 && (
        <div className="px-5 py-3 bg-rose-50/80 border-b border-rose-200 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center text-[11px]">
              {selectedWorkIds.size}
            </span>
            <span className="font-bold text-rose-950">
              {selectedWorkIds.size} pekerjaan dipilih pada proyek ini
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedWorkIds(new Set())}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 font-semibold transition cursor-pointer"
            >
              Batalkan Pilihan
            </button>
            <button
              type="button"
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-2xs transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Pekerjaan Terpilih ({selectedWorkIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Filter, Floor Navigation, Show All / Minimalis, and Search Bar */}
      <div className="p-5 border-b border-slate-100 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              Daftar Pekerjaan &amp; Volume Konstruksi
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Klik kategori di bawah setiap lantai untuk membuka/menutup daftar pekerjaan secara independen.
            </p>
          </div>

          {/* Search Box & Global Show All / Minimalis Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 gap-1">
              <button
                type="button"
                onClick={handleToolbarShowAll}
                title="Buka seluruh kategori pekerjaan pada lantai yang sedang dilihat"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-blue-50 text-blue-700 border border-slate-200/80 shadow-2xs transition cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Show All</span>
              </button>
              <button
                type="button"
                onClick={handleToolbarMinimalis}
                title="Tutup seluruh kategori pekerjaan sehingga hanya bar kategori yang terlihat rapi"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs transition cursor-pointer"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Minimalis</span>
              </button>
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari pekerjaan, kode (B1, K1)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Floor Selector Bar (Mempertahankan status buka/tutup kategori per lantai saat berpindah lantai) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Pilih Lantai:</span>
          </span>
          <button
            type="button"
            onClick={() => setSelectedFloorTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedFloorTab === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Lantai ({floors.length})
          </button>
          {floors.map((fl) => {
            const isSelectedFloor = selectedFloorTab === fl.id;
            const countInFloor = works.filter((w) => w.floorId === fl.id).length;
            return (
              <button
                key={fl.id}
                type="button"
                onClick={() => setSelectedFloorTab(fl.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  isSelectedFloor
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{fl.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelectedFloor ? 'bg-blue-700 text-white' : 'bg-white text-slate-600'
                  }`}
                >
                  {countInFloor}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter Tabs (Category + Status Quick Filter) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => {
                setLocalStatusFilter('all');
                if (onStatusFilterChange) onStatusFilterChange('all');
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                localStatusFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Status
            </button>
            <button
              onClick={() =>
                setLocalStatusFilter(localStatusFilter === 'belum_diisi' ? 'all' : 'belum_diisi')
              }
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                localStatusFilter === 'belum_diisi'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Belum Diisi
            </button>
            <button
              onClick={() =>
                setLocalStatusFilter(
                  localStatusFilter === 'tidak_lengkap' ? 'all' : 'tidak_lengkap'
                )
              }
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                localStatusFilter === 'tidak_lengkap'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              Tidak Lengkap
            </button>
            <button
              onClick={() =>
                setLocalStatusFilter(
                  localStatusFilter === 'perlu_verifikasi' ? 'all' : 'perlu_verifikasi'
                )
              }
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                localStatusFilter === 'perlu_verifikasi'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              <FileText className="w-3 h-3" />
              Perlu Verifikasi ({activeDraftWorks.length})
            </button>
            <button
              onClick={() =>
                setLocalStatusFilter(
                  localStatusFilter === 'terverifikasi' ? 'all' : 'terverifikasi'
                )
              }
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                localStatusFilter === 'terverifikasi'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              Terverifikasi
            </button>
          </div>
        </div>
      </div>

      {/* Grouped Table View with Floor Groups -> Independent Category Drawers -> Work Rows */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-black/[0.06] select-none text-[11px] tracking-tight">
              <th className="py-2.5 px-2.5 w-12 text-center">Pilih &amp; #</th>
              <th className="py-2.5 px-3 min-w-[200px]">Pekerjaan &amp; Parameter</th>
              <th className="py-2.5 px-3 w-28 text-right">Volume</th>
              <th className="py-2.5 px-3 w-28 text-center">Status</th>
              <th className="py-2.5 px-3 w-24 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleFloors.map((floor) => {
              const floorWorks = worksByFloor[floor.id] || [];
              const isFloorCollapsed = collapsedFloors[floor.id] ?? false;

              if (
                floorWorks.length === 0 &&
                (selectedCategory !== 'Semua' ||
                  localStatusFilter !== 'all' ||
                  searchQuery.trim() !== '')
              ) {
                return null;
              }

              const allFloorSelected =
                floorWorks.length > 0 && floorWorks.every((w) => selectedWorkIds.has(w.id));

              // Kelompokkan pekerjaan dalam lantai ini berdasarkan kategori USC
              const categoriesInFloor = CANONICAL_CATEGORIES.map((cat) => ({
                category: cat,
                items: floorWorks.filter((w) => w.category === cat),
              })).filter((group) => group.items.length > 0);

              return (
                <React.Fragment key={floor.id}>
                  {/* 1. FLOOR GROUP HEADER BAR */}
                  <tr className="bg-slate-100 border-t-2 border-slate-200 select-none">
                    <td colSpan={5} className="py-2.5 px-4 font-bold text-slate-800">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          {floorWorks.length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelectGroupWorks(floorWorks);
                              }}
                              title={`Pilih semua pekerjaan di ${floor.name}`}
                              className="text-slate-500 hover:text-blue-600 transition cursor-pointer"
                            >
                              {allFloorSelected ? (
                                <CheckSquare className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          <div
                            onClick={() => toggleFloorCollapse(floor.id)}
                            className="flex items-center gap-2 cursor-pointer hover:text-blue-700 transition flex-1 min-w-0"
                          >
                            {isFloorCollapsed ? (
                              <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-600 shrink-0" />
                            )}
                            <Layers className="w-4 h-4 text-blue-600 shrink-0" />
                            <span className="font-bold text-slate-900 text-sm truncate">
                              {floor.name}
                            </span>
                            {floor.elevation && (
                              <span className="text-[11px] text-slate-500 font-mono font-normal shrink-0">
                                ({floor.elevation})
                              </span>
                            )}
                            <span className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-md px-2 py-0.5 shadow-2xs ml-1 shrink-0">
                              {floorWorks.length} pekerjaan · {categoriesInFloor.length} kategori
                            </span>
                          </div>
                        </div>

                        {/* Kontrol per Lantai: Show All, Minimalis, Muat Standar, + Tambah Pekerjaan */}
                        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShowAllForFloor(floor.id);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg transition shadow-2xs cursor-pointer"
                            title={`Buka seluruh kategori di ${floor.name} (Show All)`}
                          >
                            <Maximize2 className="w-3 h-3" />
                            <span>Show All</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMinimalisForFloor(floor.id);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition shadow-2xs cursor-pointer"
                            title={`Tutup seluruh kategori di ${floor.name} menjadi tampilan bar ringkas (Minimalis)`}
                          >
                            <Minimize2 className="w-3 h-3" />
                            <span>Minimalis</span>
                          </button>

                          {onRestoreStandardFloorWorks && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRestoreStandardFloorWorks(floor.id);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition shadow-2xs cursor-pointer"
                              title={`Kembalikan daftar pekerjaan standar yang belum ada di ${floor.name}`}
                            >
                              <RotateCcw className="w-3 h-3 text-slate-500" />
                              <span className="hidden sm:inline">Muat Standar</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenAddWork(floor.id);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-2xs shrink-0 cursor-pointer"
                            title={`Tambah pekerjaan ke ${floor.name}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Tambah Pekerjaan</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* 2. INDEPENDENT CATEGORY ACCORDION DRAWERS INSIDE THIS FLOOR */}
                  {!isFloorCollapsed &&
                    categoriesInFloor.map(({ category, items: catWorks }) => {
                      const drawerKey = `${floor.id}::${category}`;
                      // Jika pengguna sedang melakukan pencarian teks aktif, tampilkan hasil pencarian secara otomatis
                      const isSearching = searchQuery.trim().length > 0;
                      const isCategoryOpen = isSearching
                        ? true
                        : Boolean(openCategories[drawerKey]);

                      const unfilledCount = catWorks.filter(
                        (w) => w.status === 'Belum Diisi' || w.status === 'Perlu Input'
                      ).length;
                      const filledCount = catWorks.length - unfilledCount;
                      const aiDraftCountInCat = catWorks.filter(
                        (w) =>
                          w.aiVerificationStatus === 'draft' ||
                          w.status === 'Perlu Verifikasi' ||
                          w.status === 'Draf AI: Perlu Verifikasi' ||
                          w.status === 'Draf AI — Perlu Verifikasi'
                      ).length;
                      const allCatSelected =
                        catWorks.length > 0 && catWorks.every((w) => selectedWorkIds.has(w.id));

                      return (
                        <React.Fragment key={drawerKey}>
                          {/* Laci / Accordion Bar Kategori */}
                          <tr
                            onClick={() => toggleCategoryDrawer(floor.id, category)}
                            className={`cursor-pointer transition-colors select-none border-b border-slate-200/80 ${getCategoryDrawerStyle(
                              category,
                              isCategoryOpen
                            )}`}
                          >
                            <td colSpan={5} className="py-2.5 px-5">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleSelectGroupWorks(catWorks);
                                    }}
                                    title={`Pilih semua pekerjaan ${category} di ${floor.name}`}
                                    className="text-slate-400 hover:text-blue-600 transition cursor-pointer"
                                  >
                                    {allCatSelected ? (
                                      <CheckSquare className="w-4 h-4 text-blue-600" />
                                    ) : (
                                      <Square className="w-4 h-4" />
                                    )}
                                  </button>

                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-white/80 border border-slate-200 text-slate-700 font-mono text-[11px] shadow-2xs">
                                    {isCategoryOpen ? '▼' : '▶'}
                                  </span>

                                  {isCategoryOpen ? (
                                    <FolderOpen className="w-4 h-4 text-blue-600 shrink-0" />
                                  ) : (
                                    <Folder className="w-4 h-4 text-slate-500 shrink-0" />
                                  )}

                                  <span className="font-bold text-xs sm:text-sm tracking-tight">
                                    {category}{' '}
                                    <span className="font-semibold text-slate-600">
                                      ({catWorks.length} pekerjaan)
                                    </span>
                                  </span>
                                </div>

                                {/* Ringkasan Status Kategori */}
                                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                  {aiDraftCountInCat > 0 && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                      <FileText className="w-3 h-3" />
                                      {aiDraftCountInCat} Perlu Verifikasi AI
                                    </span>
                                  )}

                                  {filledCount > 0 && (
                                    <span className="px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      {filledCount} Terisi
                                    </span>
                                  )}

                                  <span className="px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                    {unfilledCount} Belum Diisi
                                  </span>

                                  <span className="text-[11px] font-semibold text-blue-600 ml-1">
                                    {isCategoryOpen ? 'Tutup Laci ▲' : 'Buka Laci ▼'}
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>

                          {/* Daftar Pekerjaan di dalam Kategori (Hanya tampil jika laci kategori sedang terbuka) */}
                          {isCategoryOpen &&
                            catWorks.map((work, idx) => {
                              const isAiDraft =
                                work.aiVerificationStatus === 'draft' ||
                                work.status === 'Perlu Verifikasi' ||
                                work.status === 'Draf AI: Perlu Verifikasi' ||
                                work.status === 'Draf AI — Perlu Verifikasi';
                              const hasConflict = work.parameters.some((p) => Boolean(p.conflict));
                              const isSelected = selectedWorkIds.has(work.id);
                              const filledParams = work.parameters.filter(
                                (p) => p.value !== null && p.value !== ''
                              );

                              return (
                                <tr
                                  key={work.id}
                                  className={`hover:bg-blue-50/30 transition-colors group ${
                                    !work.isActive
                                      ? 'opacity-50 bg-slate-50/50'
                                      : isSelected
                                      ? 'bg-blue-50/40'
                                      : isAiDraft
                                      ? 'bg-blue-50/15'
                                      : 'bg-white'
                                  }`}
                                >
                                  {/* 1. Pilih & No */}
                                  <td className="py-2.5 px-2.5 text-center">
                                    <div className="flex flex-col items-center justify-center gap-0.5">
                                      <button
                                        type="button"
                                        onClick={() => toggleSelectWork(work.id)}
                                        className="text-slate-400 hover:text-blue-600 transition cursor-pointer apple-press"
                                        title="Pilih pekerjaan"
                                      >
                                        {isSelected ? (
                                          <CheckSquare className="w-4 h-4 text-blue-600" />
                                        ) : (
                                          <Square className="w-4 h-4" />
                                        )}
                                      </button>
                                      <span className="text-[10px] text-slate-400 font-mono leading-none">
                                        {idx + 1}
                                      </span>
                                    </div>
                                  </td>

                                  {/* 2. Pekerjaan & Parameter */}
                                  <td className="py-2.5 px-3 min-w-[200px]">
                                    <div className="flex items-start gap-2">
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <button
                                            onClick={() => onOpenWorkDetail(work)}
                                            className="text-left font-semibold text-slate-900 hover:text-blue-600 block transition focus:outline-none cursor-pointer"
                                          >
                                            {work.name}
                                          </button>
                                          {work.elementCode && (
                                            <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-mono text-[10px] font-bold">
                                              {work.elementCode}
                                            </span>
                                          )}
                                        </div>

                                        {/* Formula & Parameters preview inline */}
                                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px]">
                                          <span className="font-mono text-slate-600 bg-slate-100/80 border border-slate-200/60 px-1.5 py-0.5 rounded text-[10px]">
                                            {work.formulaDisplay}
                                          </span>
                                          {filledParams.length === 0 ? (
                                            <span className="text-[10px] text-slate-400">Parameter belum diisi</span>
                                          ) : (
                                            <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                                              {work.parameters.slice(0, 3).map((p) => (
                                                <span
                                                  key={p.id}
                                                  className={`px-1 py-0.5 rounded ${
                                                    p.value !== null
                                                      ? p.source === 'ai'
                                                        ? 'bg-blue-50 text-blue-700 font-medium'
                                                        : 'bg-slate-100 text-slate-700'
                                                      : 'bg-amber-50 text-amber-800 font-medium border border-amber-200'
                                                  }`}
                                                >
                                                  {p.label || p.name}:{' '}
                                                  {p.value !== null ? `${p.value} ${p.unit}` : '-'}
                                                </span>
                                              ))}
                                              {work.parameters.length > 3 && (
                                                <span className="text-slate-400">+{work.parameters.length - 3} lainnya</span>
                                              )}
                                            </div>
                                          )}
                                        </div>

                                        {/* Sub-info: AI Source, Verification Badge, Location, Grid Segments */}
                                        {(work.origin === 'ai' || work.elementLocation || (work.segments && work.segments.length > 0)) && (
                                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                            {work.origin === 'ai' && (
                                              <>
                                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                                  <FileText className="w-2.5 h-2.5" />
                                                  {work.sourceInfo || work.sourceDocument || 'Gambar AI'}
                                                </span>
                                                {renderVerificationBadgePill(work.verificationBadge)}
                                              </>
                                            )}
                                            {work.elementLocation && (
                                              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                Lokasi: {work.elementLocation}
                                              </span>
                                            )}
                                            {work.segments && work.segments.length > 0 && (
                                              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                                                {work.segments.length} Segmen Grid
                                              </span>
                                            )}
                                          </div>
                                        )}

                                        {(work.status === 'Tidak Lengkap' ||
                                          work.status === 'Belum Lengkap' ||
                                          hasConflict) &&
                                          work.statusMessage && (
                                            <p
                                              className={`text-[10px] mt-1 leading-snug ${
                                                hasConflict
                                                  ? 'text-rose-600 font-medium'
                                                  : 'text-amber-700'
                                              }`}
                                            >
                                              {work.statusMessage}
                                            </p>
                                          )}
                                      </div>
                                    </div>
                                  </td>

                                  {/* 3. Volume & Satuan */}
                                  <td className="py-2.5 px-3 text-right w-28 whitespace-nowrap">
                                    {work.calculatedVolume !== null ? (
                                      <div>
                                        <span className="font-bold text-slate-900 font-mono text-xs">
                                          {formatIndonesianNumber(work.calculatedVolume)}{' '}
                                          <span className="text-[11px] font-semibold text-slate-500 font-mono">
                                            {work.unit}
                                          </span>
                                        </span>
                                        {isAiDraft && (
                                          <span className="text-[10px] text-blue-600 block font-medium">
                                            (Perlu Verifikasi)
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="font-mono text-xs text-slate-400">
                                        - <span className="text-[11px] text-slate-400 font-semibold">{work.unit}</span>
                                      </div>
                                    )}
                                  </td>

                                  {/* 4. Status */}
                                  <td className="py-2.5 px-3 text-center w-28">{renderStatusBadge(work)}</td>

                                  {/* 5. Aksi */}
                                  <td className="py-2.5 px-3 text-right w-24 relative">
                                    <div className="inline-flex items-center justify-end gap-1">
                                      {isAiDraft &&
                                        work.calculatedVolume !== null &&
                                        !hasConflict &&
                                        onApproveDraftWork && (
                                          <button
                                            onClick={() => onApproveDraftWork(work.id)}
                                            title="Setujui Pekerjaan AI"
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition shadow-2xs cursor-pointer apple-press"
                                          >
                                            <Check className="w-3 h-3" />
                                            <span>Setujui</span>
                                          </button>
                                        )}

                                      <button
                                        onClick={() => onOpenWorkDetail(work)}
                                        title="Edit Nama, Parameter & Rumus Pekerjaan"
                                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-200 text-slate-600 hover:text-blue-700 text-xs transition cursor-pointer apple-press"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        onClick={() => setWorkToDelete(work)}
                                        title="Hapus Pekerjaan dari Kalkulator"
                                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 transition cursor-pointer apple-press"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>

                                      <div className="relative inline-block text-left">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenActionMenuId(
                                              openActionMenuId === work.id ? null : work.id
                                            );
                                          }}
                                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer apple-press"
                                          title="Menu Lainnya"
                                        >
                                          <MoreVertical className="w-3.5 h-3.5" />
                                        </button>

                                        {openActionMenuId === work.id && (
                                          <div
                                            onClick={(e) => e.stopPropagation()}
                                            className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1 text-xs"
                                          >
                                            <button
                                              onClick={() => {
                                                setOpenActionMenuId(null);
                                                onDuplicateWork(work);
                                              }}
                                              className="w-full text-left px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition"
                                            >
                                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                                              <span>Duplikasi Pekerjaan</span>
                                            </button>
                                            <button
                                              onClick={() => {
                                                setOpenActionMenuId(null);
                                                onToggleActive(work.id);
                                              }}
                                              className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                                            >
                                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                                              <span>{work.isActive ? 'Nonaktifkan' : 'Aktifkan'}</span>
                                            </button>
                                            <div className="h-px bg-slate-100 my-1" />
                                            <button
                                              onClick={() => {
                                                setOpenActionMenuId(null);
                                                setWorkToDelete(work);
                                              }}
                                              className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                              <span>Hapus Pekerjaan</span>
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                        </React.Fragment>
                      );
                    })}

                  {/* Bottom Floor Row: Quick "+ Tambah Pekerjaan di [Nama Lantai]" */}
                  {!isFloorCollapsed && (
                    <tr className="bg-slate-50/40 hover:bg-slate-50/80 border-b border-slate-200/70">
                      <td colSpan={5} className="py-2 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => onOpenAddWork(floor.id)}
                          className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold py-1 px-3 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Tambah Pekerjaan di {floor.name}</span>
                        </button>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredWorks.length === 0 && (
        <div className="p-12 text-center text-xs text-slate-500">
          <p className="font-semibold text-slate-700">Tidak ada pekerjaan yang cocok.</p>
          <p className="mt-1">Coba sesuaikan kata kunci pencarian atau ubah filter kategori/status.</p>
        </div>
      )}

      {/* Confirmation Modal for deleting a single work */}
      {workToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-slate-900 leading-tight">
                  Hapus Pekerjaan dari Proyek Ini?
                </h4>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Pekerjaan <strong>"{workToDelete.name}"</strong> akan dihapus dari kalkulator proyek aktif. Template di katalog umum dan proyek lain tidak akan terpengaruh.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setWorkToDelete(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteWork(workToDelete.id);
                  setSelectedWorkIds((prev) => {
                    const next = new Set(prev);
                    next.delete(workToDelete.id);
                    return next;
                  });
                  setWorkToDelete(null);
                }}
                className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                Hapus Pekerjaan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Bulk Deletion */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-slate-900 leading-tight">
                  Hapus {selectedWorkIds.size} Pekerjaan Terpilih?
                </h4>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Sebanyak <strong>{selectedWorkIds.size} pekerjaan</strong> yang dipilih akan dihapus dari proyek aktif ini. Anda tetap dapat memulihkannya atau menambahkannya kembali dari katalog kapan saja.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteMultipleWorks) {
                    onDeleteMultipleWorks(Array.from(selectedWorkIds));
                  } else {
                    selectedWorkIds.forEach((id) => onDeleteWork(id));
                  }
                  setSelectedWorkIds(new Set());
                  setShowBulkDeleteConfirm(false);
                }}
                className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                Ya, Hapus {selectedWorkIds.size} Pekerjaan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
