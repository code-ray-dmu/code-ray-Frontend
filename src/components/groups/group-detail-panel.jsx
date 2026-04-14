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

export function GroupDetailPanel({ group }) {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-600">Group Detail</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              {group.name ?? 'Untitled Group'}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              {group.description ?? 'No group description has been provided yet.'}
            </p>
          </div>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
            {group.cultureFitPriority ?? 'N/A'}
          </span>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <DetailItem label="Group ID" value={group.id ?? '-'} shouldWrap />
          <DetailItem label="Framework" value={group.techStacks.framework || '-'} />
          <DetailItem label="Database" value={group.techStacks.db || '-'} />
          <DetailItem
            label="Culture Fit Priority"
            value={group.cultureFitPriority ?? '-'}
          />
        </div>
      </div>
    </section>
  );
}

