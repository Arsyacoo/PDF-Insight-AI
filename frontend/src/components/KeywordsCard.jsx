export default function KeywordsCard({ keywords = [] }) {
  return (
    <section className="rounded-lg border border-line bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">Keywords</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {keywords.map((keyword) => (
          <span key={keyword} className="rounded-lg bg-soft px-3 py-1.5 text-sm font-semibold text-primary">
            {keyword}
          </span>
        ))}
      </div>
    </section>
  );
}
