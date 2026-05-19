import hashlib
import math
import os


class EmbeddingService:
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2") -> None:
        self.model_name = model_name
        self._model = None

    @property
    def model(self):
        if os.getenv("USE_SENTENCE_TRANSFORMERS", "false").lower() != "true":
            self._model = False
            return self._model

        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer

                self._model = SentenceTransformer(self.model_name, local_files_only=True)
            except Exception:
                self._model = False
        return self._model

    def embed(self, texts: list[str]) -> list[list[float]]:
        if self.model:
            vectors = self.model.encode(texts, normalize_embeddings=True)
            return [vector.tolist() for vector in vectors]
        return [self._fallback_embed(text) for text in texts]

    def _fallback_embed(self, text: str, dimensions: int = 384) -> list[float]:
        vector = [0.0] * dimensions
        for token in text.lower().split():
            digest = hashlib.sha256(token.encode("utf-8")).digest()
            index = int.from_bytes(digest[:2], "big") % dimensions
            sign = 1 if digest[2] % 2 == 0 else -1
            vector[index] += sign
        norm = math.sqrt(sum(value * value for value in vector)) or 1.0
        return [value / norm for value in vector]
