import {
  ANALYSIS_STATUS_LABELS,
  ANALYSIS_STATUS_VALUES,
} from '../../services/analysis/analysis-types.js';
import { AnalysisStageTimeline } from './analysis-stage-timeline.jsx';

function getStatusClassName(status) {
  if (status === ANALYSIS_STATUS_VALUES.COMPLETED) {
    return 'bg-emerald-50 text-emerald-700';
  }

  if (status === ANALYSIS_STATUS_VALUES.IN_PROGRESS) {
    return 'bg-blue-50 text-blue-700';
  }

  if (status === ANALYSIS_STATUS_VALUES.FAILED) {
    return 'bg-red-50 text-red-700';
  }

  return 'bg-amber-50 text-amber-700';
}

function formatTimestamp(value) {
  if (typeof value !== 'string' || value.length === 0) {
    return '-';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleString();
}

function getStatusDescription(summary) {
  if (summary.status === ANALYSIS_STATUS_VALUES.COMPLETED) {
    return '추적 중인 저장소 분석이 모두 완료되었습니다. 생성된 면접 질문을 확인할 수 있습니다.';
  }

  if (summary.status === ANALYSIS_STATUS_VALUES.FAILED) {
    return '추적 중인 저장소 분석 중 하나 이상이 실패했습니다. 실패 원인을 확인한 뒤 다시 시도해 주세요.';
  }

  if (summary.status === ANALYSIS_STATUS_VALUES.IN_PROGRESS) {
    return '지원자 분석이 진행 중입니다. 상태는 3초마다 자동으로 새로고침됩니다.';
  }

  return '분석 요청이 접수되었고, 워커 처리가 시작되기를 기다리고 있습니다.';
}

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function AnalysisProgressPanel({ summary, stages }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600">AI 분석 진행 현황</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            {ANALYSIS_STATUS_LABELS[summary.status] ?? summary.status ?? '대기 중'}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            {getStatusDescription(summary)}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClassName(summary.status)}`}
        >
          {ANALYSIS_STATUS_LABELS[summary.status] ?? summary.status ?? '대기 중'}
        </span>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryItem label="추적 중인 실행" value={summary.totalRuns} />
        <SummaryItem label="완료" value={summary.completedRuns} />
        <SummaryItem label="실패" value={summary.failedRuns} />
        <SummaryItem label="현재 단계" value={summary.currentStageLabel ?? '-'} />
      </div>

      {typeof summary.failureReasonMessage === 'string' && summary.failureReasonMessage.length > 0 ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {summary.failureReasonMessage}
        </div>
      ) : null}

      <div className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">단계 타임라인</h3>
            <p className="mt-1 text-sm text-slate-500">
              워커가 이 지원자를 처리하는 동안 백엔드 단계가 자동으로 갱신됩니다.
            </p>
          </div>

          <div className="text-right text-sm text-slate-500">
            <p>3초마다 상태 확인</p>
            <p className="mt-1">마지막 확인: {formatTimestamp(summary.lastUpdatedAt)}</p>
          </div>
        </div>

        <AnalysisStageTimeline stages={stages} />
      </div>
    </section>
  );
}
