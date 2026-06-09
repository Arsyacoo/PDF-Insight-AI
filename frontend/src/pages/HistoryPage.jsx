import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { deleteDocument, getDocuments } from "../api/api.js";
import DocumentCard from "../components/DocumentCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import LoadingState from "../components/LoadingState.jsx";

export default function HistoryPage() {
  const [documents, setDocuments] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDocuments()
      .then(setDocuments)
      .catch(() => setError("Riwayat belum bisa dimuat. Pastikan backend berjalan."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) {
        getDocuments(query).then(setDocuments).catch(() => setError("Pencarian dokumen gagal."));
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, loading]);

  const filtered = useMemo(() => {
    const keyword = query.toLowerCase();
    return documents.filter((doc) =>
      `${doc.file_name} ${doc.text_preview || ""}`.toLowerCase().includes(keyword)
    );
  }, [documents, query]);

  const groupedDocuments = useMemo(() => groupDocuments(filtered), [filtered]);

  async function handleDelete(document) {
    const confirmed = window.confirm(`Hapus dokumen "${document.file_name}" beserta chat, export, dan data vector terkait?`);
    if (!confirmed) return;

    setError("");
    try {
      await deleteDocument(document.document_id);
      setDocuments((current) => current.filter((item) => item.document_id !== document.document_id));
    } catch (err) {
      setError(err.response?.data?.detail || "Dokumen gagal dihapus.");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-8">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-ink md:text-5xl">Riwayat Dokumen</h1>
          <p className="mt-3 text-lg text-muted">Akses dan kelola hasil analisis AI dari dokumen Anda.</p>
        </div>
        <div className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm lg:max-w-md">
          <Search className="shrink-0 text-muted" size={26} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent text-lg outline-none placeholder:text-muted/70"
            placeholder="Cari dokumen..."
          />
        </div>
      </div>
      <ErrorState message={error} />
      {loading && <LoadingState label="Memuat riwayat..." />}
      {!loading && filtered.length === 0 && (
        <EmptyState
          title={query ? "Dokumen tidak ditemukan" : "Belum ada riwayat"}
          description={query ? "Coba kata kunci lain atau upload PDF baru." : "Upload PDF pertama untuk melihat riwayat di sini."}
        />
      )}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {groupedDocuments.map((group) => (
          <DocumentCard
            key={group.key}
            document={group.primary}
            relatedDocuments={group.documents}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}

function groupDocuments(documents) {
  const groups = new Map();
  documents.forEach((document) => {
    const key = normalizeFileName(document.file_name);
    const group = groups.get(key) || { key, documents: [] };
    group.documents.push(document);
    groups.set(key, group);
  });

  return Array.from(groups.values()).map((group) => {
    const sorted = [...group.documents].sort((left, right) =>
      String(right.upload_date || "").localeCompare(String(left.upload_date || ""))
    );
    return {
      ...group,
      documents: sorted,
      primary: sorted[0],
    };
  });
}

function normalizeFileName(fileName = "") {
  return fileName
    .replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i, "")
    .trim()
    .toLowerCase();
}
