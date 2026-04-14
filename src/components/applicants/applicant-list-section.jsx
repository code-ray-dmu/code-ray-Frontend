function LoadingApplicantCard({ index }) {
  return (
    <div
      key={`loading-applicant-${index}`}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-2/3 rounded bg-slate-200" />
        <div className="h-4 w-1/2 rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-100" />
        <div className="h-4 w-3/4 rounded bg-slate-100" />
      </div>
    </div>
  );
}

function ApplicantCard({ applicant }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-xl font-semibold text-slate-900">
            {applicant.name ?? 'Unnamed Applicant'}
          </h3>
          <p className="mt-1 text-sm text-slate-500">{applicant.email ?? 'Email unavailable'}</p>
        </div>

        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
          Applicant
        </span>
      </div>

      <dl className="mt-5 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Applicant ID
          </dt>
          <dd className="mt-1 break-all font-medium text-slate-800">{applicant.id ?? '-'}</dd>
        </div>

        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Group ID
          </dt>
          <dd className="mt-1 break-all font-medium text-slate-800">{applicant.groupId ?? '-'}</dd>
        </div>

        <div className="rounded-xl bg-slate-50 px-4 py-3 md:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
            GitHub Profile
          </dt>
          <dd className="mt-1 break-all font-medium text-slate-800">
            {applicant.githubUrl ?? '-'}
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function ApplicantListSection({
  applicants,
  actionLabel,
  isLoading,
  errorMessage,
  onActionClick,
  onRetry,
  onSelectApplicant,
  totalApplicants,
}) {
  if (isLoading) {
    return (
      <section className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Applicants</h3>
          <p className="mt-1 text-sm text-slate-500">
            Loading the applicants for this group.
          </p>
        </div>

        <div className="grid gap-6">
          {[0, 1, 2].map((index) => (
            <LoadingApplicantCard key={index} index={index} />
          ))}
        </div>
      </section>
    );
  }

  if (errorMessage !== null) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h3 className="text-lg font-semibold text-red-900">Unable to load applicants</h3>
        <p className="mt-2 text-sm text-red-700">{errorMessage}</p>

        <button
          onClick={onRetry}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Retry
        </button>
      </section>
    );
  }

  if (applicants.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">No applicants yet</h3>
        <p className="mt-2 text-sm text-slate-500">
          This group does not have any applicants on the current page yet.
        </p>
        {actionLabel ? (
          <button
            type="button"
            onClick={onActionClick}
            className="mt-6 rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            {actionLabel}
          </button>
        ) : null}
      </section>
    );
  }

  return (
      <section className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Applicants</h3>
          <p className="mt-1 text-sm text-slate-500">
            {totalApplicants} total applicants belong to this group.
          </p>
        </div>

        {actionLabel ? (
          <button
            type="button"
            onClick={onActionClick}
            className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>

      <div className="grid gap-6">
        {applicants.map((applicant) => (
          <button
            key={applicant.id ?? `${applicant.email}-${applicant.githubUrl}`}
            type="button"
            onClick={() => onSelectApplicant?.(applicant)}
            disabled={typeof applicant.id !== 'string' || applicant.id.length === 0}
            className="text-left disabled:cursor-not-allowed"
          >
            <ApplicantCard applicant={applicant} />
          </button>
        ))}
      </div>
    </section>
  );
}
