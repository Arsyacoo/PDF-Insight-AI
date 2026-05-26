import json
import re
from typing import Any

from services.analysis_service import _keywords
from services.groq_service import ask_groq
from services.storage_service import get_document, update_document
from services.vector_service import VectorService


def _document_context(document_id: str, query: str, top_k: int = 6) -> tuple[dict[str, Any], str]:
    document = get_document(document_id)
    if not document:
        raise KeyError("Dokumen tidak ditemukan.")

    chunks = VectorService().search(document_id, query, top_k=top_k)
    context = "\n\n".join(chunk["text"] for chunk in chunks) or document.get("text_preview", "")
    return document, context


def generate_quiz(document_id: str, total_questions: int = 5) -> dict[str, Any]:
    document, context = _document_context(document_id, "konsep utama fakta penting detail dokumen kuis")
    prompt = (
        f"Buat {total_questions} soal kuis pilihan ganda dari konteks PDF. "
        "Soal harus spesifik, relevan, dan menguji pemahaman isi dokumen, bukan sekadar menanyakan keyword. "
        "Setiap soal wajib memiliki 4 opsi yang masuk akal, satu jawaban benar, dan penjelasan singkat. "
        "Jawab hanya dalam JSON valid tanpa Markdown dengan struktur: "
        '{"quiz":[{"question":"...","options":["...","...","...","..."],"answer":"A","explanation":"..."}]}.'
    )
    raw = ask_groq(prompt, context, task="learning")
    parsed_quiz = _parse_quiz(raw)
    quiz_items = parsed_quiz[:total_questions] if parsed_quiz else _fallback_quiz(context, total_questions)
    quiz = {"document_id": document_id, "file_name": document["file_name"], "quiz": quiz_items, "raw": raw}
    update_document(document_id, {"quiz": quiz})
    return quiz


def generate_flashcards(document_id: str, total_cards: int = 8) -> dict[str, Any]:
    document, context = _document_context(document_id, "istilah penting definisi konsep flashcard")
    prompt = (
        f"Buat {total_cards} flashcard dari konteks PDF dalam bahasa Indonesia. "
        "Setiap flashcard harus berisi front dan back yang singkat."
    )
    raw = ask_groq(prompt, context, task="learning")
    flashcards = {
        "document_id": document_id,
        "file_name": document["file_name"],
        "flashcards": _fallback_flashcards(context, total_cards),
        "raw": raw,
    }
    update_document(document_id, {"flashcards": flashcards})
    return flashcards


def compare_documents(first_document_id: str, second_document_id: str) -> dict[str, Any]:
    first, first_context = _document_context(first_document_id, "ringkasan tema utama perbandingan", top_k=5)
    second, second_context = _document_context(second_document_id, "ringkasan tema utama perbandingan", top_k=5)
    prompt_context = (
        f"Dokumen A ({first['file_name']}):\n{first_context}\n\n"
        f"Dokumen B ({second['file_name']}):\n{second_context}"
    )
    prompt = (
        "Bandingkan dua PDF ini dalam bahasa Indonesia. Jelaskan persamaan, perbedaan, "
        "topik unik dokumen A, topik unik dokumen B, dan rekomendasi kapan memakai masing-masing dokumen."
    )
    raw = ask_groq(prompt, prompt_context, task="compare")
    comparison = {
        "first_document_id": first_document_id,
        "second_document_id": second_document_id,
        "first_file_name": first["file_name"],
        "second_file_name": second["file_name"],
        "summary": raw,
        "similarities": _shared_keywords(first_context, second_context),
        "first_unique_keywords": _unique_keywords(first_context, second_context),
        "second_unique_keywords": _unique_keywords(second_context, first_context),
    }
    return comparison


def _fallback_quiz(context: str, total_questions: int) -> list[dict[str, Any]]:
    sentences = _important_sentences(context)
    if not sentences:
        return []

    questions = []
    for index, sentence in enumerate(sentences[:total_questions]):
        question_text, correct_option = _question_from_sentence(sentence, index)
        distractors = _distractors(sentence, sentences)
        correct_index = index % 4
        options = distractors[:]
        options.insert(correct_index, correct_option)
        options = options[:4]
        while len(options) < 4:
            options.append("Pernyataan ini tidak sesuai dengan isi dokumen.")

        questions.append(
            {
                "question": question_text,
                "options": options,
                "answer": "ABCD"[correct_index],
                "explanation": f"Jawaban benar karena dokumen menyatakan: {_shorten(sentence, 220)}",
            }
        )
    return questions


