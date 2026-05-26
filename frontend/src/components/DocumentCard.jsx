import { BarChart3, BookOpenCheck, Download, FileText, Layers3, MessageSquareText } from "lucide-react";
import { Link } from "react-router-dom";
import { exportUrl } from "../api/api.js";

export default function DocumentCard({ document, relatedDocuments = [] }) {
  const documents = relatedDocuments.length ? relatedDocuments : [document];
  const activities = mergeActivities(documents);
  const duplicateCount = documents.length;

  return (
    <article className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-primary">
            <FileText size={28} />
          </div>
          <div>
            <h3 className="font-bold text-ink">{cleanFileName(document.file_name)}</h3>
            <p className="mt-1 text-sm text-muted">
              {document.total_pages} halaman • {document.chunk_count || 0} chunk
              {duplicateCount > 1 && ` • ${duplicateCount} upload digabung`}
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
            Learning
          </Link>
          <a href={exportUrl("summary", document.document_id)} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-muted">
            <Download className="inline" size={15} /> Summary
          </a>
          <a href={exportUrl("chat", document.document_id)} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-muted">
            <MessageSquareText className="inline" size={15} /> Chat
          </a>
        </div>
      </div>
      <div className="mt-4 rounded-lg bg-soft p-4">
        <p className="text-sm font-bold text-ink">Aktivitas pada PDF ini</p>
        {activities.length > 0 ? (
          <ul className="mt-3 grid gap-2 md:grid-cols-2">
            {activities.map((activity) => (
              <li key={activity.type} className="flex items-center gap-2 text-sm text-muted">
                <ActivityIcon type={activity.type} />
                <span>{activity.label}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">Belum ada aktivitas tambahan. Mulai dari Analysis, Chat, atau Learning.</p>
        )}
      </div>
    </article>
  );
}

function mergeActivities(documents) {
  const summary = {
    analysis: documents.some((doc) => doc.analysis || doc.summary),
    chat: documents.reduce((total, doc) => total + (doc.chat_count || 0), 0),
    quiz: documents.some((doc) => doc.quiz),
    flashcards: documents.some((doc) => doc.flashcards),
  };

  return [
    summary.analysis && { type: "analysis", label: "Analisis dokumen tersedia" },
    summary.chat > 0 && { type: "chat", label: `${summary.chat} chat tersimpan` },
    summary.quiz && { type: "quiz", label: "Quiz sudah dibuat" },
    summary.flashcards && { type: "flashcards", label: "Flashcards sudah dibuat" },
  ].filter(Boolean);
}

function ActivityIcon({ type }) {
  const className = "shrink-0 text-primary";
  if (type === "analysis") return <BarChart3 className={className} size={16} />;
  if (type === "chat") return <MessageSquareText className={className} size={16} />;
  if (type === "quiz") return <BookOpenCheck className={className} size={16} />;
  return <Layers3 className={className} size={16} />;
}

function cleanFileName(fileName = "") {
  return fileName.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i, "");
}
