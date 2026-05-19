from typing import Any

from services.groq_service import ask_groq, clean_ai_text
from services.storage_service import get_document, update_document
from services.vector_service import VectorService


def analyze_document(document_id: str) -> dict[str, Any]:
    document = get_document(document_id)
    if not document:
        raise KeyError("Dokumen tidak ditemukan.")

    vector_service = VectorService()
    chunks = vector_service.search(document_id, "ringkasan poin penting kata kunci pertanyaan", top_k=5)
    context = "\n\n".join(chunk["text"] for chunk in chunks) or document.get("text_preview", "")
    prompt = (
        "Buat analisis dokumen dalam bahasa Indonesia dengan format jelas:\n"
        "Ringkasan singkat, 5 poin penting, 8 kata kunci, dan 5 pertanyaan yang disarankan."
    )
    raw = clean_ai_text(ask_groq(prompt, context, task="analysis"))

    analysis = {
        "summary": raw,
        "key_points": _extract_lines(raw, default="Poin penting tersedia di ringkasan."),
        "keywords": _keywords(context),
        "suggested_questions": [
            "Apa inti utama dokumen ini?",
            "Bagian mana yang paling penting untuk dipahami?",
            "Apa rekomendasi atau kesimpulan dokumen?",
            "Apa istilah kunci yang sering muncul?",
            "Informasi apa yang perlu ditindaklanjuti?",
        ],
    }
    update_document(document_id, {"analysis": analysis, "summary": analysis["summary"]})
    return analysis


def _extract_lines(text: str, default: str) -> list[str]:
    lines = [line.strip(" -0123456789.") for line in text.splitlines() if len(line.strip()) > 8]
    return (lines[:5] or [default])


def _keywords(text: str) -> list[str]:
    stopwords = {
        "yang", "dan", "dari", "untuk", "dengan", "dalam", "pada", "atau", "ini", "itu", "the", "and",
        "sebagai", "digunakan", "adalah", "yaitu", "serta", "karena", "dapat", "akan", "oleh", "lebih",
        "secara", "suatu", "tersebut", "menjadi", "hasil", "nilai", "antara", "salah", "satu", "paling",
        "menunjukkan", "berdasarkan", "melalui", "terhadap", "memiliki", "menggunakan",
    }
    counts: dict[str, int] = {}
    for token in "".join(char.lower() if char.isalnum() else " " for char in text).split():
        if len(token) > 4 and token not in stopwords:
            counts[token] = counts.get(token, 0) + 1
    return [word for word, _ in sorted(counts.items(), key=lambda item: item[1], reverse=True)[:8]]
