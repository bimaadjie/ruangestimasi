# Panduan penggunaan katalog volume USC di Google AI Studio

File `katalog_volume_usc.json` adalah hasil konversi **tiga sheet volume** dari workbook asli. Isi mempertahankan alamat sel, nilai dan rumus asli (jika ada), bukan hasil interpretasi rumus pekerjaan.

- **Volume Persiapan Dll**: 162 sel berisi, 23 rumus eksplisit, 0 sel rumus dengan tanda referensi eksternal.
- **Volume Struktural**: 4721 sel berisi, 1170 rumus eksplisit, 302 sel rumus dengan tanda referensi eksternal.
- **Volume Arsitektural**: 2713 sel berisi, 787 rumus eksplisit, 0 sel rumus dengan tanda referensi eksternal.

## Instruksi untuk AI Studio

1. Masukkan file JSON ke folder proyek aplikasi (misalnya `src/data/katalog_volume_usc.json`) atau salin isi dalam beberapa bagian bila editor tidak menerima unggahan JSON.
2. Baca `sheets[].rows[].cells[]`: `cell` adalah alamat sel, `value` nilai tersimpan, `excel_formula` rumus asli (diawali `=`).
3. Jangan perlakukan nilai tersimpan sebagai input standar seluruh proyek. Identifikasi label pekerjaan, parameter, satuan, dan aturan lantai berdasarkan hubungan sel yang bisa dibuktikan.
4. Bangun katalog semantik baru dari data ini, dengan daftar pekerjaan, parameter, satuan, rumus yang telah diterjemahkan, serta sumber `sheet` dan `cell`.
5. Tandai rumus yang memiliki referensi workbook eksternal, formula shared, atau referensi yang tidak dapat diurai sebagai **perlu verifikasi**. Jangan mengarang nilainya.
6. Jalankan perhitungan dengan mesin deterministik, bukan dengan AI generatif. Bandingkan hasilnya terhadap Excel asli.
7. AI hanya membantu ekstraksi parameter PDF/gambar; pengguna memverifikasi sebelum data dihitung.
8. Pertahankan seluruh UI dalam satu halaman, dengan daftar pekerjaan bawaan per lantai dan kemampuan mengedit/menambah pekerjaan. Jangan buat fitur AHSP, harga, atau RAB sekarang.

## Penting

File JSON ini merupakan **data referensi**, belum merupakan database pekerjaan final yang langsung bisa dieksekusi. Sebagian rumus Excel bisa mengandalkan referensi luar, nama rentang, atau formula bersama yang perlu diselesaikan sebelum digunakan.
