const badgeStyles = {
  Good: "bg-green-50 text-green-700 border-green-200",
  Fair: "bg-amber-50 text-amber-700 border-amber-200",
  Poor: "bg-red-50 text-red-700 border-red-200",
};

export default function DocumentQualityCard({ quality }) {
  if (!quality) return null;
  const label = quality.quality_label || "Fair";
  const scanPercent = Math.round((quality.scan_probability || 0) * 100);

  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Document Quality</h2>
          <p className="mt-1 text-sm text-muted">Estimasi kualitas ekstraksi teks PDF.</p>
        </div>
        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${badgeStyles[label] || badgeStyles.Fair}`}>{label}</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Scan Probability" value={`${scanPercent}% (${quality.scan_probability_label || "Low"})`} />
        <Metric label="Readable Pages" value={quality.readable_pages ?? "-"} />
        <Metric label="Empty Pages" value={quality.empty_pages ?? "-"} />
        <Metric label="Avg. Characters/Page" value={quality.average_characters_per_page ?? "-"} />
      </div>
      <p className={`mt-4 rounded-lg p-3 text-sm font-semibold ${label === "Poor" ? "bg-red-50 text-red-700" : "bg-soft text-muted"}`}>
        {quality.recommendation}
      </p>
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg bg-soft p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-ink">{value}</p>
    </div>
  );
}
