import { API_BASE_URL } from "../api/api.js";

export default function PdfPreview({ documentId, page = 1, totalPages, visible = true, onPageChange }) {
  if (!documentId) {
    return <div className="rounded-lg border border-line bg-white p-6 text-center text-muted">Pilih PDF untuk melihat preview.</div>;
  }

  const safePage = Math.max(1, page || 1);
  const src = `${API_BASE_URL}/documents/${documentId}/file#page=${safePage}`;

  function changePage(nextPage) {
    if (!onPageChange) return;
    const bounded = totalPages ? Math.min(Math.max(nextPage, 1), totalPages) : Math.max(nextPage, 1);
    onPageChange(bounded);
  }

  return (
    <section className={`${visible ? "block" : "hidden lg:block"} rounded-lg border border-line bg-white shadow-sm`}>
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-ink">PDF Preview</h2>
          <p className="text-sm text-muted">Halaman aktif: {safePage}{totalPages ? ` / ${totalPages}` : ""}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => changePage(safePage - 1)} disabled={safePage <= 1} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-muted disabled:opacity-50">
            Previous
          </button>
          <button type="button" onClick={() => changePage(safePage + 1)} disabled={!!totalPages && safePage >= totalPages} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-muted disabled:opacity-50">
            Next
          </button>
          <a href={src} target="_blank" rel="noreferrer" className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-primary">
            Open
          </a>
        </div>
      </div>
      <iframe
        key={src}
        src={src}
        title="PDF Preview"
        className="h-[70vh] w-full rounded-b-lg"
      />
    </section>
  );
}
