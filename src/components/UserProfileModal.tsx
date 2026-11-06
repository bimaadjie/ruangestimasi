/**
 * RuangEstimasi: Modal Profil & Pengaturan Akun Pengguna
 * Menampilkan nama pengguna, email, jenis akun (Student / Estimator / Other), avatar inisial,
 * pengaturan profil, dan tombol Logout.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Briefcase,
  GraduationCap,
  Users,
  LogOut,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { UserAccountType, UserProfile } from '../types';
import { getInitials, updateUserProfileData } from '../services/authService';

interface UserProfileModalProps {
  isOpen: boolean;
  user: UserProfile;
  onClose: () => void;
  onUpdateUser: (updated: UserProfile) => void;
  onLogout: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  user,
  onClose,
  onUpdateUser,
  onLogout,
}) => {
  if (!isOpen) return null;

  const [fullName, setFullName] = useState(user.fullName);
  const [userType, setUserType] = useState<UserAccountType>(user.userType);
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setFullName(user.fullName);
    setUserType(user.userType);
    setSavedNotice(false);
  }, [user, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setIsSaving(true);
    try {
      const updated = await updateUserProfileData(user, {
        fullName: fullName.trim(),
        userType,
      });
      onUpdateUser(updated);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const roles: { id: UserAccountType; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'Student',
      label: 'Student',
      desc: 'Mahasiswa atau pelajar',
      icon: <GraduationCap className="w-4 h-4" />,
    },
    {
      id: 'Estimator',
      label: 'Estimator',
      desc: 'Quantity surveyor / praktisi volume',
      icon: <Briefcase className="w-4 h-4" />,
    },
    {
      id: 'Other',
      label: 'Other',
      desc: 'Kategori pengguna lainnya',
      icon: <Users className="w-4 h-4" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm ring-2 ring-blue-100">
              {getInitials(user.fullName)}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Profil Akun RuangEstimasi</h3>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
          {savedNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Profil akun berhasil diperbarui.</span>
            </div>
          )}

          <div>
            <label className="font-bold text-slate-800 block mb-1.5">Nama Lengkap</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1.5">Alamat Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1.5">Jenis Akun Pengguna</label>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((r) => {
                const active = userType === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setUserType(r.id)}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                      active
                        ? 'border-blue-600 bg-blue-50/80 text-blue-800 font-bold ring-1 ring-blue-500'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    {r.icon}
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar (Logout)</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-2xs transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Profil'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
