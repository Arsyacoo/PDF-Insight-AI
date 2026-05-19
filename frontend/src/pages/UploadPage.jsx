import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { uploadPdf } from "../api/api.js";
import ErrorState from "../components/ErrorState.jsx";
import UploadBox from "../components/UploadBox.jsx";

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
    <div className="mx-auto max-w-5xl px-5 py-8">
      <UploadBox onFile={handleFile} progress={progress} uploading={uploading} />
      <div className="mt-5">
        <ErrorState message={error} />
      </div>
      {result && (
        <section className="mt-5 rounded-lg border border-green-200 bg-green-50 p-5">
          <h2 className="text-xl font-bold text-success">{result.message}</h2>
          <p className="mt-2 text-muted">{result.file_name} • {result.total_pages} halaman</p>
          <p className="mt-3 line-clamp-3 text-sm text-muted">{result.text_preview}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => navigate(`/analysis/${result.document_id}`)} className="rounded-lg bg-primary px-4 py-2 font-semibold text-white">
              Buat Analisis
            </button>
            <Link to={`/chat/${result.document_id}`} className="rounded-lg border border-line bg-white px-4 py-2 font-semibold text-primary">
              Chat PDF
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
