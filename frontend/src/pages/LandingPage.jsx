import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  FileQuestion,
  FileText,
  GitCompareArrows,
  GraduationCap,
  Layers3,
  MessageSquareText,
  Search,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { Link } from "react-router-dom";

const valueCards = [
  ["Ringkasan Otomatis", FileText],
  ["Chat dengan Sumber", MessageSquareText],
  ["Quiz & Flashcards", GraduationCap],
  ["Export Report", UploadCloud],
];

const features = [
  ["Ringkasan Cerdas", Sparkles, "Ubah dokumen panjang menjadi ringkasan singkat dan mudah dipahami dalam hitungan detik."],
  ["Poin Penting & Keywords", Search, "Temukan inti pembahasan dan istilah utama dalam dokumen tanpa perlu membaca seluruh halaman."],
  ["Chat dengan PDF", MessageSquareText, "Ajukan pertanyaan spesifik dan dapatkan jawaban akurat berdasarkan isi teks dokumen."],
  ["Source Reference", FileQuestion, "Setiap jawaban AI menyertakan halaman dan cuplikan teks sebagai bukti validasi."],
  ["Quiz & Flashcards", Layers3, "Buat bahan belajar interaktif secara otomatis dari isi dokumen untuk menguji pemahaman."],
  ["Compare Documents", GitCompareArrows, "Bandingkan dua versi PDF untuk melihat persamaan, perbedaan, dan revisi utama secara cepat."],
];

const steps = [
  ["Upload PDF", UploadCloud, "Pilih dokumen PDF berbasis teks dari perangkat Anda."],
  ["Ekstraksi Teks", FileText, "Sistem membaca dan menyusun paragraf untuk diproses AI."],
  ["Analisis AI", BrainCircuit, "AI menghasilkan ringkasan dan konteks komprehensif."],
  ["Tanya & Pelajari", MessageSquareText, "Gunakan chat, quiz, atau export hasil untuk pembelajaran."],
];

const useCases = [
  ["Mahasiswa", GraduationCap],
  ["Peneliti", BrainCircuit],
  ["Profesional", BriefcaseBusiness],
  ["Pembelajar Mandiri", BookOpen],
];

