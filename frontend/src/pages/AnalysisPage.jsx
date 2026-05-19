import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { analyzeDocument, getDocument, getDocuments } from "../api/api.js";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import KeyPointsCard from "../components/KeyPointsCard.jsx";
import KeywordsCard from "../components/KeywordsCard.jsx";
import LoadingState from "../components/LoadingState.jsx";
import SuggestedQuestions from "../components/SuggestedQuestions.jsx";
import SummaryCard from "../components/SummaryCard.jsx";

export default function AnalysisPage() {
  const { documentId } = useParams();
  const [documents, setDocuments] = useState([]);
  const [selected, setSelected] = useState(documentId || "");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getDocuments().then((docs) => {
      setDocuments(docs);
      const active = documentId || docs[0]?.document_id || "";
      setSelected(active);
      if (active) getDocument(active).then((doc) => setAnalysis(doc.analysis || null));
    }).catch(() => setError("Tidak dapat memuat daftar dokumen."));
  }, [documentId]);

  async function runAnalysis(id = selected) {
    if (!id) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      setAnalysis(await analyzeDocument(id));
      setSuccess("Analisis berhasil dibuat. Pertanyaan saran bisa langsung dipakai untuk chat.");
    } catch (err) {
      setError(err.response?.data?.detail || "Analisis gagal.");
    } finally {
      setLoading(false);
    }
  }

  if (!documents.length && !error) return <div className="mx-auto max-w-5xl px-5 py-8"><EmptyState /></div>;

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-5 py-8">
      <div className="flex flex-col gap-3 rounded-lg bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Document Analysis</h1>
          <p className="text-muted">Ringkasan, poin penting, keywords, dan pertanyaan dalam bahasa Indonesia.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select value={selected} onChange={(e) => setSelected(e.target.value)} className="rounded-lg border border-line px-3 py-2">
            {documents.map((doc) => <option key={doc.document_id} value={doc.document_id}>{doc.file_name}</option>)}
          </select>
          <button onClick={() => runAnalysis()} className="rounded-lg bg-primary px-4 py-2 font-semibold text-white">Analyze</button>
        </div>
      </div>
      {success && <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-semibold text-success">{success}</div>}
      <ErrorState message={error} />
      {loading && <LoadingState label="Menganalisis dokumen..." />}
      {analysis && !loading && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="lg:col-span-2"><SummaryCard summary={analysis.summary} /></div>
          <KeyPointsCard points={analysis.key_points} />
          <KeywordsCard keywords={analysis.keywords} />
          <div className="lg:col-span-2">
            <SuggestedQuestions
              questions={analysis.suggested_questions}
              onPick={(question) => navigate(`/chat/${selected}`, { state: { question } })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
