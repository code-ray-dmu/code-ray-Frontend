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
            <p className="text-sm font-medium text-emerald-600">지원자 정보</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              {applicant.name ?? '이름 없는 지원자'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              지원자 상세 API에서 불러온 기본 정보를 확인할 수 있습니다.
            </p>
          </div>

          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
            지원자
          </span>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <DetailItem label="지원자 ID" value={applicant.id ?? '-'} shouldWrap />
          <DetailItem label="그룹 ID" value={applicant.groupId ?? '-'} shouldWrap />
          <DetailItem label="이메일" value={applicant.email ?? '-'} shouldWrap />
          <DetailItem label="GitHub 프로필" value={applicant.githubUrl ?? '-'} shouldWrap />
        </div>
      </div>
    </section>
  );
}
