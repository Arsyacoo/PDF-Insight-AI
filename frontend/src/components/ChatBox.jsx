import { SendHorizonal } from "lucide-react";
import SourceReference from "./SourceReference.jsx";

export default function ChatBox({ messages, value, onChange, onSubmit, loading }) {
  return (
    <section className="rounded-lg border border-line bg-white shadow-sm">
      <div className="max-h-[58vh] min-h-96 space-y-5 overflow-y-auto p-4 sm:p-5">
        {messages.length === 0 && (
          <div className="rounded-lg bg-soft p-5 text-center text-muted">
            Ajukan pertanyaan tentang PDF. Jawaban akan dibatasi pada konteks dokumen.
          </div>
        )}
        {messages.map((message, index) => (
          <div key={index} className="space-y-3">
            <div className="ml-auto max-w-2xl rounded-lg bg-primary p-4 text-white">{message.question}</div>
            <div className="max-w-3xl rounded-lg bg-soft p-4 text-ink">
              <p className="whitespace-pre-line leading-7">{message.answer}</p>
              {message.sources?.length > 0 && (
                <div className="mt-4 space-y-2">
                  {message.sources.map((source, sourceIndex) => (
                    <SourceReference key={sourceIndex} source={source} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {loading && <div className="border-t border-line px-4 py-2 text-sm font-semibold text-primary">PDF Insight AI sedang menyusun jawaban...</div>}
      <form onSubmit={onSubmit} className="flex flex-col gap-3 border-t border-line p-4 sm:flex-row">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-line bg-white px-4 py-3 outline-none focus:border-primary"
          placeholder="Tanyakan isi PDF..."
        />
        <button disabled={loading} className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-white disabled:opacity-60">
          <SendHorizonal size={18} /> Kirim
        </button>
      </form>
    </section>
  );
}
