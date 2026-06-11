import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export async function uploadPdf(file, onUploadProgress) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
  return data;
}

export const getDocuments = async (q = "") => (await api.get("/documents", { params: q ? { q } : {} })).data.documents;
export const getDocument = async (id) => (await api.get(`/documents/${id}`)).data;
export const deleteDocument = async (id) => (await api.delete(`/documents/${id}`)).data;
export const renameDocument = async (id, display_name) => (await api.patch(`/documents/${id}`, { display_name })).data;
export const analyzeDocument = async (document_id) => (await api.post("/analyze", { document_id })).data;
export const chatWithPdf = async (document_id, question) =>
  (await api.post("/chat", { document_id, question })).data;
export const generateQuiz = async (document_id, total_questions = 5) =>
  (await api.post("/quiz", { document_id, total_questions })).data;
export const generateFlashcards = async (document_id, total_cards = 8) =>
  (await api.post("/flashcards", { document_id, total_cards })).data;
export const compareDocuments = async (first_document_id, second_document_id) =>
  (await api.post("/compare", { first_document_id, second_document_id })).data;

export function exportUrl(type, documentId) {
  return `${API_BASE_URL}/${type === "chat" ? "export-chat" : "export-summary"}/${documentId}`;
}

export function exportActivityUrl(documentId, section = "all", format = "txt") {
  const params = new URLSearchParams({ section, format });
  return `${API_BASE_URL}/export-document/${documentId}?${params.toString()}`;
}


export function documentFileUrl(documentId, page = 1) {
  return `${API_BASE_URL}/documents/${documentId}/file#page=${page || 1}`;
}

export function exportReportUrl(documentId, format = "pdf") {
  return `${API_BASE_URL}/${format === "docx" ? "export-report-docx" : "export-report-pdf"}/${documentId}`;
}
