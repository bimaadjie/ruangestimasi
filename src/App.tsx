/**
 * RuangEstimasi: Quantity takeoff jadi simpel
 * Main Application Component (Protected by User Authentication & Strict Account Isolation)
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { Stepper } from './components/Stepper';
import { UserOverviewBanner } from './components/UserOverviewBanner';
import { AutoQuantityTakeoffSection } from './components/AutoQuantityTakeoffSection';
import { WorkTable } from './components/WorkTable';
import { RightPanel } from './components/RightPanel';
import { RecapCards } from './components/RecapCards';
import { WorkDetailModal } from './components/WorkDetailModal';
import { AddWorkModal } from './components/AddWorkModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { FloorManagementModal } from './components/FloorManagementModal';
import { ProjectManagementModal } from './components/ProjectManagementModal';
import { AuthPage } from './components/AuthPage';
import { UserProfileModal } from './components/UserProfileModal';

import {
  loadAllProjects,
  saveAllProjects,
  getActiveProjectId,
  setActiveProjectId,
  createNewProject,
  createDefaultWorksForFloor,
  loadSidebarCollapsed,
  saveSidebarCollapsed,
  applyAutoQuantityTakeoff,
  getAllCatalogItems,
  createProjectWorkFromCatalog,
  fetchProjectsFromServer,
  deleteProjectFromServer,
  fetchProjectsFromFirestore,
  deleteProjectFromFirestore,
} from './services/projectStorage';
import {
  getCurrentSessionUser,
  saveCurrentSessionUser,
  logoutUserAccount,
  fetchUserProfileFromFirestore,
} from './services/authService';
import { auth, onAuthStateChanged } from './firebase';
import { recalculateAllProjectWorks } from './services/calculationEngine';
import { exportProjectToExcel } from './services/excelExport';
import {
  AIAutoTakeoffSummary,
  AIBeamSloofSegment,
  AIDetectedRegion,
  AIExtractionItem,
  FloorItem,
  ProjectData,
  ProjectWorkItem,
  UserProfile,
} from './types';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getCurrentSessionUser());
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState<boolean>(false);

  // Project state
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [activeProjectId, setActiveId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [currentStep, setCurrentStep] = useState<number>(2);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Status Filter for WorkTable
  const [tableStatusFilter, setTableStatusFilter] = useState<'all' | 'ai_draft' | 'incomplete'>('all');

  // Sidebar state (Desktop collapse & Mobile drawer)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() =>
    loadSidebarCollapsed()
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Modals & Undo state
  const [selectedWorkForDetail, setSelectedWorkForDetail] = useState<ProjectWorkItem | null>(null);
  const [isAddWorkOpen, setIsAddWorkOpen] = useState<boolean>(false);
  const [targetFloorForAdd, setTargetFloorForAdd] = useState<string | undefined>(undefined);
  const [isAIOpen, setIsAIOpen] = useState<boolean>(false);
  const [isFloorsOpen, setIsFloorsOpen] = useState<boolean>(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState<boolean>(false);
  const [recentlyDeletedWorks, setRecentlyDeletedWorks] = useState<ProjectWorkItem[]>([]);

  // Pantau status autentikasi Firebase & sesi pengguna
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const existingLocal = getCurrentSessionUser();
        if (!existingLocal || existingLocal.uid !== firebaseUser.uid) {
          const firestoreProfile = await fetchUserProfileFromFirestore(firebaseUser.uid);
          if (firestoreProfile) {
            setCurrentUser(firestoreProfile);
            saveCurrentSessionUser(firestoreProfile);
          }
        }
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Muat daftar proyek terisolasi setiap kali currentUser berubah
  useEffect(() => {
    // Reset modal & state sementara saat akun pengguna berubah
    setSelectedWorkForDetail(null);
    setIsAIOpen(false);
    setIsAddWorkOpen(false);
    setIsFloorsOpen(false);
    setIsProjectsOpen(false);
    setRecentlyDeletedWorks([]);

    if (!currentUser) {
      setProjects([]);
      setActiveId('');
      return;
    }

    const uid = currentUser.uid;
    const localProjects = loadAllProjects(uid);
    const savedActiveId = getActiveProjectId(uid);

    setProjects(localProjects);
    const found = localProjects.find((p) => p.id === savedActiveId);
    if (found) {
      setActiveId(found.id);
    } else if (localProjects[0]) {
      setActiveId(localProjects[0].id);
      setActiveProjectId(localProjects[0].id, uid);
    }

    // 1. Sinkronkan dengan Server Database (/api/projects) dengan verifikasi kepemilikan userId
    fetchProjectsFromServer(uid)
      .then((serverProjs) => {
        if (serverProjs && serverProjs.length > 0) {
          setProjects(serverProjs);
          saveAllProjects(serverProjs, uid);
          if (!serverProjs.some((p) => p.id === savedActiveId)) {
            setActiveId(serverProjs[0].id);
            setActiveProjectId(serverProjs[0].id, uid);
          }
        } else {
          // Simpan proyek lokal milik pengguna ini ke server jika di server belum ada
          saveAllProjects(localProjects, uid);
        }
      })
      .catch(() => {
        // Gunakan proyek terisolasi lokal jika offline
      });

    // 2. Jika pengguna juga terautentikasi di Firebase, sinkronkan dengan Cloud Firestore
    if (auth.currentUser && auth.currentUser.uid === uid) {
      fetchProjectsFromFirestore(uid)
        .then((remoteProjs) => {
          if (remoteProjs && remoteProjs.length > 0) {
            setProjects(remoteProjs);
            saveAllProjects(remoteProjs, uid);
            if (!remoteProjs.some((p) => p.id === savedActiveId)) {
              setActiveId(remoteProjs[0].id);
              setActiveProjectId(remoteProjs[0].id, uid);
            }
          }
        })
        .catch(() => {
          // Gunakan proyek lokal jika offline
        });
    }
  }, [currentUser?.uid]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  const handleUserAuthenticated = (user: UserProfile) => {
    setCurrentUser(user);
    saveCurrentSessionUser(user);
    showToast(`Selamat datang di RuangEstimasi, ${user.fullName}!`);
  };

  const handleLogout = async () => {
    setIsUserProfileOpen(false);
    setSelectedWorkForDetail(null);
    setIsAIOpen(false);
    setRecentlyDeletedWorks([]);
    await logoutUserAccount();
    setProjects([]);
    setActiveId('');
    setCurrentUser(null);
  };

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      saveSidebarCollapsed(next);
      return next;
    });
  };

  // Proteksi halaman dashboard: tampilkan halaman Sign In / Create Account jika belum login
  if (!currentUser) {
    if (!isAuthReady) {
      return (
        <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center text-xs font-semibold text-slate-500">
          Memuat sesi RuangEstimasi...
        </div>
      );
    }
    return <AuthPage onAuthenticated={handleUserAuthenticated} />;
  }

  const userId = currentUser.uid;

  const activeProject: ProjectData =
    projects.find((p) => p.id === activeProjectId) ||
    projects[0] ||
    createNewProject('Proyek Baru', 2, '', userId);

  // Update proyek aktif
  const handleUpdateActiveProject = (updated: ProjectData) => {
    const recalculatedWorks = recalculateAllProjectWorks(updated.works);
    const finalProject: ProjectData = {
      ...updated,
      ownerUid: userId,
      works: recalculatedWorks,
      updatedAt: new Date().toISOString(),
    };

    const exists = projects.some((p) => p.id === finalProject.id);
    const newProjects = exists
      ? projects.map((p) => (p.id === finalProject.id ? finalProject : p))
      : [finalProject, ...projects];

    setProjects(newProjects);
    saveAllProjects(newProjects, userId);
  };

  // Simpan proyek manual
  const handleSaveProject = () => {
    setIsSaving(true);
    saveAllProjects(projects, userId);
    setTimeout(() => {
      setIsSaving(false);
      showToast('Perubahan data proyek berhasil disimpan ke akun Anda.');
    }, 400);
  };

  // Ubah nama proyek
  const handleUpdateProjectName = (newName: string) => {
    handleUpdateActiveProject({
      ...activeProject,
      name: newName,
    });
    showToast(`Nama proyek diubah menjadi "${newName}".`);
  };

  // Ekspor Excel
  const handleExportExcel = async () => {
    try {
      showToast('Mempersiapkan ekspor file Excel...');
      await exportProjectToExcel(activeProject);
      showToast('File Excel (.xlsx) berhasil diekspor.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Gagal mengekspor file Excel: ${msg}`);
    }
  };

  // Detail & Simpan pekerjaan yang diedit
  const handleSaveWorkItem = (updatedWork: ProjectWorkItem) => {
    const newWorks = activeProject.works.map((w) =>
      w.id === updatedWork.id ? updatedWork : w
    );
    handleUpdateActiveProject({
      ...activeProject,
      works: newWorks,
    });
    showToast(`Pekerjaan "${updatedWork.name}" diperbarui.`);
  };

  // Tambah pekerjaan tunggal baru
  const handleAddWorkItem = (newWork: ProjectWorkItem) => {
    const newWorks = [newWork, ...activeProject.works];
    handleUpdateActiveProject({
      ...activeProject,
      works: newWorks,
    });
    showToast(`Pekerjaan "${newWork.name}" berhasil ditambahkan ke kalkulator.`);
  };

  // Tambah banyak pekerjaan sekaligus (Multi-select)
  const handleAddMultipleWorks = (
    newWorks: ProjectWorkItem[],
    floorName: string,
    skippedCount: number
  ) => {
    const updatedWorks = [...newWorks, ...activeProject.works];
    handleUpdateActiveProject({
      ...activeProject,
      works: updatedWorks,
    });
    if (skippedCount > 0) {
      showToast(
        `Berhasil menambahkan ${newWorks.length} pekerjaan ke ${floorName} (${skippedCount} dilewati karena sudah ada).`
      );
    } else {
      showToast(`Berhasil menambahkan ${newWorks.length} pekerjaan ke ${floorName}.`);
    }
  };

  // Hapus pekerjaan tunggal dari kalkulator
  const handleDeleteWorkItem = (workId: string) => {
    const workToDelete = activeProject.works.find((w) => w.id === workId);
    const newWorks = activeProject.works.filter((w) => w.id !== workId);

    const existingRejected = new Set<string>(activeProject.rejectedDraftKeys || []);
    if (workToDelete?.dedupKey && workToDelete.origin === 'ai') {
      existingRejected.add(workToDelete.dedupKey);
    }

    if (workToDelete) {
      setRecentlyDeletedWorks((prev) => [workToDelete, ...prev]);
    }

    handleUpdateActiveProject({
      ...activeProject,
      works: newWorks,
      rejectedDraftKeys: Array.from(existingRejected),
    });

    if (selectedWorkForDetail?.id === workId) {
      setSelectedWorkForDetail(null);
    }

    showToast(`Pekerjaan "${workToDelete?.name || ''}" berhasil dihapus dari proyek ini.`);
  };

  // Tolak usulan AI pada pekerjaan standar USC (mengosongkan parameter AI kembali ke Belum Diisi tanpa menghapus pekerjaan standar)
  const handleRejectDraftWork = (workId: string) => {
    const targetWork = activeProject.works.find((w) => w.id === workId);
    if (!targetWork) return;

    const newWorks = activeProject.works.map((w) => {
      if (w.id !== workId) return w;
      return {
        ...w,
        origin: 'manual' as const,
        aiVerificationStatus: undefined,
        verificationBadge: undefined,
        sourceDocument: undefined,
        sourceInfo: undefined,
        identificationReason: undefined,
        segments: undefined,
        elementCode: undefined,
        elementLocation: undefined,
        calculatedVolume: null,
        status: 'Belum Diisi' as const,
        parameters: w.parameters.map((p) => ({
          ...p,
          value: null,
          source: 'manual' as const,
          sourceDocument: undefined,
          sourceInfo: undefined,
          drawingType: undefined,
          drawingTitle: undefined,
          pageNumber: undefined,
          rawExtractedValue: undefined,
          rawUnit: undefined,
          verificationBadge: undefined,
          isVerified: false,
          conflict: null,
        })),
      };
    });

    handleUpdateActiveProject({
      ...activeProject,
      works: newWorks,
    });
    showToast(`Usulan AI pada "${targetWork.name}" ditolak dan parameter dikosongkan.`);
  };

  // Hapus banyak pekerjaan sekaligus (Multi-select)
  const handleDeleteMultipleWorks = (workIds: string[]) => {
    if (workIds.length === 0) return;
    const idSet = new Set(workIds);
    const deletedItems = activeProject.works.filter((w) => idSet.has(w.id));
    const newWorks = activeProject.works.filter((w) => !idSet.has(w.id));

    const existingRejected = new Set<string>(activeProject.rejectedDraftKeys || []);
    deletedItems.forEach((w) => {
      if (w.dedupKey && w.origin === 'ai') {
        existingRejected.add(w.dedupKey);
      }
    });

    setRecentlyDeletedWorks((prev) => [...deletedItems, ...prev]);

    handleUpdateActiveProject({
      ...activeProject,
      works: newWorks,
      rejectedDraftKeys: Array.from(existingRejected),
    });

    if (selectedWorkForDetail && idSet.has(selectedWorkForDetail.id)) {
      setSelectedWorkForDetail(null);
    }

    showToast(`Berhasil menghapus ${deletedItems.length} pekerjaan terpilih dari proyek ini.`);
  };

  // Pulihkan pekerjaan yang baru dihapus
  const handleRestoreDeletedWorks = () => {
    if (recentlyDeletedWorks.length === 0) return;
    const existingIds = new Set(activeProject.works.map((w) => w.id));
    const toRestore = recentlyDeletedWorks.filter((w) => !existingIds.has(w.id));

    handleUpdateActiveProject({
      ...activeProject,
      works: [...toRestore, ...activeProject.works],
    });
    setRecentlyDeletedWorks([]);
    showToast(`Berhasil memulihkan ${toRestore.length} pekerjaan ke proyek aktif.`);
  };

  // Muat kembali daftar pekerjaan standar yang belum ada pada suatu lantai
  const handleRestoreStandardFloorWorks = (floorId: string) => {
    const floor = activeProject.floors.find((f) => f.id === floorId);
    if (!floor) return;

    const standardFloorWorks = createDefaultWorksForFloor(
      floor.id,
      floor.level,
      activeProject.floorCount
    );
    const existingCatalogIdsOnFloor = new Set(
      activeProject.works
        .filter((w) => w.floorId === floorId && w.catalogId)
        .map((w) => w.catalogId!)
    );

    const missingWorks = standardFloorWorks.filter(
      (w) => w.catalogId && !existingCatalogIdsOnFloor.has(w.catalogId)
    );

    if (missingWorks.length === 0) {
      showToast(`Seluruh pekerjaan standar untuk ${floor.name} sudah tersedia.`);
      return;
    }

    handleUpdateActiveProject({
      ...activeProject,
      works: [...activeProject.works, ...missingWorks],
    });
    showToast(
      `Berhasil memulihkan ${missingWorks.length} pekerjaan standar ke ${floor.name}.`
    );
  };

  // Duplikasi pekerjaan
  const handleDuplicateWorkItem = (work: ProjectWorkItem) => {
    const duplicated: ProjectWorkItem = {
      ...work,
      id: `work-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: `${work.name} (Salinan)`,
      dedupKey: undefined,
      lastUpdated: new Date().toISOString(),
    };
    const newWorks = [duplicated, ...activeProject.works];
    handleUpdateActiveProject({
      ...activeProject,
      works: newWorks,
    });
    showToast(`Pekerjaan "${work.name}" berhasil diduplikasi.`);
  };

  // Nonaktifkan / Aktifkan pekerjaan
  const handleToggleActive = (workId: string) => {
    const newWorks = activeProject.works.map((w) =>
      w.id === workId ? { ...w, isActive: !w.isActive } : w
    );
    handleUpdateActiveProject({
      ...activeProject,
      works: newWorks,
    });
  };

  // Setujui satu pekerjaan draf AI
  const handleApproveDraftWork = (workId: string) => {
    const targetWork = activeProject.works.find((w) => w.id === workId);
    if (!targetWork) return;

    const newWorks: ProjectWorkItem[] = activeProject.works.map((w) =>
      w.id === workId
        ? {
            ...w,
            aiVerificationStatus: 'verified',
            parameters: w.parameters.map((p) => ({ ...p, isVerified: true })),
            lastUpdated: new Date().toISOString(),
          }
        : w
    );

    handleUpdateActiveProject({
      ...activeProject,
      works: newWorks,
    });
    showToast(`Draf AI "${targetWork.name}" disetujui dan masuk ke total volume terverifikasi.`);
  };

  // Setujui semua draf AI yang sudah lengkap parameternya
  const handleApproveAllReadyDrafts = () => {
    let approvedCount = 0;
    const newWorks: ProjectWorkItem[] = activeProject.works.map((w) => {
      const hasConflicts = w.parameters.some((p) => Boolean(p.conflict));
      if (w.aiVerificationStatus === 'draft' && w.calculatedVolume !== null && !hasConflicts) {
        approvedCount++;
        return {
          ...w,
          aiVerificationStatus: 'verified',
          parameters: w.parameters.map((p) => ({ ...p, isVerified: true })),
          lastUpdated: new Date().toISOString(),
        };
      }
      return w;
    });

    if (approvedCount === 0) {
      showToast('Tidak ada draf AI yang siap disetujui (lengkapi parameter yang kosong terlebih dahulu).');
      return;
    }

    handleUpdateActiveProject({
      ...activeProject,
      works: newWorks,
    });
    showToast(
      `Berhasil menyetujui ${approvedCount} pekerjaan hasil AI ke dalam rekap volume terverifikasi.`
    );
  };

  // Auto Quantity Takeoff: Integrasi langsung hasil bacaan AI ke kalkulator proyek aktif
  const handleAutoTakeoff = (
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
  ): {
    summary: AIAutoTakeoffSummary;
    affectedWorks: ProjectWorkItem[];
  } => {
    const { updatedProject, summary, affectedWorkIds } = applyAutoQuantityTakeoff(
      activeProject,
      items,
      targetFloorId,
      sourceDocument,
      meta
    );

    handleUpdateActiveProject(updatedProject);

    if (summary.createdDraftWorksCount > 0 || summary.updatedExistingWorksCount > 0) {
      showToast(
        `Auto Quantity Takeoff selesai: ${summary.updatedExistingWorksCount} pekerjaan standar diperbarui, +${summary.createdDraftWorksCount} baru.`
      );
    } else {
      showToast('Analisis selesai. Parameter sudah sinkron dengan gambar.');
    }

    const recalculated = recalculateAllProjectWorks(updatedProject.works);
    const affectedWorks = recalculated.filter((w) => affectedWorkIds.includes(w.id));

    return { summary, affectedWorks };
  };

  // Tambahkan rekomendasi pekerjaan lanjutan ke kalkulator sebagai Draf AI
  const handleAddRecommendationWork = (catalogId: string, floorId: string, reason: string) => {
    const allCatalog = getAllCatalogItems(userId);
    const catItem = allCatalog.find((c) => c.id === catalogId);
    if (!catItem) return;

    const dedupKey = `${floorId}::${catalogId}`;
    const existing = activeProject.works.find(
      (w) => w.dedupKey === dedupKey || (w.floorId === floorId && w.catalogId === catalogId)
    );

    const floorWorks = activeProject.works.filter(
      (w) => w.floorId === floorId || w.floorId === 'fl-umum'
    );
    const dindingWork = floorWorks.find((w) => w.catalogId === 'ars-dinding-bata-hebel');
    const lantaiWork = floorWorks.find(
      (w) =>
        w.catalogId === 'ars-homogenous-tile-60x60' ||
        w.catalogId === 'ars-lantai-homogenous-60x60'
    );
    const sloofWork = floorWorks.find((w) => w.catalogId === 'str-sloof-beton');

    const initialParams: Record<string, number | null> = {};
    if (dindingWork && dindingWork.calculatedVolume !== null) {
      initialParams['luas_dinding'] = Number(dindingWork.calculatedVolume.toFixed(2));
      initialParams['luas_dinding_bersih'] = Number(dindingWork.calculatedVolume.toFixed(2));
    }
    if (lantaiWork && lantaiWork.calculatedVolume !== null) {
      initialParams['luas_cat'] = Number(lantaiWork.calculatedVolume.toFixed(2));
      initialParams['luas_plafond'] = Number(lantaiWork.calculatedVolume.toFixed(2));
    }
    if (sloofWork) {
      const pTotal = sloofWork.parameters.find((p) => p.id === 'panjang_total')?.value;
      const tSloof = sloofWork.parameters.find((p) => p.id === 'tinggi')?.value;
      if (typeof pTotal === 'number') initialParams['panjang_total'] = pTotal;
      if (typeof tSloof === 'number') initialParams['tinggi'] = tSloof;
    }

    if (existing) {
      const updatedWorks = activeProject.works.map((w) => {
        if (w.id !== existing.id) return w;
        return {
          ...w,
          origin: 'ai' as const,
          aiVerificationStatus: 'draft' as const,
          verificationBadge: 'Hasil Penggabungan' as const,
          identificationReason: reason,
          parameters: w.parameters.map((p) =>
            initialParams[p.id] !== undefined && initialParams[p.id] !== null
              ? {
                  ...p,
                  value: initialParams[p.id],
                  source: 'ai' as const,
                  verificationBadge: 'Hasil Penggabungan' as const,
                }
              : p
          ),
        };
      });
      handleUpdateActiveProject({
        ...activeProject,
        works: updatedWorks,
      });
      showToast(`Pekerjaan standar "${catItem.name}" dihubungkan dengan parameter rekomendasi AI.`);
      return;
    }

    const newWork = createProjectWorkFromCatalog(catalogId, floorId, initialParams, {
      origin: 'ai',
      aiVerificationStatus: 'draft',
      verificationBadge: 'Hasil Penggabungan',
      identificationReason: reason,
      dedupKey,
      userId,
    });

    if (!newWork) return;

    const newWorks: ProjectWorkItem[] = [newWork, ...activeProject.works];
    handleUpdateActiveProject({
      ...activeProject,
      works: newWorks,
    });
    showToast(`Rekomendasi "${catItem.name}" ditambahkan ke kalkulator sebagai Draf AI.`);
  };

  // Manajemen Lantai
  const handleAddFloor = (name: string, elevation: string) => {
    const nextLevel = activeProject.floors.filter((f) => f.id !== 'fl-umum').length + 1;
    const newFloor: FloorItem = {
      id: `fl-${Date.now()}`,
      name,
      elevation,
      level: nextLevel,
      description: `Elevasi ${elevation}`,
    };
    const defaultFloorWorks = createDefaultWorksForFloor(newFloor.id, nextLevel, nextLevel);
    const newFloors = [...activeProject.floors, newFloor];
    const newWorks = [...activeProject.works, ...defaultFloorWorks];

    handleUpdateActiveProject({
      ...activeProject,
      floorCount: newFloors.filter((f) => f.id !== 'fl-umum').length,
      floors: newFloors,
      works: newWorks,
    });
    showToast(
      `Lantai "${name}" beserta ${defaultFloorWorks.length} pekerjaan standar berhasil ditambahkan.`
    );
  };

  const handleRenameFloor = (floorId: string, newName: string, newElevation: string) => {
    const newFloors = activeProject.floors.map((f) =>
      f.id === floorId ? { ...f, name: newName, elevation: newElevation } : f
    );
    handleUpdateActiveProject({
      ...activeProject,
      floors: newFloors,
    });
    showToast(`Lantai berhasil diubah menjadi "${newName}".`);
  };

  const handleDeleteFloor = (floorId: string, moveWorksToFloorId?: string) => {
    const floor = activeProject.floors.find((f) => f.id === floorId);
    const newFloors = activeProject.floors.filter((f) => f.id !== floorId);

    let newWorks: ProjectWorkItem[];
    if (moveWorksToFloorId) {
      newWorks = activeProject.works.map((w) =>
        w.floorId === floorId
          ? {
              ...w,
              floorId: moveWorksToFloorId,
              dedupKey: w.catalogId ? `${moveWorksToFloorId}::${w.catalogId}` : w.dedupKey,
            }
          : w
      );
    } else {
      newWorks = activeProject.works.filter((w) => w.floorId !== floorId);
    }

    handleUpdateActiveProject({
      ...activeProject,
      floorCount: newFloors.filter((f) => f.id !== 'fl-umum').length,
      floors: newFloors,
      works: newWorks,
    });

    if (moveWorksToFloorId) {
      const targetFloor = activeProject.floors.find((f) => f.id === moveWorksToFloorId);
      showToast(
        `Lantai "${floor?.name || ''}" dihapus dan pekerjaannya dipindahkan ke ${targetFloor?.name || 'lantai lain'}.`
      );
    } else {
      showToast(`Lantai "${floor?.name || ''}" beserta pekerjaannya telah dihapus.`);
    }
  };

  const handleDuplicateFloor = (sourceFloorId: string) => {
    const sourceFloor = activeProject.floors.find((f) => f.id === sourceFloorId);
    if (!sourceFloor) return;

    const newFloorId = `fl-${Date.now()}`;
    const newFloorName = `${sourceFloor.name} (Duplikat)`;
    const newFloor: FloorItem = {
      id: newFloorId,
      name: newFloorName,
      elevation: sourceFloor.elevation,
      level: activeProject.floors.length,
    };

    const sourceWorks = activeProject.works.filter((w) => w.floorId === sourceFloorId);
    const duplicatedWorks: ProjectWorkItem[] = sourceWorks.map((w) => ({
      ...w,
      id: `work-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      floorId: newFloorId,
      dedupKey: w.catalogId ? `${newFloorId}::${w.catalogId}` : undefined,
    }));

    const newFloors = [...activeProject.floors, newFloor];
    const newWorks = [...activeProject.works, ...duplicatedWorks];

    handleUpdateActiveProject({
      ...activeProject,
      floorCount: newFloors.filter((f) => f.id !== 'fl-umum').length,
      floors: newFloors,
      works: newWorks,
    });
    showToast(
      `Lantai "${sourceFloor.name}" dan ${sourceWorks.length} pekerjaan berhasil diduplikasi.`
    );
  };

  const currentWorkFloor = activeProject.floors.find(
    (f) => f.id === selectedWorkForDetail?.floorId
  );

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-row selection:bg-[#0071E3]/20">
      {/* 1. Left Sidebar (Collapsible on Desktop + Drawer on Mobile) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'rekap') setCurrentStep(4);
          if (tab === 'kalkulator') setCurrentStep(3);
          if (tab === 'dashboard') setCurrentStep(2);
        }}
        onOpenAI={() => setIsAIOpen(true)}
        onExportExcel={handleExportExcel}
        onOpenFloors={() => setIsFloorsOpen(true)}
        onOpenProjects={() => setIsProjectsOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. Main Content Viewport */}
      <main className="flex-1 flex flex-col min-w-0 transition-all duration-200">
        {/* Top Header */}
        <Header
          user={currentUser}
          project={activeProject}
          onUpdateProjectName={handleUpdateProjectName}
          onOpenFloors={() => setIsFloorsOpen(true)}
          onNewProject={() => setIsProjectsOpen(true)}
          onSaveProject={handleSaveProject}
          onExportExcel={handleExportExcel}
          isSaving={isSaving}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenUserProfile={() => setIsUserProfileOpen(true)}
          onLogout={handleLogout}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebarCollapse={handleToggleSidebarCollapse}
        />

        {/* 4-Step Stepper Progress */}
        <Stepper
          currentStep={currentStep}
          onStepClick={(step) => {
            setCurrentStep(step);
            if (step === 1) setIsProjectsOpen(true);
            if (step === 4) handleExportExcel();
          }}
        />

        {/* Workspace Canvas */}
        <div className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {/* User Overview & Projects Hub Banner */}
          <UserOverviewBanner
            user={currentUser}
            projects={projects}
            activeProject={activeProject}
            onSelectProject={(id) => {
              setSelectedWorkForDetail(null);
              setRecentlyDeletedWorks([]);
              setActiveId(id);
              setActiveProjectId(id, userId);
            }}
            onOpenProjectModal={() => setIsProjectsOpen(true)}
          />

          {/* Main Hero: Asisten AI & Input Manual (Bersebelahan) */}
          <AutoQuantityTakeoffSection
            floors={activeProject.floors}
            activeFloorId={activeProject.floors[1]?.id || 'fl-1'}
            onOpenManualForm={(floorId) => {
              setTargetFloorForAdd(floorId);
              setIsAddWorkOpen(true);
            }}
            onOpenDetailedModal={() => setIsAIOpen(true)}
            existingWorks={activeProject.works}
          />

          {/* Main 2-Column Split: Work Table (Left) + Right Panel (Right) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Left 8-9 cols: Work & Volume Table with Category Accordion Drawers */}
            <div className="xl:col-span-8 2xl:col-span-9 min-w-0">
              <WorkTable
                key={`table-${userId}-${activeProject.id}`}
                userId={userId}
                projectId={activeProject.id}
                works={activeProject.works}
                floors={activeProject.floors}
                onOpenWorkDetail={(work) => setSelectedWorkForDetail(work)}
                onOpenAddWork={(floorId) => {
                  setTargetFloorForAdd(floorId || activeProject.floors[1]?.id || 'fl-1');
                  setIsAddWorkOpen(true);
                }}
                onDeleteWork={handleDeleteWorkItem}
                onDeleteMultipleWorks={handleDeleteMultipleWorks}
                onRestoreDeletedWorks={handleRestoreDeletedWorks}
                recentlyDeletedCount={recentlyDeletedWorks.length}
                onRestoreStandardFloorWorks={handleRestoreStandardFloorWorks}
                onDuplicateWork={handleDuplicateWorkItem}
                onToggleActive={handleToggleActive}
                onApproveDraftWork={handleApproveDraftWork}
                onApproveAllReadyDrafts={handleApproveAllReadyDrafts}
                activeStatusFilter={tableStatusFilter}
                onStatusFilterChange={(f) => setTableStatusFilter(f)}
              />
            </div>

            {/* Right 3-4 cols: Project Summary & Excel Export */}
            <div className="xl:col-span-4 2xl:col-span-3">
              <RightPanel
                project={activeProject}
                onExportExcel={handleExportExcel}
              />
            </div>
          </div>

          {/* Bottom Recap Total Volume Section */}
          <RecapCards
            works={activeProject.works}
            onApproveAllReadyDrafts={handleApproveAllReadyDrafts}
          />
        </div>
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200 max-w-md">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals (Keyed by userId and activeProject.id to guarantee strict state isolation) */}
      <UserProfileModal
        isOpen={isUserProfileOpen}
        user={currentUser}
        onClose={() => setIsUserProfileOpen(false)}
        onUpdateUser={(updated) => {
          setCurrentUser(updated);
          showToast('Profil akun berhasil diperbarui.');
        }}
        onLogout={handleLogout}
      />

      <WorkDetailModal
        key={`detail-${userId}-${activeProject.id}-${selectedWorkForDetail?.id || 'none'}`}
        isOpen={Boolean(selectedWorkForDetail)}
        work={selectedWorkForDetail}
        floorName={currentWorkFloor?.name}
        onClose={() => setSelectedWorkForDetail(null)}
        onSaveWork={handleSaveWorkItem}
        onRejectDraftWork={handleRejectDraftWork}
      />

      <AddWorkModal
        key={`add-${userId}-${activeProject.id}`}
        isOpen={isAddWorkOpen}
        floors={activeProject.floors}
        defaultFloorId={targetFloorForAdd}
        projectWorks={activeProject.works}
        onClose={() => setIsAddWorkOpen(false)}
        onAddWork={handleAddWorkItem}
        onAddMultipleWorks={handleAddMultipleWorks}
      />

      <AIAssistantModal
        key={`ai-${userId}-${activeProject.id}`}
        isOpen={isAIOpen}
        userId={userId}
        projectId={activeProject.id}
        floors={activeProject.floors}
        currentFloorId={activeProject.floors[0]?.id || 'fl-umum'}
        onClose={() => setIsAIOpen(false)}
        onAutoTakeoff={handleAutoTakeoff}
        onAddRecommendationWork={handleAddRecommendationWork}
        onApproveDraftWork={handleApproveDraftWork}
        onRejectDraftWork={handleRejectDraftWork}
        onApproveAllReadyDrafts={handleApproveAllReadyDrafts}
        onOpenWorkDetail={(work) => {
          setIsAIOpen(false);
          setSelectedWorkForDetail(work);
        }}
        existingWorks={activeProject.works}
      />

      <FloorManagementModal
        isOpen={isFloorsOpen}
        floors={activeProject.floors}
        works={activeProject.works}
        onClose={() => setIsFloorsOpen(false)}
        onAddFloor={handleAddFloor}
        onRenameFloor={handleRenameFloor}
        onDeleteFloor={handleDeleteFloor}
        onDuplicateFloor={handleDuplicateFloor}
      />

      <ProjectManagementModal
        isOpen={isProjectsOpen}
        projects={projects}
        activeProjectId={activeProjectId}
        userId={userId}
        onClose={() => setIsProjectsOpen(false)}
        onSelectProject={(id) => {
          setSelectedWorkForDetail(null);
          setRecentlyDeletedWorks([]);
          setActiveId(id);
          setActiveProjectId(id, userId);
        }}
        onSaveProjects={(newProjs, deletedProjectId) => {
          setProjects(newProjs);
          saveAllProjects(newProjs, userId);
          if (deletedProjectId) {
            deleteProjectFromServer(userId, deletedProjectId).catch(() => {});
            deleteProjectFromFirestore(userId, deletedProjectId).catch(() => {});
          }
        }}
      />
    </div>
  );
}
