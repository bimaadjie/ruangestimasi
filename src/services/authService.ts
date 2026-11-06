/**
 * RuangEstimasi - Layanan Autentikasi & Profil Pengguna
 * Terintegrasi dengan Firebase Authentication, Cloud Firestore, serta Server Auth Backup.
 */

import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  doc,
  getDoc,
  setDoc,
  OperationType,
  handleFirestoreError,
} from '../firebase';
import { UserAccountType, UserProfile } from '../types';

const STORAGE_KEY_CURRENT_USER = 'ruangrab_auth_current_user_v1';
const STORAGE_KEY_LOCAL_ACCOUNTS = 'ruangrab_auth_accounts_v1';

interface StoredLocalAccount {
  uid: string;
  fullName: string;
  email: string;
  userType: UserAccountType;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

function simpleHash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

export function validateEmailFormat(email: string): boolean {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
}

export function getInitials(fullName: string): string {
  const parts = (fullName || 'Pengguna').trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getUserTypeLabel(userType: UserAccountType): string {
  switch (userType) {
    case 'Student':
      return 'Student (Mahasiswa / Pelajar)';
    case 'Estimator':
      return 'Estimator / Quantity Surveyor';
    case 'Other':
      return 'Other (Pengguna Umum)';
    default:
      return 'Estimator';
  }
}

export function getCurrentSessionUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.uid && parsed.email) {
      return parsed as UserProfile;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveCurrentSessionUser(user: UserProfile | null): void {
  try {
    if (!user) {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    } else {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
    }
  } catch (err) {
    console.error('Gagal menyimpan sesi pengguna:', err);
  }
}

function loadLocalAccounts(): StoredLocalAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL_ACCOUNTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalAccounts(accounts: StoredLocalAccount[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_LOCAL_ACCOUNTS, JSON.stringify(accounts));
  } catch (err) {
    console.error('Gagal menyimpan daftar akun:', err);
  }
}

/**
 * Simpan profil pengguna ke Cloud Firestore jika pengguna terautentikasi di Firebase
 */
export async function syncUserProfileToFirestore(profile: UserProfile): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== profile.uid) return;
  const path = `users/${profile.uid}`;
  try {
    await setDoc(
      doc(db, 'users', profile.uid),
      {
        uid: profile.uid,
        fullName: profile.fullName,
        email: profile.email,
        userType: profile.userType,
        createdAt: profile.createdAt,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Ambil profil pengguna dari Cloud Firestore
 */
export async function fetchUserProfileFromFirestore(uid: string): Promise<UserProfile | null> {
  if (!auth.currentUser || auth.currentUser.uid !== uid) return null;
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      const data = snap.data();
      return {
        uid: data.uid,
        fullName: data.fullName,
        email: data.email,
        userType: (data.userType as UserAccountType) || 'Estimator',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

/**
 * Registrasi Akun Baru (Create Account / Sign Up)
 */
export async function registerUserAccount(params: {
  fullName: string;
  email: string;
  password: string;
  userType: UserAccountType;
}): Promise<UserProfile> {
  const cleanName = params.fullName.trim();
  const cleanEmail = params.email.trim().toLowerCase();

  if (!cleanName) {
    throw new Error('Nama lengkap wajib diisi.');
  }
  if (!validateEmailFormat(cleanEmail)) {
    throw new Error('Format alamat email tidak valid.');
  }
  if (params.password.length < 6) {
    throw new Error('Password minimal harus terdiri dari 6 karakter.');
  }

  const now = new Date().toISOString();

  // 1. Coba buat akun melalui backend API terlebih dahulu agar password di-hash dengan scrypt di server
  try {
    const resp = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: cleanName,
        email: cleanEmail,
        password: params.password,
        userType: params.userType,
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      if (data.success && data.user) {
        const profile: UserProfile = data.user;
        // Coba daftarkan juga ke Firebase Auth jika diaktifkan
        try {
          const cred = await createUserWithEmailAndPassword(auth, cleanEmail, params.password);
          await updateProfile(cred.user, { displayName: cleanName });
          profile.uid = cred.user.uid;
          await syncUserProfileToFirestore(profile);
        } catch {
          // Abaikan jika Email/Password provider belum diaktifkan di Firebase Console
        }
        saveCurrentSessionUser(profile);
        return profile;
      } else if (data.error) {
        throw new Error(data.error);
      }
    } else {
      const errJson = await resp.json().catch(() => null);
      if (errJson?.error) {
        throw new Error(errJson.error);
      }
    }
  } catch (err: any) {
    if (err?.message && !err.message.includes('fetch')) {
      throw err;
    }
  }

  // 2. Fallback penyimpanan terisolasi jika offline
  const accounts = loadLocalAccounts();
  if (accounts.some((a) => a.email.toLowerCase() === cleanEmail)) {
    throw new Error('Alamat email ini sudah terdaftar. Silakan masuk melalui menu Sign In.');
  }

  const newAccount: StoredLocalAccount = {
    uid: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    fullName: cleanName,
    email: cleanEmail,
    userType: params.userType,
    passwordHash: simpleHash(`${cleanEmail}::${params.password}`),
    createdAt: now,
    updatedAt: now,
  };

  accounts.push(newAccount);
  saveLocalAccounts(accounts);

  const profile: UserProfile = {
    uid: newAccount.uid,
    fullName: newAccount.fullName,
    email: newAccount.email,
    userType: newAccount.userType,
    createdAt: newAccount.createdAt,
    updatedAt: newAccount.updatedAt,
    authProvider: 'email',
  };

  saveCurrentSessionUser(profile);
  return profile;
}

/**
 * Masuk Akun (Sign In dengan Email & Password)
 */
export async function signInWithEmail(email: string, password: string): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();
  if (!validateEmailFormat(cleanEmail)) {
    throw new Error('Format alamat email tidak valid.');
  }
  if (!password) {
    throw new Error('Password wajib diisi.');
  }

  // 1. Coba verifikasi ke backend server
  try {
    const resp = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password }),
    });

    if (resp.ok) {
      const data = await resp.json();
      if (data.success && data.user) {
        const profile: UserProfile = data.user;
        try {
          const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
          profile.uid = cred.user.uid;
          await syncUserProfileToFirestore(profile);
        } catch {
          // Abaikan jika Email/Password provider belum aktif di Firebase Console
        }
        saveCurrentSessionUser(profile);
        return profile;
      }
    } else {
      const errJson = await resp.json().catch(() => null);
      if (errJson?.error) {
        throw new Error(errJson.error);
      }
    }
  } catch (err: any) {
    if (err?.message && !err.message.includes('fetch')) {
      throw err;
    }
  }

  // 2. Coba Firebase Auth langsung
  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const existing = await fetchUserProfileFromFirestore(cred.user.uid);
    const now = new Date().toISOString();
    const profile: UserProfile = existing || {
      uid: cred.user.uid,
      fullName: cred.user.displayName || cleanEmail.split('@')[0],
      email: cleanEmail,
      userType: 'Estimator',
      createdAt: now,
      updatedAt: now,
      authProvider: 'email',
    };
    if (!existing) {
      await syncUserProfileToFirestore(profile);
    }
    saveCurrentSessionUser(profile);
    return profile;
  } catch {
    // Lanjut ke pengecekan akun lokal
  }

  // 3. Cek akun lokal
  const accounts = loadLocalAccounts();
  const found = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
  if (!found) {
    throw new Error('Akun dengan alamat email tersebut belum terdaftar. Silakan buat akun baru.');
  }
  const expectedHash = simpleHash(`${cleanEmail}::${password}`);
  if (found.passwordHash !== expectedHash) {
    throw new Error('Password yang Anda masukkan tidak sesuai. Silakan periksa kembali.');
  }

  const profile: UserProfile = {
    uid: found.uid,
    fullName: found.fullName,
    email: found.email,
    userType: found.userType,
    createdAt: found.createdAt,
    updatedAt: new Date().toISOString(),
    authProvider: 'email',
  };

  saveCurrentSessionUser(profile);
  return profile;
}

