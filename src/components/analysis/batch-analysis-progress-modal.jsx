import { buildStageTimeline } from '../../services/analysis/analysis-state.js';
import {
  ANALYSIS_STATUS_LABELS,
  ANALYSIS_STATUS_VALUES,
} from '../../services/analysis/analysis-types.js';
import { AnalysisProgressPanel } from './analysis-progress-panel.jsx';

function getStatusClassName(item) {
  if (item.isRequesting) {
    return 'bg-slate-100 text-slate-700';
  }

  if (item.summary?.status === ANALYSIS_STATUS_VALUES.COMPLETED) {
    return 'bg-emerald-50 text-emerald-700';
  }

  if (item.summary?.status === ANALYSIS_STATUS_VALUES.IN_PROGRESS) {
    return 'bg-blue-50 text-blue-700';
  }

  if (item.summary?.status === ANALYSIS_STATUS_VALUES.FAILED) {
    return 'bg-red-50 text-red-700';
  }

  if (item.summary?.status === ANALYSIS_STATUS_VALUES.QUEUED) {
    return 'bg-amber-50 text-amber-700';
  }

  return 'bg-slate-100 text-slate-700';
}

function getStatusLabel(item) {
  if (item.isRequesting) {
    return '요청 중';
  }

  return ANALYSIS_STATUS_LABELS[item.summary?.status] ?? '준비됨';
}

function getSelectionButtonClassName(isSelected) {
  if (isSelected) {
    return 'border-blue-200 bg-blue-50 shadow-sm';
  }

  return 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50';
}

function EmptyAnalysisSelectionState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
      <h3 className="text-lg font-semibold text-slate-900">표시할 분석 대상이 없습니다</h3>
      <p className="mt-2 text-sm text-slate-500">
        분석을 시작하면 이 모달에서 지원자별 실시간 단계 진행 상황을 확인할 수 있습니다.
      </p>
    </div>
  );
}

function RequestedAnalysisPlaceholder({ item }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600">실시간 분석 모니터</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">분석 요청 전송 중</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            {item.applicant.name ?? '지원자'}의 분석 요청을 백엔드에 전송하고 있습니다. 요청이
            접수되면 단계 타임라인이 자동으로 실시간 갱신됩니다.
          </p>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          요청 중
        </span>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-slate-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">지원자</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {item.applicant.name ?? '-'}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">이메일</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {item.applicant.email ?? '-'}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">진행률</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{item.progressPercent}%</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">현재 단계</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">요청 대기</p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-500">
        분석 요청이 성공하면 `저장소 조회 → 폴더 구조 분석 → 핵심 파일 수집 → 코드 요약 분석 →
        질문 생성` 단계가 자동으로 표시됩니다.
      </div>
    </section>
  );
}

export function BatchAnalysisProgressModal({
  analysisItems,
  isOpen,
  onClose,
  onSelectApplicant,
  selectedApplicantId,
}) {
  if (!isOpen) {
    return null;
  }

  const visibleItems = analysisItems.filter((item) => {
    return item.isRequesting || item.summary !== null || item.requestErrorMessage.length > 0;
  });
  const selectedItem =
    visibleItems.find((item) => item.applicant.id === selectedApplicantId) ?? visibleItems[0];
  const stages =
    selectedItem?.summary === null || selectedItem?.summary === undefined
      ? []
      : buildStageTimeline(selectedItem.summary);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-4 backdrop-blur-sm">
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">실시간 분석 단계</h2>
            <p className="mt-1 text-sm text-slate-500">
              분석 시작 후 백엔드 단계 변화를 이 모달에서 실시간으로 확인할 수 있습니다.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            닫기
          </button>
        </div>

        <div className="grid flex-1 gap-0 overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="overflow-y-auto border-b border-slate-200 bg-white p-5 lg:border-b-0 lg:border-r">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-900">분석 대상</h3>
              <p className="mt-1 text-xs text-slate-500">
                지원자를 선택하면 상세 단계 타임라인이 오른쪽에 표시됩니다.
              </p>
            </div>

            <div className="space-y-3">
              {visibleItems.map((item) => {
                const isSelected = item.applicant.id === selectedItem?.applicant.id;

                return (
                  <button
                    key={item.applicant.id}
                    type="button"
                    onClick={() => onSelectApplicant(item.applicant.id)}
                    className={`block w-full rounded-2xl border p-4 text-left transition ${getSelectionButtonClassName(
                      isSelected,
                    )}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {item.applicant.name ?? '이름 없는 지원자'}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {item.applicant.email ?? '이메일 정보 없음'}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClassName(
                          item,
                        )}`}
                      >
                        {getStatusLabel(item)}
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                        <p>{item.summary?.currentStageLabel ?? (item.isRequesting ? '요청 중' : '-')}</p>
                        <p className="font-semibold text-slate-700">{item.progressPercent}%</p>
                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all duration-700"
                          style={{ width: `${item.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="overflow-y-auto p-5">
            {selectedItem === undefined ? <EmptyAnalysisSelectionState /> : null}
            {selectedItem !== undefined && selectedItem.summary === null ? (
              <RequestedAnalysisPlaceholder item={selectedItem} />
            ) : null}
            {selectedItem !== undefined && selectedItem.summary !== null ? (
              <AnalysisProgressPanel summary={selectedItem.summary} stages={stages} />
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
