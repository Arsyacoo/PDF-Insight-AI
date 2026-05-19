from typing import Any


def chunk_pages(
    pages: list[dict[str, Any]],
    document_id: str,
    file_name: str,
    chunk_size: int = 900,
    overlap: int = 150,
) -> list[dict[str, Any]]:
    chunks: list[dict[str, Any]] = []

    for page in pages:
        text = " ".join(page["text"].split())
        start = 0
        while start < len(text):
            chunk_text = text[start : start + chunk_size].strip()
            if chunk_text:
                chunks.append(
                    {
                        "chunk_id": f"{document_id}-{len(chunks) + 1}",
                        "text": chunk_text,
                        "page_number": page.get("page_number"),
                        "document_id": document_id,
                        "file_name": file_name,
                    }
                )
            start += max(chunk_size - overlap, 1)

    return chunks
