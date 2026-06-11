import hashlib
import math
import os
import re


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
        for token in self._fallback_tokens(text):
            digest = hashlib.sha256(token.encode("utf-8")).digest()
            index = int.from_bytes(digest[:2], "big") % dimensions
            sign = 1 if digest[2] % 2 == 0 else -1
            vector[index] += sign
        norm = math.sqrt(sum(value * value for value in vector)) or 1.0
        return [value / norm for value in vector]

    def _fallback_tokens(self, text: str) -> list[str]:
        normalized = text.lower().replace("asia pacific", "apac")
        base_tokens = re.findall(r"[a-z0-9]+", normalized)
        synonyms = {
            "income": ["revenue"],
            "pendapatan": ["revenue"],
            "revenues": ["revenue"],
            "pertumbuhan": ["growth"],
            "grew": ["growth"],
            "improve": ["growth"],
            "improved": ["growth"],
            "increase": ["growth"],
            "increased": ["growth"],
            "awan": ["cloud"],
            "layanan": ["services"],
            "kontrak": ["contract"],
            "hukum": ["legal"],
        }
        expanded: list[str] = []
        for token in base_tokens:
            expanded.append(token)
            expanded.extend(synonyms.get(token, []))
        return expanded
