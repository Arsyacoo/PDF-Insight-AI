import uuid
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from services.chunk_service import chunk_pages
from services.pdf_service import extract_pdf_text
from services.quality_service import assess_document_quality
from services.storage_service import save_document
from services.vector_service import VectorService

router = APIRouter(tags=["Upload"])
UPLOAD_DIR = Path(__file__).resolve().parents[1] / "uploads"
MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024
PDF_MAGIC_HEADER = b"%PDF-"


@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    safe_name = Path(file.filename or "").name
    if not safe_name:
        raise HTTPException(status_code=400, detail="Nama file tidak boleh kosong.")
    if Path(safe_name).suffix.lower() != ".pdf":
        raise HTTPException(status_code=400, detail="File harus memiliki ekstensi .pdf.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="File PDF tidak boleh kosong.")
    if len(content) > MAX_PDF_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="Ukuran file PDF maksimal 10 MB.")
    if not content.startswith(PDF_MAGIC_HEADER):
        raise HTTPException(status_code=400, detail="File tidak valid. Header PDF harus diawali dengan %PDF-.")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    document_id = str(uuid.uuid4())
    file_path = UPLOAD_DIR / f"{document_id}-{safe_name}"
    file_path.write_bytes(content)

    try:
        extracted = extract_pdf_text(file_path)
        quality = assess_document_quality(extracted)
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
        "quality": quality,
    }
    save_document(document)
    return {
        "document_id": document_id,
        "file_name": safe_name,
        "total_pages": extracted["total_pages"],
        "text_preview": extracted["preview"],
        "message": "PDF berhasil diunggah dan diproses.",
        "quality": quality,
    }
