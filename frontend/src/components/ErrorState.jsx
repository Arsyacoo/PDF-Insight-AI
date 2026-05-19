import { AlertCircle } from "lucide-react";

export default function ErrorState({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-danger">
      <div className="flex items-center gap-2">
        <AlertCircle size={18} /> {message}
      </div>
    </div>
  );
}
