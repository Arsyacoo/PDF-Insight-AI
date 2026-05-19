export default function FlashcardGrid({ cards = [] }) {
  return (
    <section className="rounded-lg border border-line bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">Flashcards</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card, index) => (
          <article key={`${card.front}-${index}`} className="min-h-36 rounded-lg border border-line bg-soft p-4">
            <p className="text-sm font-semibold text-primary">Front</p>
            <h3 className="mt-1 text-lg font-bold text-ink">{card.front}</h3>
            <p className="mt-4 text-sm font-semibold text-primary">Back</p>
            <p className="mt-1 text-sm leading-6 text-muted">{card.back}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
