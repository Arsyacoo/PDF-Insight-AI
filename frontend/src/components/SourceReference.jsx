export default function SourceReference({ source }) {
  return (
    <div className="rounded-lg border border-line bg-white p-3 text-sm text-muted">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="font-bold text-primary">Source Reference</p>
        <span className="shrink-0 rounded-lg bg-soft px-2 py-1 text-xs font-bold text-primary">Page {source.page_number || "-"}</span>
      </div>
      <p className="leading-6">{source.snippet || "Snippet tidak tersedia."}</p>
    </div>
  );
}
