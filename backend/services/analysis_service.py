import re
from collections import Counter
from pathlib import Path
from typing import Any

from services.groq_service import ask_groq, clean_ai_text
from services.pdf_service import extract_pdf_text
from services.storage_service import get_document, update_document


def analyze_document(document_id: str) -> dict[str, Any]:
    document = get_document(document_id)
    if not document:
        raise KeyError("Dokumen tidak ditemukan.")

    extracted = _load_document_text(document)
    pages = extracted["pages"]
    full_text = extracted["text"]
    context = _build_context(pages, max_chars=9000)
    prompt = (
        "Analisis dokumen berikut dalam bahasa Indonesia. Gunakan format persis:\n"
        "RINGKASAN:\n"
        "2-4 kalimat yang padat dan spesifik.\n\n"
        "POIN PENTING:\n"
        "- 5 poin utama yang paling informatif.\n\n"
        "PERTANYAAN LANJUTAN:\n"
        "- 5 pertanyaan yang relevan untuk memahami dokumen."
    )
    raw = clean_ai_text(ask_groq(prompt, context, task="analysis")) if context else ""

    keywords_with_counts = _keywords(full_text, limit=12)
    page_stats = _page_stats(pages)
    total_words = sum(item["word_count"] for item in page_stats)
    metrics = {
        "total_pages": document.get("total_pages", extracted.get("total_pages", 0)),
        "pages_with_text": len(pages),
        "total_words": total_words,
        "total_characters": len(full_text),
        "average_words_per_page": round(total_words / max(len(page_stats), 1), 1),
        "longest_page": max(page_stats, key=lambda item: item["word_count"], default={}).get("page_number"),
        "shortest_page": min(page_stats, key=lambda item: item["word_count"], default={}).get("page_number"),
    }

    analysis = {
        "summary": _extract_section(raw, "RINGKASAN") or _fallback_summary(full_text),
        "key_points": _extract_bullets(raw, "POIN PENTING") or _fallback_key_points(pages),
        "keywords": [item["keyword"] for item in keywords_with_counts[:8]],
        "keyword_details": keywords_with_counts,
        "suggested_questions": _extract_bullets(raw, "PERTANYAAN LANJUTAN") or _fallback_questions(keywords_with_counts),
        "metrics": metrics,
        "page_stats": page_stats,
    }
    update_document(document_id, {"analysis": analysis, "summary": analysis["summary"]})
    return analysis


def _load_document_text(document: dict[str, Any]) -> dict[str, Any]:
    file_path = document.get("file_path")
    if file_path and Path(file_path).exists():
        return extract_pdf_text(Path(file_path))

    preview = document.get("text_preview", "")
    return {
        "total_pages": document.get("total_pages", 0),
        "pages": [{"page_number": 1, "text": preview}] if preview else [],
        "text": preview,
    }


def _build_context(pages: list[dict[str, Any]], max_chars: int) -> str:
    selected: list[str] = []
    for page in pages:
        page_text = " ".join(page.get("text", "").split())
        if page_text:
            selected.append(f"[Halaman {page.get('page_number')}]\n{page_text}")
        if sum(len(item) for item in selected) >= max_chars:
            break
    return "\n\n".join(selected)[:max_chars]


def _extract_section(text: str, title: str) -> str:
    pattern = rf"{title}\s*:?\s*(.*?)(?=\n[A-ZÀ-Ÿ\s]+:|\Z)"
    match = re.search(pattern, text, flags=re.IGNORECASE | re.DOTALL)
    if not match:
        return ""
    return "\n".join(line.strip(" -") for line in match.group(1).splitlines() if line.strip())


def _extract_bullets(text: str, title: str) -> list[str]:
    section = _extract_section(text, title)
    lines = []
    for line in section.splitlines():
        clean = re.sub(r"^\s*[-*•]?\s*\d*[\).:-]?\s*", "", line).strip()
        if len(clean) > 8 and clean.upper() != title:
            lines.append(clean)
    return lines[:5]


def _fallback_summary(text: str) -> str:
    sentences = re.split(r"(?<=[.!?])\s+", " ".join(text.split()))
    selected = [sentence for sentence in sentences if len(sentence.split()) >= 8][:4]
    return " ".join(selected) or "Ringkasan belum dapat dibuat karena teks dokumen terlalu sedikit."


def _fallback_key_points(pages: list[dict[str, Any]]) -> list[str]:
    candidates = []
    for page in pages:
        text = " ".join(page.get("text", "").split())
        sentences = re.split(r"(?<=[.!?])\s+", text)
        for sentence in sentences:
            words = sentence.split()
            if 10 <= len(words) <= 35:
                candidates.append(f"Halaman {page.get('page_number')}: {sentence}")
    return candidates[:5] or ["Poin penting belum dapat diekstrak dari dokumen."]


def _fallback_questions(keywords: list[dict[str, Any]]) -> list[str]:
    topic = keywords[0]["keyword"] if keywords else "dokumen ini"
    return [
        f"Apa inti pembahasan tentang {topic}?",
        "Bagian mana yang paling penting untuk dipahami?",
        "Apa kesimpulan atau rekomendasi utama dokumen?",
        "Istilah kunci apa yang perlu dijelaskan lebih lanjut?",
        "Informasi apa yang perlu ditindaklanjuti?",
    ]


def _page_stats(pages: list[dict[str, Any]]) -> list[dict[str, int]]:
    return [
        {
            "page_number": page.get("page_number", index),
            "word_count": len(_tokens(page.get("text", ""))),
            "character_count": len(page.get("text", "")),
        }
        for index, page in enumerate(pages, start=1)
    ]


def _tokens(text: str) -> list[str]:
    return re.findall(r"[A-Za-zÀ-ÿ0-9]+", text.lower())


def _keywords(text: str, limit: int = 8) -> list[dict[str, Any]]:
    stopwords = {
        "yang", "dan", "dari", "untuk", "dengan", "dalam", "pada", "atau", "ini", "itu", "the", "and",
        "sebagai", "digunakan", "adalah", "yaitu", "serta", "karena", "dapat", "akan", "oleh", "lebih",
        "secara", "suatu", "tersebut", "menjadi", "hasil", "nilai", "antara", "salah", "satu", "paling",
        "menunjukkan", "berdasarkan", "melalui", "terhadap", "memiliki", "menggunakan", "tidak", "telah",
        "sebuah", "bagi", "para", "bisa", "ada", "artikel", "paper", "halaman",
    }
    counts = Counter(token for token in _tokens(text) if len(token) > 3 and token not in stopwords)
    return [{"keyword": word, "count": count} for word, count in counts.most_common(limit)]
