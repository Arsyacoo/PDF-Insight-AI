import { Download, FileText, MessageSquareText } from "lucide-react";
import { Link } from "react-router-dom";
import { exportUrl } from "../api/api.js";

export default function DocumentCard({ document }) {
  return (
    <article className="flex flex-col gap-4 rounded-lg border border-line bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex gap-4">
        <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-primary">
          <FileText size={28} />
        </div>
        <div>
          <h3 className="font-bold text-ink">{document.file_name}</h3>
          <p className="mt-1 text-sm text-muted">
            {document.total_pages} halaman • {document.chunk_count || 0} chunk
          </p>
          <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-muted">{document.text_preview}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to={`/analysis/${document.document_id}`} className="rounded-lg bg-soft px-3 py-2 text-sm font-semibold text-primary">
          Analysis
        </Link>
        <Link to={`/chat/${document.document_id}`} className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white">
          Chat
        </Link>
        <Link to="/learning" className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-primary">
          Quiz
        </Link>
        <a href={exportUrl("summary", document.document_id)} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-muted">
          <Download className="inline" size={15} /> Summary
        </a>
        <a href={exportUrl("chat", document.document_id)} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-muted">
          <MessageSquareText className="inline" size={15} /> Chat
        </a>
      </div>
    </article>
  );
}
