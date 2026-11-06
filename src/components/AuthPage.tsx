/**
 * RuangEstimasi: Halaman Autentikasi Pengguna (Sign In & Create Account)
 * Menyediakan pendaftaran akun baru, masuk akun dengan Email/Password atau Google,
 * validasi, tampil/sembunyikan password, dan fitur pemulihan password.
 */

import React, { useState } from 'react';
import {
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Briefcase,
  GraduationCap,
  Users,
  AlertCircle,
  CheckCircle2,
  Layers,
  FileSpreadsheet,
  KeyRound,
  ScanText,
} from 'lucide-react';
import { UserAccountType, UserProfile } from '../types';
import {
  registerUserAccount,
  signInWithEmail,
  signInWithGoogleAccount,
  requestPasswordReset,
  validateEmailFormat,
} from '../services/authService';

interface AuthPageProps {
  onAuthenticated: (user: UserProfile) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<UserAccountType>('Estimator');
  const [newResetPassword, setNewResetPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const switchMode = (nextMode: 'signin' | 'signup' | 'forgot') => {
    setMode(nextMode);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!validateEmailFormat(email)) {
      setErrorMsg('Format alamat email tidak valid. Contoh: nama@email.com');
      return;
    }
    if (!password) {
      setErrorMsg('Silakan masukkan password akun Anda.');
      return;
    }

    setIsLoading(true);
    try {
      const profile = await signInWithEmail(email, password);
      onAuthenticated(profile);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal masuk ke akun.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg('Nama lengkap wajib diisi (minimal 2 karakter).');
      return;
    }
    if (!validateEmailFormat(email)) {
      setErrorMsg('Format alamat email tidak valid. Contoh: nama@email.com');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password minimal harus terdiri dari 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok dengan password yang dimasukkan.');
      return;
    }

    setIsLoading(true);
    try {
      const profile = await registerUserAccount({
        fullName,
        email,
        password,
        userType,
      });
      onAuthenticated(profile);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal mendaftarkan akun baru.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!validateEmailFormat(email)) {
      setErrorMsg('Masukkan alamat email akun yang terdaftar.');
      return;
    }
    if (newResetPassword && newResetPassword.length < 6) {
      setErrorMsg('Password baru minimal harus terdiri dari 6 karakter.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await requestPasswordReset(email, newResetPassword || undefined);
      setSuccessMsg(res.message);
      if (newResetPassword) {
        setTimeout(() => {
          setPassword(newResetPassword);
          setNewResetPassword('');
          setMode('signin');
        }, 1400);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memproses pemulihan password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);
    try {
      const profile = await signInWithGoogleAccount(userType);
      onAuthenticated(profile);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal masuk dengan Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const userTypeOptions: {
    id: UserAccountType;
    title: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'Student',
      title: 'Student',
      desc: 'Mahasiswa atau pelajar teknik sipil & arsitektur',
      icon: <GraduationCap className="w-4 h-4" />,
    },
    {
      id: 'Estimator',
      title: 'Estimator',
      desc: 'Quantity surveyor, estimator, atau praktisi volume',
      icon: <Briefcase className="w-4 h-4" />,
    },
    {
      id: 'Other',
      title: 'Other',
      desc: 'Pengguna umum, pemilik bangunan, atau kategori lain',
      icon: <Users className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col lg:flex-row">
      {/* Left Technical Info Panel */}
      <div className="lg:w-5/12 xl:w-1/2 bg-[#0F172A] border-b lg:border-b-0 lg:border-r border-slate-800 text-white p-8 sm:p-12 flex flex-col justify-between relative">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-2xs">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">RuangEstimasi</h1>
              <p className="text-xs text-slate-400">
                Quantity Takeoff &amp; Estimasi Volume Konstruksi
              </p>
            </div>
          </div>

          <div className="mt-10 sm:mt-12 max-w-lg space-y-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 border border-slate-700 text-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Sistem Estimasi Terstruktur
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight text-white">
              Perhitungan Volume Pekerjaan Konstruksi yang Akurat &amp; Transparan
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Platform Quantity Takeoff untuk membaca gambar kerja arsitektur dan struktur, mengekstraksi dimensi elemen bangunan, serta menyusun rincian volume pekerjaan siap ekspor.
            </p>
          </div>

          <div className="mt-8 space-y-3 max-w-md text-xs">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-800/60 flex items-center justify-center shrink-0 mt-0.5 text-blue-400">
                <ScanText className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-white block">
                  Ekstraksi Gambar Teknik &amp; Segmen Struktur
                </span>
                <span className="text-slate-300 block mt-0.5 leading-normal">
                  Identifikasi denah arsitektur, denah sloof, balok, kolom, tabel pembesian, dan bentang per grid struktur.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-800/60 flex items-center justify-center shrink-0 mt-0.5 text-blue-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-white block">
                  Manajemen Proyek &amp; Pengelompokan Lantai
                </span>
                <span className="text-slate-300 block mt-0.5 leading-normal">
                  Struktur breakdown pekerjaan per lantai (Ground, Lantai 1, dst.) dengan isolasi data akun yang aman.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-800/60 flex items-center justify-center shrink-0 mt-0.5 text-blue-400">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-white block">
                  Standar Rumus Sipil &amp; Ekspor Excel (.xlsx)
                </span>
                <span className="text-slate-300 block mt-0.5 leading-normal">
                  Rumus matematis terbuka yang dapat diverifikasi dan siap diekspor ke format spreadsheet standar proyek.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>RuangEstimasi Platform</span>
          <span>Student · Estimator · Professional</span>
        </div>
      </div>

      {/* Right Form Card Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-slate-50">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 sm:p-8 space-y-6">
          {/* Top Mode Tabs */}
          {mode !== 'forgot' ? (
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className={`py-2 text-xs rounded-lg transition-colors cursor-pointer min-h-[38px] ${
                  mode === 'signin'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                Sign In (Masuk)
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`py-2 text-xs rounded-lg transition-colors cursor-pointer min-h-[38px] ${
                  mode === 'signup'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                Create Account (Daftar)
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Pemulihan Password Akun</h3>
              </div>
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
              >
                Kembali ke Sign In
              </button>
            </div>
          )}

          {/* Header Text */}
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {mode === 'signin'
                ? 'Masuk ke RuangEstimasi'
                : mode === 'signup'
                ? 'Buat Akun RuangEstimasi Baru'
                : 'Reset Password Anda'}
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              {mode === 'signin'
                ? 'Masukkan email dan password Anda untuk mengakses dashboard proyek.'
                : mode === 'signup'
                ? 'Lengkapi data diri dan pilih kategori pengguna untuk mulai menghitung volume proyek.'
                : 'Masukkan alamat email terdaftar dan password baru untuk memulihkan akses akun Anda.'}
            </p>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block">{errorMsg}</span>
                {errorMsg.toLowerCase().includes('unauthorized-domain') && (
                  <span className="block text-[11px] text-rose-700 leading-relaxed">
                    Catatan: Anda dapat langsung login atau mendaftar menggunakan formulir <strong>Email &amp; Password</strong> di bawah tanpa memerlukan konfigurasi domain Firebase.
                  </span>
                )}
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {mode === 'signin' && (
            <form onSubmit={handleSignInSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-900 block mb-1.5">
                  Alamat Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 min-h-[44px] rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 bg-white placeholder:text-slate-400 text-xs transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-900">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    Lupa password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan password Anda"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 min-h-[44px] rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 bg-white placeholder:text-slate-400 text-xs transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    title={showPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 min-h-[44px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-xs transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
              >
                {isLoading ? 'Memproses...' : 'Sign In ke Dashboard'}
              </button>
            </form>
          )}

          {/* CREATE ACCOUNT / SIGN UP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-900 block mb-1.5">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Masukkan nama lengkap Anda"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 min-h-[44px] rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 bg-white placeholder:text-slate-400 text-xs transition"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-900 block mb-1.5">
                  Alamat Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 min-h-[44px] rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 bg-white placeholder:text-slate-400 text-xs transition"
                  />
                </div>
              </div>

              {/* Jenis Pengguna: Student, Estimator, Other */}
              <div>
                <label className="font-semibold text-slate-900 block mb-1.5">
                  Jenis Pengguna <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {userTypeOptions.map((opt) => {
                    const selected = userType === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setUserType(opt.id)}
                        className={`p-3 rounded-xl border transition-colors cursor-pointer flex items-center gap-3 ${
                          selected
                            ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {opt.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-slate-900 block text-xs">{opt.title}</span>
                          <span className="text-[11px] text-slate-600 block mt-0.5">{opt.desc}</span>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            selected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-900 block mb-1.5">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Min. 6 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-9 py-2.5 min-h-[44px] rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 bg-white placeholder:text-slate-400 text-xs transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-900 block mb-1.5">
                    Konfirmasi Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Ulangi password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-9 py-2.5 min-h-[44px] rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 bg-white placeholder:text-slate-400 text-xs transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 min-h-[44px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-xs transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
              >
                {isLoading ? 'Mendaftarkan Akun...' : 'Create Account & Masuk'}
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-900 block mb-1.5">
                  Alamat Email Terdaftar <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 min-h-[44px] rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 bg-white placeholder:text-slate-400 text-xs transition"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-900 block mb-1.5">
                  Password Baru (Opsional untuk Reset Langsung)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan password baru minimal 6 karakter"
                    value={newResetPassword}
                    onChange={(e) => setNewResetPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 min-h-[44px] rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 bg-white placeholder:text-slate-400 text-xs transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 min-h-[44px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-xs transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
              >
                {isLoading ? 'Memproses...' : 'Reset Password Sekarang'}
              </button>
            </form>
          )}

          {/* Divider & Google Sign-In */}
          {mode !== 'forgot' && (
            <>
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200" />
                <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-medium">
                  atau lanjutkan dengan
                </span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-2.5 min-h-[44px] px-4 rounded-xl border border-slate-300 hover:bg-slate-50 active:bg-slate-100 bg-white text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2.5 shadow-2xs cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Masuk dengan Akun Google</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