/**
 * Masuk dengan Akun Google (Firebase Popup Auth + Cloud Firestore)
 */
export async function signInWithGoogleAccount(
  defaultUserType: UserAccountType = 'Estimator'
): Promise<UserProfile> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    const user = cred.user;
    const now = new Date().toISOString();

    let profile = await fetchUserProfileFromFirestore(user.uid);
    if (!profile) {
      profile = {
        uid: user.uid,
        fullName: user.displayName || (user.email ? user.email.split('@')[0] : 'Pengguna RuangEstimasi'),
        email: user.email || 'user@ruangestimasi.id',
        userType: defaultUserType,
        createdAt: now,
        updatedAt: now,
        authProvider: 'google',
      };
      await syncUserProfileToFirestore(profile);
    }

    saveCurrentSessionUser(profile);
    return profile;
  } catch (err: any) {
    const code = err?.code || '';
    if (code === 'auth/popup-closed-by-user') {
      throw new Error('Jendela login Google ditutup sebelum proses selesai.');
    }
    if (code === 'auth/unauthorized-domain') {
      throw new Error(
        'Domain ini belum diizinkan oleh Firebase (auth/unauthorized-domain). Pastikan Anda membuka browser di http://localhost:3000 (bukan http://0.0.0.0:3000 atau IP). Jika masih muncul, silakan gunakan form Email & Password di bawah atau tambahkan domain di Firebase Console.'
      );
    }
    throw new Error(
      err?.message || 'Gagal masuk menggunakan akun Google. Silakan gunakan form Email & Password.'
    );
  }
}

