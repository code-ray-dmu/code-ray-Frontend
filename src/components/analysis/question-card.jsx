function getCategoryClassName(category) {
  if (category === 'CULTURE_FIT') {
    return 'bg-amber-50 text-amber-700';
  }

  return 'bg-blue-50 text-blue-700';
}

export function QuestionCard({ question, index }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Question {index + 1}
          </p>
          <h3 className="mt-2 text-lg font-semibold leading-7 text-slate-900">
            {question.questionText}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${getCategoryClassName(question.category)}`}
          >
            {question.category ?? 'UNKNOWN'}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            Priority {question.priority}
          </span>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Intent
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-700">{question.intent}</p>
      </div>
    </article>
  );
}