def _parse_quiz(raw: str) -> list[dict[str, Any]]:
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw, flags=re.DOTALL)
        if not match:
            return _parse_text_quiz(raw)
        try:
            data = json.loads(match.group(0))
        except json.JSONDecodeError:
            return _parse_text_quiz(raw)

    items = data.get("quiz", data if isinstance(data, list) else [])
    parsed: list[dict[str, Any]] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        question = str(item.get("question", "")).strip()
        options = item.get("options", [])
        answer = str(item.get("answer", "")).strip().upper()[:1]
        explanation = str(item.get("explanation", "")).strip()
        if question and isinstance(options, list) and len(options) >= 4 and answer in "ABCD" and _is_good_quiz_item(question, options):
            parsed.append(
                {
                    "question": question,
                    "options": [str(option).strip() for option in options[:4]],
                    "answer": answer,
                    "explanation": explanation or "Jawaban ini sesuai dengan informasi yang ada di dokumen.",
                }
            )
    return parsed


def _parse_text_quiz(raw: str) -> list[dict[str, Any]]:
    blocks = re.split(r"(?=\bSoal\s+\d+\b)", raw, flags=re.IGNORECASE)
    parsed: list[dict[str, Any]] = []

    for block in blocks:
        block = block.strip()
        if not block or not re.search(r"\bPertanyaan\s*:", block, flags=re.IGNORECASE):
            continue

        question_match = re.search(
            r"Pertanyaan\s*:\s*(.*?)(?=\n\s*A[\).]\s*)",
            block,
            flags=re.IGNORECASE | re.DOTALL,
        )
        if not question_match:
            continue
        question = " ".join(question_match.group(1).split())

        option_matches = re.findall(
            r"^\s*([A-D])[\).]\s*(.+?)(?=^\s*[A-D][\).]\s*|^\s*Jawaban\s*:|\Z)",
            block,
            flags=re.IGNORECASE | re.DOTALL | re.MULTILINE,
        )
        options_by_letter = {
            letter.upper(): " ".join(option.strip().split())
            for letter, option in option_matches
        }
        if any(letter not in options_by_letter for letter in "ABCD"):
            continue

        answer_match = re.search(r"Jawaban\s*:\s*([A-D])", block, flags=re.IGNORECASE)
        answer = answer_match.group(1).upper() if answer_match else ""

        explanation_match = re.search(
            r"Penjelasan\s*:\s*(.*?)(?=\n\s*Soal\s+\d+\b|\Z)",
            block,
            flags=re.IGNORECASE | re.DOTALL,
        )
        explanation = (
            " ".join(explanation_match.group(1).split())
            if explanation_match
            else "Jawaban ini sesuai dengan informasi yang ada di dokumen."
        )

        options = [options_by_letter[letter] for letter in "ABCD"]
        if question and answer in "ABCD" and _is_good_quiz_item(question, options):
            parsed.append(
                {
                    "question": question,
                    "options": options,
                    "answer": answer,
                    "explanation": explanation,
                }
            )

    return parsed


def _is_good_quiz_item(question: str, options: list[Any]) -> bool:
    bad_patterns = [
        "apa informasi yang berkaitan",
        "membahas ",
        "berdasarkan konteks dokumen",
        "informasi yang tidak berasal dari dokumen",
        "topik yang tidak disebutkan",
        "jawaban di luar konteks",
    ]
    combined = f"{question} {' '.join(str(option) for option in options)}".lower()
    return not any(pattern in combined for pattern in bad_patterns)


def _important_sentences(context: str) -> list[str]:
    normalized = " ".join(context.replace("\n", " ").split())
    raw_sentences = re.split(r"(?<=[.!?])\s+", normalized)
    sentences = []
    for sentence in raw_sentences:
        sentence = sentence.strip(" -")
        if 50 <= len(sentence) <= 320 and _keywords(sentence):
            sentences.append(sentence)

    seen = set()
    unique = []
    for sentence in sentences:
        key = sentence.lower()
        if key not in seen:
            seen.add(key)
            unique.append(sentence)
    return unique


