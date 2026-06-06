import { useState } from "react";

export default function RetrievalDetails({ details }) {
  const [open, setOpen] = useState(false);
  if (!details) return null;

  return (
    <div className="mt-3 rounded-lg border border-line bg-white p-3">
      <button type="button" onClick={() => setOpen((value) => !value)} className="text-sm font-bold text-primary">
        {open ? "Hide Retrieval Details" : "Show Retrieval Details"}
      </button>
      {open && (
        <div className="mt-3 space-y-2 text-sm text-muted">
          <p><span className="font-semibold text-ink">Method:</span> {details.retrieval_method}</p>
          <p><span className="font-semibold text-ink">Model:</span> {details.model}</p>
          <p><span className="font-semibold text-ink">Retrieved:</span> {details.total_chunks_retrieved} chunks</p>
          <p><span className="font-semibold text-ink">Used:</span> {details.chunks_used_for_answer} chunks</p>
          <div className="space-y-1">
            {(details.sources || []).map((source, index) => (
              <p key={index}>Page {source.page_number || "-"} • relevance {Math.round((source.score || 0) * 100)}%</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
