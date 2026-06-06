from pathlib import Path
from urllib.parse import quote

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from services.pdf_service import extract_pdf_text
from services.quality_service import assess_document_quality
from services.storage_service import get_chat_history, get_document, list_documents, search_documents, update_document

router = APIRouter(tags=["Documents"])
UPLOAD_ROOT = Path(__file__).resolve().parents[1] / "uploads"


@router.get("/documents")
def documents(q: str = ""):
    return {"documents": search_documents(q) if q else list_documents()}


@router.get("/documents/{document_id}")
def document_detail(document_id: str):
    document = get_document(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan.")
    document = _ensure_quality(document_id, document)
    return {**document, "chat_history": get_chat_history(document_id)}


@router.get("/documents/{document_id}/file")
def document_file(document_id: str):
    document = get_document(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan.")

    file_path = Path(document.get("file_path", "")).resolve()
    upload_root = UPLOAD_ROOT.resolve()
    if upload_root not in file_path.parents:
        raise HTTPException(status_code=403, detail="Akses file dokumen tidak diizinkan.")
    if not file_path.exists() or file_path.suffix.lower() != ".pdf":
        raise HTTPException(status_code=404, detail="File PDF tidak ditemukan di server.")

    file_name = document.get("file_name", file_path.name)
    return FileResponse(
        file_path,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"inline; filename*=UTF-8''{quote(file_name)}",
            "X-Content-Type-Options": "nosniff",
        },
    )


def _ensure_quality(document_id: str, document: dict) -> dict:
    if document.get("quality"):
        return document
    file_path = Path(document.get("file_path", ""))
    if not file_path.exists():
        return document
    try:
        quality = assess_document_quality(extract_pdf_text(file_path))
    except ValueError:
        return document
    return update_document(document_id, {"quality": quality})