def _best_topic(sentence: str) -> str:
    keywords = _keyword_texts(sentence)
    if len(keywords) >= 2:
        return f"{keywords[0]} dan {keywords[1]}"
    return keywords[0] if keywords else ""


def _question_from_sentence(sentence: str, index: int) -> tuple[str, str]:
    clean = _shorten(sentence, 220)
    lower = sentence.lower()
    topic = _best_topic(sentence) or f"poin penting ke-{index + 1}"

    if " adalah " in lower:
        before, after = re.split(r"\sadalah\s", sentence, maxsplit=1, flags=re.IGNORECASE)
        subject = _shorten(before.strip(" ,.;:"), 90)
        definition = _shorten(after.strip(" ,.;:"), 180)
        if subject and definition:
            return f"Apa yang dimaksud dengan {subject} menurut dokumen?", definition

    if " karena " in lower:
        before, after = re.split(r"\skarena\s", sentence, maxsplit=1, flags=re.IGNORECASE)
        subject = _shorten(before.strip(" ,.;:"), 110)
        reason = _shorten(after.strip(" ,.;:"), 180)
        if subject and reason:
            return f"Mengapa {subject}?", reason

    if " digunakan untuk " in lower:
        before, after = re.split(r"\sdigunakan untuk\s", sentence, maxsplit=1, flags=re.IGNORECASE)
        subject = _shorten(before.strip(" ,.;:"), 90)
        purpose = _shorten(after.strip(" ,.;:"), 180)
        if subject and purpose:
            return f"Untuk apa {subject} digunakan menurut dokumen?", purpose

    if " menunjukkan bahwa " in lower:
        _, after = re.split(r"\smenunjukkan bahwa\s", sentence, maxsplit=1, flags=re.IGNORECASE)
        return f"Apa temuan utama yang dijelaskan dokumen tentang {topic}?", _shorten(after, 180)

    return f"Pernyataan mana yang paling sesuai dengan isi dokumen tentang {topic}?", clean


def _distractors(correct_sentence: str, sentences: list[str]) -> list[str]:
    distractors = [
        _shorten(_answer_fragment(sentence), 180)
        for sentence in sentences
        if sentence != correct_sentence
    ]
    generic = [
        "Dokumen menyatakan bahwa metode tersebut tidak berhubungan dengan topik yang dibahas.",
        "Dokumen menyimpulkan bahwa tidak ada algoritma yang dapat dibandingkan.",
        "Dokumen menjelaskan bahwa seluruh proses dilakukan tanpa analisis data.",
    ]
    return (distractors + generic)[:3]


def _answer_fragment(sentence: str) -> str:
    for pattern in [r"\sadalah\s", r"\skarena\s", r"\sdigunakan untuk\s", r"\smenunjukkan bahwa\s"]:
        if re.search(pattern, sentence, flags=re.IGNORECASE):
            parts = re.split(pattern, sentence, maxsplit=1, flags=re.IGNORECASE)
            if len(parts) == 2 and len(parts[1].strip()) > 20:
                return parts[1].strip(" ,.;:")
    return sentence


def _shorten(text: str, limit: int) -> str:
    text = " ".join(text.split())
    if len(text) <= limit:
        return text
    return text[: limit - 3].rstrip() + "..."


def _fallback_flashcards(context: str, total_cards: int) -> list[dict[str, str]]:
    sentences = _flashcard_sentences(context)
    keywords = _learning_keywords(context)
    cards: list[dict[str, str]] = []
    used_sentences: set[str] = set()

    for keyword in keywords:
        sentence = _sentence_for_keyword(keyword, sentences, used_sentences)
        if not sentence:
            continue
        used_sentences.add(sentence)
        cards.append(
            {
                "front": _flashcard_front(keyword, sentence),
                "back": _flashcard_back(keyword, sentence),
            }
        )
        if len(cards) >= total_cards:
            return cards

    for sentence in sentences:
        if sentence in used_sentences:
            continue
        topic = _best_topic(sentence)
        if not topic:
            continue
        cards.append(
            {
                "front": _flashcard_front(topic, sentence),
                "back": _shorten(sentence, 240),
            }
        )
        if len(cards) >= total_cards:
            return cards

    return cards


