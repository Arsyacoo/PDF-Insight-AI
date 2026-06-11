import io
import json
import os
import shutil
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
from reportlab.pdfgen import canvas

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))
os.chdir(BACKEND)
os.environ["USE_SENTENCE_TRANSFORMERS"] = "false"
os.environ["RAG_MIN_RELEVANCE_SCORE"] = "0.25"
os.environ["RAG_MIN_RELEVANT_CHUNKS"] = "1"

from main import app
from services.relevance_service import normalize_retrieval_result
from services.storage_service import CHATS_FILE, DOCUMENTS_FILE
from services.vector_service import JSON_STORE, VectorService


def make_pdf(text: str) -> bytes:
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer)
    y = 740
    for line in [text[i:i + 95] for i in range(0, len(text), 95)]:
        pdf.drawString(72, y, line)
        y -= 16
        if y < 80:
            pdf.showPage()
            y = 740
    pdf.showPage()
    pdf.save()
    return buffer.getvalue()


class RagRelevanceTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app, raise_server_exceptions=False)
        self.backup_dir = Path(tempfile.mkdtemp(prefix="rag_test_backup_"))
        for path in [DOCUMENTS_FILE, CHATS_FILE, JSON_STORE]:
            self._backup(path)
        self._clear_store()
        self.doc_a = self._upload("a.pdf", "Revenue growth in APAC was fifteen percent. Cloud services were the main driver. " * 30)
        self.doc_b = self._upload("b.pdf", "Vendor contract renewal requires legal approval and quarterly review. " * 30)

    def tearDown(self):
        for path in [DOCUMENTS_FILE, CHATS_FILE, JSON_STORE]:
            self._restore(path)
        shutil.rmtree(self.backup_dir, ignore_errors=True)

    def _backup(self, path: Path):
        if path.exists():
            dest = self.backup_dir / path.relative_to(BACKEND)
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, dest)

    def _restore(self, path: Path):
        dest = self.backup_dir / path.relative_to(BACKEND)
        if dest.exists():
            path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(dest, path)
        elif path.exists():
            path.unlink()

    def _clear_store(self):
        DOCUMENTS_FILE.parent.mkdir(parents=True, exist_ok=True)
        DOCUMENTS_FILE.write_text("{}", encoding="utf-8")
        CHATS_FILE.write_text("{}", encoding="utf-8")
        JSON_STORE.parent.mkdir(parents=True, exist_ok=True)
        JSON_STORE.write_text("{}", encoding="utf-8")

    def _upload(self, name: str, text: str) -> str:
        response = self.client.post("/upload", files={"file": (name, make_pdf(text), "application/pdf")})
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()["document_id"]

    def test_exact_question_returns_relevant_sources(self):
        with patch("routers.chat.ask_groq", return_value="APAC revenue growth was fifteen percent.") as mocked:
            response = self.client.post("/chat", json={"document_id": self.doc_a, "question": "APAC revenue growth"})
        self.assertEqual(response.status_code, 200, response.text)
        data = response.json()
        self.assertEqual(data["response_mode"], "llm")
        self.assertGreater(len(data["sources"]), 0)
        self.assertGreaterEqual(data["retrieval_details"]["chunks_above_threshold"], 1)
        mocked.assert_called_once()

    def test_paraphrased_and_indonesian_questions_return_sources(self):
        questions = ["How did income improve in Asia Pacific cloud?", "Berapa pertumbuhan pendapatan APAC?"]
        for question in questions:
            with self.subTest(question=question):
                with patch("routers.chat.ask_groq", return_value="Relevant answer"):
                    response = self.client.post("/chat", json={"document_id": self.doc_a, "question": question})
                self.assertEqual(response.status_code, 200, response.text)
                self.assertGreater(len(response.json()["sources"]), 0)

    def test_unrelated_question_returns_not_found_and_skips_groq(self):
        with patch("routers.chat.ask_groq", side_effect=AssertionError("Groq should not be called")):
            response = self.client.post("/chat", json={"document_id": self.doc_a, "question": "penguins antarctica biology unrelated"})
        self.assertEqual(response.status_code, 200, response.text)
        data = response.json()
        self.assertEqual(data["response_mode"], "not_found")
        self.assertEqual(data["sources"], [])
        self.assertEqual(data["retrieval_details"]["chunks_above_threshold"], 0)
        self.assertTrue(all(not item["passed_threshold"] for item in data["retrieval_details"]["results"]))

    def test_no_vector_chunks_returns_not_found(self):
        from services.storage_service import save_document
        doc_id = "manual-no-vector"
        save_document({"document_id": doc_id, "file_name": "manual.pdf", "total_pages": 1, "text_preview": "manual"})
        response = self.client.post("/chat", json={"document_id": doc_id, "question": "anything"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["response_mode"], "not_found")

    def test_document_isolation(self):
        results = VectorService().search(self.doc_a, "vendor legal contract", top_k=5)
        self.assertTrue(results)
        self.assertTrue(all("vendor" not in result["text"].lower() for result in results))

    def test_low_quality_top_result_not_rank_normalized_to_one(self):
        response = self.client.post("/chat", json={"document_id": self.doc_a, "question": "penguins antarctica biology unrelated"})
        scores = [item["relevance_score"] for item in response.json()["retrieval_details"]["results"]]
        self.assertTrue(scores)
        self.assertTrue(all(score < 1.0 for score in scores))

    def test_score_interpretation_safety(self):
        cases = [
            ({"score": 0.8, "score_type": "similarity"}, 0.8),
            ({"score": -0.3, "score_type": "similarity"}, 0.0),
            ({"score": 2.0, "score_type": "similarity"}, 1.0),
            ({"score": 0.2, "score_type": "distance_cosine"}, 0.8),
            ({"score": 0.0, "score_type": "distance_l2"}, 1.0),
            ({"score": "nan", "score_type": "similarity"}, 0.0),
            ({"score": None, "score_type": "similarity"}, 0.0),
        ]
        for payload, expected in cases:
            with self.subTest(payload=payload):
                result = normalize_retrieval_result(payload, threshold=0.25)
                self.assertAlmostEqual(result["relevance_score"], expected, places=4)
                self.assertIn("passed_threshold", result)

    def test_threshold_can_be_configured(self):
        with patch.dict(os.environ, {"RAG_MIN_RELEVANCE_SCORE": "0.95"}):
            response = self.client.post("/chat", json={"document_id": self.doc_a, "question": "APAC revenue growth"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["response_mode"], "not_found")
        self.assertEqual(response.json()["sources"], [])


    def test_corrupted_pdf_logs_are_sanitized(self):
        absolute_project_path = str(BACKEND.resolve())
        with self.assertLogs("services.pdf_service", level="WARNING") as captured:
            response = self.client.post(
                "/upload",
                files={"file": ("broken.pdf", b"%PDF-not-a-real-pdf", "application/pdf")},
            )
        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json()["detail"], "File PDF rusak atau tidak dapat dibaca.")
        logs = "\n".join(captured.output)
        self.assertIn("category=corrupted_pdf", logs)
        self.assertIn("exception_class=", logs)
        self.assertNotIn(absolute_project_path, logs)
        self.assertNotIn("No /Root object", logs)
        self.assertNotIn("Traceback", logs)

    def test_groq_logs_do_not_expose_api_key(self):
        from services.groq_service import ask_groq

        secret = "gsk_test_secret_should_not_appear"
        with patch.dict(os.environ, {"GROQ_API_KEY": secret, "GROQ_MODEL": "test-model"}):
            with patch("services.groq_service.Groq", side_effect=RuntimeError(f"bad key {secret}")):
                with self.assertLogs("services.groq_service", level="WARNING") as captured:
                    answer = ask_groq("question", "context from document", task="chat")
        logs = "\n".join(captured.output)
        self.assertIn("category=groq_failed", logs)
        self.assertIn("exception_class=RuntimeError", logs)
        self.assertNotIn(secret, logs)
        self.assertNotIn("context from document", logs)
        self.assertTrue(answer.startswith("Jawaban sementara dari dokumen:"))

    def test_unexpected_groq_error_returns_api_error(self):
        with patch("routers.chat.ask_groq", side_effect=RuntimeError("boom")):
            response = self.client.post("/chat", json={"document_id": self.doc_a, "question": "APAC revenue growth"})
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["response_mode"], "api_error")
        self.assertEqual(response.json()["sources"], [])


if __name__ == "__main__":
    unittest.main()
