from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.groq_service import ask_groq
from services.storage_service import add_chat, get_document
from services.vector_service import VectorService

router = APIRouter(tags=["Chat"])


class ChatRequest(BaseModel):
    document_id: str
    question: str


@router.post("/chat")
def chat(request: ChatRequest):
    document = get_document(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan.")
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Pertanyaan tidak boleh kosong.")

    chunks = VectorService().search(request.document_id, request.question, top_k=5)
    context = "\n\n".join(
        f"[Halaman {chunk.get('page_number')}] {chunk['text']}" for chunk in chunks
    )
    answer = ask_groq(request.question, context, task="chat")
    sources = [
        {
            "page_number": chunk.get("page_number"),
            "snippet": chunk["text"][:260],
        }
        for chunk in chunks[:3]
    ]
    add_chat(request.document_id, request.question, answer, sources)
    return {"answer": answer, "sources": sources}
