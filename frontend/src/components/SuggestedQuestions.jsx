export default function SuggestedQuestions({ questions = [], onPick }) {
  return (
    <section className="rounded-lg border border-line bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">Pertanyaan Disarankan</h2>
      <div className="mt-4 grid gap-2">
        {questions.map((question) => (
          <button
            key={question}
            onClick={() => onPick?.(question)}
            className="rounded-lg border border-line px-4 py-3 text-left text-sm font-semibold text-muted hover:border-primary hover:bg-soft hover:text-primary"
          >
            {question}
          </button>
        ))}
      </div>
    </section>
  );
}
