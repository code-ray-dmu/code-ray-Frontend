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
    return 'All tracked repository analyses finished successfully. Generated interview questions are ready.';
  }

  if (summary.status === ANALYSIS_STATUS_VALUES.FAILED) {
    return 'At least one tracked repository analysis failed. Review the failure details before retrying.';
  }

  if (summary.status === ANALYSIS_STATUS_VALUES.IN_PROGRESS) {
    return 'The applicant analysis is currently running. Status updates refresh automatically every 3 seconds.';
  }

  return 'The request has been accepted and is waiting for worker processing to begin.';
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
          <p className="text-sm font-medium text-blue-600">AI Analysis Progress</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            {ANALYSIS_STATUS_LABELS[summary.status] ?? summary.status ?? 'Pending'}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            {getStatusDescription(summary)}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClassName(summary.status)}`}
        >
          {ANALYSIS_STATUS_LABELS[summary.status] ?? summary.status ?? 'Pending'}
        </span>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryItem label="Tracked Runs" value={summary.totalRuns} />
        <SummaryItem label="Completed" value={summary.completedRuns} />
        <SummaryItem label="Failed" value={summary.failedRuns} />
        <SummaryItem label="Active Stage" value={summary.currentStageLabel ?? '-'} />
      </div>

      {typeof summary.failureReasonMessage === 'string' && summary.failureReasonMessage.length > 0 ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {summary.failureReasonMessage}
        </div>
      ) : null}

      <div className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Stage Timeline</h3>
            <p className="mt-1 text-sm text-slate-500">
              Detailed backend stages update automatically while the worker processes this applicant.
            </p>
          </div>

          <div className="text-right text-sm text-slate-500">
            <p>Polling every 3 seconds</p>
            <p className="mt-1">Last checked: {formatTimestamp(summary.lastUpdatedAt)}</p>
          </div>
        </div>

        <AnalysisStageTimeline stages={stages} />
      </div>
    </section>
  );
}
