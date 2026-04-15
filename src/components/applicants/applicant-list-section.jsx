import { ANALYSIS_STATUS_LABELS, ANALYSIS_STATUS_VALUES } from '../../services/analysis/analysis-types.js';

function getStatusClassName(summary, isRequesting) {
  if (isRequesting) {
    return 'bg-slate-100 text-slate-700';
  }

  if (summary?.status === ANALYSIS_STATUS_VALUES.COMPLETED) {
    return 'bg-emerald-50 text-emerald-700';
  }

  if (summary?.status === ANALYSIS_STATUS_VALUES.IN_PROGRESS) {
    return 'bg-blue-50 text-blue-700';
  }

  if (summary?.status === ANALYSIS_STATUS_VALUES.FAILED) {
    return 'bg-red-50 text-red-700';
  }

  if (summary?.status === ANALYSIS_STATUS_VALUES.QUEUED) {
    return 'bg-amber-50 text-amber-700';
  }

  return 'bg-slate-100 text-slate-700';
}

function getProgressBarClassName(summary, isRequesting) {
  if (isRequesting) {
    return 'bg-slate-500';
  }

  if (summary?.status === ANALYSIS_STATUS_VALUES.COMPLETED) {
    return 'bg-emerald-500';
  }

  if (summary?.status === ANALYSIS_STATUS_VALUES.FAILED) {
    return 'bg-red-500';
  }

  if (summary?.status === ANALYSIS_STATUS_VALUES.QUEUED) {
    return 'bg-amber-500';
  }

  return 'bg-blue-500';
}

function getProgressMessage(item) {
  const currentStageLabel = item.summary?.currentStageLabel;

  if (item.isRequesting) {
    return '분석 요청 중...';
  }

  if (item.summary === null) {
    return '분석 시작 대기';
  }

  if (item.summary.status === ANALYSIS_STATUS_VALUES.QUEUED) {
    return currentStageLabel === undefined || currentStageLabel === null
      ? `대기 중... ${item.progressPercent}%`
      : `대기 중... ${item.progressPercent}% · ${currentStageLabel}`;
  }

  if (item.summary.status === ANALYSIS_STATUS_VALUES.IN_PROGRESS) {
    return currentStageLabel === undefined || currentStageLabel === null
      ? `분석 중... ${item.progressPercent}%`
      : `분석 중... ${item.progressPercent}% · ${currentStageLabel}`;
  }

  if (item.summary.status === ANALYSIS_STATUS_VALUES.COMPLETED) {
    return '분석 완료. 질문을 확인할 수 있습니다.';
  }

  return '분석 실패. 안내 메시지를 확인한 뒤 다시 시도해 주세요.';
}

function getRowMessage(item) {
  if (item.requestErrorMessage.length > 0) {
    return {
      tone: 'error',
      text: item.requestErrorMessage,
    };
  }

  if (item.pollingErrorMessage.length > 0) {
    return {
      tone: 'warning',
      text: item.pollingErrorMessage,
    };
  }

  if (item.infoMessage.length > 0) {
    return {
      tone: 'info',
      text: item.infoMessage,
    };
  }

  return null;
}

function getRowMessageClassName(tone) {
  if (tone === 'error') {
    return 'border-red-200 bg-red-50 text-red-700';
  }

  if (tone === 'warning') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
}

