import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AnalysisProgressPanel } from '../components/analysis/analysis-progress-panel.jsx';
import { QuestionListSection } from '../components/analysis/question-list-section.jsx';
import { ApplicantDetailPanel } from '../components/applicants/applicant-detail-panel.jsx';
import DashboardLayout from '../components/layout/DashboardLayout';
import { getApiErrorCode } from '../services/api/api-types.js';
import {
  getAnalysisRun,
  getAnalysisRuns,
  getApplicantGeneratedQuestions,
  requestApplicantAnalysis,
} from '../services/analysis/analysis-api.js';
import {
  ANALYSIS_STATUS_LABELS,
  ANALYSIS_STATUS_VALUES,
  DEFAULT_ANALYSIS_POLLING_INTERVAL_MS,
  TERMINAL_ANALYSIS_STATUS_VALUES,
} from '../services/analysis/analysis-types.js';
import {
  buildStageTimeline,
  getAnalysisSummary,
  getRecoveredAnalysisRuns,
  mergeTrackedAnalysisRuns,
} from '../services/analysis/analysis-state.js';
import { getApplicantDetail } from '../services/applicants/applicant-api.js';

function getApplicantDetailErrorState(error) {
  const errorCode = getApiErrorCode(error);

  if (errorCode === 'APPLICANT_NOT_FOUND') {
    return {
      title: '지원자를 찾을 수 없습니다',
      description: '요청한 지원자가 없거나 더 이상 사용할 수 없습니다.',
    };
  }

  if (errorCode === 'FORBIDDEN_RESOURCE_ACCESS') {
    return {
      title: '접근 권한이 없습니다',
      description: '이 지원자 정보를 조회할 권한이 없습니다.',
    };
  }

  if (errorCode === 'UNAUTHORIZED' || errorCode === 'AUTH_TOKEN_EXPIRED') {
    return {
      title: '세션이 만료되었습니다',
      description: '다시 로그인한 뒤 시도해 주세요.',
    };
  }

  if (error?.response === undefined) {
    return {
      title: '네트워크 오류',
      description: '서버에 연결할 수 없습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.',
    };
  }

  return {
    title: '지원자 정보를 불러오지 못했습니다',
    description:
      error instanceof Error && error.message.length > 0
        ? error.message
        : '지원자 상세 정보를 불러오지 못했습니다. 다시 시도해 주세요.',
  };
}

function getApplicantGroupContextErrorState(applicantGroupId, routeGroupId) {
  return {
    title: '그룹 정보가 일치하지 않습니다',
    description:
      applicantGroupId === null
        ? '지원자 상세 응답에 올바른 그룹 정보가 포함되지 않았습니다.'
        : `이 지원자는 "${routeGroupId}"가 아니라 "${applicantGroupId}" 그룹에 속해 있습니다.`,
  };
}

