import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { chatWithPdf, getDocument, getDocuments } from "../api/api.js";
import ChatBox from "../components/ChatBox.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";

export default function ChatPage() {
  const { documentId } = useParams();
  const [documents, setDocuments] = useState([]);
  const [selected, setSelected] = useState(documentId || "");
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const location = useLocation();

  useEffect(() => {
    getDocuments().then((docs) => {
      setDocuments(docs);
      const active = documentId || docs[0]?.document_id || "";
      setSelected(active);
      if (active) {
        getDocument(active).then((doc) => setMessages(doc.chat_history || []));
      }
    }).catch(() => setError("Tidak dapat memuat dokumen."));
  }, [documentId]);

  useEffect(() => {
    if (location.state?.question) {
      setQuestion(location.state.question);
    }
  }, [location.state]);

  async function handleSelect(id) {
    setSelected(id);
    const doc = await getDocument(id);
    setMessages(doc.chat_history || []);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selected || !question.trim()) return;
    const asked = question.trim();
    setQuestion("");
    setLoading(true);
    setError("");
    try {
      const response = await chatWithPdf(selected, asked);
      setMessages((items) => [...items, { question: asked, answer: response.answer, sources: response.sources }]);
    } catch (err) {
      setError(err.response?.data?.detail || "Chat gagal.");
    } finally {
      setLoading(false);
    }
  }

  if (!documents.length && !error) return <div className="mx-auto max-w-5xl px-5 py-8"><EmptyState /></div>;

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-5 py-8">
      <div className="flex flex-col gap-3 rounded-lg bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Chat with PDF</h1>
          <p className="text-muted">Jawaban dibuat dari chunk dokumen paling relevan dan menyertakan source reference.</p>
        </div>
        <select value={selected} onChange={(e) => handleSelect(e.target.value)} className="rounded-lg border border-line px-3 py-2">
          {documents.map((doc) => <option key={doc.document_id} value={doc.document_id}>{doc.file_name}</option>)}
        </select>
      </div>
      <ErrorState message={error} />
      <ChatBox messages={messages} value={question} onChange={setQuestion} onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
