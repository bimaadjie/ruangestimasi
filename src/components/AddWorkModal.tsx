import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Search,
  Layers,
  EyeOff,
  Eye,
  Pencil,
  Trash2,
  AlertTriangle,
  BookmarkPlus,
  Check,
  CheckSquare,
  Square,
} from 'lucide-react';
import { CATALOG_WORK_ITEMS } from '../data/uscCatalog';
import { CatalogWorkItem, FloorItem, ProjectWorkItem, WorkCategory } from '../types';
import {
  createProjectWorkFromCatalog,
  loadCustomCatalogItems,
  saveCustomCatalogItems,
  loadDisabledCatalogIds,
  saveDisabledCatalogIds,
} from '../services/projectStorage';

interface AddWorkModalProps {
  isOpen: boolean;
  floors: FloorItem[];
  defaultFloorId?: string;
  projectWorks?: ProjectWorkItem[];
  onClose: () => void;
  onAddWork: (newWork: ProjectWorkItem) => void;
  onAddMultipleWorks?: (
    newWorks: ProjectWorkItem[],
    floorName: string,
    skippedCount: number
  ) => void;
}

export const AddWorkModal: React.FC<AddWorkModalProps> = ({
  isOpen,
  floors,
  defaultFloorId,
  projectWorks = [],
  onClose,
  onAddWork,
  onAddMultipleWorks,
}) => {
  if (!isOpen) return null;

  const [selectedFloorId, setSelectedFloorId] = useState<string>(
    defaultFloorId || floors[0]?.id || 'fl-1'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mode, setMode] = useState<'catalog' | 'custom'>('catalog');
  const [showDisabledCatalog, setShowDisabledCatalog] = useState<boolean>(false);

  // Multi-select state
  const [selectedCatalogIds, setSelectedCatalogIds] = useState<Set<string>>(new Set());

  // Persisted Catalog State
  const [disabledIds, setDisabledIds] = useState<string[]>(() => loadDisabledCatalogIds());
  const [customCatalog, setCustomCatalog] = useState<CatalogWorkItem[]>(() =>
    loadCustomCatalogItems()
  );

  // Custom Work Create / Edit State
  const [editingCustomCatalogId, setEditingCustomCatalogId] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<WorkCategory>('Struktural');
  const [customUnit, setCustomUnit] = useState('m³');
  const [customDescription, setCustomDescription] = useState('');
  const [customFormula, setCustomFormula] = useState('panjang * lebar * tinggi');
  const [saveToCatalogTemplate, setSaveToCatalogTemplate] = useState<boolean>(true);

  // Confirmation modal for permanent custom catalog deletion
  const [catalogItemToDelete, setCatalogItemToDelete] = useState<CatalogWorkItem | null>(null);

  useEffect(() => {
    if (defaultFloorId) {
      setSelectedFloorId(defaultFloorId);
    }
    setDisabledIds(loadDisabledCatalogIds());
    setCustomCatalog(loadCustomCatalogItems());
    setSelectedCatalogIds(new Set());
  }, [isOpen, defaultFloorId]);

  const categories = ['Semua', 'Persiapan Dll', 'Struktural', 'Arsitektural', 'MEP'];

  const allCatalogItems: CatalogWorkItem[] = [...customCatalog, ...CATALOG_WORK_ITEMS];
  const disabledSet = new Set(disabledIds);

  const activeCatalogCount = allCatalogItems.filter((item) => !disabledSet.has(item.id)).length;
  const disabledCatalogCount = allCatalogItems.filter((item) => disabledSet.has(item.id)).length;

  const filteredCatalog = allCatalogItems.filter((item) => {
    const isDisabled = disabledSet.has(item.id);
    if (!showDisabledCatalog && isDisabled) return false;
    if (showDisabledCatalog && !isDisabled) return false;

    const matchCat = selectedCategory === 'Semua' || item.category === selectedCategory;
    const matchSearch =
      searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.formulaDisplay.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const targetFloor = floors.find((f) => f.id === selectedFloorId);
  const floorNameText = targetFloor ? targetFloor.name : 'Lantai Terpilih';

  const handleToggleSelectCatalogItem = (catalogId: string) => {
    setSelectedCatalogIds((prev) => {
      const next = new Set(prev);
      if (next.has(catalogId)) {
        next.delete(catalogId);
      } else {
        next.add(catalogId);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    const selectable = filteredCatalog.filter((item) => !disabledSet.has(item.id));
    const allSelected = selectable.every((item) => selectedCatalogIds.has(item.id));

    setSelectedCatalogIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        selectable.forEach((item) => next.delete(item.id));
      } else {
        selectable.forEach((item) => next.add(item.id));
      }
      return next;
    });
  };

  const handleToggleDisableBuiltIn = (id: string) => {
    const next = disabledSet.has(id)
      ? disabledIds.filter((item) => item !== id)
      : [...disabledIds, id];
    setDisabledIds(next);
    saveDisabledCatalogIds(next);
  };

  const handleSelectSingleCatalogItem = (catalogItem: CatalogWorkItem) => {
    const newWork = createProjectWorkFromCatalog(catalogItem.id, selectedFloorId);
    if (newWork) {
      onAddWork(newWork);
      onClose();
    }
  };

  const handleAddMultipleSelectedWorks = () => {
    if (selectedCatalogIds.size === 0) return;

    const worksToAdd: ProjectWorkItem[] = [];
    let skippedCount = 0;

    // Check existing works on the target floor to prevent duplicate instances of the same catalog template
    const existingCatalogIdsOnFloor = new Set(
      projectWorks
        .filter((w) => w.floorId === selectedFloorId && w.catalogId)
        .map((w) => w.catalogId!)
    );

    for (const catalogId of selectedCatalogIds) {
      if (existingCatalogIdsOnFloor.has(catalogId)) {
        skippedCount++;
        continue;
      }

      const item = allCatalogItems.find((c) => c.id === catalogId);
      if (item) {
        const created = createProjectWorkFromCatalog(item.id, selectedFloorId);
        if (created) {
          worksToAdd.push(created);
        }
      }
    }

    if (worksToAdd.length > 0) {
      if (onAddMultipleWorks) {
        onAddMultipleWorks(worksToAdd, floorNameText, skippedCount);
      } else {
        worksToAdd.forEach((w) => onAddWork(w));
      }
      onClose();
    } else if (skippedCount > 0) {
      alert(`Seluruh ${skippedCount} pekerjaan yang dipilih sudah ada pada ${floorNameText}.`);
    }
  };

  const handleStartEditCustomCatalog = (item: CatalogWorkItem) => {
    setEditingCustomCatalogId(item.id);
    setCustomName(item.name);
    setCustomCategory(item.category);
    setCustomUnit(item.defaultUnit);
    setCustomDescription(item.description || '');
    setCustomFormula(item.customFormula || item.formulaDisplay || 'panjang * lebar * tinggi');
    setSaveToCatalogTemplate(true);
    setMode('custom');
  };

  const resetCustomForm = () => {
    setEditingCustomCatalogId(null);
    setCustomName('');
    setCustomCategory('Struktural');
    setCustomUnit('m³');
    setCustomDescription('');
    setCustomFormula('panjang * lebar * tinggi');
    setSaveToCatalogTemplate(true);
  };

  const handleConfirmDeleteCustomCatalog = () => {
    if (!catalogItemToDelete) return;
    const nextCustom = customCatalog.filter((c) => c.id !== catalogItemToDelete.id);
    setCustomCatalog(nextCustom);
    saveCustomCatalogItems(nextCustom);
    setCatalogItemToDelete(null);
  };

  const handleCreateOrUpdateCustomWork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const cleanFormula = customFormula
      .trim()
      .replace(/×/g, '*')
      .replace(/÷/g, '/');

    const defaultParams = [
      { id: 'panjang', name: 'panjang', label: 'Panjang (P)', value: null, unit: 'm', required: true },
      { id: 'lebar', name: 'lebar', label: 'Lebar (L)', value: null, unit: 'm', required: true },
      { id: 'tinggi', name: 'tinggi', label: 'Tinggi (T)', value: null, unit: 'm', required: true },
    ];

    if (editingCustomCatalogId) {
      const updatedList = customCatalog.map((c) =>
        c.id === editingCustomCatalogId
          ? {
              ...c,
              name: customName.trim(),
              category: customCategory,
              defaultUnit: customUnit.trim() || 'm³',
              description: customDescription.trim() || 'Pekerjaan kustom pengguna',
              formulaDisplay: customFormula.trim() || 'Panjang × Lebar × Tinggi',
              customFormula: cleanFormula,
            }
          : c
      );
      setCustomCatalog(updatedList);
      saveCustomCatalogItems(updatedList);
      resetCustomForm();
      setMode('catalog');
      return;
    }

    const catalogIdToUse = `custom-cat-${Date.now()}`;

    if (saveToCatalogTemplate) {
      const newCustomCatalogItem: CatalogWorkItem = {
        id: catalogIdToUse,
        name: customName.trim(),
        category: customCategory,
        floorRule: 'per_lantai',
        description: customDescription.trim() || 'Pekerjaan kustom pengguna',
        defaultUnit: customUnit.trim() || 'm³',
        formulaDisplay: customFormula.trim() || 'Panjang × Lebar × Tinggi',
        customFormula: cleanFormula,
        isCustomCatalog: true,
        excelSheet: 'Kustom',
        excelCell: 'USER',
        parameters: defaultParams,
        calculationMethod: () => null,
        verificationStatus: 'Perlu Input',
      };
      const updatedList = [newCustomCatalogItem, ...customCatalog];
      setCustomCatalog(updatedList);
      saveCustomCatalogItems(updatedList);
    }

    const newProjectWork: ProjectWorkItem = {
      id: `work-custom-${Date.now()}`,
      catalogId: saveToCatalogTemplate ? catalogIdToUse : undefined,
      name: customName.trim(),
      category: customCategory,
      floorId: selectedFloorId,
      unit: customUnit.trim() || 'm³',
      formulaDisplay: customFormula.trim() || 'Panjang × Lebar × Tinggi',
      customFormula: cleanFormula,
      parameters: defaultParams,
      components: [],
      calculatedVolume: null,
      status: 'Perlu Input',
      origin: 'manual',
      aiVerificationStatus: 'verified',
      excelSheet: 'Kustom',
      excelCell: 'USER',
      isActive: true,
      lastUpdated: new Date().toISOString(),
    };

    onAddWork(newProjectWork);
    resetCustomForm();
    onClose();
  };

  const getCategoryBadgeClass = (cat: WorkCategory) => {
    switch (cat) {
      case 'Persiapan Dll':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Struktural':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'Arsitektural':
        return 'bg-teal-50 text-teal-700 border-teal-100';
      case 'MEP':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const countUsedInActiveProject = (catalogId: string) => {
    return projectWorks.filter((w) => w.catalogId === catalogId).length;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Katalog Pekerjaan Konstruksi
              </h3>
              <p className="text-xs text-slate-500">
                Pilih satu atau beberapa pekerjaan sekaligus untuk ditambahkan ke kelompok lantai.
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

        {/* Top Controls: Target Floor Indicator & Mode Switcher */}
        <div className="px-6 py-3.5 border-b border-slate-100 bg-blue-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-semibold text-slate-700">Lantai Target:</span>
            <select
              value={selectedFloorId}
              onChange={(e) => setSelectedFloorId(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-blue-300 font-bold text-blue-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
            >
              {floors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} {f.elevation ? `(${f.elevation})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-white border border-slate-200 rounded-lg shadow-2xs">
              <button
                onClick={() => {
                  resetCustomForm();
                  setMode('catalog');
                }}
                className={`px-3 py-1 font-semibold rounded-md transition cursor-pointer ${
                  mode === 'catalog'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Katalog Pekerjaan ({activeCatalogCount})
              </button>
              <button
                onClick={() => setMode('custom')}
                className={`px-3 py-1 font-semibold rounded-md transition cursor-pointer ${
                  mode === 'custom'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {editingCustomCatalogId ? 'Edit Katalog Kustom' : '+ Pekerjaan Kustom'}
              </button>
            </div>
          </div>
        </div>

        {/* Catalog Mode */}
        {mode === 'catalog' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search & Category Filter */}
            <div className="p-4 border-b border-slate-100 space-y-3 shrink-0 bg-white">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari nama pekerjaan atau rumus dalam katalog..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowDisabledCatalog(!showDisabledCatalog)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition shrink-0 cursor-pointer ${
                    showDisabledCatalog
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {showDisabledCatalog ? (
                    <>
                      <Eye className="w-3.5 h-3.5 text-amber-600" />
                      <span>Kembali ke Katalog Aktif ({activeCatalogCount})</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                      <span>Item Nonaktif ({disabledCatalogCount})</span>
                    </>
                  )}
                </button>
              </div>

              {/* Category Pills & Select All Button */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-lg font-medium transition shrink-0 cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {!showDisabledCatalog && filteredCatalog.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 transition flex items-center gap-1 cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Pilih / Batal Semua di Halaman Ini</span>
                  </button>
                )}
              </div>
            </div>

            {/* Catalog List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {filteredCatalog.map((item) => {
                const isDisabled = disabledSet.has(item.id);
                const isCustom = Boolean(item.isCustomCatalog);
                const isChecked = selectedCatalogIds.has(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!isDisabled) {
                        handleToggleSelectCatalogItem(item.id);
                      }
                    }}
                    className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer ${
                      isDisabled
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : isChecked
                        ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-400 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Checkbox for multi-select */}
                      {!isDisabled && (
                        <div className="mt-0.5 shrink-0 text-blue-600">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 fill-blue-600 text-white" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                          )}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${getCategoryBadgeClass(
                              item.category
                            )}`}
                          >
                            {item.category}
                          </span>
                          {isCustom && (
                            <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                              Katalog Kustom
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {item.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-slate-600">
                          <span className="font-semibold text-slate-700">
                            Satuan: <span className="font-mono text-slate-900">{item.defaultUnit}</span>
                          </span>
                          <span>·</span>
                          <span className="text-slate-500">
                            Rumus:{' '}
                            <span className="font-medium text-slate-800">{item.formulaDisplay}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 shrink-0 self-end sm:self-center"
                    >
                      {isCustom && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStartEditCustomCatalog(item)}
                            title="Edit Template Katalog Kustom"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCatalogItemToDelete(item)}
                            title="Hapus Permanen dari Katalog Kustom"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {!isCustom && (
                        <button
                          type="button"
                          onClick={() => handleToggleDisableBuiltIn(item.id)}
                          title={
                            isDisabled
                              ? 'Aktifkan Kembali Pekerjaan di Katalog'
                              : 'Nonaktifkan / Sembunyikan dari Katalog'
                          }
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                            isDisabled
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-800'
                          }`}
                        >
                          {isDisabled ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Aktifkan</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span className="hidden md:inline">Sembunyikan</span>
                            </>
                          )}
                        </button>
                      )}

                      {!isDisabled && (
                        <button
                          type="button"
                          onClick={() => handleSelectSingleCatalogItem(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition shadow-2xs shrink-0 cursor-pointer"
                          title={`Tambahkan langsung ke ${floorNameText}`}
                        >
                          <Plus className="w-3 h-3" />
                          <span>Pilih</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredCatalog.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-500">
                  {showDisabledCatalog
                    ? 'Tidak ada pekerjaan katalog yang sedang dinonaktifkan.'
                    : 'Tidak ditemukan item pekerjaan yang cocok dengan pencarian.'}
                </div>
              )}
            </div>

            {/* Bottom Multi-Select Sticky Action Bar */}
            {selectedCatalogIds.size > 0 && (
              <div className="p-3.5 px-6 border-t border-blue-200 bg-blue-50/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0 animate-in slide-in-from-bottom-2 duration-150">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[11px]">
                    {selectedCatalogIds.size}
                  </span>
                  <span className="font-bold text-slate-900">
                    {selectedCatalogIds.size} pekerjaan dipilih untuk ditambahkan ke{' '}
                    <span className="text-blue-700 underline underline-offset-2">{floorNameText}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCatalogIds(new Set())}
                    className="px-3 py-1.5 font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition cursor-pointer"
                  >
                    Batalkan Pilihan
                  </button>

                  <button
                    type="button"
                    onClick={handleAddMultipleSelectedWorks}
                    className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambahkan {selectedCatalogIds.size} Pekerjaan ke {floorNameText}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Custom Work Form Mode */}
        {mode === 'custom' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {editingCustomCatalogId ? 'Edit Template Pekerjaan Kustom' : 'Buat Pekerjaan Kustom Baru'}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tentukan nama, rumus perhitungan matematika, dan satuan pekerjaan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetCustomForm();
                  setMode('catalog');
                }}
                className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                Kembali ke Katalog
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateCustomWork} className="space-y-4">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Nama Pekerjaan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pasangan Rangka Hollow Plafond"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Kategori Pekerjaan</label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as WorkCategory)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Persiapan Dll">Persiapan Dll</option>
                    <option value="Struktural">Struktural</option>
                    <option value="Arsitektural">Arsitektural</option>
                    <option value="MEP">MEP</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Satuan Hasil Volume</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: m³, m², m', titik, unit"
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Rumus Perhitungan Teknis</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: panjang * lebar * tinggi atau panjang * lebar"
                  value={customFormula}
                  onChange={(e) => setCustomFormula(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <span className="text-[11px] text-slate-500 block mt-1">
                  Variabel yang didukung: <code className="text-blue-700 font-mono">panjang</code>, <code className="text-blue-700 font-mono">lebar</code>, <code className="text-blue-700 font-mono">tinggi</code>, operasi matematika (+, -, *, /).
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Deskripsi &amp; Catatan Teknis</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan pekerjaan atau spesifikasi bahan..."
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {!editingCustomCatalogId && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="saveToCatalogTemplate"
                    checked={saveToCatalogTemplate}
                    onChange={(e) => setSaveToCatalogTemplate(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="saveToCatalogTemplate" className="text-slate-700 font-medium cursor-pointer">
                    Simpan juga sebagai template di Katalog Pekerjaan (dapat digunakan kembali di lantai lain)
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    resetCustomForm();
                    setMode('catalog');
                  }}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer"
                >
                  {editingCustomCatalogId ? 'Perbarui Template' : 'Tambahkan Pekerjaan'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0 text-xs text-slate-500">
          <span>Menambahkan ke: <strong className="text-slate-800">{floorNameText}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Permanent Custom Catalog Deletion */}
      {catalogItemToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-slate-900 leading-tight">
                  Hapus Template Pekerjaan Kustom?
                </h4>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Template <strong>"{catalogItemToDelete.name}"</strong> akan dihapus permanen dari daftar katalog kustom.
                </p>
                {countUsedInActiveProject(catalogItemToDelete.id) > 0 ? (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Pekerjaan ini sedang digunakan oleh{' '}
                      <strong>{countUsedInActiveProject(catalogItemToDelete.id)} item</strong> di proyek aktif. Pekerjaan pada proyek Anda TIDAK akan terhapus, namun tidak dapat dipilih lagi dari katalog.
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Pekerjaan ini belum digunakan pada proyek aktif.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setCatalogItemToDelete(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCustomCatalog}
                className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
