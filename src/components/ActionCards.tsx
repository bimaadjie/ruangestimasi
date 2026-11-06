import React, { useRef } from 'react';
import { UploadCloud, FileEdit, Upload } from 'lucide-react';

interface ActionCardsProps {
  onUploadFile: (file: File) => void;
  onOpenManualForm: () => void;
}

export const ActionCards: React.FC<ActionCardsProps> = ({
  onUploadFile,
  onOpenManualForm,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadFile(e.target.files[0]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-7">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Unggah Gambar / PDF</h3>
              <p className="text-xs text-slate-500">
                Upload file gambar denah, potongan, atau PDF untuk dibaca AI.
              </p>
            </div>
          </div>
        </div>

        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="mt-3.5 border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/30 hover:bg-blue-50/60 rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
            <Upload className="w-4 h-4 text-blue-600" />
            <span>Klik untuk mengunggah atau drag & drop</span>
          </div>
          <span className="text-[11px] text-slate-500">
            Format: PDF, JPG, PNG (maks. 10 MB)
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Input Manual</h3>
              <p className="text-xs text-slate-500">
                Isi data bangunan dan parameter secara manual.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3.5">
          <button
            onClick={onOpenManualForm}
            className="w-full py-3 px-4 rounded-xl border border-blue-200 hover:border-blue-400 bg-white hover:bg-blue-50/50 text-blue-700 font-semibold text-xs transition flex items-center justify-center shadow-2xs"
          >
            Buka Form Input
          </button>
        </div>
      </div>
    </div>
  );
};
