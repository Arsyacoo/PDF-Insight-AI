from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.learning_service import compare_documents, generate_flashcards, generate_quiz

router = APIRouter(tags=["Learning"])


class QuizRequest(BaseModel):
    document_id: str
    total_questions: int = Field(default=5, ge=1, le=10)


class FlashcardRequest(BaseModel):
    document_id: str
    total_cards: int = Field(default=8, ge=1, le=20)


class CompareRequest(BaseModel):
    first_document_id: str
    second_document_id: str


@router.post("/quiz")
def quiz(request: QuizRequest):
    try:
        return generate_quiz(request.document_id, request.total_questions)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/flashcards")
def flashcards(request: FlashcardRequest):
    try:
        return generate_flashcards(request.document_id, request.total_cards)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/compare")
def compare(request: CompareRequest):
    if request.first_document_id == request.second_document_id:
        raise HTTPException(status_code=400, detail="Pilih dua dokumen yang berbeda.")
    try:
        return compare_documents(request.first_document_id, request.second_document_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
