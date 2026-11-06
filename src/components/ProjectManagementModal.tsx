import React, { useState } from 'react';
import {
  X,
  FolderKanban,
  Plus,
  Building,
  Trash2,
  Calendar,
} from 'lucide-react';
import { ProjectData } from '../types';
import { createNewProject } from '../services/projectStorage';

interface ProjectManagementModalProps {
  isOpen: boolean;
  projects: ProjectData[];
  activeProjectId: string;
  userId?: string;
  onClose: () => void;
  onSelectProject: (projectId: string) => void;
  onSaveProjects: (projects: ProjectData[], deletedProjectId?: string) => void;
}

export const ProjectManagementModal: React.FC<ProjectManagementModalProps> = ({
  isOpen,
  projects,
  activeProjectId,
  userId,
  onClose,
  onSelectProject,
  onSaveProjects,
}) => {
  if (!isOpen) return null;

  const [isCreating, setIsCreating] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newFloorCount, setNewFloorCount] = useState(2);
  const [newLocation, setNewLocation] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    const newProj = createNewProject(
      newProjName.trim(),
      newFloorCount,
      newLocation.trim(),
      userId
    );
    const updated = [newProj, ...projects];
    onSaveProjects(updated);
    onSelectProject(newProj.id);
    setIsCreating(false);
    setNewProjName('');
    setNewLocation('');
    onClose();
  };

  const handleDeleteProject = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (projects.length <= 1) return;

    if (deleteConfirmId !== projectId) {
      setDeleteConfirmId(projectId);
      return;
    }

    const updated = projects.filter((p) => p.id !== projectId);
    onSaveProjects(updated, projectId);
    setDeleteConfirmId(null);
    if (activeProjectId === projectId && updated[0]) {
      onSelectProject(updated[0].id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Manajemen Proyek</h3>
              <p className="text-xs text-slate-500">
                Pilih, buat proyek baru, atau kelola daftar proyek perhitungan volume Anda
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
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-5 text-xs">
          {!isCreating ? (
            <>
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800">
                  Daftar Proyek Milik Anda ({projects.length})
                </label>
                <button
                  onClick={() => setIsCreating(true)}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buat Proyek Baru</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {projects.map((proj) => {
                  const isActive = proj.id === activeProjectId;
                  const formattedDate = new Date(proj.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={proj.id}
                      onClick={() => {
                        onSelectProject(proj.id);
                        onClose();
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                        isActive
                          ? 'border-blue-500 bg-blue-50/40 shadow-xs ring-1 ring-blue-400'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                            isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Building className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 truncate">{proj.name}</span>
                            {isActive && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                                Aktif
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 block">
                            {proj.floorCount} Lantai · {proj.works.length} Pekerjaan ·{' '}
                            {proj.location || 'Lokasi belum diisi'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formattedDate}
                        </span>
                        {projects.length > 1 && (
                          <button
                            onClick={(e) => handleDeleteProject(proj.id, e)}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              deleteConfirmId === proj.id
                                ? 'bg-rose-600 text-white font-bold text-[10px] px-2'
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                            title="Hapus Proyek"
                          >
                            {deleteConfirmId === proj.id ? 'Hapus?' : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">Buat Proyek Konstruksi Baru</h4>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Kembali ke Daftar
                </button>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Nama Proyek *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Proyek Rumah Tinggal 2 Lantai"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Jumlah Lantai</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={newFloorCount}
                    onChange={(e) => setNewFloorCount(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Lokasi Proyek</label>
                  <input
                    type="text"
                    placeholder="Contoh: Jakarta Selatan"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Buat Proyek
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-end bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
