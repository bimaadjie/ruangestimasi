import React, { useState } from 'react';
import {
  X,
  Layers,
  Plus,
  Trash2,
  Copy,
  Pencil,
  Check,
  AlertTriangle,
  ArrowRightLeft,
} from 'lucide-react';
import { FloorItem, ProjectWorkItem } from '../types';

interface FloorManagementModalProps {
  isOpen: boolean;
  floors: FloorItem[];
  works: ProjectWorkItem[];
  onClose: () => void;
  onAddFloor: (name: string, elevation: string) => void;
  onRenameFloor: (floorId: string, newName: string, newElevation: string) => void;
  onDeleteFloor: (floorId: string, moveWorksToFloorId?: string) => void;
  onDuplicateFloor: (floorId: string) => void;
}

export const FloorManagementModal: React.FC<FloorManagementModalProps> = ({
  isOpen,
  floors,
  works,
  onClose,
  onAddFloor,
  onRenameFloor,
  onDeleteFloor,
  onDuplicateFloor,
}) => {
  if (!isOpen) return null;

  const [newFloorName, setNewFloorName] = useState('');
  const [newElevation, setNewElevation] = useState('');
  const [editingFloorId, setEditingFloorId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editElevation, setEditElevation] = useState('');
  const [floorPendingDelete, setFloorPendingDelete] = useState<FloorItem | null>(null);
  const [moveTargetFloorId, setMoveTargetFloorId] = useState<string>('fl-umum');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFloorName.trim()) return;
    onAddFloor(newFloorName.trim(), newElevation.trim() || '+ 0.00 m');
    setNewFloorName('');
    setNewElevation('');
  };

  const handleSaveEdit = (floorId: string) => {
    if (editName.trim()) {
      onRenameFloor(floorId, editName.trim(), editElevation.trim());
    }
    setEditingFloorId(null);
  };

  const initiateDeleteFloor = (floor: FloorItem) => {
    const otherFloors = floors.filter((f) => f.id !== floor.id);
    setMoveTargetFloorId(otherFloors[0]?.id || 'fl-umum');
    setFloorPendingDelete(floor);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Kelola Lantai &amp; Elevasi</h3>
              <p className="text-xs text-slate-500">
                Tambah lantai (otomatis menyiapkan daftar pekerjaan standar), ubah nama, atau kelola lantai.
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

        {/* Content */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-5 text-xs">
          {/* Floor List */}
          <div className="space-y-2.5">
            <label className="font-bold text-slate-800 block">
              Daftar Lantai Aktif ({floors.length})
            </label>
            {floors.map((floor) => {
              const floorWorksCount = works.filter((w) => w.floorId === floor.id).length;
              const isEditing = editingFloorId === floor.id;
              const isPendingDelete = floorPendingDelete?.id === floor.id;

              return (
                <div
                  key={floor.id}
                  className={`p-3 border rounded-xl space-y-3 transition ${
                    isPendingDelete
                      ? 'bg-rose-50/60 border-rose-300'
                      : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="px-2 py-1 border border-slate-300 rounded text-xs font-bold w-36 bg-white"
                          autoFocus
                        />
                        <input
                          type="text"
                          placeholder="+ 4.00 m"
                          value={editElevation}
                          onChange={(e) => setEditElevation(e.target.value)}
                          className="px-2 py-1 border border-slate-300 rounded text-xs w-24 font-mono bg-white"
                        />
                        <button
                          onClick={() => handleSaveEdit(floor.id)}
                          className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{floor.name}</span>
                          {floor.elevation && (
                            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                              {floor.elevation}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {floorWorksCount} pekerjaan terdaftar
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isEditing && (
                        <button
                          onClick={() => {
                            setEditingFloorId(floor.id);
                            setEditName(floor.name);
                            setEditElevation(floor.elevation || '');
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Ubah Nama/Elevasi"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => onDuplicateFloor(floor.id)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                        title="Duplikasi Lantai & Seluruh Pekerjaannya"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {floor.id !== 'fl-umum' && (
                        <button
                          onClick={() => initiateDeleteFloor(floor)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Hapus Lantai"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Confirmation Panel when user clicks Delete on a floor */}
                  {isPendingDelete && (
                    <div className="pt-2.5 border-t border-rose-200 space-y-2.5 text-[11px]">
                      <div className="flex items-start gap-2 text-rose-900">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block">
                            Konfirmasi Penghapusan {floor.name}
                          </span>
                          <span className="text-rose-700 block mt-0.5">
                            Terdapat <strong>{floorWorksCount} pekerjaan</strong> pada lantai ini.
                            Pilih tindakan untuk pekerjaan tersebut:
                          </span>
                        </div>
                      </div>

                      {floorWorksCount > 0 && floors.filter((f) => f.id !== floor.id).length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-lg border border-rose-200">
                          <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="font-semibold text-slate-700">Pindahkan ke:</span>
                          <select
                            value={moveTargetFloorId}
                            onChange={(e) => setMoveTargetFloorId(e.target.value)}
                            className="px-2 py-1 rounded border border-slate-300 font-bold text-slate-800 bg-white"
                          >
                            {floors
                              .filter((f) => f.id !== floor.id)
                              .map((f) => (
                                <option key={f.id} value={f.id}>
                                  {f.name}
                                </option>
                              ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteFloor(floor.id, moveTargetFloorId);
                              setFloorPendingDelete(null);
                            }}
                            className="ml-auto px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition cursor-pointer"
                          >
                            Pindahkan Pekerjaan &amp; Hapus Lantai
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setFloorPendingDelete(null)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold transition cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteFloor(floor.id);
                            setFloorPendingDelete(null);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition cursor-pointer"
                        >
                          Hapus Lantai Beserta Pekerjaannya
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add New Floor Form */}
          <form onSubmit={handleAddSubmit} className="pt-3 border-t border-slate-200/80 space-y-3">
            <div>
              <label className="font-bold text-slate-800 block">Tambah Lantai Baru</label>
              <span className="text-[11px] text-slate-500">
                Lantai baru akan otomatis dilengkapi daftar pekerjaan standar konstruksi (parameter kosong).
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Contoh: Lantai 3 / Rooftop"
                value={newFloorName}
                onChange={(e) => setNewFloorName(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Elevasi (contoh: + 8.00 m)"
                value={newElevation}
                onChange={(e) => setNewElevation(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Lantai &amp; Pekerjaan Standar</span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-end bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};

