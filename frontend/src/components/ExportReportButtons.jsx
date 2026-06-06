import { useState } from "react";
import { Download } from "lucide-react";
import { exportReportUrl } from "../api/api.js";

const labels = {
  pdf: "Full Report PDF",
  docx: "Full Report DOCX",
};

export default function ExportReportButtons({ documentId }) {
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  if (!documentId) return null;

  async function download(format) {
    setLoading(format);
    setError("");
    try {
      const response = await fetch(exportReportUrl(documentId, format));
      if (!response.ok) throw new Error("Export gagal dibuat.");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${documentId}-full-report.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Export report gagal.");
    } finally {
      setLoading("");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {Object.entries(labels).map(([format, label]) => (
        <button
          key={format}
          type="button"
          onClick={() => download(format)}
          disabled={!!loading}
          className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-muted disabled:opacity-60"
        >
          <Download className="inline" size={15} /> {loading === format ? "Exporting..." : label}
        </button>
      ))}
      {error && <span className="text-xs font-semibold text-red-600">{error}</span>}
    </div>
  );
}
