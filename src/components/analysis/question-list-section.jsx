import { QuestionCard } from './question-card.jsx';

function QuestionListLoadingState() {
  return (
    <div className="grid gap-5">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="h-7 w-4/5 rounded bg-slate-100" />
            <div className="h-24 rounded-2xl bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function QuestionListSection({
  questions,
  isLoading,
  errorMessage,
  emptyMessage,
  title = 'Generated Questions',
  description = 'Interview questions generated from the completed applicant analysis.',
}) {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-violet-600">AI Questions</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
        </div>

        <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
          {questions.length} questions
        </span>
      </div>

      {isLoading ? <QuestionListLoadingState /> : null}

      {!isLoading && errorMessage !== null ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {!isLoading && errorMessage === null && questions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
          {emptyMessage}
        </div>
      ) : null}

      {!isLoading && errorMessage === null && questions.length > 0 ? (
        <div className="grid gap-5">
          {questions.map((question, index) => (
            <QuestionCard
              key={question.id ?? `${question.category}-${question.priority}-${index}`}
              question={question}
              index={index}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
