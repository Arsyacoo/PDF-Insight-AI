import { FolderOpen } from "lucide-react";

export default function EmptyState({ title = "Belum ada data", description = "Upload PDF untuk memulai analisis." }) {
  return (
    <div className="glass rounded-lg p-8 text-center">
      <FolderOpen className="mx-auto mb-3 text-muted" size={40} />
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  );
}
