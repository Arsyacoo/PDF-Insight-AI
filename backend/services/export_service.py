from pathlib import Path

from services.storage_service import get_chat_history, get_document

EXPORT_DIR = Path(__file__).resolve().parents[1] / "exports"


def export_summary(document_id: str) -> Path:
    document = get_document(document_id)
    if not document:
        raise KeyError("Dokumen tidak ditemukan.")
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    path = EXPORT_DIR / f"{document_id}-summary.txt"
    path.write_text(document.get("summary") or "Ringkasan belum tersedia.", encoding="utf-8")
    return path


def export_chat(document_id: str) -> Path:
    document = get_document(document_id)
    if not document:
        raise KeyError("Dokumen tidak ditemukan.")
    history = get_chat_history(document_id)
    content = [f"Chat PDF Insight AI - {document.get('file_name', document_id)}"]
    for item in history:
        content.append(f"\nQ: {item['question']}\nA: {item['answer']}")
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    path = EXPORT_DIR / f"{document_id}-chat.txt"
    path.write_text("\n".join(content), encoding="utf-8")
    return path
