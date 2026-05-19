export default function KeyPointsCard({ points = [] }) {
  return (
    <section className="rounded-lg border border-line bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">Poin Penting</h2>
      <ul className="mt-4 space-y-3">
        {points.map((point, index) => (
          <li key={point} className="flex gap-3 text-muted">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-soft text-sm font-bold text-primary">{index + 1}</span>
            {point}
          </li>
        ))}
      </ul>
    </section>
  );
}
