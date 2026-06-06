import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.groq_service import ask_groq
from services.storage_service import add_chat, get_document
from services.vector_service import VectorService

router = APIRouter(tags=["Chat"])
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
    relevant_chunks = [chunk for chunk in chunks if chunk.get("text", "").strip()]
    if not relevant_chunks:
        retrieval_details = _retrieval_details([], [])
        add_chat(request.document_id, request.question, NOT_FOUND_ANSWER, [], retrieval_details)
        return {"answer": NOT_FOUND_ANSWER, "sources": [], "retrieval_details": retrieval_details}

    scored_chunks = _attach_relevance_scores(relevant_chunks)
    chunks_used = scored_chunks[:3]
    context = "\n\n".join(
        f"[Halaman {chunk.get('page_number')}] {chunk['text']}" for chunk in chunks_used
    )
    answer = ask_groq(request.question, context, task="chat")
    sources = [_source_reference(chunk) for chunk in chunks_used]
    retrieval_details = _retrieval_details(scored_chunks, sources)
    add_chat(request.document_id, request.question, answer, sources, retrieval_details)
    return {"answer": answer, "sources": sources, "retrieval_details": retrieval_details}


def _source_reference(chunk: dict) -> dict:
    relevance_score = chunk.get("relevance_score", 0.0)
    return {
        "page_number": chunk.get("page_number"),
        "snippet": chunk.get("text", "")[:300],
        "score": relevance_score,
        "confidence_label": _confidence_label(relevance_score),
    }


def _retrieval_details(retrieved_chunks: list[dict], sources: list[dict]) -> dict:
    return {
        "total_chunks_retrieved": len(retrieved_chunks),
        "chunks_used_for_answer": len(sources),
        "model": os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
        "retrieval_method": "vector similarity search",
        "sources": sources,
    }


def _attach_relevance_scores(chunks: list[dict]) -> list[dict]:
    if not chunks:
        return []
    score_type = chunks[0].get("score_type")
    raw_scores = [_safe_float(chunk.get("score")) for chunk in chunks]
    valid_scores = [score for score in raw_scores if score is not None]
    if not valid_scores:
        return [{**chunk, "relevance_score": 0.0} for chunk in chunks]

    minimum = min(valid_scores)
    maximum = max(valid_scores)
    spread = maximum - minimum
    normalized = []
    for chunk, raw_score in zip(chunks, raw_scores):
        if raw_score is None:
            relevance = 0.0
        elif spread == 0:
            relevance = _single_relevance_score(raw_score, score_type)
        elif score_type == "distance":
            relevance = 1 - ((raw_score - minimum) / spread)
        else:
            relevance = (raw_score - minimum) / spread
        normalized.append({**chunk, "relevance_score": round(max(0.0, min(relevance, 1.0)), 2)})
    return normalized


def _single_relevance_score(raw_score: float, score_type: str | None) -> float:
    if score_type == "distance":
        return 1 / (1 + max(raw_score, 0.0))
    return max(0.0, min(raw_score, 1.0))


def _safe_float(value) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _confidence_label(score: float) -> str:
    if score >= 0.8:
        return "High"
    if score >= 0.6:
        return "Medium"
    return "Low"
