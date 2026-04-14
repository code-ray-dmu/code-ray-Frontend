function getStageStateClassName(state) {
  if (state === 'done') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (state === 'current') {
    return 'border-blue-200 bg-blue-50 text-blue-700';
  }

  if (state === 'failed') {
    return 'border-red-200 bg-red-50 text-red-700';
  }

  return 'border-slate-200 bg-slate-50 text-slate-500';
}

function getStageStateLabel(state) {
  if (state === 'done') {
    return 'Done';
  }

  if (state === 'current') {
    return 'Current';
  }

  if (state === 'failed') {
    return 'Failed';
  }

  return 'Pending';
}

export function AnalysisStageTimeline({ stages }) {
  if (!Array.isArray(stages) || stages.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-500">
        Stage information will appear once the analysis begins.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {stages.map((stage, index) => (
        <div
          key={stage.key}
          className={`rounded-2xl border px-4 py-4 ${getStageStateClassName(stage.state)}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                Stage {index + 1}
              </p>
              <p className="mt-1 text-sm font-semibold">{stage.label}</p>
              {typeof stage.description === 'string' && stage.description.length > 0 ? (
                <p className="mt-2 text-sm opacity-80">{stage.description}</p>
              ) : null}
            </div>

            <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold">
              {getStageStateLabel(stage.state)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
