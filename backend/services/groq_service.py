import os
import re
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq

ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(ENV_PATH)

SYSTEM_PROMPT = (
    "Kamu adalah PDF Insight AI, asisten akademik untuk memahami isi dokumen PDF. "
    "Jawab SELALU dalam bahasa Indonesia yang jelas, natural, dan profesional. "
    "Gunakan hanya informasi dari konteks PDF yang diberikan. Jangan mengarang fakta, angka, nama, "
    "metode, atau kesimpulan yang tidak ada di konteks. Jika informasi tidak ada, jawab tepat: "
    "'Informasi tersebut tidak ditemukan dalam dokumen.' "
    "Jika konteks cukup, jawab pertanyaan secara langsung terlebih dahulu, lalu berikan penjelasan "
    "yang rapi. Gunakan bullet points hanya jika membuat jawaban lebih mudah dibaca. "
    "Jangan menyalin konteks mentah secara panjang. Rangkum, hubungkan ide, dan jelaskan maknanya. "
    "Jika ada beberapa bagian relevan, gabungkan menjadi jawaban yang utuh dan tidak berulang."
)


def ask_groq(question: str, context: str, task: str = "chat") -> str:
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    if not api_key or api_key == "your_groq_api_key_here":
        return _offline_answer(question, context)

    client = Groq(api_key=api_key)
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": _build_user_prompt(question, context, task)},
        ],
        temperature=0.15,
        max_tokens=1000,
    )
    content = response.choices[0].message.content or "Informasi tersebut tidak ditemukan dalam dokumen."
    return clean_ai_text(content)


def clean_ai_text(text: str) -> str:
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = re.sub(r"__(.*?)__", r"\1", text)
    text = re.sub(r"^\s*#{1,6}\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\s*[-*]\s+", "- ", text, flags=re.MULTILINE)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _build_user_prompt(question: str, context: str, task: str) -> str:
    task_instruction = {
        "chat": (
            "Tugas: jawab pertanyaan pengguna berdasarkan konteks PDF. Mulai dengan jawaban inti "
            "dalam 1-2 kalimat, lalu jelaskan detail pendukung dari dokumen. Jika pertanyaan meminta "
            "kesimpulan, berikan kesimpulan yang tegas. Jika pertanyaan meminta perbandingan, susun "
            "dengan poin perbedaan/persamaan."
        ),
        "analysis": (
            "Tugas: buat analisis dokumen yang rapi. Berikan ringkasan singkat, poin penting, "
            "keywords, dan pertanyaan lanjutan yang relevan."
        ),
        "learning": (
            "Tugas: buat materi belajar dari dokumen. Pastikan pertanyaan, jawaban, dan penjelasan "
            "tetap berasal dari konteks PDF."
        ),
        "compare": (
            "Tugas: bandingkan dua dokumen berdasarkan konteks yang diberikan. Jelaskan persamaan, "
            "perbedaan, dan poin unik masing-masing dokumen."
        ),
    }.get(task, "Tugas: jawab berdasarkan konteks PDF.")

    return (
        f"{task_instruction}\n\n"
        "Konteks PDF:\n"
        f"{context.strip() or '[Konteks kosong]'}\n\n"
        f"Pertanyaan/Instruksi pengguna:\n{question.strip()}\n\n"
        "Aturan jawaban:\n"
        "- Jangan menyebut bahwa kamu hanya menerima potongan konteks kecuali informasi tidak ditemukan.\n"
        "- Jangan membuka jawaban dengan frasa seperti 'berdasarkan konteks yang diberikan' jika tidak perlu.\n"
        "- Jawab dengan bahasa Indonesia yang enak dibaca dan tidak kaku.\n"
        "- Jangan gunakan Markdown tebal seperti **judul** atau __judul__.\n"
        "- Untuk judul bagian, tulis teks biasa tanpa simbol Markdown.\n"
        "- Jika informasi tidak ada, gunakan kalimat persis: Informasi tersebut tidak ditemukan dalam dokumen."
    )


def _offline_answer(question: str, context: str) -> str:
    if not context.strip():
        return "Informasi tersebut tidak ditemukan dalam dokumen."

    sentences = _split_sentences(context)
    question_terms = {
        token.lower()
        for token in question.replace("?", " ").replace(".", " ").split()
        if len(token) > 3
    }
    ranked = sorted(
        sentences,
        key=lambda sentence: sum(1 for term in question_terms if term in sentence.lower()),
        reverse=True,
    )
    selected = ranked[:3] if ranked else sentences[:3]
    answer = " ".join(selected).strip()
    if not answer:
        return "Informasi tersebut tidak ditemukan dalam dokumen."
    return f"Jawaban sementara dari dokumen: {answer[:900]}"


def _split_sentences(text: str) -> list[str]:
    normalized = " ".join(text.replace("\n", " ").split())
    sentences: list[str] = []
    current: list[str] = []
    for char in normalized:
        current.append(char)
        if char in ".!?":
            sentence = "".join(current).strip()
            if len(sentence) > 20:
                sentences.append(sentence)
            current = []
    tail = "".join(current).strip()
    if len(tail) > 20:
        sentences.append(tail)
    return sentences or [normalized[:900]]
