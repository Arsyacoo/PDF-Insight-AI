import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { chatWithPdf, getDocument, getDocuments } from "../api/api.js";
import ChatBox from "../components/ChatBox.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import PdfPreview from "../components/PdfPreview.jsx";

export default function ChatPage() {
  const { documentId } = useParams();
  const [documents, setDocuments] = useState([]);
  const [selected, setSelected] = useState(documentId || "");
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState(1);
  const [activeSource, setActiveSource] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [mobileTab, setMobileTab] = useState("chat");
  const location = useLocation();

  useEffect(() => {
    getDocuments().then((docs) => {
      setDocuments(docs);
      const active = documentId || docs[0]?.document_id || "";
      setSelected(active);
      if (active) {
        getDocument(active).then((doc) => {
          setSelectedDocument(doc);
          setMessages(doc.chat_history || []);
        });
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
    setActivePage(1);
    setActiveSource(null);
    const doc = await getDocument(id);
    setSelectedDocument(doc);
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
      setMessages((items) => [
        ...items,
        {
          question: asked,
          answer: response.answer,
          sources: response.sources,
          retrieval_details: response.retrieval_details,
        },
      ]);
    } catch (err) {
      setError(err.response?.data?.detail || "Chat gagal.");
    } finally {
      setLoading(false);
    }
  }

  function handleSourceClick(source) {
    setActiveSource(source);
    if (source.page_number) setActivePage(source.page_number);
    setMobileTab("preview");
  }

  if (!documents.length && !error) return <div className="mx-auto max-w-5xl px-5 py-8"><EmptyState /></div>;

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-5 py-8">
      <div className="flex flex-col gap-3 rounded-lg bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Chat with PDF</h1>
          <p className="text-muted">Klik source reference untuk membuka halaman PDF terkait.</p>
        </div>
        <select value={selected} onChange={(e) => handleSelect(e.target.value)} className="rounded-lg border border-line px-3 py-2">
          {documents.map((doc) => <option key={doc.document_id} value={doc.document_id}>{doc.file_name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-soft p-1 lg:hidden">
        <button onClick={() => setMobileTab("chat")} className={`rounded-lg px-3 py-2 text-sm font-bold ${mobileTab === "chat" ? "bg-white text-primary shadow-sm" : "text-muted"}`}>Chat</button>
        <button onClick={() => setMobileTab("preview")} className={`rounded-lg px-3 py-2 text-sm font-bold ${mobileTab === "preview" ? "bg-white text-primary shadow-sm" : "text-muted"}`}>PDF Preview</button>
      </div>
      <ErrorState message={error} />
      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <PdfPreview documentId={selected} page={activePage} totalPages={selectedDocument?.total_pages} visible={mobileTab === "preview"} onPageChange={setActivePage} />
        <div className={mobileTab === "chat" ? "block" : "hidden lg:block"}>
          <ChatBox
            messages={messages}
            value={question}
            onChange={setQuestion}
            onSubmit={handleSubmit}
            loading={loading}
            onSourceClick={handleSourceClick}
            activeSource={activeSource}
          />
        </div>
      </div>
    </div>
  );
}


