import math
import os
from typing import Any

DEFAULT_MIN_RELEVANCE_SCORE = 0.25
DEFAULT_MIN_RELEVANT_CHUNKS = 1

def get_min_relevance_score() -> float:
    return _env_float("RAG_MIN_RELEVANCE_SCORE", DEFAULT_MIN_RELEVANCE_SCORE)

def get_min_relevant_chunks() -> int:
    value = os.getenv("RAG_MIN_RELEVANT_CHUNKS", str(DEFAULT_MIN_RELEVANT_CHUNKS))
    try:
        return max(1, int(value))
    except (TypeError, ValueError):
        return DEFAULT_MIN_RELEVANT_CHUNKS

def normalize_retrieval_result(result: dict[str, Any], threshold: float | None = None) -> dict[str, Any]:
    threshold = get_min_relevance_score() if threshold is None else threshold
    raw_score = _safe_float(result.get("score"))
    score_type = str(result.get("score_type") or "unknown")
    relevance_score = _relevance_from_score(raw_score, score_type)
    passed = relevance_score >= threshold
    return {
        **result,
        "raw_score": raw_score,
        "score_type": score_type,
        "relevance_score": round(relevance_score, 4),
        "relevance_label": relevance_label(relevance_score),
        "is_relevant": passed,
        "passed_threshold": passed,
    }

def normalize_retrieval_results(results: list[dict[str, Any]], threshold: float | None = None) -> list[dict[str, Any]]:
    return [normalize_retrieval_result(result, threshold=threshold) for result in results]

def relevance_label(score: float) -> str:
    if score >= 0.75:
        return "High Relevance"
    if score >= 0.45:
        return "Medium Relevance"
    return "Low Relevance"

def _relevance_from_score(raw_score: float | None, score_type: str) -> float:
    if raw_score is None or not math.isfinite(raw_score):
        return 0.0
    score_type = score_type.lower()
    if score_type in {"similarity", "cosine_similarity"}:
        return _clamp(raw_score)
    if score_type in {"distance_cosine", "cosine_distance"}:
        return _clamp(1.0 - max(raw_score, 0.0))
    if score_type in {"distance_l2", "l2_distance", "distance"}:
        return _clamp(1.0 / (1.0 + max(raw_score, 0.0)))
    return 0.0

def _safe_float(value: Any) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None

def _env_float(name: str, default: float) -> float:
    try:
        value = float(os.getenv(name, str(default)))
    except (TypeError, ValueError):
        return default
    return _clamp(value)

def _clamp(value: float) -> float:
    if not math.isfinite(value):
        return 0.0
    return max(0.0, min(value, 1.0))
