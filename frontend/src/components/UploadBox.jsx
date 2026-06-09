import { FileUp } from "lucide-react";

export default function UploadBox({ onFile, progress, uploading }) {
  return (
    <label className="group flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-200 bg-white/60 p-7 text-center transition hover:border-primary hover:bg-white hover:shadow-soft">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-primary transition group-hover:scale-105">
        <FileUp size={36} />
      </div>
      <h2 className="mt-6 text-2xl font-black tracking-tight">Pilih file atau seret ke sini</h2>
      <p className="mt-3 max-w-xl text-base leading-7 text-muted">
        Mendukung format .pdf hingga ukuran maksimal 10MB. Pastikan dokumen berbasis teks untuk hasil terbaik.
      </p>
      <input
        className="hidden"
        type="file"
        accept="application/pdf,.pdf"
        disabled={uploading}
        onChange={(event) => onFile(event.target.files?.[0])}
      />
      <span className="mt-6 rounded-xl border border-primary px-7 py-2.5 text-sm font-extrabold text-primary transition group-hover:bg-primary group-hover:text-white">
        Jelajahi File
      </span>
      {uploading && (
        <div className="mt-8 w-full max-w-xl rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between text-sm font-semibold text-muted">
            <span>Sedang mengunggah...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-indigo-100">
            <div className="h-3 rounded-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
    </label>
  );
}
