from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from services.export_service import export_chat, export_summary

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
