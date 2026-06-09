import { AlertTriangle, Bot, Eye, FileText, MessageSquareText } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { uploadPdf } from "../api/api.js";
import DocumentQualityCard from "../components/DocumentQualityCard.jsx";
import ErrorState from "../components/ErrorState.jsx";
import UploadBox from "../components/UploadBox.jsx";

const quickActions = [
  ["Lihat Hasil", Eye, "Tinjau struktur dan data mentah yang diekstrak."],
  ["Ringkas Dokumen", FileText, "Buat ikhtisar eksekutif dalam hitungan detik."],
  ["Tanya AI", Bot, "Mulai sesi chat untuk bertanya seputar isi dokumen ini."],
];

export default function UploadPage() {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  async function handleFile(file) {
    setError("");
    setResult(null);
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("File harus berformat PDF.");
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const data = await uploadPdf(file, (event) => {
        setProgress(Math.round((event.loaded * 100) / (event.total || 1)));
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Upload gagal. Pastikan backend berjalan.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1320px] px-5 py-8 lg:px-8">
      <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <div className="mb-6">
            <h1 className="text-4xl font-black tracking-tight text-ink md:text-5xl">Analisis Dokumen Baru</h1>
            <p className="mt-3 max-w-3xl text-lg leading-8 text-muted">
              Unggah file PDF Anda untuk mulai mengekstrak wawasan, membuat ringkasan otomatis, dan berinteraksi dengan AI cerdas kami.
            </p>
          </div>
          <section className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-danger">
            <div className="flex gap-4">
              <AlertTriangle className="mt-1 shrink-0" size={28} />
              <div>
                <p className="text-base font-black">Perhatian</p>
                <p className="mt-2 text-lg leading-8">Hanya mendukung PDF berbasis teks. PDF hasil scan atau gambar tidak didukung.</p>
              </div>
            </div>
          </section>
          <UploadBox onFile={handleFile} progress={progress} uploading={uploading} />
          <div className="mt-5">
            <ErrorState message={error} />
          </div>
          {result && (
            <div className="mt-6 space-y-5">
              <section className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
                <h2 className="text-xl font-bold text-success">{result.message}</h2>
                <p className="mt-2 text-muted">{result.file_name} • {result.total_pages} halaman</p>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{result.text_preview}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => navigate(`/analysis/${result.document_id}`)} className="rounded-xl bg-primary px-4 py-2 font-semibold text-white">
                    Buat Analisis
                  </button>
                  <Link to={`/chat/${result.document_id}`} className="rounded-xl border border-line bg-white px-4 py-2 font-semibold text-primary">
                    Chat PDF
                  </Link>
                </div>
              </section>
              <DocumentQualityCard quality={result.quality} />
            </div>
          )}
        </div>
        <aside className="space-y-4 xl:pt-[166px]">
          <h2 className="text-2xl font-black">Tindakan Cepat</h2>
          {quickActions.map(([title, Icon, desc], index) => (
            <div key={title} className={`${index === 2 ? "bg-gradient-to-br from-primary to-secondary text-white shadow-soft" : "border border-line bg-white text-ink"} rounded-2xl p-4`}>
              <div className="flex gap-4">
                <div className={`${index === 2 ? "bg-white/15 text-white" : "bg-indigo-100 text-primary"} flex h-12 w-12 shrink-0 items-center justify-center rounded-full`}>
                  <Icon size={26} />
                </div>
                <div>
                  <p className="text-base font-black">{title}</p>
                  <p className={`${index === 2 ? "text-white/75" : "text-muted"} mt-1.5 text-sm leading-6`}>{desc}</p>
                </div>
              </div>
            </div>
          ))}
          <section className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
            <div className="flex gap-3">
              <MessageSquareText className="text-primary" />
              <p className="text-sm leading-6 text-muted">Setelah upload berhasil, gunakan tombol analisis atau chat untuk melanjutkan workflow dokumen.</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
