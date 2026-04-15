function formatRelativeUpdatedAt(createdAt) {
  if (typeof createdAt !== 'string' || createdAt.length === 0) {
    return '최근 업데이트';
  }

  const createdTime = new Date(createdAt).getTime();

  if (Number.isNaN(createdTime)) {
    return '최근 업데이트';
  }

  const diffMs = Date.now() - createdTime;
  const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));

  if (diffMinutes < 60) {
    return `${diffMinutes}분 전 업데이트`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}시간 전 업데이트`;
  }

  const diffDays = Math.floor(diffHours / 24);

  return `${diffDays}일 전 업데이트`;
}

function getGroupStatusLabel(group) {
  if (typeof group.applicantCount === 'number' && group.applicantCount > 0) {
    return '준비 완료';
  }

  return '초안';
}

function getGroupStatusClassName(group) {
  if (getGroupStatusLabel(group) === '준비 완료') {
    return 'bg-blue-50 text-blue-600';
  }

  return 'bg-slate-100 text-slate-600';
}

function getGroupTags(group) {
  return [
    group.techStacks?.framework,
    group.techStacks?.db,
    getCultureFitPriorityLabel(group.cultureFitPriority),
  ].filter((value) => typeof value === 'string' && value.length > 0);
}

function getCultureFitPriorityLabel(priority) {
  if (priority === 'HIGH') {
    return '높음';
  }

  if (priority === 'MEDIUM') {
    return '보통';
  }

  if (priority === 'LOW') {
    return '낮음';
  }

  return priority ?? null;
}

function getGroupDescription(group) {
  if (typeof group.description === 'string' && group.description.length > 0) {
    return group.description;
  }

  return '지원자 분석과 면접 질문 생성을 바로 시작할 수 있는 면접 그룹입니다.';
}

function getBottomMetrics(group) {
  return [
    {
      label: '지원자',
      value:
        typeof group.applicantCount === 'number' ? `${group.applicantCount}명` : null,
    },
    {
      label: '우선순위',
      value:
        typeof group.cultureFitPriority === 'string' && group.cultureFitPriority.length > 0
          ? getCultureFitPriorityLabel(group.cultureFitPriority)
          : null,
    },
  ].filter((metric) => metric.value !== null);
}

function LoadingGroupCard({ index }) {
  return (
    <div
      key={`loading-group-${index}`}
      className="min-h-[260px] rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
    >
      <div className="flex h-full animate-pulse flex-col space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="h-6 w-40 rounded bg-slate-200" />
            <div className="h-4 w-28 rounded bg-slate-100" />
          </div>
          <div className="h-9 w-20 rounded-full bg-slate-100" />
        </div>

        <div className="flex min-h-[2.5rem] gap-3">
          <div className="h-9 w-20 rounded-xl bg-slate-100" />
          <div className="h-9 w-28 rounded-xl bg-slate-100" />
          <div className="h-9 w-24 rounded-xl bg-slate-100" />
        </div>

        <div className="min-h-[3.5rem] space-y-3">
          <div className="h-5 w-full rounded bg-slate-100" />
          <div className="h-5 w-2/3 rounded bg-slate-100" />
        </div>

        <div className="mt-auto flex items-center justify-between pt-4">
          <div className="h-5 w-28 rounded bg-slate-100" />
          <div className="h-5 w-20 rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

function GroupCard({ group }) {
  const tags = getGroupTags(group);
  const metrics = getBottomMetrics(group);

  return (
    <article className="flex h-full min-h-[260px] flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(15,23,42,0.11)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-2xl font-semibold tracking-tight text-slate-950">
            {group.name ?? '이름 없는 그룹'}
          </h3>
          <p className="mt-2 text-sm font-medium text-slate-400">
            {formatRelativeUpdatedAt(group.createdAt)}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1.5 text-sm font-semibold ${getGroupStatusClassName(
            group,
          )}`}
        >
          {getGroupStatusLabel(group)}
        </span>
      </div>

      <div className="mt-6 flex min-h-[2.5rem] flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700"
          >
            {tag}
          </span>
        ))}
      </div>

      <p className="mt-6 min-h-[3.5rem] line-clamp-2 text-base font-medium leading-7 text-slate-700">
        {getGroupDescription(group)}
      </p>

      {metrics.length > 0 ? (
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-8 text-sm text-slate-500">
          {metrics.map((metric) => (
            <div key={metric.label} className="font-medium text-slate-500">
              {metric.value}
            </div>
          ))}
        </div>
      ) : null}
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
          <h3 className="text-lg font-semibold text-slate-900">내 그룹</h3>
          <p className="mt-1 text-sm text-slate-500">그룹 목록을 불러오는 중입니다.</p>
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
        <h3 className="text-lg font-semibold text-red-900">그룹을 불러오지 못했습니다</h3>
        <p className="mt-2 text-sm text-red-700">{errorMessage}</p>

        <button
          onClick={onRetry}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          다시 시도
        </button>
      </section>
    );
  }

  if (groups.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">아직 그룹이 없습니다</h3>
        <p className="mt-2 text-sm text-slate-500">
          아직 등록된 그룹이 없습니다. 옆의 그룹 만들기 버튼으로 새 그룹을 추가해 보세요.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">내 그룹</h3>
          <p className="mt-1 text-sm text-slate-500">
            총 {totalGroups}개의 그룹이 있습니다.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {groups.map((group) => (
          <button
            key={group.id ?? group.name}
            type="button"
            onClick={() => onSelectGroup(group)}
            className="h-full text-left"
          >
            <GroupCard group={group} />
          </button>
        ))}
      </div>
    </section>
  );
}
