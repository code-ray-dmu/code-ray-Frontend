function formatCreatedAt(createdAt) {
  if (typeof createdAt !== 'string' || createdAt.length === 0) {
    return 'Created date unavailable';
  }

  const createdDate = new Date(createdAt);

  if (Number.isNaN(createdDate.getTime())) {
    return createdAt;
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(createdDate);
}

function LoadingGroupCard({ index }) {
  return (
    <div
      key={`loading-group-${index}`}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-2/3 rounded bg-slate-200" />
        <div className="h-4 w-1/2 rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-100" />
      </div>
    </div>
  );
}

function GroupCard({ group }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-xl font-semibold text-slate-900">{group.name ?? 'Untitled Group'}</h3>
          <p className="mt-1 text-sm text-slate-500">Created {formatCreatedAt(group.createdAt)}</p>
        </div>

        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
          Group
        </span>
      </div>

      <dl className="mt-5 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Group ID</dt>
          <dd className="mt-1 break-all font-medium text-slate-800">{group.id ?? '-'}</dd>
        </div>

        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Created At</dt>
          <dd className="mt-1 font-medium text-slate-800">{formatCreatedAt(group.createdAt)}</dd>
        </div>
      </dl>
    </article>
  );
}

export function GroupListSection({
  groups,
  isLoading,
  errorMessage,
  onRetry,
  onSelectGroup,
  totalGroups,
}) {
  if (isLoading) {
    return (
      <section className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Your Groups</h3>
          <p className="mt-1 text-sm text-slate-500">Loading your authenticated group list.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {[0, 1, 2, 3].map((index) => (
            <LoadingGroupCard key={index} index={index} />
          ))}
        </div>
      </section>
    );
  }

  if (errorMessage !== null) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h3 className="text-lg font-semibold text-red-900">Unable to load groups</h3>
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

  if (groups.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">No groups yet</h3>
        <p className="mt-2 text-sm text-slate-500">
          Your account does not have any groups on this page yet. Connect the create flow next to add one.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Your Groups</h3>
          <p className="mt-1 text-sm text-slate-500">
            {totalGroups} total groups available for your account.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {groups.map((group) => (
          <button
            key={group.id ?? group.name}
            type="button"
            onClick={() => onSelectGroup(group)}
            className="text-left"
          >
            <GroupCard group={group} />
          </button>
        ))}
      </div>
    </section>
  );
}
