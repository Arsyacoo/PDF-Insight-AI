import json
from datetime import datetime
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
DOCUMENTS_FILE = DATA_DIR / "documents.json"
CHATS_FILE = DATA_DIR / "chats.json"


def _read_json(path: Path, default: Any) -> Any:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return default


def _write_json(path: Path, data: Any) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


def list_documents() -> list[dict[str, Any]]:
    documents = _read_json(DOCUMENTS_FILE, {})
    return sorted(documents.values(), key=lambda item: item.get("upload_date", ""), reverse=True)


def get_document(document_id: str) -> dict[str, Any] | None:
    return _read_json(DOCUMENTS_FILE, {}).get(document_id)


def save_document(document: dict[str, Any]) -> None:
    documents = _read_json(DOCUMENTS_FILE, {})
    document.setdefault("upload_date", datetime.utcnow().isoformat())
    documents[document["document_id"]] = document
    _write_json(DOCUMENTS_FILE, documents)


def update_document(document_id: str, values: dict[str, Any]) -> dict[str, Any]:
    document = get_document(document_id)
    if not document:
        raise KeyError("Dokumen tidak ditemukan.")
    document.update(values)
    save_document(document)
    return document


def add_chat(document_id: str, question: str, answer: str, sources: list[dict[str, Any]]) -> None:
    chats = _read_json(CHATS_FILE, {})
    chats.setdefault(document_id, []).append(
        {
            "question": question,
            "answer": answer,
            "sources": sources,
            "created_at": datetime.utcnow().isoformat(),
        }
    )
    _write_json(CHATS_FILE, chats)


def get_chat_history(document_id: str) -> list[dict[str, Any]]:
    return _read_json(CHATS_FILE, {}).get(document_id, [])


def search_documents(query: str) -> list[dict[str, Any]]:
    keyword = query.strip().lower()
    if not keyword:
        return list_documents()
    return [
        document
        for document in list_documents()
        if keyword in f"{document.get('file_name', '')} {document.get('text_preview', '')} {document.get('summary', '')}".lower()
    ]
