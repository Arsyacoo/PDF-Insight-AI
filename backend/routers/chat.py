import logging
import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.groq_service import ask_groq
from services.relevance_service import get_min_relevance_score, get_min_relevant_chunks, normalize_retrieval_results
from services.storage_service import add_chat, get_document
from services.vector_service import VectorService

router = APIRouter(tags=["Chat"])
logger = logging.getLogger(__name__)
NOT_FOUND_ANSWER = "Informasi tersebut tidak ditemukan dalam dokumen."


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
    threshold = get_min_relevance_score()
    min_relevant_chunks = get_min_relevant_chunks()
    text_chunks = [chunk for chunk in chunks if chunk.get("text", "").strip()]
    scored_chunks = normalize_retrieval_results(text_chunks, threshold=threshold)
    accepted_chunks = [chunk for chunk in scored_chunks if chunk["passed_threshold"]]

    if len(accepted_chunks) < min_relevant_chunks:
        retrieval_details = _retrieval_details(scored_chunks, [], threshold, min_relevant_chunks)
        add_chat(request.document_id, request.question, NOT_FOUND_ANSWER, [], retrieval_details, response_mode="not_found")
        return {"answer": NOT_FOUND_ANSWER, "sources": [], "response_mode": "not_found", "retrieval_details": retrieval_details}

    chunks_used = accepted_chunks[:3]
    context = "\n\n".join(
        f"[Halaman {chunk.get('page_number')}] {chunk['text']}" for chunk in chunks_used
    )
    sources = [_source_reference(chunk) for chunk in chunks_used]
    retrieval_details = _retrieval_details(scored_chunks, sources, threshold, min_relevant_chunks)
    try:
        answer = ask_groq(request.question, context, task="chat")
    except Exception as exc:
        logger.warning(
            "operation=chat_answer category=groq_failed document_id=%s exception_class=%s",
            request.document_id,
            exc.__class__.__name__,
        )
        if os.getenv("DEBUG", "false").strip().lower() in {"1", "true", "yes", "on"}:
            logger.debug(
                "Chat AI debug details. document_id=%s exception_class=%s",
                request.document_id,
                exc.__class__.__name__,
                exc_info=True,
            )
        answer = "Layanan AI sedang tidak tersedia. Silakan coba kembali."
        add_chat(request.document_id, request.question, answer, [], retrieval_details, response_mode="api_error")
        return {"answer": answer, "sources": [], "response_mode": "api_error", "retrieval_details": retrieval_details}

    response_mode = "offline_fallback" if answer.startswith("Jawaban sementara dari dokumen:") else "llm"
    add_chat(request.document_id, request.question, answer, sources, retrieval_details, response_mode=response_mode)
    return {"answer": answer, "sources": sources, "response_mode": response_mode, "retrieval_details": retrieval_details}


def _source_reference(chunk: dict) -> dict:
    relevance_score = chunk.get("relevance_score", 0.0)
    return {
        "page_number": chunk.get("page_number"),
        "snippet": chunk.get("text", "")[:300],
        "score": relevance_score,
        "raw_score": chunk.get("raw_score"),
        "score_type": chunk.get("score_type"),
        "relevance_label": chunk.get("relevance_label"),
        # Deprecated compatibility field. Prefer relevance_label and relevance_score.
        "confidence_label": chunk.get("relevance_label"),
    }


def _retrieval_details(retrieved_chunks: list[dict], sources: list[dict], threshold: float, min_relevant_chunks: int) -> dict:
    return {
        "total_chunks_retrieved": len(retrieved_chunks),
        "chunks_above_threshold": len([chunk for chunk in retrieved_chunks if chunk.get("passed_threshold")]),
        "chunks_used_for_answer": len(sources),
        "threshold": threshold,
        "min_relevant_chunks": min_relevant_chunks,
        "model": os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
        "retrieval_method": "document-scoped vector search with absolute relevance threshold",
        "results": [_retrieval_result_detail(chunk) for chunk in retrieved_chunks],
        "sources": sources,
    }


def _retrieval_result_detail(chunk: dict) -> dict:
    return {
        "page_number": chunk.get("page_number"),
        "snippet": chunk.get("text", "")[:220],
        "raw_score": chunk.get("raw_score"),
        "score_type": chunk.get("score_type"),
        "relevance_score": chunk.get("relevance_score", 0.0),
        "relevance_label": chunk.get("relevance_label", "Low Relevance"),
        "passed_threshold": bool(chunk.get("passed_threshold")),
    }