export default function LandingPage() {
  return (
    <div className="overflow-hidden bg-[#f6f3ff] text-ink">
      <section className="relative border-b border-indigo-100/80 bg-gradient-to-br from-white via-[#f4efff] to-[#ece8ff]">
        <div className="absolute -right-24 top-16 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute left-1/3 top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="mx-auto grid max-w-[1500px] gap-12 px-6 py-12 md:px-10 md:py-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center xl:px-12">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/70 px-3 py-1.5 text-xs font-bold text-primary shadow-sm">
              <Sparkles size={14} /> AI Document Intelligence
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.04] tracking-tight text-[#0f172a] md:text-5xl xl:text-6xl">
              Pahami Dokumen PDF Lebih Cepat dengan <span className="text-primary">AI</span>
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-muted md:text-lg">
              Upload PDF berbasis teks, dapatkan ringkasan, poin penting, quiz, flashcards, dan chat berbasis sumber dalam satu aplikasi.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/upload" className="ai-gradient inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5">
                Mulai Analisis PDF <ArrowRight size={18} />
              </Link>
              <a href="#features" className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-5 py-3 text-sm font-extrabold text-ink shadow-sm hover:border-primary/40">
                <CheckCircle2 size={18} /> Lihat Fitur
              </a>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs font-medium text-muted">
              <AlertTriangle size={14} /> Mendukung PDF berbasis teks. PDF scan/gambar belum didukung.
            </p>
          </div>
          <HeroMockup />
        </div>
        <div className="border-y border-indigo-100/70 bg-white/45 backdrop-blur">
          <div className="mx-auto max-w-[1500px] px-6 py-5 md:px-10 xl:px-12">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {valueCards.map(([label, Icon]) => (
                <div key={label} className="flex items-center justify-center gap-3 rounded-2xl border border-indigo-100/90 bg-white/65 px-5 py-4 text-base font-extrabold text-muted shadow-sm">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-primary">
                    <Icon size={18} />
                  </span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-6 py-10 md:px-10 xl:px-12">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber shadow-sm">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 shrink-0" size={18} />
            <div>
              <p className="font-bold text-ink">Catatan Format PDF</p>
              <p className="mt-1">Saat ini PDF Insight AI hanya mendeteksi teks digital pada PDF. Format PDF hasil scan atau dokumen fisik belum dapat diproses oleh AI kami. Pastikan PDF Anda berisi teks yang dapat disorot/select.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-[1500px] px-6 pb-14 pt-2 md:px-10 xl:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-black tracking-tight md:text-4xl">Semua yang Dibutuhkan untuk Memahami PDF</h2>
          <p className="mt-3 text-muted">Satu platform, beragam alat kecerdasan buatan untuk mengurai kerumitan dokumen Anda.</p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {features.map(([title, Icon, desc], index) => (
            <article key={title} className={`${index === 0 ? "md:col-span-2" : ""} rounded-2xl border border-indigo-100 bg-white/85 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-soft`}>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
                <Icon size={22} />
              </div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{desc}</p>
              {index === 0 && (
                <div className="mt-7 flex gap-2">
                  <span className="h-2 flex-1 rounded-full bg-indigo-100" />
                  <span className="h-2 flex-1 rounded-full bg-indigo-100" />
                  <span className="h-2 flex-1 rounded-full bg-purple-200" />
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section id="process" className="border-y border-indigo-100 bg-white py-16">
        <div className="mx-auto max-w-[1500px] px-6 md:px-10 xl:px-12">
          <div className="text-center">
            <h2 className="text-3xl font-black">Cara Kerja</h2>
            <p className="mt-2 text-muted">4 langkah sederhana menuju pemahaman dokumen yang lebih baik.</p>
          </div>
          <div className="relative mt-12 grid gap-8 md:grid-cols-4">
            <div className="absolute left-0 right-0 top-10 hidden h-px bg-indigo-200 md:block" />
            {steps.map(([title, Icon, desc], index) => (
              <div key={title} className="relative text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-indigo-100 bg-[#eef2ff] text-primary shadow-sm">
                  <Icon size={28} />
                </div>
                <span className="absolute left-1/2 top-16 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-white text-xs font-bold text-primary shadow-sm">{index + 1}</span>
                <h3 className="mt-5 font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-6 md:px-10 xl:px-12 py-16">
        <h2 className="text-center text-3xl font-black">Cocok untuk</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {useCases.map(([label, Icon]) => (
            <div key={label} className="rounded-2xl border border-indigo-100 bg-white p-6 text-center shadow-sm">
              <Icon className="mx-auto text-primary" size={26} />
              <p className="mt-3 font-semibold text-muted">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 rounded-[2rem] bg-gradient-to-br from-primary to-secondary p-8 text-center text-white shadow-soft md:p-12 xl:p-14">
          <h2 className="text-3xl font-black md:text-4xl">Siap Memahami PDF Lebih Cepat?</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/80">Mulai analisis dokumen pertama Anda hari ini. Tidak memerlukan kartu kredit untuk mencoba fitur dasar.</p>
          <Link to="/upload" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-extrabold text-primary shadow-lg">
            <UploadCloud size={18} /> Upload PDF Sekarang
          </Link>
        </div>
      </section>
    </div>
  );
}

function HeroMockup() {
  return (
    <div className="relative z-10 mx-auto w-full max-w-2xl">
      <div className="rounded-[1.75rem] border border-indigo-100 bg-white/70 p-5 shadow-soft backdrop-blur">
        <div className="rounded-[1.25rem] border border-indigo-100 bg-[#f8faff] p-4">
          <div className="mb-5 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
            <span className="ml-4 rounded-full border border-line bg-white px-8 py-1 text-[10px] text-muted">Q3_Financial_Report.pdf</span>
          </div>
          <div className="grid min-h-[360px] gap-5 md:grid-cols-[0.95fr_1fr]">
            <div className="rounded-xl border border-indigo-100 bg-white p-4">
              <div className="h-5 w-32 rounded bg-indigo-100" />
              <div className="mt-6 space-y-3">
                <div className="h-3 rounded bg-indigo-100" />
                <div className="h-3 rounded bg-purple-200" />
                <div className="h-3 w-4/5 rounded bg-indigo-100" />
                <div className="mt-6 h-3 w-2/3 rounded bg-indigo-100" />
                <div className="h-3 rounded bg-indigo-100" />
                <div className="h-3 w-3/4 rounded bg-indigo-100" />
              </div>
            </div>
            <div className="flex flex-col justify-between rounded-xl border border-indigo-100 bg-white p-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-primary"><Sparkles size={14} /> AI Summary</div>
                <p className="mt-3 text-xs leading-6 text-muted">The Q3 report indicates a 15% revenue growth, primarily driven by the new SaaS product launch in APAC...</p>
              </div>
              <div className="rounded-lg bg-soft p-3 text-[10px] text-muted">
                Berdasarkan <span className="font-bold text-primary">Halaman #1</span>, pertumbuhan tertinggi terjadi di sektor layanan cloud.
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -left-4 top-1/2 hidden h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-soft md:flex">
        <MessageSquareText size={22} />
      </div>
      <div className="absolute -right-5 top-1/3 hidden h-14 w-14 items-center justify-center rounded-2xl bg-white text-secondary shadow-soft md:flex">
        <Sparkles size={24} />
      </div>
    </div>
  );
}
