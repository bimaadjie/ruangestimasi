/**
 * RuangEstimasi - Layanan Ekspor Excel (XLSX) Asli menggunakan ExcelJS
 * Menghasilkan 4 Sheet Lengkap:
 *  1. Informasi Proyek
 *  2. Rekap Volume
 *  3. Detail Perhitungan
 *  4. Status Verifikasi Rumus
 */

import ExcelJS from 'exceljs';
import { ProjectData } from '../types';
import { computeProjectSummaries, formatIndonesianNumber } from './calculationEngine';

export async function exportProjectToExcel(project: ProjectData): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'RuangEstimasi: Quantity Takeoff';
  workbook.created = new Date();
  workbook.modified = new Date();

  const brandNavy = '173B73';
  const brandBlue = '2563EB';
  const headerFill: ExcelJS.FillPattern = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: `FF${brandNavy}` },
  };

  const headerFont: Partial<ExcelJS.Font> = {
    name: 'Calibri',
    size: 11,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  };

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  };

  const summaries = computeProjectSummaries(project.works);

  // ==========================================
  // SHEET 1: INFORMASI PROYEK
  // ==========================================
  const wsInfo = workbook.addWorksheet('Informasi Proyek', {
    views: [{ showGridLines: true }],
  });

  wsInfo.columns = [
    { header: 'Parameter', key: 'key', width: 34 },
    { header: 'Keterangan / Nilai', key: 'value', width: 48 },
  ];

  // Header Judul
  wsInfo.mergeCells('A1:B1');
  const titleCell = wsInfo.getCell('A1');
  titleCell.value = 'RUANGESTIMASI: RINGKASAN DATA PROYEK & QUANTITY TAKEOFF';
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: `FF${brandNavy}` } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  wsInfo.getRow(1).height = 30;

  wsInfo.addRow([]);
  wsInfo.addRow(['Nama Proyek', project.name]);
  wsInfo.addRow(['Lokasi Bangunan', project.location || 'Magelang, Jawa Tengah']);
  wsInfo.addRow(['Deskripsi', project.description || 'Pekerjaan Perhitungan Quantity Takeoff']);
  wsInfo.addRow(['Tanggal Ekspor', new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })]);
  wsInfo.addRow(['Jumlah Lantai', `${project.floorCount} Lantai`]);
  wsInfo.addRow([]);

  wsInfo.addRow(['RINGKASAN REKAPITULASI TOTAL (TERVERIFIKASI)', 'NILAI VOLUME']);
  const subheadRowIdx = wsInfo.lastRow?.number || 8;
  wsInfo.getCell(`A${subheadRowIdx}`).font = { bold: true, color: { argb: `FF${brandBlue}` } };
  wsInfo.getCell(`B${subheadRowIdx}`).font = { bold: true, color: { argb: `FF${brandBlue}` } };

  wsInfo.addRow(['Total Pekerjaan Aktif', `${project.works.filter((w) => w.isActive).length} item`]);
  wsInfo.addRow(['Pekerjaan Terverifikasi Lengkap', `${summaries.completedWorks} item`]);
  wsInfo.addRow(['Draf AI Menunggu Verifikasi', `${summaries.draftWorksCount} item`]);
  wsInfo.addRow(['Pekerjaan Perlu Input / Belum Lengkap', `${summaries.pendingWorks} item`]);
  wsInfo.addRow(['Volume Beton Terverifikasi', `${formatIndonesianNumber(summaries.totalBetonM3)} m³`]);
  wsInfo.addRow(['Luas Pekerjaan Terverifikasi', `${formatIndonesianNumber(summaries.totalLuasM2)} m²`]);
  wsInfo.addRow(['Panjang Pekerjaan Terverifikasi', `${formatIndonesianNumber(summaries.totalPanjangM)} m'`]);

  if (summaries.draftWorksCount > 0) {
    wsInfo.addRow(['Volume Beton Draf AI (Belum Disetujui)', `${formatIndonesianNumber(summaries.draftBetonM3)} m³`]);
    wsInfo.addRow(['Luas Pekerjaan Draf AI (Belum Disetujui)', `${formatIndonesianNumber(summaries.draftLuasM2)} m²`]);
    wsInfo.addRow(['Panjang Pekerjaan Draf AI (Belum Disetujui)', `${formatIndonesianNumber(summaries.draftPanjangM)} m'`]);
  }

  const lastInfoRow = wsInfo.lastRow?.number || 16;
  for (let r = 3; r <= lastInfoRow; r++) {
    const row = wsInfo.getRow(r);
    if (row.getCell(1).value) {
      row.getCell(1).font = { bold: true };
      row.getCell(1).border = thinBorder;
      row.getCell(2).border = thinBorder;
    }
  }

  // ==========================================
  // SHEET 2: REKAP VOLUME
  // ==========================================
  const wsRekap = workbook.addWorksheet('Rekap Volume', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: true }],
  });

  wsRekap.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Kategori', key: 'category', width: 16 },
    { header: 'Lantai / Zona', key: 'floor', width: 18 },
    { header: 'Nama Pekerjaan', key: 'name', width: 38 },
    { header: 'Satuan', key: 'unit', width: 10 },
    { header: 'Volume Pekerjaan', key: 'volume', width: 18 },
    { header: 'Sumber & Verifikasi', key: 'verification', width: 22 },
    { header: 'Status Perhitungan', key: 'status', width: 24 },
  ];

  // Header styling
  const headerRow2 = wsRekap.getRow(1);
  headerRow2.height = 25;
  headerRow2.eachCell((cell) => {
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  let rowCounter = 1;
  project.works
    .filter((w) => w.isActive)
    .forEach((w) => {
      const floorObj = project.floors.find((f) => f.id === w.floorId);
      const floorName = floorObj ? floorObj.name : w.floorId;
      const verifStr =
        w.aiVerificationStatus === 'draft'
          ? 'Draf AI (Menunggu Verifikasi)'
          : w.origin === 'ai'
          ? 'AI (Terverifikasi)'
          : 'Terverifikasi';

      const newRow = wsRekap.addRow({
        no: rowCounter++,
        category: w.category,
        floor: floorName,
        name: w.name,
        unit: w.unit,
        volume: w.calculatedVolume !== null ? Number(w.calculatedVolume.toFixed(3)) : '-',
        verification: verifStr,
        status: w.status,
      });

      newRow.eachCell((cell, colNumber) => {
        cell.border = thinBorder;
        if (colNumber === 1 || colNumber === 5 || colNumber === 7 || colNumber === 8) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if (colNumber === 6) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          if (typeof cell.value === 'number') {
            cell.numFmt = '#,##0.00';
          }
        }
      });
    });

  // ==========================================
  // SHEET 3: DETAIL PERHITUNGAN
  // ==========================================
  const wsDetail = workbook.addWorksheet('Detail Perhitungan', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: true }],
  });

  wsDetail.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Pekerjaan', key: 'name', width: 34 },
    { header: 'Lantai', key: 'floor', width: 16 },
    { header: 'Rumus Teknis', key: 'formula', width: 32 },
    { header: 'Parameter Input', key: 'params', width: 45 },
    { header: 'Hasil Volume', key: 'volume', width: 16 },
    { header: 'Satuan', key: 'unit', width: 10 },
    { header: 'Sumber Data', key: 'source', width: 24 },
    { header: 'Status', key: 'status', width: 22 },
  ];

  const headerRow3 = wsDetail.getRow(1);
  headerRow3.height = 25;
  headerRow3.eachCell((cell) => {
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  let detailCounter = 1;
  project.works
    .filter((w) => w.isActive)
    .forEach((w) => {
      const floorObj = project.floors.find((f) => f.id === w.floorId);
      const floorName = floorObj ? floorObj.name : w.floorId;

      const paramStr = w.parameters
        .filter((p) => p.value !== null && p.value !== '')
        .map((p) => `${p.label || p.name} = ${p.value} ${p.unit}`)
        .join('; ');

      const sourceStr =
        w.origin === 'ai'
          ? `Analisis Gambar AI${w.sourceDocument ? ` (${w.sourceDocument})` : ''}`
          : w.customFormula
          ? 'Input Kustom'
          : 'Katalog Konstruksi';

      const newRow = wsDetail.addRow({
        no: detailCounter++,
        name: w.name,
        floor: floorName,
        formula: w.formulaDisplay || '-',
        params: paramStr || '(Belum ada input lengkap)',
        volume: w.calculatedVolume !== null ? Number(w.calculatedVolume.toFixed(3)) : '-',
        unit: w.unit,
        source: sourceStr,
        status: w.status,
      });

      newRow.eachCell((cell, colNumber) => {
        cell.border = thinBorder;
        if (colNumber === 1 || colNumber === 7 || colNumber === 9) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if (colNumber === 6) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          if (typeof cell.value === 'number') {
            cell.numFmt = '#,##0.00';
          }
        }
      });
    });

  // ==========================================
  // SHEET 4: STATUS VERIFIKASI RUMUS
  // ==========================================
  const wsVerif = workbook.addWorksheet('Status Verifikasi', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: true }],
  });

  wsVerif.columns = [
    { header: 'Pekerjaan', key: 'name', width: 35 },
    { header: 'Kategori', key: 'category', width: 16 },
    { header: 'Asal Data', key: 'origin', width: 22 },
    { header: 'Rumus Perhitungan', key: 'formula', width: 32 },
    { header: 'Status Verifikasi', key: 'status', width: 24 },
    { header: 'Catatan Quantity Surveyor', key: 'notes', width: 48 },
  ];

  const headerRow4 = wsVerif.getRow(1);
  headerRow4.height = 25;
  headerRow4.eachCell((cell) => {
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  project.works
    .filter((w) => w.isActive)
    .forEach((w) => {
      const originLabel =
        w.origin === 'ai'
          ? w.aiVerificationStatus === 'draft'
            ? 'Draf AI (Menunggu Verifikasi)'
            : 'Hasil AI (Disetujui)'
          : w.customFormula
          ? 'Pekerjaan Kustom'
          : 'Katalog Konstruksi';

      const newRow = wsVerif.addRow({
        name: w.name,
        category: w.category,
        origin: originLabel,
        formula: w.formulaDisplay || '-',
        status: w.status,
        notes: w.statusMessage || 'Seluruh parameter lengkap dan terhitung sesuai rumus.',
      });

      newRow.eachCell((cell) => {
        cell.border = thinBorder;
      });
    });

  // Generate buffer and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const sanitizedProjName = (project.name || 'Proyek_Konstruksi').replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `RuangEstimasi_${sanitizedProjName}_${dateStr}.xlsx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
