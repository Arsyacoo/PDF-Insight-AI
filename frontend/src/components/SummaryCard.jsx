export default function SummaryCard({ summary }) {
  return (
    <section className="rounded-lg border border-line bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">Ringkasan Dokumen</h2>
      <p className="mt-3 whitespace-pre-line leading-7 text-muted">{summary || "Ringkasan belum dibuat."}</p>
    </section>
  );
}
