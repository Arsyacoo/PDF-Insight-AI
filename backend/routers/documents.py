from fastapi import APIRouter, HTTPException

from services.storage_service import get_chat_history, get_document, list_documents, search_documents

router = APIRouter(tags=["Documents"])


@router.get("/documents")
def documents(q: str = ""):
    return {"documents": search_documents(q) if q else list_documents()}


@router.get("/documents/{document_id}")
def document_detail(document_id: str):
    document = get_document(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan.")
    return {**document, "chat_history": get_chat_history(document_id)}
