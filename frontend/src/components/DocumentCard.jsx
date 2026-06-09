import { BarChart3, BookOpenCheck, Clock3, Download, FileText, Layers3, MessageSquareText, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { exportActivityUrl } from "../api/api.js";
import ExportReportButtons from "./ExportReportButtons.jsx";

const EXPORT_SECTIONS = [
  ["all", "Semua Aktivitas"],
  ["summary", "Ringkasan"],
  ["chat", "Chat"],
  ["quiz", "Quiz"],
  ["flashcards", "Flashcards"],
];

const EXPORT_FORMATS = [
  ["txt", "TXT"],
  ["pdf", "PDF"],
  ["docx", "Word"],
];

export default function DocumentCard({ document, relatedDocuments = [], onDelete }) {
  const documents = relatedDocuments.length ? relatedDocuments : [document];
  const activities = mergeActivities(documents);
  const duplicateCount = documents.length;
  const qualityLabel = document.quality?.quality_label || (document.quality?.scan_probability >= 0.25 ? "Fair" : "Good");

  return (
    <article className="group rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-soft">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-primary">
          <FileText size={30} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-black text-ink">{cleanFileName(document.file_name)}</h3>
          <p className="mt-2 font-mono text-sm text-muted">
            {document.total_pages} halaman • {document.chunk_count || 0} chunk
            {duplicateCount > 1 && ` • ${duplicateCount} upload`}
          </p>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <span className={`${qualityLabel === "Good" ? "bg-purple-100 text-secondary" : "bg-indigo-100 text-muted"} rounded-full px-4 py-1.5 font-mono text-sm`}>
          Kualitas {qualityLabel === "Good" ? "Tinggi" : qualityLabel === "Fair" ? "Sedang" : "Rendah"}
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono text-sm text-muted">
          <Clock3 size={16} /> {formatRelativeDate(document.upload_date)}
        </span>
      </div>

      <p className="mt-5 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-muted">{document.text_preview || "Preview teks belum tersedia."}</p>

      <div className="mt-5 rounded-xl bg-soft p-4">
        <p className="text-sm font-black text-ink">Aktivitas</p>
        {activities.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {activities.slice(0, 3).map((activity) => (
              <li key={activity.type} className="flex items-center gap-2 text-sm text-muted">
                <ActivityIcon type={activity.type} />
                <span>{activity.label}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">Belum ada aktivitas tambahan.</p>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link to={`/analysis/${document.document_id}`} className="rounded-xl bg-soft px-3 py-2 text-sm font-bold text-primary">
          Analysis
        </Link>
        <Link to={`/chat/${document.document_id}`} className="rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white">
          Chat
        </Link>
        <ExportMenu documentId={document.document_id} activities={activities} />
        <ExportReportButtons documentId={document.document_id} />
        <button
          type="button"
          onClick={() => onDelete?.(document)}
          className="rounded-xl border border-red-200 px-3 py-2 text-sm font-bold text-danger hover:bg-red-50"
        >
          <Trash2 className="inline" size={15} /> Hapus
        </button>
      </div>
    </article>
  );
}

function ExportMenu({ documentId, activities }) {
  const availableSections = EXPORT_SECTIONS.filter(([section]) =>
    section === "all" || activities.some((activity) => activity.type === section || (section === "summary" && activity.type === "analysis"))
  );

  return (
    <div className="group/menu relative">
      <button type="button" className="rounded-xl border border-line px-3 py-2 text-sm font-bold text-muted hover:border-primary/40">
        <Download className="inline" size={15} /> Download
      </button>
      <div className="pointer-events-none absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-line bg-white p-3 opacity-0 shadow-lg transition group-hover/menu:pointer-events-auto group-hover/menu:opacity-100 group-focus-within/menu:pointer-events-auto group-focus-within/menu:opacity-100">
        <p className="text-sm font-bold text-ink">Pilih aktivitas & format</p>
        <div className="mt-3 space-y-3">
          {availableSections.map(([section, label]) => (
            <div key={section}>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {EXPORT_FORMATS.map(([format, formatLabel]) => (
                  <a
                    key={`${section}-${format}`}
                    href={exportActivityUrl(documentId, section, format)}
                    className="rounded-lg bg-soft px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-indigo-100"
                  >
                    {formatLabel}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
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
    summary.analysis && { type: "analysis", label: "Analisis tersedia" },
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
  return fileName.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i, "").replace(/^[0-9a-f-]{36}-/i, "");
}

function formatRelativeDate(value) {
  if (!value) return "Baru saja";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Baru saja";
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays <= 0) return "Baru saja";
  if (diffDays === 1) return "1 hari lalu";
  if (diffDays < 7) return `${diffDays} hari lalu`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
  return `${Math.floor(diffDays / 30)} bulan lalu`;
}
