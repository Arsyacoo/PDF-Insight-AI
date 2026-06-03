import { ArrowRight, BrainCircuit, FileSearch, GitCompareArrows, Layers3, MessageSquareText, UploadCloud } from "lucide-react";
import { Link } from "react-router-dom";
import logoWordmark from "../assets/logo-wordmark.svg";

export default function LandingPage() {
  return (
    <div>
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <img src={logoWordmark} alt="PDF Insight AI" className="h-auto w-full max-w-md" />
          <p className="mt-5 max-w-2xl text-xl leading-8 text-muted">
            Upload PDF, buat ringkasan, temukan poin penting, dan tanyakan isi dokumen dengan RAG berbasis konteks lokal.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/upload" className="ai-gradient flex items-center gap-2 rounded-lg px-5 py-3 font-bold text-white shadow-soft">
              <UploadCloud size={20} /> Upload PDF
            </Link>
            <a href="#features" className="flex items-center gap-2 rounded-lg border border-line bg-white px-5 py-3 font-bold text-ink">
              Lihat Fitur <ArrowRight size={18} />
            </a>
          </div>
        </div>
        <div className="glass rounded-lg p-5 shadow-soft">
          <div className="rounded-lg bg-white p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-primary">Smart Document Workspace</p>
                <h2 className="text-2xl font-extrabold">Analisis Proposal.pdf</h2>
              </div>
              <FileSearch className="text-primary" size={34} />
            </div>
            <div className="space-y-3">
              {["Ringkasan otomatis dalam bahasa Indonesia", "Top chunk retrieval dengan vector search", "Source reference dari halaman PDF"].map((item) => (
                <div key={item} className="rounded-lg bg-soft p-4 font-semibold text-muted">{item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section id="features" className="mx-auto grid max-w-7xl gap-4 px-5 py-10 md:grid-cols-3">
        {[
          ["Upload & Extract", UploadCloud, "Validasi PDF, ekstraksi teks, dan penyimpanan lokal."],
          ["AI Analysis", BrainCircuit, "Ringkasan, poin penting, keywords, dan pertanyaan saran."],
          ["Chat with PDF", MessageSquareText, "Jawaban berbasis konteks dengan referensi sumber."],
          ["Quiz & Flashcards", Layers3, "Bahan belajar otomatis dari isi dokumen."],
          ["Compare PDFs", GitCompareArrows, "Bandingkan dua dokumen yang sudah diunggah."],
        ].map(([title, Icon, desc]) => (
          <article key={title} className="rounded-lg border border-line bg-white p-6 shadow-sm">
            <Icon className="mb-4 text-primary" size={34} />
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="mt-2 text-muted">{desc}</p>
          </article>
        ))}
      </section>
      <section id="process" className="mx-auto max-w-7xl px-5 pb-16">
        <div className="rounded-lg bg-ink p-8 text-white">
          <h2 className="text-3xl font-extrabold">Alur kerja lokal</h2>
          <p className="mt-3 max-w-3xl text-white/70">
            PDF disimpan di backend, teks dipotong menjadi chunk, embedding dibuat secara lokal, lalu Groq dipakai untuk menyusun jawaban berdasarkan chunk paling relevan.
          </p>
        </div>
      </section>
    </div>
  );
}
