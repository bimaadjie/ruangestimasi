/**
 * RuangEstimasi - Server Backend
 * Express API server with Vite middleware integration, server-side Gemini API,
 * 16-category engineering drawing classifier, segment-based beam/sloof extractor,
 * per-user & per-project data isolation, and secure user authentication endpoints.
 */

import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

// Support civil engineering high-resolution drawing PDFs & CAD image uploads (up to 50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware to catch JSON parsing and payload size errors before they return HTML
app.use((err: any, req: Request, res: Response, next: NextFunction): void => {
  if (err) {
    console.error('[RuangEstimasi Server Middleware Error]:', err);
    res.setHeader('Content-Type', 'application/json');
    if (err.type === 'entity.too.large') {
      res.status(413).json({
        success: false,
        errorType: 'unreadable_file',
        error: 'Ukuran file dokumen terlalu besar. Harap unggah file di bawah 15 MB.',
      });
      return;
    }
    res.status(err.status || 400).json({
      success: false,
      errorType: 'unreadable_file',
      error: err.message || 'Format data permintaan tidak valid.',
    });
    return;
  }
  next();
});

// =========================================================
// PENYIMPANAN AKUN PENGGUNA, PROYEK TERISOLASI, & CACHE AI
// =========================================================
interface ServerUserRecord {
  uid: string;
  fullName: string;
  email: string;
  userType: 'Student' | 'Estimator' | 'Other';
  salt: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

interface ServerProjectRecord {
  id: string;
  ownerUid: string;
  name: string;
  location?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  floorCount: number;
  floors: any[];
  works: any[];
  rejectedDraftKeys?: string[];
  catalogVersion: string;
  isolationVersion?: string;
  aiTakeoffHistory?: any[];
}

interface ServerAICacheEntry {
  cacheKey: string;
  userId: string;
  projectId: string;
  documentHash: string;
  fileName: string;
  modelUsed: string;
  createdAt: string;
  data: any;
}

const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', 'data')
  : path.resolve(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users_store.json');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects_store.json');
const AI_CACHE_FILE = path.join(DATA_DIR, 'ai_cache_store.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadServerUsers(): ServerUserRecord[] {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveServerUsers(users: ServerUserRecord[]): void {
  try {
    ensureDataDir();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('[RuangEstimasi Auth] Gagal menyimpan users_store.json:', err);
  }
}

function loadServerProjects(): ServerProjectRecord[] {
  try {
    if (!fs.existsSync(PROJECTS_FILE)) return [];
    const raw = fs.readFileSync(PROJECTS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveServerProjects(projects: ServerProjectRecord[]): void {
  try {
    ensureDataDir();
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
  } catch (err) {
    console.error('[RuangEstimasi Projects] Gagal menyimpan projects_store.json:', err);
  }
}

function loadServerAICache(): Record<string, ServerAICacheEntry> {
  try {
    if (!fs.existsSync(AI_CACHE_FILE)) return {};
    const raw = fs.readFileSync(AI_CACHE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveServerAICache(cache: Record<string, ServerAICacheEntry>): void {
  try {
    ensureDataDir();
    fs.writeFileSync(AI_CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (err) {
    console.error('[RuangEstimasi AI Cache] Gagal menyimpan ai_cache_store.json:', err);
  }
}

function hashPasswordScrypt(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function getAuthenticatedUserId(req: Request): string {
  const headerUid = req.headers['x-user-id'];
  if (typeof headerUid === 'string' && headerUid.trim()) {
    return headerUid.trim();
  }
  const queryUid = req.query.userId;
  if (typeof queryUid === 'string' && queryUid.trim()) {
    return queryUid.trim();
  }
  const bodyUid = req.body?.userId;
  if (typeof bodyUid === 'string' && bodyUid.trim()) {
    return bodyUid.trim();
  }
  return '';
}

// =========================================================
// ENDPOINT AUTENTIKASI PENGGUNA (/api/auth/*)
// =========================================================
app.post('/api/auth/register', (req: Request, res: Response): void => {
  res.setHeader('Content-Type', 'application/json');
  const { fullName, email, password, userType } = req.body || {};

  if (!fullName || !email || !password) {
    res.status(400).json({
      success: false,
      error: 'Nama lengkap, alamat email, dan password wajib diisi.',
    });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanName = String(fullName).trim();
  const cleanRole: 'Student' | 'Estimator' | 'Other' =
    userType === 'Student' || userType === 'Estimator' || userType === 'Other'
      ? userType
      : 'Estimator';

  if (String(password).length < 6) {
    res.status(400).json({
      success: false,
      error: 'Password minimal harus terdiri dari 6 karakter.',
    });
    return;
  }

  const users = loadServerUsers();
  if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    res.status(409).json({
      success: false,
      error: 'Alamat email ini sudah terdaftar. Silakan masuk melalui menu Sign In.',
    });
    return;
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPasswordScrypt(String(password), salt);
  const now = new Date().toISOString();

  const newUser: ServerUserRecord = {
    uid: `usr_${crypto.randomBytes(8).toString('hex')}`,
    fullName: cleanName,
    email: cleanEmail,
    userType: cleanRole,
    salt,
    passwordHash,
    createdAt: now,
    updatedAt: now,
  };

  users.push(newUser);
  saveServerUsers(users);

  res.json({
    success: true,
    user: {
      uid: newUser.uid,
      fullName: newUser.fullName,
      email: newUser.email,
      userType: newUser.userType,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
      authProvider: 'email',
    },
  });
});

app.post('/api/auth/login', (req: Request, res: Response): void => {
  res.setHeader('Content-Type', 'application/json');
  const { email, password } = req.body || {};

  if (!email || !password) {
    res.status(400).json({
      success: false,
      error: 'Email dan password wajib diisi.',
    });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const users = loadServerUsers();
  const found = users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!found) {
    res.status(404).json({
      success: false,
      error: 'Akun dengan alamat email tersebut belum terdaftar. Silakan buat akun baru.',
    });
    return;
  }

  const candidateHash = hashPasswordScrypt(String(password), found.salt);
  if (candidateHash !== found.passwordHash) {
    res.status(401).json({
      success: false,
      error: 'Password yang Anda masukkan tidak sesuai. Silakan periksa kembali.',
    });
    return;
  }

  res.json({
    success: true,
    user: {
      uid: found.uid,
      fullName: found.fullName,
      email: found.email,
      userType: found.userType,
      createdAt: found.createdAt,
      updatedAt: found.updatedAt,
      authProvider: 'email',
    },
  });
});

app.post('/api/auth/update-profile', (req: Request, res: Response): void => {
  res.setHeader('Content-Type', 'application/json');
  const { uid, email, fullName, userType } = req.body || {};
  const users = loadServerUsers();
  const idx = users.findIndex(
    (u) => u.uid === uid || (email && u.email.toLowerCase() === String(email).toLowerCase())
  );

  if (idx >= 0) {
    if (fullName) users[idx].fullName = String(fullName).trim();
    if (userType === 'Student' || userType === 'Estimator' || userType === 'Other') {
      users[idx].userType = userType;
    }
    users[idx].updatedAt = new Date().toISOString();
    saveServerUsers(users);
  }

  res.json({ success: true });
});

app.post('/api/auth/reset-password', (req: Request, res: Response): void => {
  res.setHeader('Content-Type', 'application/json');
  const { email, newPassword } = req.body || {};
  if (!email || !newPassword || String(newPassword).length < 6) {
    res.status(400).json({
      success: false,
      error: 'Email dan password baru (minimal 6 karakter) wajib diisi.',
    });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const users = loadServerUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
  if (idx < 0) {
    res.status(404).json({
      success: false,
      error: 'Alamat email tidak ditemukan dalam sistem.',
    });
    return;
  }

  const salt = crypto.randomBytes(16).toString('hex');
  users[idx].salt = salt;
  users[idx].passwordHash = hashPasswordScrypt(String(newPassword), salt);
  users[idx].updatedAt = new Date().toISOString();
  saveServerUsers(users);

  res.json({ success: true });
});

// =========================================================
// ENDPOINT PROYEK TERISOLASI PER AKUN (/api/projects/*)
// Memastikan Akun A tidak dapat membaca, mengubah, atau menghapus data Akun B
// =========================================================

app.get('/api/projects', (req: Request, res: Response): void => {
  res.setHeader('Content-Type', 'application/json');
  const userId = getAuthenticatedUserId(req);
  if (!userId || userId === 'default' || userId === 'anonymous') {
    res.status(401).json({
      success: false,
      error: 'Identitas pengguna (userId) diperlukan untuk memuat data proyek.',
    });
    return;
  }

  const allProjects = loadServerProjects();
  const userProjects = allProjects.filter((p) => p.ownerUid === userId);

  res.json({
    success: true,
    userId,
    projects: userProjects,
  });
});

app.post('/api/projects/sync', (req: Request, res: Response): void => {
  res.setHeader('Content-Type', 'application/json');
  const userId = getAuthenticatedUserId(req);
  const { projects } = req.body || {};

  if (!userId || userId === 'default' || userId === 'anonymous') {
    res.status(401).json({
      success: false,
      error: 'Identitas pengguna (userId) diperlukan untuk menyimpan data proyek.',
    });
    return;
  }

  if (!Array.isArray(projects)) {
    res.status(400).json({
      success: false,
      error: 'Data daftar proyek harus berupa array.',
    });
    return;
  }

  const allProjects = loadServerProjects();

  // Validasi kepemilikan: Tolak jika ada proyek yang sudah dimiliki oleh pengguna lain
  for (const incoming of projects) {
    if (!incoming || !incoming.id) continue;
    if (incoming.ownerUid && incoming.ownerUid !== userId) {
      res.status(403).json({
        success: false,
        error: 'Akses ditolak: Anda tidak diizinkan mengubah proyek milik akun pengguna lain.',
      });
      return;
    }
    const existingOnServer = allProjects.find((p) => p.id === incoming.id);
    if (existingOnServer && existingOnServer.ownerUid !== userId) {
      res.status(403).json({
        success: false,
        error: 'Akses ditolak: ID proyek ini dimiliki oleh akun pengguna lain.',
      });
      return;
    }
  }

  // Pertahankan proyek milik pengguna lain tanpa perubahan, lalu ganti proyek milik userId ini
  const otherUsersProjects = allProjects.filter((p) => p.ownerUid !== userId);
  const sanitizedUserProjects: ServerProjectRecord[] = projects
    .filter((p: any) => p && p.id)
    .map((p: any) => ({
      ...p,
      ownerUid: userId,
      updatedAt: p.updatedAt || new Date().toISOString(),
    }));

  saveServerProjects([...otherUsersProjects, ...sanitizedUserProjects]);

  res.json({
    success: true,
    savedCount: sanitizedUserProjects.length,
  });
});

app.put('/api/projects/:projectId', (req: Request, res: Response): void => {
  res.setHeader('Content-Type', 'application/json');
  const userId = getAuthenticatedUserId(req);
  const { projectId } = req.params;
  const { project } = req.body || {};

  if (!userId || userId === 'default' || userId === 'anonymous') {
    res.status(401).json({
      success: false,
      error: 'Identitas pengguna (userId) diperlukan.',
    });
    return;
  }

  const allProjects = loadServerProjects();
  const existingIdx = allProjects.findIndex((p) => p.id === projectId);

  if (existingIdx >= 0 && allProjects[existingIdx].ownerUid !== userId) {
    res.status(403).json({
      success: false,
      error: 'Akses ditolak: Anda tidak berhak mengubah proyek milik akun pengguna lain.',
    });
    return;
  }

  if (!project || project.id !== projectId) {
    res.status(400).json({
      success: false,
      error: 'Data proyek tidak valid.',
    });
    return;
  }

  const record: ServerProjectRecord = {
    ...project,
    id: projectId,
    ownerUid: userId,
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    allProjects[existingIdx] = record;
  } else {
    allProjects.push(record);
  }

  saveServerProjects(allProjects);
  res.json({ success: true, project: record });
});

app.delete('/api/projects/:projectId', (req: Request, res: Response): void => {
  res.setHeader('Content-Type', 'application/json');
  const userId = getAuthenticatedUserId(req);
  const { projectId } = req.params;

  if (!userId || userId === 'default' || userId === 'anonymous') {
    res.status(401).json({
      success: false,
      error: 'Identitas pengguna (userId) diperlukan.',
    });
    return;
  }

  const allProjects = loadServerProjects();
  const target = allProjects.find((p) => p.id === projectId);

  if (!target) {
    res.json({ success: true, deleted: false });
    return;
  }

  if (target.ownerUid !== userId) {
    res.status(403).json({
      success: false,
      error: 'Akses ditolak: Anda tidak berhak menghapus proyek milik akun pengguna lain.',
    });
    return;
  }

  const remaining = allProjects.filter((p) => p.id !== projectId);
  saveServerProjects(remaining);

  // Hapus juga cache AI untuk proyek ini
  const aiCache = loadServerAICache();
  let cacheChanged = false;
  for (const key of Object.keys(aiCache)) {
    if (aiCache[key].userId === userId && aiCache[key].projectId === projectId) {
      delete aiCache[key];
      cacheChanged = true;
    }
  }
  if (cacheChanged) {
    saveServerAICache(aiCache);
  }

  res.json({ success: true, deleted: true });
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({
    status: 'ok',
    appName: 'RuangEstimasi',
    version: '4.0.0',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(err: any): boolean {
  if (!err) return false;
  const status = err.status || err.code || err.statusCode;
  const message = String(err.message || '');

  if (status === 503 || status === 429) return true;
  if (message.includes('503') || message.includes('UNAVAILABLE') || message.includes('high demand')) return true;
  if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) return true;
  if (message.includes('ECONNRESET') || message.includes('ETIMEDOUT') || message.includes('fetch failed')) return true;

  if (status === 400 || status === 401 || status === 403) return false;
  if (message.includes('API_KEY_INVALID') || message.includes('PERMISSION_DENIED')) return false;

  return false;
}

/**
 * Endpoint Ekstraksi Parameter Dimensi, Klasifikasi 16 Jenis Gambar, & Segmen Struktur dari Gambar Teknik / PDF
 */
app.post('/api/gemini/extract-dimensions', async (req: Request, res: Response): Promise<void> => {
  res.setHeader('Content-Type', 'application/json');

  try {
    const {
      userId,
      projectId,
      targetFloorId,
      fileBase64,
      mimeType,
      fileName,
      floorName,
      unitSetting,
      scaleSetting,
      pageSelection,
      forceRefresh,
    } = req.body || {};

    if (!fileBase64 || !mimeType) {
      res.status(400).json({
        success: false,
        errorType: 'unreadable_file',
        error: 'Data file gambar atau dokumen PDF tidak ditemukan atau rusak.',
      });
      return;
    }

    const allowedMimeTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(String(mimeType).toLowerCase())) {
      res.status(400).json({
        success: false,
        errorType: 'unsupported_format',
        error: `Format file (${mimeType}) tidak didukung. Harap unggah dokumen PDF, PNG, JPG, atau JPEG.`,
      });
      return;
    }

    const cleanBase64 = String(fileBase64).replace(/^data:[^;]+;base64,/, '');
    if (cleanBase64.length < 32) {
      res.status(400).json({
        success: false,
        errorType: 'unreadable_file',
        error: 'File dokumen kosong atau tidak dapat dibaca. Silakan periksa kembali file yang diunggah.',
      });
      return;
    }

    const chosenUnit = unitSetting || 'cm';
    const chosenScale = scaleSetting || '1:100';
    const cleanUserId = String(userId || getAuthenticatedUserId(req) || 'anonymous');
    const cleanProjectId = String(projectId || 'default-project');
    const cleanFloorId = String(targetFloorId || 'fl-1');
    const cleanPageSelection = String(pageSelection || 'all').trim();

    // Hitung hash dokumen terikat pada (userId, projectId, targetFloorId, unit, scale, pageSelection, content)
    const documentHash = crypto
      .createHash('sha256')
      .update(`${cleanUserId}::${cleanProjectId}::${cleanFloorId}::${chosenUnit}::${chosenScale}::${cleanPageSelection}::${cleanBase64}`)
      .digest('hex')
      .slice(0, 32);

    const cacheKey = `${cleanUserId}::${cleanProjectId}::${documentHash}`;
    if (!forceRefresh) {
      const aiCache = loadServerAICache();
      const cached = aiCache[cacheKey];
      if (cached && cached.userId === cleanUserId && cached.projectId === cleanProjectId && cached.data) {
        console.log(`[RuangEstimasi AI] Mengembalikan hasil analisis dari cache proyek (${cacheKey})`);
        res.json({
          success: true,
          fromCache: true,
          documentHash,
          modelUsed: cached.modelUsed,
          data: cached.data,
        });
        return;
      }
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(503).json({
        success: false,
        errorType: 'api_error',
        error: 'GEMINI_API_KEY belum dikonfigurasi pada environment server.',
      });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = `
Anda adalah Senior Civil Engineering Quantity Surveyor RuangEstimasi yang sangat teliti.
Tugas Anda adalah menganalisis dokumen gambar teknik konstruksi (PDF multi-halaman atau gambar tunggal) secara bertahap dan terstruktur untuk Auto Quantity Takeoff.

=====================================================================
A. KLASIFIKASI HALAMAN ATAU BAGIAN GAMBAR ("detectedRegions")
=====================================================================
Setiap halaman PDF atau bagian gambar dalam dokumen HARUS diklasifikasikan terlebih dahulu sebelum mengekstrak angka ke dalam salah satu dari 16 jenis gambar standar berikut:
1. "Denah arsitektur"
2. "Denah struktur"
3. "Denah pondasi"
4. "Denah kolom"
5. "Denah balok"
6. "Denah sloof"
7. "Denah pembesian"
8. "Gambar potongan"
9. "Gambar tampak"
10. "Detail konstruksi"
11. "Detail penulangan"
12. "Tabel dimensi atau schedule"
13. "Gambar tangga"
14. "Gambar atap"
15. "Gambar MEP"
16. "Tidak diketahui / perlu pemeriksaan manual"

Jika 1 halaman memiliki beberapa bagian gambar (misal di kiri ada "Denah sloof" dan di kanan ada "Tabel dimensi atau schedule" atau "Detail penulangan"), pisahkan konteks pembacaannya dan catat masing-masing di dalam array "detectedRegions" beserta "pageNumber", "drawingType", "title", "identifiedFloor", "scale", dan "summary".

=====================================================================
B. PEMISAHAN PEMBACAAN BERDASARKAN HALAMAN DAN JENIS GAMBAR
=====================================================================
- JANGAN mencampur angka dari halaman atau jenis gambar yang berbeda tanpa kecocokan konteks elemen!
- Jangan menggabungkan angka dari denah arsitektur dan potongan struktur secara sembarangan kecuali memiliki kecocokan identitas elemen yang jelas (kode elemen, grid, dan lantai).
- Setiap hasil pembacaan pada "items" dan "segments" wajib mencatat:
  * "pageNumber": nomor halaman (angka)
  * "drawingType": jenis gambar (dari 16 klasifikasi di atas)
  * "drawingTitle": judul gambar jika tertulis pada kop/etiket (misal "DENAH BALOK LANTAI 1" atau "DENAH RENCANA SLOOF")
  * "identifiedFloor": lantai atau bagian bangunan
  * "gridLocation": kode grid / as jika ada (misal "As A–B / Grid 1")
  * "elementCode": kode elemen seperti "K1", "K2", "B1", "B2", "S1", "S2", "P1", "J1", dll.
  * "rawExtractedValue": dimensi yang terbaca persis dari gambar
  * "detectedUnit": satuan yang digunakan pada angka tersebut ("mm", "cm", "m", "m²", "titik", "unit", "btg")
  * "sourceInfo": sumber informasi lengkap pada gambar, contoh: "Halaman 1, Denah sloof - Rencana Sloof Lantai Dasar" atau "Halaman 4, Denah balok Lantai 1"
  * "verificationBadge": salah satu dari:
    - "Terbaca Jelas" (jika angka tertulis jelas pada satu bagian gambar)
    - "Hasil Penggabungan" (jika merupakan total penjumlahan segmen atau penggabungan denah + tabel dimensi/schedule)
    - "Perlu Verifikasi" (jika angka kurang tajam atau butuh pemeriksaan manual estimator)

=====================================================================
C. ATURAN SATUAN DAN SKALA
=====================================================================
- Utamakan angka dimensi yang tertulis jelas pada gambar.
- JANGAN PERNAH mengalikan dimensi tertulis dua kali dengan skala!
- Gunakan skala hanya sebagai konteks atau pemeriksaan proporsi jika diperlukan.
- Perhatikan apakah angka pada gambar tertulis dalam meter (misal "6.00", "3.60", "3.00", "12.00" -> detectedUnit: "m") atau dalam cm/mm (misal "40", "60", "600", "300" -> detectedUnit: "${chosenUnit}").
- Jika angka tidak terbaca jelas, jangan menebak nilai secara acak.

=====================================================================
D. PERHITUNGAN PANJANG TOTAL BALOK DAN SLOOF ("segments")
=====================================================================
Untuk pekerjaan seperti balok (B1, B2, B3, RB, dll.) dan sloof (S1, S2, S3, S.1, dll.):
- JANGAN mengambil satu angka bentang saja sebagai panjang total jika terdapat beberapa segmen!
- JANGAN PERNAH menggunakan keliling luar bangunan sebagai panjang sloof atau balok!
- Hitung panjang total dari penjumlahan seluruh segmen yang teridentifikasi pada denah balok atau denah sloof:
  1. Identifikasi kode elemen, misalnya "B1", "B2", "S1", "S.1", atau "S2".
  2. Identifikasi setiap segmen berdasarkan grid/as atau bentang yang tertulis:
     Contoh:
     - Segmen A–B (Grid 1): 3.00 m
     - Segmen B–C (Grid 1): 4.00 m
     - Segmen C–D (Grid 1): 3.50 m
  3. Konversi setiap segmen ke meter pada "lengthMeters" dan kalikan dengan "count" (jumlah jalur identik) menjadi "subtotalMeters".
  4. Hindari penghitungan ganda pada titik pertemuan grid.
  5. Jumlahkan seluruh segmen yang termasuk kode elemen yang sama pada lantai tersebut menjadi nilai parameter "panjang_total" pada pekerjaan terkait di dalam "items" (dengan verificationBadge: "Hasil Penggabungan").

=====================================================================
E. PENCOCOKAN TABEL DIMENSI DAN DETAIL STRUKTUR
=====================================================================
Jika gambar memiliki tabel/schedule ("Tabel dimensi atau schedule") atau detail struktur ("Detail penulangan" / "Detail konstruksi"):
- Cocokkan kode elemen pada denah (K1, K2, B1, B2, S1, S.1, S2) dengan kode pada tabel.
- Ambil ukuran penampang ("lebar", "tinggi", "tebal") dari tabel dimensi atau detail struktur.
- Ambil panjang total (dari penjumlahan segmen) atau jumlah elemen dari denah.
- Ambil tinggi kolom atau elevasi dari gambar potongan jika tersedia.
- JANGAN memakai dimensi milik B2 untuk B1 atau S2 untuk S1!
- Jika ukuran penampang belum ditemukan pada gambar, jangan mengarang nilainya.

=====================================================================
F. PEMETAAN KE KATALOG STANDAR USC RUANGESTIMASI ("catalogId" & "parameterId")
=====================================================================
Gunakan catalogId standar USC berikut HANYA untuk pekerjaan yang benar-benar teridentifikasi pada gambar:
- Sloof:
  * "str-sloof-beton" (Sloof S1 / S.1) -> parameterId: "panjang_total", "lebar", "tinggi"
  * "str-sloof-s2" (Sloof S2 / S.2) -> parameterId: "panjang_total", "lebar", "tinggi"
  * "str-sloof-s3" (Sloof S3 / S.3) -> parameterId: "panjang_total", "lebar", "tinggi"
- Balok:
  * "str-balok-b1-beton" (Balok B1) -> parameterId: "panjang_total", "lebar", "tinggi"
  * "str-balok-b2-beton" (Balok B2) -> parameterId: "panjang_total", "lebar", "tinggi"
  * "str-balok-b3-beton" (Balok B3) -> parameterId: "panjang_total", "lebar", "tinggi"
  * "str-ring-balok" (Ring Balok RB) -> parameterId: "panjang_total", "lebar", "tinggi"
- Kolom:
  * "str-kolom-k1-beton" (Kolom K1) -> parameterId: "lebar", "tebal", "tinggi", "jumlah"
  * "str-kolom-k2-beton" (Kolom K2) -> parameterId: "lebar", "tebal", "tinggi", "jumlah"
  * "str-kolom-k3-beton" (Kolom K3) -> parameterId: "lebar", "tebal", "tinggi", "jumlah"
  * "str-kolom-praktis" (Kolom Praktis KP) -> parameterId: "lebar", "tebal", "tinggi", "jumlah"
- Pondasi:
  * "str-pondasi-batu-kali-a" (Pondasi Batu Kali) -> parameterId: "lebar_bawah", "lebar_atas", "tinggi", "panjang_total"
  * "str-footplat-beton" (Pondasi Footplat Type A) -> parameterId: "panjang", "lebar", "tebal", "jumlah"
  * "str-footplat-type-b-beton" (Pondasi Footplat Type B) -> parameterId: "panjang", "lebar", "tebal", "jumlah"
- Persiapan & Arsitektur (HANYA jika gambar memang memuat "Denah arsitektur" / ukuran ruang/bangunan):
  * "prep-pembersihan-lahan" -> parameterId: "panjang", "lebar"
  * "prep-bouwplank" -> parameterId: "panjang", "lebar"
  * "ars-dinding-bata-hebel" -> parameterId: "panjang_keliling", "tinggi_dinding"
  * "ars-homogenous-tile-60x60" -> parameterId: "luas_lantai" (detectedUnit: "m²")
  * "ars-keramik-toilet-antislip" -> parameterId: "luas_total_toilet" (detectedUnit: "m²")
`;

    const userPrompt = `
Dokumen yang dianalisis: ${fileName || 'Dokumen Gambar Teknik'}
Target Lantai: ${floorName || 'Lantai 1'}
Satuan dimensi default pilihan pengguna: ${chosenUnit}
Skala pilihan pengguna: ${chosenScale}
${cleanPageSelection !== 'all' ? `Fokus Halaman: ${cleanPageSelection}` : 'Analisis seluruh halaman yang tersedia dalam dokumen.'}

Langkah analisis wajib:
1. Klasifikasikan setiap halaman dan bagian gambar ke dalam "detectedRegions" menggunakan salah satu dari 16 jenis gambar standar.
2. Jika terdapat Denah sloof atau Denah balok, identifikasi setiap segmen berdasarkan grid/as ke dalam array "segments", konversikan ke meter, hindari duplikasi titik pertemuan grid, dan jumlahkan total panjang per kode elemen (misal S.1 / S1 / B1 / B2).
3. Jika terdapat Tabel dimensi atau schedule / Detail penulangan, cocokkan kode elemen (K1, B1, S1, S.1, dll.) dan ambil ukuran penampangnya (lebar, tinggi, tebal).
4. Kembalikan seluruh parameter yang teridentifikasi ke dalam "items" lengkap dengan "pageNumber", "drawingType", "drawingTitle", "identifiedFloor", "gridLocation", "elementCode", "sourceInfo", dan "verificationBadge".

Kembalikan HANYA objek JSON murni dengan struktur persis berikut:
{
  "documentSummary": "Ringkasan lengkap isi dokumen gambar teknik",
  "drawingType": "struktur_denah | arsitektur_denah | potongan_detail | lainnya",
  "identifiedFloor": "Lantai atau level struktur yang tertera pada gambar",
  "identifiedScale": "Skala yang tertera pada etiket gambar (misal 1:200)",
  "detectedRegions": [
    {
      "pageNumber": 1,
      "drawingType": "Denah sloof | Tabel dimensi atau schedule | Denah arsitektur | Denah struktur | Denah pondasi | Denah kolom | Denah balok | Denah pembesian | Gambar potongan | Gambar tampak | Detail konstruksi | Detail penulangan | Gambar tangga | Gambar atap | Gambar MEP | Tidak diketahui / perlu pemeriksaan manual",
      "title": "Judul bagian gambar yang tertulis",
      "identifiedFloor": "Lantai 1 / Umum & Pondasi",
      "scale": "1:200",
      "summary": "Ringkasan informasi teknis pada bagian ini"
    }
  ],
  "segments": [
    {
      "elementCode": "S.1",
      "elementCategory": "sloof",
      "segmentName": "Segmen Horizontal Grid 1 (As A-H)",
      "gridLocation": "Grid 1 / As A-H",
      "rawLength": 42,
      "rawUnit": "m",
      "lengthMeters": 42,
      "count": 1,
      "subtotalMeters": 42,
      "pageNumber": 1,
      "drawingType": "Denah sloof",
      "drawingTitle": "Rencana Sloof",
      "identifiedFloor": "Umum & Pondasi",
      "sourceInfo": "Halaman 1, Denah sloof - Grid 1 (As A-H)"
    }
  ],
  "items": [
    {
      "pageNumber": 1,
      "drawingType": "Denah sloof",
      "drawingTitle": "Rencana Sloof",
      "identifiedFloor": "Umum & Pondasi",
      "gridLocation": "As A-H & 1-8",
      "elementCode": "S.1",
      "targetCategory": "Struktural",
      "suggestedWorkName": "Sloof S1",
      "catalogId": "str-sloof-beton",
      "parameterId": "panjang_total",
      "parameterName": "Panjang Total Jalur Sloof (L)",
      "rawExtractedValue": 318.6,
      "detectedUnit": "m",
      "confidence": 0.95,
      "verificationBadge": "Hasil Penggabungan",
      "pageOrLocation": "Denah Sloof As A-H & 1-8",
      "sourceInfo": "Halaman 1, Denah sloof (Penjumlahan Segmen Grid)",
      "notes": "Penjumlahan seluruh segmen sloof S.1 pada denah"
    }
  ]
}
`;

    const documentPart = {
      inlineData: {
        mimeType: mimeType,
        data: cleanBase64,
      },
    };

    const textPart = {
      text: userPrompt,
    };

    const plannedAttempts = [
      { model: 'gemini-3-flash-preview', label: 'Primary (gemini-3-flash-preview)' },
      { model: 'gemini-2.5-flash', label: 'Fallback 1 (gemini-2.5-flash)' },
    ];

    let lastError: any = null;
    let successfulResponseText: string | null = null;
    let modelUsed = '';

    for (let i = 0; i < plannedAttempts.length; i++) {
      const { model, label } = plannedAttempts[i];
      const attemptNum = i + 1;

      try {
        console.log(`[RuangEstimasi AI] Attempt ${attemptNum}/${plannedAttempts.length}: Invoking ${label}...`);

        const response: any = await Promise.race([
          ai.models.generateContent({
            model,
            contents: { parts: [documentPart, textPart] },
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
            },
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('503 Request timed out waiting for AI model response')), 45000)
          ),
        ]);

        successfulResponseText = response.text || '{}';
        modelUsed = model;
        console.log(`[RuangEstimasi AI] Success on attempt ${attemptNum} with model: ${model}`);
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(
          `[RuangEstimasi AI] Attempt ${attemptNum} failed with error:`,
          err?.status || err?.code || '',
          err?.message || err
        );

        if (!isRetryableError(err) && i === plannedAttempts.length - 1) {
          console.error('[RuangEstimasi AI] Non-retryable error, aborting attempts.');
          break;
        }

        if (i < plannedAttempts.length - 1) {
          const jitter = Math.floor(Math.random() * 350);
          const backoffMs = 800 + i * 800 + jitter;
          await wait(backoffMs);
        }
      }
    }

    if (!successfulResponseText) {
      const errMessage = String(lastError?.message || lastError || '');
      const isInvalidArgument =
        errMessage.includes('INVALID_ARGUMENT') ||
        errMessage.includes('Unable to process input') ||
        errMessage.includes('corrupt');

      if (isInvalidArgument) {
        res.status(400).json({
          success: false,
          errorType: 'unreadable_file',
          error:
            'File gambar atau PDF tidak dapat dibaca atau rusak. Pastikan dokumen tidak terproteksi password dan memiliki resolusi yang jelas.',
        });
        return;
      }

      res.status(503).json({
        success: false,
        isBusy: true,
        errorType: 'api_error',
        error:
          'Layanan AI sedang mengalami beban tinggi atau gangguan koneksi (503). Dokumen belum berhasil dianalisis. Silakan coba kembali beberapa saat lagi.',
        technicalDetail: errMessage.slice(0, 200),
      });
      return;
    }

    let parsedData: any;
    try {
      parsedData = JSON.parse(successfulResponseText);
    } catch (parseErr) {
      console.error(
        '[RuangEstimasi AI] Failed to parse model output as JSON:',
        parseErr,
        successfulResponseText.slice(0, 300)
      );
      res.status(500).json({
        success: false,
        errorType: 'incomplete_extraction',
        error: 'Format keluaran pembacaan gambar tidak lengkap. Silakan coba analisis ulang.',
      });
      return;
    }

    // Simpan ke dalam cache terikat pada (userId, projectId, documentHash)
    const hasValidItems =
      (Array.isArray(parsedData.items) && parsedData.items.length > 0) ||
      (Array.isArray(parsedData.segments) && parsedData.segments.length > 0);

    if (hasValidItems) {
      const aiCache = loadServerAICache();
      aiCache[cacheKey] = {
        cacheKey,
        userId: cleanUserId,
        projectId: cleanProjectId,
        documentHash,
        fileName: String(fileName || 'Dokumen Gambar Teknik'),
        modelUsed,
        createdAt: new Date().toISOString(),
        data: parsedData,
      };
      saveServerAICache(aiCache);
    }

    res.json({
      success: true,
      fromCache: false,
      documentHash,
      modelUsed,
      data: parsedData,
    });
  } catch (error: unknown) {
    console.error('[RuangEstimasi AI] Server unexpected error:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      errorType: 'api_error',
      error: `Gagal membaca gambar dengan AI: ${errorMsg}`,
    });
  }
});

// Setup Vite development middlewares or static files for production
async function startServer() {
  if (!isProd) {
    let viteMiddleware: any = null;
    const viteReady = createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    }).then((vite) => {
      viteMiddleware = vite.middlewares;
      return vite;
    });

    app.use(async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!viteMiddleware) {
          await viteReady;
        }
        viteMiddleware(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  ➜  Local:   http://localhost:${PORT}/`);
    console.log(`  ➜  Network: http://0.0.0.0:${PORT}/\n`);
  });
}

// Hanya jalankan startServer langsung jika tidak berjalan di environment serverless Vercel
if (!process.env.VERCEL) {
  startServer();
}

export default app;
