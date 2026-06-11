import ConfidenceBadge from "./ConfidenceBadge.jsx";

export default function SourceReference({ source, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(source)}
      className={`w-full rounded-lg border p-3 text-left text-sm transition ${active ? "border-primary bg-indigo-50" : "border-line bg-white hover:border-primary/60"}`}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="font-bold text-primary">Source Reference</p>
        <div className="flex items-center gap-2">
          <ConfidenceBadge label={source.relevance_label || source.confidence_label} />
          <span className="shrink-0 rounded-lg bg-soft px-2 py-1 text-xs font-bold text-primary">Page {source.page_number || "-"}</span>
        </div>
      </div>
      <p className="leading-6 text-muted">{source.snippet || "Snippet tidak tersedia."}</p>
      <p className="mt-2 text-xs font-semibold text-muted">Source Relevance: {Math.round((source.score || 0) * 100)}%</p>
    </button>
  );
}
