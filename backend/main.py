import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import analysis, chat, documents, export, learning, upload

load_dotenv()

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(levelname)s:%(name)s:%(message)s",
)

app = FastAPI(title="PDF Insight AI API", version="1.0.0")

frontend_urls = [
    origin.strip()
    for origin in os.getenv("FRONTEND_URL", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_urls,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(analysis.router)
app.include_router(chat.router)
app.include_router(documents.router)
app.include_router(export.router)
app.include_router(learning.router)


@app.get("/")
def health_check():
    return {"message": "PDF Insight AI API is running"}


@app.get("/debug-version")
def debug_version():
    return {"app": "PDF Insight AI", "quiz_engine": "text-parser-v2"}
