import { AlertTriangle, FilePenLine, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { deleteDocument, getDocuments, renameDocument } from "../api/api.js";
import DocumentCard from "../components/DocumentCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import LoadingState from "../components/LoadingState.jsx";

export default function HistoryPage() {
  const [documents, setDocuments] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [saving, setSaving] = useState(false);

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
      `${doc.display_name || ""} ${doc.file_name} ${doc.text_preview || ""}`.toLowerCase().includes(keyword)
    );
  }, [documents, query]);

  const groupedDocuments = useMemo(() => groupDocuments(filtered), [filtered]);

  function openRenameModal(document) {
    setError("");
    setRenameTarget(document);
    setRenameValue(document.display_name || cleanFileName(document.file_name));
  }

  async function handleRename(event) {
    event.preventDefault();
    if (!renameTarget) return;

    const displayName = renameValue.trim();
    if (!displayName) {
      setError("Nama dokumen tidak boleh kosong.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const data = await renameDocument(renameTarget.document_id, displayName);
      setDocuments((current) => current.map((item) => item.document_id === renameTarget.document_id ? { ...item, ...data.document } : item));
      setRenameTarget(null);
      setRenameValue("");
    } catch (err) {
      setError(err.response?.data?.detail || "Nama dokumen gagal diperbarui.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setSaving(true);
    setError("");
    try {
      await deleteDocument(deleteTarget.document_id);
      setDocuments((current) => current.filter((item) => item.document_id !== deleteTarget.document_id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Dokumen gagal dihapus.");
    } finally {
      setSaving(false);
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
            onDelete={setDeleteTarget}
            onRename={openRenameModal}
          />
        ))}
      </div>

      {renameTarget && (
        <Modal title="Rename Dokumen" onClose={() => setRenameTarget(null)}>
          <form onSubmit={handleRename} className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl bg-soft p-4">
              <FilePenLine className="mt-0.5 text-primary" size={22} />
              <p className="text-sm leading-6 text-muted">Nama ini hanya digunakan untuk tampilan di aplikasi. Nama file asli tetap disimpan.</p>
            </div>
            <label className="block">
              <span className="text-sm font-bold text-ink">Nama dokumen</span>
              <input
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                maxLength={120}
                className="mt-2 w-full rounded-xl border border-line px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                autoFocus
              />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setRenameTarget(null)} className="rounded-xl border border-line px-4 py-2 font-bold text-muted">Batal</button>
              <button type="submit" disabled={saving} className="rounded-xl bg-primary px-4 py-2 font-bold text-white disabled:opacity-60">
                {saving ? "Menyimpan..." : "Simpan Nama"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Hapus Dokumen" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-danger">
              <AlertTriangle className="mt-0.5 shrink-0" size={24} />
              <div>
                <p className="font-black">Tindakan ini tidak bisa dibatalkan.</p>
                <p className="mt-1 text-sm leading-6">Dokumen, chat, file export, dan vector chunks terkait akan dihapus dari storage lokal.</p>
              </div>
            </div>
            <p className="text-sm leading-6 text-muted">
              Yakin ingin menghapus <span className="font-bold text-ink">{deleteTarget.display_name || cleanFileName(deleteTarget.file_name)}</span>?
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-xl border border-line px-4 py-2 font-bold text-muted">Batal</button>
              <button type="button" disabled={saving} onClick={handleDelete} className="rounded-xl bg-danger px-4 py-2 font-bold text-white disabled:opacity-60">
                <Trash2 className="mr-1 inline" size={16} /> {saving ? "Menghapus..." : "Hapus Dokumen"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-white p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-black text-ink">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted hover:bg-soft" aria-label="Tutup modal">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function groupDocuments(documents) {
  const groups = new Map();
  documents.forEach((document) => {
    const key = normalizeFileName(document.display_name || document.file_name);
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

function cleanFileName(fileName = "") {
  return fileName.replace(/^[0-9a-f-]{36}-/i, "");
}
