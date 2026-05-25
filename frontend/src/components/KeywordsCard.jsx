export default function KeywordsCard({ keywords = [], keywordDetails = [] }) {
  const details = keywordDetails.length
    ? keywordDetails
    : keywords.map((keyword) => ({ keyword, count: null }));

  return (
    <section className="rounded-lg border border-line bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">Keywords</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {details.map((item) => (
          <span key={item.keyword} className="rounded-lg bg-soft px-3 py-1.5 text-sm font-semibold text-primary">
            {item.keyword}
            {item.count !== null && <span className="ml-1 text-xs text-muted">({item.count})</span>}
          </span>
        ))}
      </div>
    </section>
  );
}
