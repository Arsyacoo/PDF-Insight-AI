import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getDocuments } from "../api/api.js";
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
      .catch(() => setError("History belum bisa dimuat. Pastikan backend berjalan."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) {
        getDocuments(query).then(setDocuments).catch(() => setError("Pencarian dokumen gagal."));
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const filtered = useMemo(() => {
    const keyword = query.toLowerCase();
    return documents.filter((doc) =>
      `${doc.file_name} ${doc.text_preview || ""}`.toLowerCase().includes(keyword)
    );
  }, [documents, query]);

  const groupedDocuments = useMemo(() => groupDocuments(filtered), [filtered]);

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-5 py-8">
      <div className="rounded-lg bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-extrabold">History & Export</h1>
        <p className="mt-1 text-muted">Lihat dokumen yang sudah diunggah dan export summary atau chat sebagai TXT.</p>
      </div>
      <div className="glass flex items-center gap-3 rounded-lg p-4">
        <Search className="text-muted" size={20} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full bg-transparent outline-none"
          placeholder="Cari berdasarkan nama dokumen atau preview..."
        />
      </div>
      <ErrorState message={error} />
      {loading && <LoadingState label="Memuat history..." />}
      {!loading && filtered.length === 0 && (
        <EmptyState
          title={query ? "Dokumen tidak ditemukan" : "No history yet"}
          description={query ? "Coba kata kunci lain atau upload PDF baru." : "Upload PDF pertama untuk melihat history di sini."}
        />
      )}
      <div className="grid gap-4">
        {groupedDocuments.map((group) => (
          <DocumentCard
            key={group.key}
            document={group.primary}
            relatedDocuments={group.documents}
          />
        ))}
      </div>
      <section className="rounded-lg bg-ink p-6 text-white">
        <h2 className="text-2xl font-extrabold">Bulk Export Intelligence</h2>
        <p className="mt-2 max-w-2xl text-white/70">
          Export per dokumen sudah tersedia dalam format TXT. Export PDF dan DOCX dapat dikembangkan sebagai peningkatan berikutnya.
        </p>
      </section>
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
