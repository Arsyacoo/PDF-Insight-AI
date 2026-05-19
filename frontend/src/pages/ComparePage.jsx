import { GitCompareArrows } from "lucide-react";
import { useEffect, useState } from "react";
import { compareDocuments, getDocuments } from "../api/api.js";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import LoadingState from "../components/LoadingState.jsx";

export default function ComparePage() {
  const [documents, setDocuments] = useState([]);
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getDocuments()
      .then((docs) => {
        setDocuments(docs);
        setFirst(docs[0]?.document_id || "");
        setSecond(docs[1]?.document_id || "");
      })
      .catch(() => setError("Tidak dapat memuat dokumen."));
  }, []);

  async function runCompare() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      setResult(await compareDocuments(first, second));
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal membandingkan dokumen.");
    } finally {
      setLoading(false);
    }
  }

  if (documents.length < 2 && !error) {
    return <div className="mx-auto max-w-5xl px-5 py-8"><EmptyState title="Butuh dua PDF" description="Upload minimal dua dokumen untuk memakai fitur comparison." /></div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-5 py-8">
      <section className="rounded-lg bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-primary">
              <GitCompareArrows size={20} />
              <span className="text-sm font-bold">Document Comparison</span>
            </div>
            <h1 className="text-2xl font-extrabold">Compare Two PDFs</h1>
            <p className="mt-1 text-muted">Bandingkan persamaan, perbedaan, dan topik unik dari dua dokumen.</p>
          </div>
          <button onClick={runCompare} disabled={!first || !second || loading} className="rounded-lg bg-primary px-4 py-2 font-semibold text-white disabled:opacity-60">
            Compare
          </button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <select value={first} onChange={(event) => setFirst(event.target.value)} className="rounded-lg border border-line px-3 py-3">
            {documents.map((doc) => <option key={doc.document_id} value={doc.document_id}>{doc.file_name}</option>)}
          </select>
          <select value={second} onChange={(event) => setSecond(event.target.value)} className="rounded-lg border border-line px-3 py-3">
            {documents.map((doc) => <option key={doc.document_id} value={doc.document_id}>{doc.file_name}</option>)}
          </select>
        </div>
      </section>
      <ErrorState message={error} />
      {loading && <LoadingState label="Membandingkan dokumen..." />}
      {result && (
        <section className="rounded-lg border border-line bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">{result.first_file_name} vs {result.second_file_name}</h2>
          <p className="mt-4 whitespace-pre-line leading-7 text-muted">{result.summary}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <KeywordPanel title="Persamaan" items={result.similarities} />
            <KeywordPanel title="Unik Dokumen A" items={result.first_unique_keywords} />
            <KeywordPanel title="Unik Dokumen B" items={result.second_unique_keywords} />
          </div>
        </section>
      )}
    </div>
  );
}

function KeywordPanel({ title, items = [] }) {
  return (
    <div className="rounded-lg bg-soft p-4">
      <h3 className="font-bold text-ink">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {(items.length ? items : ["Tidak ada data"]).map((item) => (
          <span key={item} className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-muted">{item}</span>
        ))}
      </div>
    </div>
  );
}
