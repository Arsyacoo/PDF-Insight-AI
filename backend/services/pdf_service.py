from pathlib import Path
from typing import Any

import pdfplumber

MIN_DIGITAL_TEXT_LENGTH = 100

def extract_pdf_text(file_path: Path) -> dict[str, Any]:
    pages: list[dict[str, Any]] = []
    try:
        with pdfplumber.open(file_path) as pdf:
            for index, page in enumerate(pdf.pages, start=1):
                text = page.extract_text() or ""
                if text.strip():
                    pages.append({
                        "page_number": index,
                        "text": text.strip(),
                    })
            total_pages = len(pdf.pages)
    except Exception as exc:
        raise ValueError(f"Teks PDF tidak dapat diekstrak: {exc}") from exc

    combined_text = "\n\n".join(page["text"] for page in pages)
    if len(combined_text.strip()) < MIN_DIGITAL_TEXT_LENGTH:
        raise ValueError(
            "PDF tidak memiliki teks digital yang cukup untuk diproses. "
            "Gunakan PDF berbasis teks, bukan PDF hasil scan/gambar."
        )

    return {
        "total_pages": total_pages,
        "pages": pages,
        "text": combined_text,
        "preview": combined_text[:500],
    }