def _learning_keywords(context: str) -> list[str]:
    ignored = {
        "fitur",
        "model",
        "rata",
        "mean",
        "feature",
        "importance",
        "kepada",
        "teman",
        "seluruh",
        "saya",
        "skripsi",
        "halaman",
        "program",
        "studi",
        "data",
        "nilai",
        "hasil",
        "proses",
    }
    lower_context = context.lower()
    priority_phrases = [
        "machine learning",
        "random forest",
        "support vector machine",
        "gradient boosting",
        "confusion matrix",
        "credit card fraud",
        "kartu kredit",
        "transaksi kartu kredit",
        "ensemble learning",
        "exploratory data analysis",
        "feature importance",
        "precision",
        "recall",
        "akurasi",
        "klasifikasi",
        "prediksi",
    ]
    keywords = [phrase for phrase in priority_phrases if phrase in lower_context]
    for keyword in _keyword_texts(context):
        normalized = keyword.lower().strip()
        if len(normalized) < 4 or normalized in ignored:
            continue
        if normalized not in keywords:
            keywords.append(normalized)
    return keywords


def _flashcard_sentences(context: str) -> list[str]:
    bad_patterns = [
        "kepada ",
        "terima kasih",
        "menyelesaikan skripsi",
        "calon istri",
        "teman seperjuangan",
        "pondok pesantren",
        "universitas",
        "fakultas",
        "program studi",
        "halaman judul",
        "berikut penelitian lain",
        "yang relevan dengan judul",
        "yang di teliti oleh",
        "grabkios",
        "during this",
        "careful examination",
        "cover various",
    ]
    learning_terms = [
        "adalah",
        "digunakan",
        "menunjukkan",
        "bertujuan",
        "metode",
        "algoritma",
        "model",
        "analisis",
        "akurasi",
        "klasifikasi",
        "prediksi",
        "evaluasi",
        "dataset",
        "fitur",
        "machine learning",
        "random forest",
        "support vector",
        "gradient boosting",
        "penipuan",
        "fraud",
        "transaksi",
        "precision",
        "recall",
        "confusion matrix",
    ]
    sentences = []
    for sentence in _important_sentences(context):
        lower = sentence.lower()
        if any(pattern in lower for pattern in bad_patterns):
            continue
        if not any(term in lower for term in learning_terms):
            continue
        sentences.append(sentence)
    return sentences or [
        sentence
        for sentence in _important_sentences(context)
        if not any(pattern in sentence.lower() for pattern in bad_patterns)
    ]


def _sentence_for_keyword(keyword: str, sentences: list[str], used_sentences: set[str]) -> str:
    candidates = [
        sentence
        for sentence in sentences
        if sentence not in used_sentences and re.search(rf"\b{re.escape(keyword)}\b", sentence, flags=re.IGNORECASE)
    ]
    if not candidates:
        return ""
    return max(candidates, key=lambda sentence: (len(_keyword_texts(sentence)), min(len(sentence), 240)))


def _flashcard_back(keyword: str, sentence: str) -> str:
    answer = _answer_fragment(sentence)
    if answer == sentence and re.search(rf"\b{re.escape(keyword)}\b", sentence, flags=re.IGNORECASE):
        return _shorten(sentence, 240)
    return _shorten(answer, 240)


def _flashcard_front(keyword: str, sentence: str) -> str:
    keyword_title = keyword.title()
    lower = sentence.lower()
    if " digunakan untuk " in lower:
        return f"Untuk apa {keyword_title} digunakan menurut dokumen?"
    if " karena " in lower:
        return f"Mengapa {keyword_title} penting dalam dokumen?"
    if " menunjukkan bahwa " in lower:
        return f"Apa temuan dokumen tentang {keyword_title}?"
    return f"Apa yang dijelaskan dokumen tentang {keyword_title}?"


def _shared_keywords(first_context: str, second_context: str) -> list[str]:
    return sorted(set(_keyword_texts(first_context)) & set(_keyword_texts(second_context)))[:8]


def _unique_keywords(source_context: str, other_context: str) -> list[str]:
    return sorted(set(_keyword_texts(source_context)) - set(_keyword_texts(other_context)))[:8]


def _keyword_texts(text: str) -> list[str]:
    keywords = _keywords(text)
    normalized: list[str] = []
    for item in keywords:
        if isinstance(item, dict):
            keyword = str(item.get("keyword", "")).strip()
        else:
            keyword = str(item).strip()
        if keyword:
            normalized.append(keyword)
    return normalized
