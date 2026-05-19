import { CheckCircle2 } from "lucide-react";

export default function QuizCard({ quiz = [] }) {
  return (
    <section className="rounded-lg border border-line bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">AI Quiz</h2>
      <div className="mt-4 space-y-4">
        {quiz.map((item, index) => (
          <article key={`${item.question}-${index}`} className="rounded-lg bg-soft p-4">
            <p className="font-bold text-ink">{index + 1}. {item.question}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {item.options?.map((option, optionIndex) => (
                <div key={option} className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-muted">
                  {String.fromCharCode(65 + optionIndex)}. {option}
                </div>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-success">
              <CheckCircle2 size={16} /> Jawaban: {item.answer}
            </p>
            <p className="mt-1 text-sm text-muted">{item.explanation}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