function getAnalysisRequestErrorMessage(error) {
  const errorCode = getApiErrorCode(error);

  if (errorCode === 'ANALYSIS_RUN_ALREADY_COMPLETED') {
    return '이 지원자에 대한 분석 결과가 이미 존재합니다.';
  }

  if (errorCode === 'APPLICANT_NOT_FOUND') {
    return '지원자를 찾을 수 없어 새 분석 요청을 시작할 수 없습니다.';
  }

  if (errorCode === 'FORBIDDEN_RESOURCE_ACCESS') {
    return '이 지원자에 대한 분석을 시작할 권한이 없습니다.';
  }

  if (errorCode === 'UNAUTHORIZED' || errorCode === 'AUTH_TOKEN_EXPIRED') {
    return '세션이 만료되었습니다. 다시 로그인한 뒤 시도해 주세요.';
  }

  if (error?.response === undefined) {
    return '서버에 연결할 수 없습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.';
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return 'AI 분석을 시작하지 못했습니다. 다시 시도해 주세요.';
}

function getAnalysisRecoveryErrorMessage(error) {
  const errorCode = getApiErrorCode(error);

  if (errorCode === 'FORBIDDEN_RESOURCE_ACCESS') {
    return '이 지원자의 분석 이력을 불러올 권한이 없습니다.';
  }

  if (errorCode === 'UNAUTHORIZED' || errorCode === 'AUTH_TOKEN_EXPIRED') {
    return '세션이 만료되었습니다. 다시 로그인한 뒤 시도해 주세요.';
  }

  if (error?.response === undefined) {
    return '서버에 연결할 수 없어 저장된 분석 상태를 복구하지 못했습니다.';
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return '이 지원자의 저장된 분석 상태를 복구하지 못했습니다.';
}

function getAnalysisPollingErrorMessage(error) {
  const errorCode = getApiErrorCode(error);

  if (errorCode === 'ANALYSIS_RUN_NOT_FOUND') {
    return '요청한 분석 실행 중 일부를 더 이상 찾을 수 없습니다.';
  }

  if (errorCode === 'FORBIDDEN_RESOURCE_ACCESS') {
    return '이 분석 실행 상태를 조회할 권한이 없습니다.';
  }

  if (errorCode === 'UNAUTHORIZED' || errorCode === 'AUTH_TOKEN_EXPIRED') {
    return '세션이 만료되었습니다. 다시 로그인한 뒤 시도해 주세요.';
  }

  if (error?.response === undefined) {
    return '서버에 연결할 수 없어 분석 진행 상태를 새로고침하지 못했습니다.';
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return '지금은 분석 진행 상태를 새로고침할 수 없습니다.';
}

function getGeneratedQuestionErrorMessage(error) {
  const errorCode = getApiErrorCode(error);

  if (errorCode === 'APPLICANT_NOT_FOUND') {
    return '지원자를 찾을 수 없어 생성된 질문을 불러올 수 없습니다.';
  }

  if (errorCode === 'FORBIDDEN_RESOURCE_ACCESS') {
    return '이 지원자의 생성 질문을 조회할 권한이 없습니다.';
  }

  if (errorCode === 'UNAUTHORIZED' || errorCode === 'AUTH_TOKEN_EXPIRED') {
    return '세션이 만료되었습니다. 다시 로그인한 뒤 시도해 주세요.';
  }

  if (error?.response === undefined) {
    return '생성된 질문을 불러오는 중 서버에 연결할 수 없습니다.';
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return '생성된 면접 질문을 불러오지 못했습니다.';
}

function ApplicantDetailLoadingState() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="animate-pulse space-y-5">
        <div className="h-4 w-28 rounded bg-slate-200" />
        <div className="h-8 w-1/3 rounded bg-slate-200" />
        <div className="h-5 w-3/4 rounded bg-slate-100" />
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="h-24 rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    </section>
  );
}

function ApplicantDetailErrorState({ title, description, onBack, onRetry }) {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-8 shadow-sm">
      <h2 className="text-2xl font-semibold text-red-900">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-red-700">{description}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={onBack}
          className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
        >
          지원자 목록으로 돌아가기
        </button>

        <button
          onClick={onRetry}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          다시 시도
        </button>
      </div>
    </section>
  );
}

function ApplicantAnalysisActionPanel({
  canRefreshQuestions,
  hasQuestions,
  infoMessage,
  isLoadingQuestions,
  isRecoveringAnalysis,
  isRequestingAnalysis,
  onRefreshQuestions,
  onStartAnalysis,
  pollingErrorMessage,
  requestErrorMessage,
  summary,
}) {
  let actionLabel = 'AI 분석 시작';
  let actionDisabled = false;

  if (isRequestingAnalysis) {
    actionLabel = '분석 시작 중...';
    actionDisabled = true;
  } else if (summary?.status === ANALYSIS_STATUS_VALUES.QUEUED) {
    actionLabel = '분석 대기 중';
    actionDisabled = true;
  } else if (summary?.status === ANALYSIS_STATUS_VALUES.IN_PROGRESS) {
    actionLabel = '분석 진행 중';
    actionDisabled = true;
  } else if (summary?.status === ANALYSIS_STATUS_VALUES.COMPLETED) {
    actionLabel = '분석 완료';
    actionDisabled = true;
  } else if (summary?.status === ANALYSIS_STATUS_VALUES.FAILED) {
    actionLabel = '실패한 분석 다시 시도';
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600">4단계</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">AI 분석</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            이 지원자의 저장소 분석을 시작하고, 같은 화면에서 생성된 면접 질문까지
            이어서 확인할 수 있습니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onStartAnalysis}
            disabled={actionDisabled}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {actionLabel}
          </button>

          {canRefreshQuestions ? (
            <button
              type="button"
              onClick={onRefreshQuestions}
              disabled={isLoadingQuestions}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              {isLoadingQuestions
                ? '질문 새로고침 중...'
                : hasQuestions
                  ? '질문 새로고침'
                  : '질문 불러오기'}
            </button>
          ) : null}
        </div>
      </div>

      {isRecoveringAnalysis ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
          이 지원자의 저장된 분석 상태를 복구하는 중입니다.
        </div>
      ) : null}

      {typeof infoMessage === 'string' && infoMessage.length > 0 ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
          {infoMessage}
        </div>
      ) : null}

      {typeof requestErrorMessage === 'string' && requestErrorMessage.length > 0 ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {requestErrorMessage}
        </div>
      ) : null}

      {typeof pollingErrorMessage === 'string' && pollingErrorMessage.length > 0 ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700">
          {pollingErrorMessage}
        </div>
      ) : null}
    </section>
  );
}