/**
 * Perbarui Profil Pengguna (Nama & Jenis Akun)
 */
export async function updateUserProfileData(
  currentProfile: UserProfile,
  updates: { fullName: string; userType: UserAccountType }
): Promise<UserProfile> {
  const updated: UserProfile = {
    ...currentProfile,
    fullName: updates.fullName.trim() || currentProfile.fullName,
    userType: updates.userType,
    updatedAt: new Date().toISOString(),
  };

  saveCurrentSessionUser(updated);

  // Update di backend server
  try {
    await fetch('/api/auth/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: updated.uid,
        email: updated.email,
        fullName: updated.fullName,
        userType: updated.userType,
      }),
    });
  } catch {
    // ignore network error
  }

  // Update di Firestore jika login Firebase
  if (auth.currentUser && auth.currentUser.uid === updated.uid) {
    await syncUserProfileToFirestore(updated);
  }

  // Update di local accounts
  const accounts = loadLocalAccounts();
  const nextAccounts = accounts.map((a) =>
    a.uid === updated.uid || a.email === updated.email
      ? { ...a, fullName: updated.fullName, userType: updated.userType, updatedAt: updated.updatedAt }
      : a
  );
  saveLocalAccounts(nextAccounts);

  return updated;
}

/**
 * Reset Password Akun
 */
export async function requestPasswordReset(
  email: string,
  newPassword?: string
): Promise<{ message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!validateEmailFormat(cleanEmail)) {
    throw new Error('Masukkan alamat email yang valid untuk mereset password.');
  }

  if (newPassword && newPassword.length >= 6) {
    const resp = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, newPassword }),
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data.success) {
        return { message: 'Password berhasil diperbarui. Silakan masuk dengan password baru Anda.' };
      }
    }
  }

  try {
    await sendPasswordResetEmail(auth, cleanEmail);
    return {
      message: `Tautan pemulihan password telah dikirim ke ${cleanEmail}.`,
    };
  } catch {
    return {
      message: `Permintaan reset password untuk ${cleanEmail} telah diproses. Silakan atur password baru Anda.`,
    };
  }
}

/**
 * Keluar Akun (Logout)
 */
export async function logoutUserAccount(): Promise<void> {
  try {
    await signOut(auth);
  } catch {
    // ignore
  }
  saveCurrentSessionUser(null);
}
