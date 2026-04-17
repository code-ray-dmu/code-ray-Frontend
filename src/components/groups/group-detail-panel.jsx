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

function formatApplicantCount(applicantCount) {
  if (!Number.isInteger(applicantCount) || applicantCount < 0) {
    return '-';
  }

  return `${applicantCount}명`;
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

  return priority ?? '미정';
}

export function GroupDetailPanel({ group, applicantCount }) {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-600">그룹 정보</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              {group.name ?? '이름 없는 그룹'}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              {group.description ?? '아직 그룹 설명이 등록되지 않았습니다.'}
            </p>
          </div>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
            {getCultureFitPriorityLabel(group.cultureFitPriority)}
          </span>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <DetailItem label="등록 지원자 수" value={formatApplicantCount(applicantCount)} />
          <DetailItem label="프레임워크" value={group.techStacks.framework || '-'} />
          <DetailItem label="데이터베이스" value={group.techStacks.db || '-'} />
          <DetailItem
            label="컬처 핏 우선순위"
            value={getCultureFitPriorityLabel(group.cultureFitPriority)}
          />
        </div>
      </div>
    </section>
  );
}
