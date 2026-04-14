function DetailItem({ label, value, shouldWrap = false }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-2 text-sm font-medium text-slate-900 ${shouldWrap ? 'break-all' : ''}`}>
        {value}
      </p>
    </div>
  );
}

export function ApplicantDetailPanel({ applicant }) {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-emerald-600">Applicant Detail</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              {applicant.name ?? 'Unnamed Applicant'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Review the identity information fetched from the applicant detail API.
            </p>
          </div>

          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
            Applicant
          </span>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <DetailItem label="Applicant ID" value={applicant.id ?? '-'} shouldWrap />
          <DetailItem label="Group ID" value={applicant.groupId ?? '-'} shouldWrap />
          <DetailItem label="Email" value={applicant.email ?? '-'} shouldWrap />
          <DetailItem label="GitHub Profile" value={applicant.githubUrl ?? '-'} shouldWrap />
        </div>
      </div>
    </section>
  );
}
