import logging
import os
from pathlib import Path
from typing import Any

import pdfplumber

logger = logging.getLogger(__name__)
MIN_DIGITAL_TEXT_LENGTH = 100

def _debug_logging_enabled() -> bool:
    return os.getenv("DEBUG", "false").strip().lower() in {"1", "true", "yes", "on"}

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
        safe_name = Path(file_path).name
        logger.warning(
            "operation=pdf_text_extraction category=corrupted_pdf filename=%s exception_class=%s",
            safe_name,
            exc.__class__.__name__,
        )
        if _debug_logging_enabled():
            logger.debug(
                "PDF parser debug details. filename=%s exception_class=%s",
                safe_name,
                exc.__class__.__name__,
                exc_info=True,
            )
        raise ValueError("File PDF rusak atau tidak dapat dibaca.") from exc

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
