import { BrainCircuit, Layers3, ListChecks } from "lucide-react";
import { useEffect, useState } from "react";
import { generateFlashcards, generateQuiz, getDocument, getDocuments } from "../api/api.js";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import FlashcardGrid from "../components/FlashcardGrid.jsx";
import LoadingState from "../components/LoadingState.jsx";
import QuizCard from "../components/QuizCard.jsx";

export default function LearningPage() {
  const [documents, setDocuments] = useState([]);
  const [selected, setSelected] = useState("");
  const [quiz, setQuiz] = useState(null);
  const [flashcards, setFlashcards] = useState(null);
  const [loading, setLoading] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getDocuments()
      .then((docs) => {
        setDocuments(docs);
        const active = docs[0]?.document_id || "";
        setSelected(active);
        if (active) hydrate(active);
      })
      .catch(() => setError("Tidak dapat memuat dokumen."));
  }, []);

  async function hydrate(id) {
    if (!id) return;
    const doc = await getDocument(id);
    setFlashcards(doc.flashcards || null);
  }

  async function handleSelect(id) {
    setSelected(id);
    setQuiz(null);
    setSuccess("");
    setError("");
    await hydrate(id);
  }

  async function runQuiz() {
    setLoading("quiz");
    setError("");
    setSuccess("");
    setQuiz(null);
    try {
      setQuiz(await generateQuiz(selected, 5));
      setSuccess("Quiz berhasil dibuat dari PDF.");
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal membuat quiz.");
    } finally {
      setLoading("");
    }
  }

  async function runFlashcards() {
    setLoading("flashcards");
    setError("");
    setSuccess("");
    try {
      setFlashcards(await generateFlashcards(selected, 8));
      setSuccess("Flashcards berhasil dibuat dari PDF.");
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal membuat flashcards.");
    } finally {
      setLoading("");
    }
  }

  if (!documents.length && !error) {
    return <div className="mx-auto max-w-5xl px-5 py-8"><EmptyState title="Belum ada PDF" description="Upload PDF dulu untuk membuat quiz dan flashcards." /></div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-5 py-8">
      <section className="rounded-lg bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-primary">
              <BrainCircuit size={20} />
              <span className="text-sm font-bold">Learning Tools</span>
            </div>
            <h1 className="text-2xl font-extrabold">Quiz & Flashcards</h1>
            <p className="mt-1 text-muted">Buat bahan belajar otomatis dari PDF yang sudah diunggah.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select value={selected} onChange={(event) => handleSelect(event.target.value)} className="rounded-lg border border-line px-3 py-2">
              {documents.map((doc) => <option key={doc.document_id} value={doc.document_id}>{doc.file_name}</option>)}
            </select>
            <button onClick={runQuiz} disabled={!selected || loading} className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white disabled:opacity-60">
              <ListChecks size={18} /> Buat Soal AI
            </button>
            <button onClick={runFlashcards} disabled={!selected || loading} className="flex items-center justify-center gap-2 rounded-lg border border-line bg-soft px-4 py-2 font-semibold text-primary disabled:opacity-60">
              <Layers3 size={18} /> Flashcards
            </button>
          </div>
        </div>
      </section>
      {success && <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-semibold text-success">{success}</div>}
      <ErrorState message={error} />
      {loading && <LoadingState label={loading === "quiz" ? "Membuat quiz..." : "Membuat flashcards..."} />}
      {quiz?.quiz?.length > 0 && <QuizCard quiz={quiz.quiz} />}
      {flashcards?.flashcards?.length > 0 && <FlashcardGrid cards={flashcards.flashcards} />}
    </div>
  );
}
