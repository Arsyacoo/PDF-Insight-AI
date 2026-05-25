export default function AnalysisMetrics({ metrics = {}, pageStats = [] }) {
  const topPages = [...pageStats]
    .sort((left, right) => right.word_count - left.word_count)
    .slice(0, 5);

  const cards = [
    ["Total Halaman", metrics.total_pages ?? "-"],
    ["Halaman Berteks", metrics.pages_with_text ?? "-"],
    ["Total Kata", formatNumber(metrics.total_words)],
    ["Rata-rata Kata/Halaman", metrics.average_words_per_page ?? "-"],
  ];

  return (
    <section className="rounded-lg border border-line bg-white p-6 shadow-sm lg:col-span-2">
      <h2 className="text-xl font-bold">EDA Dokumen</h2>
      <p className="mt-1 text-sm text-muted">Statistik dasar untuk menilai kepadatan dan kualitas ekstraksi teks.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-lg bg-soft p-4">
            <p className="text-sm font-semibold text-muted">{label}</p>
            <p className="mt-1 text-2xl font-extrabold text-primary">{value}</p>
          </div>
        ))}
      </div>
      {!!topPages.length && (
        <div className="mt-5">
          <h3 className="font-bold">Halaman Terpadat</h3>
          <div className="mt-3 space-y-2">
            {topPages.map((page) => (
              <div key={page.page_number} className="flex items-center gap-3">
                <span className="w-24 text-sm font-semibold text-muted">Hal. {page.page_number}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-soft">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max((page.word_count / Math.max(topPages[0].word_count, 1)) * 100, 5)}%` }}
                  />
                </div>
                <span className="w-20 text-right text-sm font-semibold text-muted">{formatNumber(page.word_count)} kata</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function formatNumber(value) {
  if (value === undefined || value === null) return "-";
  return new Intl.NumberFormat("id-ID").format(value);
}
