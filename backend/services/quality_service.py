from __future__ import annotations

from typing import Any


def assess_document_quality(extracted: dict[str, Any]) -> dict[str, Any]:
    total_pages = int(extracted.get("total_pages") or 0)
    pages = extracted.get("pages") or []
    readable_pages = len([page for page in pages if page.get("text", "").strip()])
    empty_pages = max(total_pages - readable_pages, 0)
    character_counts = [len(page.get("text", "")) for page in pages]
    average_characters_per_page = round(sum(character_counts) / max(total_pages, 1), 1)
    scan_probability = round(empty_pages / max(total_pages, 1), 2) if total_pages else 1.0

    if scan_probability >= 0.6 or average_characters_per_page < 80:
        label = "Poor"
        recommendation = "Dokumen kemungkinan hasil scan atau teksnya sangat sedikit. Gunakan OCR agar hasil AI lebih akurat."
    elif scan_probability >= 0.25 or average_characters_per_page < 250:
        label = "Fair"
        recommendation = "Sebagian halaman memiliki teks terbatas. Hasil masih bisa digunakan, tetapi mungkin kurang lengkap."
    else:
        label = "Good"
        recommendation = "Kualitas teks dokumen baik untuk ringkasan, chat, quiz, dan flashcards."

    return {
        "quality_label": label,
        "scan_probability": scan_probability,
        "scan_probability_label": _scan_probability_label(scan_probability),
        "readable_pages": readable_pages,
        "empty_pages": empty_pages,
        "average_characters_per_page": average_characters_per_page,
        "recommendation": recommendation,
    }


def _scan_probability_label(scan_probability: float) -> str:
    if scan_probability >= 0.6:
        return "High"
    if scan_probability >= 0.25:
        return "Medium"
    return "Low"
