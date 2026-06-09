import { CloudUpload } from "lucide-react";

export default function UploadBox({ onFile, progress, uploading }) {
  return (
    <label className="glass flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-line p-8 text-center transition hover:border-primary hover:bg-white">
      <CloudUpload className="mb-4 text-primary" size={48} />
      <h2 className="text-2xl font-bold">Upload PDF</h2>
      <p className="mt-2 max-w-md text-muted">Pilih PDF berbasis teks. PDF scan/gambar belum didukung karena teksnya tidak bisa diekstrak langsung.</p>
      <input
        className="hidden"
        type="file"
        accept="application/pdf,.pdf"
        disabled={uploading}
        onChange={(event) => onFile(event.target.files?.[0])}
      />
      {uploading && (
        <div className="mt-6 w-full max-w-md">
          <div className="h-3 rounded-full bg-line">
            <div className="h-3 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-sm font-semibold text-primary">{progress}%</p>
        </div>
      )}
    </label>
  );
}
