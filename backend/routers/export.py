from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse

from services.export_service import export_chat, export_document_activity, export_summary

router = APIRouter(tags=["Export"])

@router.get("/export-summary/{document_id}")
def download_summary(document_id: str):
    try:
        path = export_summary(document_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return FileResponse(path, media_type="text/plain", filename=path.name)

@router.get("/export-chat/{document_id}")
def download_chat(document_id: str):
    try:
        path = export_chat(document_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return FileResponse(path, media_type="text/plain", filename=path.name)

@router.get("/export-document/{document_id}")
def download_document_activity(
    document_id: str,
    section: str = Query(default="all", pattern="^(all|summary|chat|quiz|flashcards)$"),
    format: str = Query(default="txt", pattern="^(txt|pdf|docx)$"),
):
    try:
        path, media_type = export_document_activity(document_id, section=section, file_format=format)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return FileResponse(path, media_type=media_type, filename=path.name)
