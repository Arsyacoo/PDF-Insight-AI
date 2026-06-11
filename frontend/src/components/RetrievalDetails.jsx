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
          <p><span className="font-semibold text-ink">Accepted:</span> {details.chunks_above_threshold ?? 0} chunks above threshold {details.threshold ?? "-"}</p>
          <p><span className="font-semibold text-ink">Used:</span> {details.chunks_used_for_answer} chunks</p>
          <div className="space-y-1">
            {(details.results || details.sources || []).map((result, index) => (
              <p key={index}>
                Page {result.page_number || "-"} ? retrieval relevance {Math.round((result.relevance_score ?? result.score ?? 0) * 100)}% ? {result.passed_threshold ? "accepted" : "rejected"}
              </p>
            ))}
          </div>
          <p className="text-xs text-muted">Retrieval relevance measures how well a chunk matched the query. It is not a guarantee of answer accuracy.</p>
        </div>
      )}
    </div>
  );
}