export function ApplicantDetailPage() {
  const { applicantId, groupId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [applicant, setApplicant] = useState(null);
  const [isLoadingApplicant, setIsLoadingApplicant] = useState(true);
  const [applicantErrorState, setApplicantErrorState] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [analysisRunIds, setAnalysisRunIds] = useState([]);
  const [analysisRuns, setAnalysisRuns] = useState([]);
  const [lastAnalysisUpdatedAt, setLastAnalysisUpdatedAt] = useState(null);
  const [isRecoveringAnalysis, setIsRecoveringAnalysis] = useState(false);
  const [isRequestingAnalysis, setIsRequestingAnalysis] = useState(false);
  const [analysisRequestErrorMessage, setAnalysisRequestErrorMessage] = useState('');
  const [analysisInfoMessage, setAnalysisInfoMessage] = useState('');
  const [analysisPollingErrorMessage, setAnalysisPollingErrorMessage] = useState('');
  const [questions, setQuestions] = useState([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [questionErrorMessage, setQuestionErrorMessage] = useState(null);
  const [hasAttemptedQuestionLoad, setHasAttemptedQuestionLoad] = useState(false);

  const recoveryRequestIdRef = useRef(0);
  const pollRequestIdRef = useRef(0);
  const questionRequestIdRef = useRef(0);
  const analysisRunsRef = useRef([]);

  const effectiveGroupId = applicant?.groupId ?? groupId ?? null;
  const backDestination = location.state?.from ?? `/groups/${effectiveGroupId ?? ''}`;
  const recentApplicants =
    applicant === null
      ? []
      : [
          {
            id: applicant.id,
            name: applicant.name ?? '이름 없는 지원자',
            href:
              typeof applicant.id === 'string' && typeof effectiveGroupId === 'string'
                ? `/groups/${effectiveGroupId}/applicants/${applicant.id}`
                : `/groups/${effectiveGroupId ?? ''}`,
          },
        ];

  const analysisSummary = getAnalysisSummary(analysisRuns, lastAnalysisUpdatedAt);
  const stageTimeline = buildStageTimeline(analysisSummary);
  const shouldShowQuestionSection =
    hasAttemptedQuestionLoad || isLoadingQuestions || questionErrorMessage !== null || questions.length > 0;

  useEffect(() => {
    analysisRunsRef.current = analysisRuns;
  }, [analysisRuns]);

  useEffect(() => {
    if (typeof applicantId !== 'string' || applicantId.length === 0) {
      setApplicant(null);
      setApplicantErrorState({
        title: '잘못된 지원자 정보입니다',
        description: '이 페이지를 불러오려면 올바른 지원자 식별자가 필요합니다.',
      });
      setIsLoadingApplicant(false);
      return;
    }

    let isMounted = true;

    async function loadApplicantDetail() {
      setIsLoadingApplicant(true);
      setApplicantErrorState(null);

      try {
        const response = await getApplicantDetail(applicantId);

        if (!isMounted) {
          return;
        }

        setApplicant(response.applicant);
        if (
          typeof groupId === 'string' &&
          groupId.length > 0 &&
          typeof response.applicant.groupId === 'string' &&
          response.applicant.groupId.length > 0 &&
          response.applicant.groupId !== groupId
        ) {
          setApplicantErrorState(
            getApplicantGroupContextErrorState(response.applicant.groupId, groupId),
          );
          return;
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setApplicant(null);
        setApplicantErrorState(getApplicantDetailErrorState(error));
      } finally {
        if (isMounted) {
          setIsLoadingApplicant(false);
        }
      }
    }

    void loadApplicantDetail();

    return () => {
      isMounted = false;
    };
  }, [applicantId, groupId, retryCount]);

  useEffect(() => {
    recoveryRequestIdRef.current += 1;
    pollRequestIdRef.current += 1;
    questionRequestIdRef.current += 1;
    setAnalysisRunIds([]);
    setAnalysisRuns([]);
    setLastAnalysisUpdatedAt(null);
    setIsRecoveringAnalysis(false);
    setIsRequestingAnalysis(false);
    setAnalysisRequestErrorMessage('');
    setAnalysisInfoMessage('');
    setAnalysisPollingErrorMessage('');
    setQuestions([]);
    setIsLoadingQuestions(false);
    setQuestionErrorMessage(null);
    setHasAttemptedQuestionLoad(false);
  }, [applicantId]);

  const loadGeneratedQuestions = useCallback(async (targetApplicantId, successMessage = '') => {
    const nextRequestId = questionRequestIdRef.current + 1;

    questionRequestIdRef.current = nextRequestId;
    setHasAttemptedQuestionLoad(true);
    setIsLoadingQuestions(true);
    setQuestionErrorMessage(null);

    try {
      const response = await getApplicantGeneratedQuestions(targetApplicantId);

      if (questionRequestIdRef.current !== nextRequestId) {
        return;
      }

      setQuestions(response.questions);
      if (successMessage.length > 0) {
        setAnalysisInfoMessage(successMessage);
      }
    } catch (error) {
      if (questionRequestIdRef.current !== nextRequestId) {
        return;
      }

      setQuestions([]);
      setQuestionErrorMessage(getGeneratedQuestionErrorMessage(error));
    } finally {
      if (questionRequestIdRef.current === nextRequestId) {
        setIsLoadingQuestions(false);
      }
    }
  }, []);

  const recoverAnalysisState = useCallback(
    async ({
      conflictMessage = '',
      preserveInfoMessage = false,
    } = {}) => {
      if (typeof applicantId !== 'string' || applicantId.length === 0) {
        return;
      }

      const nextRequestId = recoveryRequestIdRef.current + 1;

      recoveryRequestIdRef.current = nextRequestId;
      setIsRecoveringAnalysis(true);
      setAnalysisPollingErrorMessage('');
      if (!preserveInfoMessage) {
        setAnalysisInfoMessage('');
      }

      try {
        const recoveredAnalysisRuns = [];
        let nextPage = 1;
        let totalPages = 1;

        while (nextPage <= totalPages) {
          const response = await getAnalysisRuns({
            applicantId,
            page: nextPage,
            size: 20,
          });

          if (recoveryRequestIdRef.current !== nextRequestId) {
            return;
          }

          recoveredAnalysisRuns.push(...response.analysisRuns);
          totalPages = Math.max(1, Math.ceil(response.meta.total / response.meta.size));
          nextPage += 1;
        }

        const nextAnalysisRuns = getRecoveredAnalysisRuns(recoveredAnalysisRuns);
        const nextAnalysisRunIds = nextAnalysisRuns
          .filter(
            (analysisRun) =>
              analysisRun.status === ANALYSIS_STATUS_VALUES.QUEUED ||
              analysisRun.status === ANALYSIS_STATUS_VALUES.IN_PROGRESS,
          )
          .map((analysisRun) => analysisRun.id)
          .filter((value) => typeof value === 'string' && value.length > 0);
        const hasCompletedRun = nextAnalysisRuns.some(
          (analysisRun) => analysisRun.status === ANALYSIS_STATUS_VALUES.COMPLETED,
        );

        setAnalysisRuns(nextAnalysisRuns);
        setAnalysisRunIds(nextAnalysisRunIds);
        setLastAnalysisUpdatedAt(new Date().toISOString());

        if (hasCompletedRun) {
          await loadGeneratedQuestions(applicantId, conflictMessage);
        }
      } catch (error) {
        if (recoveryRequestIdRef.current !== nextRequestId) {
          return;
        }

        setAnalysisPollingErrorMessage(getAnalysisRecoveryErrorMessage(error));
      } finally {
        if (recoveryRequestIdRef.current === nextRequestId) {
          setIsRecoveringAnalysis(false);
        }
      }
    },
    [applicantId, loadGeneratedQuestions],
  );

  useEffect(() => {
    if (
      isLoadingApplicant ||
      applicantErrorState !== null ||
      applicant === null ||
      typeof applicant.id !== 'string' ||
      applicant.id.length === 0
    ) {
      return;
    }

    void recoverAnalysisState();
  }, [applicant, applicantErrorState, isLoadingApplicant, recoverAnalysisState]);

  useEffect(() => {
    if (analysisRunIds.length === 0) {
      return;
    }

    let isMounted = true;

    async function pollAnalysisRuns() {
      const nextRequestId = pollRequestIdRef.current + 1;

      pollRequestIdRef.current = nextRequestId;

      const settledAnalysisRuns = await Promise.allSettled(
        analysisRunIds.map(async (analysisRunId) => {
          const response = await getAnalysisRun(analysisRunId);

          return response.analysisRun;
        }),
      );

      if (!isMounted || pollRequestIdRef.current !== nextRequestId) {
        return;
      }

      const nextAnalysisRuns = settledAnalysisRuns
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value);
      const missingAnalysisRunIds = settledAnalysisRuns
        .map((result, index) => {
          if (result.status !== 'rejected') {
            return null;
          }

          return getApiErrorCode(result.reason) === 'ANALYSIS_RUN_NOT_FOUND'
            ? analysisRunIds[index]
            : null;
        })
        .filter((analysisRunId) => typeof analysisRunId === 'string');
      const nextTrackedAnalysisRunIds = analysisRunIds.filter(
        (analysisRunId) => !missingAnalysisRunIds.includes(analysisRunId),
      );
      const mergedAnalysisRuns = mergeTrackedAnalysisRuns(
        analysisRunsRef.current,
        nextAnalysisRuns,
        analysisRunIds,
        missingAnalysisRunIds,
      );
      const rejectedResult = settledAnalysisRuns.find(
        (result) =>
          result.status === 'rejected' &&
          getApiErrorCode(result.reason) !== 'ANALYSIS_RUN_NOT_FOUND',
      );

      setAnalysisRuns(mergedAnalysisRuns);
      setLastAnalysisUpdatedAt(new Date().toISOString());

      if (nextTrackedAnalysisRunIds.length !== analysisRunIds.length) {
        setAnalysisRunIds(nextTrackedAnalysisRunIds);
      }

      if (rejectedResult !== undefined) {
        setAnalysisPollingErrorMessage(getAnalysisPollingErrorMessage(rejectedResult.reason));
      } else {
        setAnalysisPollingErrorMessage('');
      }

      if (
        mergedAnalysisRuns.length === analysisRunIds.length &&
        mergedAnalysisRuns.every((analysisRun) =>
          TERMINAL_ANALYSIS_STATUS_VALUES.includes(analysisRun.status),
        )
      ) {
        setAnalysisRunIds([]);

        if (
          mergedAnalysisRuns.some(
            (analysisRun) => analysisRun.status === ANALYSIS_STATUS_VALUES.COMPLETED,
          )
        ) {
          await loadGeneratedQuestions(applicantId);
        }
      }
    }

    void pollAnalysisRuns();

    const intervalId = window.setInterval(() => {
      void pollAnalysisRuns();
    }, DEFAULT_ANALYSIS_POLLING_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [analysisRunIds, applicantId, loadGeneratedQuestions]);

  function handleBack() {
    navigate(backDestination);
  }

  function handleRetry() {
    setRetryCount((previousRetryCount) => previousRetryCount + 1);
  }

  async function handleStartAnalysis() {
    if (typeof applicant?.id !== 'string' || applicant.id.length === 0) {
      setAnalysisRequestErrorMessage('분석을 시작하려면 올바른 지원자 정보가 필요합니다.');
      return;
    }

    setIsRequestingAnalysis(true);
    setAnalysisRequestErrorMessage('');
    setAnalysisInfoMessage('');
    setAnalysisPollingErrorMessage('');

    try {
      const response = await requestApplicantAnalysis(applicant.id);
      const queuedAnalysisRuns = response.analysisRunIds.map((analysisRunId) => ({
        id: analysisRunId,
        status: ANALYSIS_STATUS_VALUES.QUEUED,
        currentStage: null,
        startedAt: null,
        completedAt: null,
        failureReason: null,
      }));

      setAnalysisRunIds(response.analysisRunIds);
      setAnalysisRuns(queuedAnalysisRuns);
      setLastAnalysisUpdatedAt(new Date().toISOString());
      setAnalysisInfoMessage(
        '분석 요청이 접수되었습니다. 진행 상태는 3초마다 자동으로 갱신됩니다.',
      );
    } catch (error) {
      const errorCode = getApiErrorCode(error);

      if (errorCode === 'ANALYSIS_RUN_ALREADY_COMPLETED') {
        setAnalysisInfoMessage(
          '이 지원자의 저장된 분석 결과가 있어 기존 질문을 자동으로 불러옵니다.',
        );
        await recoverAnalysisState({
          conflictMessage:
            '저장된 분석 결과를 찾아 자동으로 불러왔습니다.',
          preserveInfoMessage: true,
        });
      } else {
        setAnalysisRequestErrorMessage(getAnalysisRequestErrorMessage(error));
      }
    } finally {
      setIsRequestingAnalysis(false);
    }
  }

  function handleRefreshQuestions() {
    if (typeof applicant?.id !== 'string' || applicant.id.length === 0) {
      return;
    }

    void loadGeneratedQuestions(applicant.id);
  }

  return (
    <DashboardLayout
      rooms={[]}
      recentItems={recentApplicants}
      recentItemsLabel="최근 지원자"
      title="지원자 상세"
      description="지원자 기본 정보, 분석 진행 상태, 생성된 면접 질문을 한곳에서 확인할 수 있습니다."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-6">
          <button
            onClick={handleBack}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            지원자 목록으로 돌아가기
          </button>

          {isLoadingApplicant ? <ApplicantDetailLoadingState /> : null}

          {!isLoadingApplicant && applicantErrorState !== null ? (
            <ApplicantDetailErrorState
              title={applicantErrorState.title}
              description={applicantErrorState.description}
              onBack={handleBack}
              onRetry={handleRetry}
            />
          ) : null}

          {!isLoadingApplicant && applicantErrorState === null && applicant !== null ? (
            <>
              <ApplicantDetailPanel applicant={applicant} />

              <ApplicantAnalysisActionPanel
                canRefreshQuestions={
                  analysisSummary?.status === ANALYSIS_STATUS_VALUES.COMPLETED ||
                  questions.length > 0
                }
                hasQuestions={questions.length > 0}
                infoMessage={analysisInfoMessage}
                isLoadingQuestions={isLoadingQuestions}
                isRecoveringAnalysis={isRecoveringAnalysis}
                isRequestingAnalysis={isRequestingAnalysis}
                onRefreshQuestions={handleRefreshQuestions}
                onStartAnalysis={handleStartAnalysis}
                pollingErrorMessage={analysisPollingErrorMessage}
                requestErrorMessage={analysisRequestErrorMessage}
                summary={analysisSummary}
              />

              {analysisSummary !== null ? (
                <AnalysisProgressPanel summary={analysisSummary} stages={stageTimeline} />
              ) : null}

              {shouldShowQuestionSection ? (
                <QuestionListSection
                  questions={questions}
                  isLoading={isLoadingQuestions}
                  errorMessage={questionErrorMessage}
                  emptyMessage="분석은 완료되었지만 아직 이 지원자에 대한 생성 질문이 도착하지 않았습니다."
                />
              ) : null}
            </>
          ) : null}
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">검토 가이드</h3>

            <div className="space-y-4 text-sm text-slate-600">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  현재 단계
                </p>
                <p className="mt-2 text-slate-800">
                  면접 전까지 지원자 기본 정보를 확인하고, 분석 진행 상황을 살펴본 뒤,
                  생성된 면접 질문을 검토하세요.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  추천 다음 작업
                </p>
                <p className="mt-2 text-slate-800">
                  {analysisSummary?.status === ANALYSIS_STATUS_VALUES.COMPLETED
                    ? '생성된 질문을 새로고침해 확인한 뒤 다음 지원자 검토를 위해 그룹 화면으로 돌아가세요.'
                    : '질문이 준비될 때까지 분석을 시작하거나 계속 추적해 주세요.'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">이동 정보</h3>

            <div className="space-y-4 text-sm text-slate-600">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  그룹 ID
                </p>
                <p className="mt-2 break-all font-medium text-slate-800">{groupId ?? '-'}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  지원자 ID
                </p>
                <p className="mt-2 break-all font-medium text-slate-800">{applicantId ?? '-'}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  현재 분석 상태
                </p>
                <p className="mt-2 break-all font-medium text-slate-800">
                  {ANALYSIS_STATUS_LABELS[analysisSummary?.status] ?? analysisSummary?.status ?? '-'}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  돌아갈 경로
                </p>
                <p className="mt-2 break-all font-medium text-slate-800">{backDestination}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </DashboardLayout>
  );
}