function LoadingApplicantRow({ index }) {
  return (
    <div
      key={`loading-applicant-${index}`}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-48 rounded bg-slate-200" />
        <div className="h-4 w-64 rounded bg-slate-200" />
        <div className="h-3 rounded-full bg-slate-100" />
        <div className="grid gap-3 md:grid-cols-3">
          <div className="h-14 rounded-2xl bg-slate-100" />
          <div className="h-14 rounded-2xl bg-slate-100" />
          <div className="h-14 rounded-2xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

function ApplicantAnalysisRow({ item, onViewQuestions }) {
  const rowMessage = getRowMessage(item);
  const statusLabel = item.isRequesting
    ? '시작 중'
    : ANALYSIS_STATUS_LABELS[item.summary?.status] ?? '준비됨';

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="truncate text-xl font-semibold text-slate-900">
              {item.applicant.name ?? '이름 없는 지원자'}
            </h3>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClassName(
                item.summary,
                item.isRequesting,
              )}`}
            >
              {statusLabel}
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            {item.applicant.email ?? '이메일 정보 없음'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onViewQuestions(item.applicant)}
          disabled={!item.canViewQuestions}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          질문 보기
        </button>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="font-medium text-slate-700">{getProgressMessage(item)}</p>
          <p className="font-semibold text-slate-900">{item.progressPercent}%</p>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-700 ${getProgressBarClassName(
              item.summary,
              item.isRequesting,
            )}`}
            style={{ width: `${item.progressPercent}%` }}
          />
        </div>
      </div>

      <dl className="mt-6 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 px-4 py-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            현재 단계
          </dt>
          <dd className="mt-2 font-medium text-slate-900">
            {item.summary?.currentStageLabel ?? '-'}
          </dd>
        </div>

        <div className="rounded-2xl bg-slate-50 px-4 py-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            추적 중인 실행
          </dt>
          <dd className="mt-2 font-medium text-slate-900">{item.summary?.totalRuns ?? 0}</dd>
        </div>

        <div className="rounded-2xl bg-slate-50 px-4 py-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            GitHub 프로필
          </dt>
          <dd className="mt-2 break-all font-medium text-slate-900">
            {item.applicant.githubUrl ?? '-'}
          </dd>
        </div>
      </dl>

      {rowMessage !== null ? (
        <div
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${getRowMessageClassName(
            rowMessage.tone,
          )}`}
        >
          {rowMessage.text}
        </div>
      ) : null}
    </article>
  );
}

export function ApplicantListSection({
  analysisItems,
  batchErrorMessage,
  batchInfoMessage,
  canStartAnalysis,
  emptyActionLabel,
  isLoading,
  isStartingAnalysis,
  errorMessage,
  onAddApplicant,
  onRetry,
  onStartAnalysis,
  onViewQuestions,
  totalApplicants,
}) {
  if (isLoading) {
    return (
      <section className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">지원자 일괄 분석</h3>
          <p className="mt-1 text-sm text-slate-500">
            이 그룹의 지원자 목록을 불러오는 중입니다.
          </p>
        </div>

        <div className="grid gap-6">
          {[0, 1, 2].map((index) => (
            <LoadingApplicantRow key={index} index={index} />
          ))}
        </div>
      </section>
    );
  }

  if (errorMessage !== null) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h3 className="text-lg font-semibold text-red-900">지원자 목록을 불러오지 못했습니다</h3>
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

  if (analysisItems.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">아직 지원자가 없습니다</h3>
        <p className="mt-2 text-sm text-slate-500">
          먼저 지원자를 여러 명 추가한 뒤 이 목록에서 일괄 분석을 시작해 보세요.
        </p>
        {emptyActionLabel ? (
          <button
            type="button"
            onClick={onAddApplicant}
            className="mt-6 rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            {emptyActionLabel}
          </button>
        ) : null}
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">지원자 일괄 분석</h3>
          <p className="mt-1 text-sm text-slate-500">
            여러 지원자의 분석을 한 번에 시작하고 각 행의 진행 상태를 실시간으로 확인할 수 있습니다.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            이 그룹에는 총 {totalApplicants}명의 지원자가 있습니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onAddApplicant}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            지원자 추가
          </button>

          <button
            type="button"
            onClick={onStartAnalysis}
            disabled={!canStartAnalysis || isStartingAnalysis}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isStartingAnalysis ? '분석 시작 중...' : '분석 시작'}
          </button>
        </div>
      </div>

      {batchInfoMessage.length > 0 ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
          {batchInfoMessage}
        </div>
      ) : null}

      {batchErrorMessage.length > 0 ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {batchErrorMessage}
        </div>
      ) : null}

      <div className="grid gap-6">
        {analysisItems.map((item) => (
          <ApplicantAnalysisRow
            key={item.applicant.id ?? `${item.applicant.email}-${item.applicant.githubUrl}`}
            item={item}
            onViewQuestions={onViewQuestions}
          />
        ))}
      </div>
    </section>
  );
}
