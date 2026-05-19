import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from services.chunk_service import chunk_pages
from services.pdf_service import extract_pdf_text
from services.storage_service import save_document
from services.vector_service import VectorService

router = APIRouter(tags=["Upload"])
UPLOAD_DIR = Path(__file__).resolve().parents[1] / "uploads"


@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf" and not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File harus berformat PDF.")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    document_id = str(uuid.uuid4())
    safe_name = Path(file.filename).name
    file_path = UPLOAD_DIR / f"{document_id}-{safe_name}"

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        extracted = extract_pdf_text(file_path)
        chunks = chunk_pages(extracted["pages"], document_id, safe_name)
        VectorService().add_chunks(chunks)
    except ValueError as exc:
        file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    document = {
        "document_id": document_id,
        "file_name": safe_name,
        "file_path": str(file_path),
        "total_pages": extracted["total_pages"],
        "text_preview": extracted["preview"],
        "chunk_count": len(chunks),
    }
    save_document(document)
    return {
        "document_id": document_id,
        "file_name": safe_name,
        "total_pages": extracted["total_pages"],
        "text_preview": extracted["preview"],
        "message": "PDF berhasil diunggah dan diproses.",
    }
