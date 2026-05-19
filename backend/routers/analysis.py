from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.analysis_service import analyze_document

router = APIRouter(tags=["Analysis"])


class AnalyzeRequest(BaseModel):
    document_id: str


@router.post("/analyze")
def analyze(request: AnalyzeRequest):
    try:
        return analyze_document(request.document_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
