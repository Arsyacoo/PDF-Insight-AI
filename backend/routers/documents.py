from pathlib import Path
from urllib.parse import quote

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from services.pdf_service import extract_pdf_text
from services.quality_service import assess_document_quality
from services.storage_service import delete_document_record, get_chat_history, get_document, list_documents, search_documents, update_document
from services.vector_service import VectorService

router = APIRouter(tags=["Documents"])
UPLOAD_ROOT = Path(__file__).resolve().parents[1] / "uploads"
EXPORT_ROOT = Path(__file__).resolve().parents[1] / "exports"

class RenameDocumentRequest(BaseModel):
    display_name: str


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




@router.patch("/documents/{document_id}")
def rename_document(document_id: str, request: RenameDocumentRequest):
    display_name = " ".join(request.display_name.split())
    if not display_name:
        raise HTTPException(status_code=400, detail="Nama dokumen tidak boleh kosong.")
    if len(display_name) > 120:
        raise HTTPException(status_code=400, detail="Nama dokumen maksimal 120 karakter.")

    try:
        document = update_document(document_id, {"display_name": display_name})
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return {"message": "Nama dokumen berhasil diperbarui.", "document": document}

@router.delete("/documents/{document_id}")
def delete_document(document_id: str):
    try:
        document = delete_document_record(document_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    _delete_uploaded_file(document)
    _delete_export_files(document_id)
    VectorService().delete_document_chunks(document_id)
    return {"message": "Dokumen berhasil dihapus.", "document_id": document_id}

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

def _delete_uploaded_file(document: dict) -> None:
    file_path = Path(document.get("file_path", ""))
    try:
        resolved = file_path.resolve()
        if UPLOAD_ROOT.resolve() in resolved.parents and resolved.exists():
            resolved.unlink()
    except OSError:
        pass

def _delete_export_files(document_id: str) -> None:
    if not EXPORT_ROOT.exists():
        return
    for path in EXPORT_ROOT.glob(f"{document_id}-*"):
        try:
            if path.is_file():
                path.unlink()
        except OSError:
            pass
