import json
import math
from pathlib import Path
from typing import Any

from services.embedding_service import EmbeddingService

VECTOR_DIR = Path(__file__).resolve().parents[1] / "vector_store"
JSON_STORE = VECTOR_DIR / "chunks.json"


class VectorService:
    def __init__(self) -> None:
        VECTOR_DIR.mkdir(parents=True, exist_ok=True)
        self.embeddings = EmbeddingService()
        self.collection = None
        try:
            import chromadb

            self.client = chromadb.PersistentClient(path=str(VECTOR_DIR / "chroma"))
            self.collection = self.client.get_or_create_collection(name="pdf_chunks")
            metadata = getattr(self.collection, "metadata", None) or {}
            self.chroma_space = metadata.get("hnsw:space", "l2")
        except Exception:
            self.client = None
            self.chroma_space = None

    def add_chunks(self, chunks: list[dict[str, Any]]) -> None:
        if not chunks:
            return
        vectors = self.embeddings.embed([chunk["text"] for chunk in chunks])
        if self.collection:
            self.collection.upsert(
                ids=[chunk["chunk_id"] for chunk in chunks],
                documents=[chunk["text"] for chunk in chunks],
                embeddings=vectors,
                metadatas=[
                    {
                        "document_id": chunk["document_id"],
                        "file_name": chunk["file_name"],
                        "page_number": chunk.get("page_number") or 0,
                    }
                    for chunk in chunks
                ],
            )
            return

        stored = self._read_json_store()
        for chunk, vector in zip(chunks, vectors):
            stored[chunk["chunk_id"]] = {**chunk, "embedding": vector}
        JSON_STORE.write_text(json.dumps(stored, ensure_ascii=False, indent=2), encoding="utf-8")

    def delete_document_chunks(self, document_id: str) -> None:
        if self.collection:
            try:
                self.collection.delete(where={"document_id": document_id})
            except Exception:
                pass

        stored = self._read_json_store()
        filtered = {
            chunk_id: chunk
            for chunk_id, chunk in stored.items()
            if chunk.get("document_id") != document_id
        }
        if len(filtered) != len(stored):
            JSON_STORE.write_text(json.dumps(filtered, ensure_ascii=False, indent=2), encoding="utf-8")

    def search(self, document_id: str, question: str, top_k: int = 5) -> list[dict[str, Any]]:
        vector = self.embeddings.embed([question])[0]
        if self.collection:
            result = self.collection.query(
                query_embeddings=[vector],
                n_results=top_k,
                where={"document_id": document_id},
                include=["documents", "metadatas", "distances"],
            )

            matches: list[dict[str, Any]] = []
            for text, metadata, distance in zip(
                result.get("documents", [[]])[0],
                result.get("metadatas", [[]])[0],
                result.get("distances", [[]])[0],
            ):
                matches.append(
                    {
                        "text": text,
                        "page_number": metadata.get("page_number"),
                        "file_name": metadata.get("file_name"),
                        "score": distance,
                        "score_type": self._chroma_score_type(),
                    }
                )
            return matches

        chunks = [
            chunk for chunk in self._read_json_store().values()
            if chunk.get("document_id") == document_id
        ]
        ranked = sorted(
            chunks,
            key=lambda chunk: self._cosine(vector, chunk.get("embedding", [])),
            reverse=True,
        )
        return [
            {
                "text": chunk["text"],
                "page_number": chunk.get("page_number"),
                "file_name": chunk.get("file_name"),
                "score": self._cosine(vector, chunk.get("embedding", [])),
                "score_type": "similarity",
            }
            for chunk in ranked[:top_k]
        ]

    def _chroma_score_type(self) -> str:
        if self.chroma_space == "cosine":
            return "distance_cosine"
        if self.chroma_space in {"l2", "ip"}:
            return f"distance_{self.chroma_space}"
        return "distance_l2"

    def _read_json_store(self) -> dict[str, Any]:
        if not JSON_STORE.exists():
            return {}
        try:
            return json.loads(JSON_STORE.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return {}

    def _cosine(self, left: list[float], right: list[float]) -> float:
        if not left or not right:
            return 0.0
        dot = sum(a * b for a, b in zip(left, right))
        left_norm = math.sqrt(sum(a * a for a in left)) or 1.0
        right_norm = math.sqrt(sum(b * b for b in right)) or 1.0
        return dot / (left_norm * right_norm)
