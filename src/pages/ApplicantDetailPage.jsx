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
      title: 'Applicant not found',
      description: 'The requested applicant does not exist or is no longer available.',
    };
  }

  if (errorCode === 'FORBIDDEN_RESOURCE_ACCESS') {
    return {
      title: 'Access denied',
      description: 'You do not have permission to view this applicant.',
    };
  }

  if (errorCode === 'UNAUTHORIZED' || errorCode === 'AUTH_TOKEN_EXPIRED') {
    return {
      title: 'Session expired',
      description: 'Your session is no longer valid. Please sign in again and retry.',
    };
  }

  if (error?.response === undefined) {
    return {
      title: 'Network error',
      description: 'Unable to reach the server. Please check your connection and try again.',
    };
  }

  return {
    title: 'Unable to load applicant',
    description:
      error instanceof Error && error.message.length > 0
        ? error.message
        : 'The applicant detail request failed. Please try again.',
  };
}

function getApplicantGroupContextErrorState(applicantGroupId, routeGroupId) {
  return {
    title: 'Group context mismatch',
    description:
      applicantGroupId === null
        ? 'The applicant detail response did not include a valid group context.'
        : `This applicant belongs to group "${applicantGroupId}", not "${routeGroupId}".`,
  };
}

function getAnalysisRequestErrorMessage(error) {
  const errorCode = getApiErrorCode(error);

  if (errorCode === 'ANALYSIS_RUN_ALREADY_COMPLETED') {
    return 'Analysis results already exist for the repositories selected for this applicant.';
  }

  if (errorCode === 'APPLICANT_NOT_FOUND') {
    return 'This applicant no longer exists, so a new analysis request cannot be started.';
  }

  if (errorCode === 'FORBIDDEN_RESOURCE_ACCESS') {
    return 'You do not have permission to start analysis for this applicant.';
  }

  if (errorCode === 'UNAUTHORIZED' || errorCode === 'AUTH_TOKEN_EXPIRED') {
    return 'Your session is no longer valid. Please sign in again and retry.';
  }

  if (error?.response === undefined) {
    return 'Unable to reach the server. Please check your connection and try again.';
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return 'Unable to start the AI analysis. Please try again.';
}

function getAnalysisRecoveryErrorMessage(error) {
  const errorCode = getApiErrorCode(error);

  if (errorCode === 'FORBIDDEN_RESOURCE_ACCESS') {
    return 'You do not have permission to load analysis history for this applicant.';
  }

  if (errorCode === 'UNAUTHORIZED' || errorCode === 'AUTH_TOKEN_EXPIRED') {
    return 'Your session is no longer valid. Please sign in again and retry.';
  }

  if (error?.response === undefined) {
    return 'Unable to recover the saved analysis state because the server could not be reached.';
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return 'Unable to recover the saved analysis state for this applicant.';
}

function getAnalysisPollingErrorMessage(error) {
  const errorCode = getApiErrorCode(error);

  if (errorCode === 'ANALYSIS_RUN_NOT_FOUND') {
    return 'One of the requested analysis runs could not be found anymore.';
  }

  if (errorCode === 'FORBIDDEN_RESOURCE_ACCESS') {
    return 'You do not have permission to track these analysis runs.';
  }

  if (errorCode === 'UNAUTHORIZED' || errorCode === 'AUTH_TOKEN_EXPIRED') {
    return 'Your session is no longer valid. Please sign in again and retry.';
  }

  if (error?.response === undefined) {
    return 'Unable to refresh the analysis progress because the server could not be reached.';
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return 'Unable to refresh the analysis progress right now.';
}

function getGeneratedQuestionErrorMessage(error) {
  const errorCode = getApiErrorCode(error);

  if (errorCode === 'APPLICANT_NOT_FOUND') {
    return 'This applicant no longer exists, so generated questions cannot be loaded.';
  }

  if (errorCode === 'FORBIDDEN_RESOURCE_ACCESS') {
    return 'You do not have permission to view generated questions for this applicant.';
  }

  if (errorCode === 'UNAUTHORIZED' || errorCode === 'AUTH_TOKEN_EXPIRED') {
    return 'Your session is no longer valid. Please sign in again and retry.';
  }

  if (error?.response === undefined) {
    return 'Unable to reach the server while loading generated questions.';
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return 'Unable to load the generated interview questions.';
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
          Back to Applicants
        </button>

        <button
          onClick={onRetry}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Retry
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
  let actionLabel = 'Start AI Analysis';
  let actionDisabled = false;

  if (isRequestingAnalysis) {
    actionLabel = 'Starting Analysis...';
    actionDisabled = true;
  } else if (summary?.status === ANALYSIS_STATUS_VALUES.QUEUED) {
    actionLabel = 'Queued for Analysis';
    actionDisabled = true;
  } else if (summary?.status === ANALYSIS_STATUS_VALUES.IN_PROGRESS) {
    actionLabel = 'Analysis Running...';
    actionDisabled = true;
  } else if (summary?.status === ANALYSIS_STATUS_VALUES.COMPLETED) {
    actionLabel = 'Analysis Completed';
    actionDisabled = true;
  } else if (summary?.status === ANALYSIS_STATUS_VALUES.FAILED) {
    actionLabel = 'Retry Failed Analysis';
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600">Phase 4</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">AI Analysis</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            Start repository analysis for this applicant and review the generated interview
            questions on the same page.
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
              {isLoadingQuestions ? 'Refreshing Questions...' : hasQuestions ? 'Refresh Questions' : 'Load Questions'}
            </button>
          ) : null}
        </div>
      </div>

      {isRecoveringAnalysis ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
          Recovering saved analysis state for this applicant.
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
            name: applicant.name ?? 'Unnamed Applicant',
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
        title: 'Invalid applicant',
        description: 'A valid applicant identifier is required to load this page.',
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
      setAnalysisRequestErrorMessage('A valid applicant is required before analysis can start.');
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
        'Analysis request accepted. Progress updates will refresh automatically every 3 seconds.',
      );
    } catch (error) {
      const errorCode = getApiErrorCode(error);

      if (errorCode === 'ANALYSIS_RUN_ALREADY_COMPLETED') {
        setAnalysisInfoMessage(
          'Saved analysis results already exist for this applicant. Loading the existing questions automatically.',
        );
        await recoverAnalysisState({
          conflictMessage:
            'Saved analysis results were found and loaded automatically for this applicant.',
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
      recentItemsLabel="Recent Applicants"
      title="Applicant Detail"
      description="Review the applicant profile, analysis progress, and generated interview questions."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-6">
          <button
            onClick={handleBack}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Back to Applicants
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
                  emptyMessage="The analysis completed, but no generated questions were returned for this applicant yet."
                />
              ) : null}
            </>
          ) : null}
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Review Workflow</h3>

            <div className="space-y-4 text-sm text-slate-600">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Current Step
                </p>
                <p className="mt-2 text-slate-800">
                  Validate the applicant profile, monitor analysis progress, and review the
                  generated interview questions before the interview.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Best Next Action
                </p>
                <p className="mt-2 text-slate-800">
                  {analysisSummary?.status === ANALYSIS_STATUS_VALUES.COMPLETED
                    ? 'Refresh and review the generated questions, then move back to the group for the next applicant.'
                    : 'Start or keep tracking the analysis until the applicant questions are ready.'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Navigation Context</h3>

            <div className="space-y-4 text-sm text-slate-600">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Group ID
                </p>
                <p className="mt-2 break-all font-medium text-slate-800">{groupId ?? '-'}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Applicant ID
                </p>
                <p className="mt-2 break-all font-medium text-slate-800">{applicantId ?? '-'}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Current Analysis Status
                </p>
                <p className="mt-2 break-all font-medium text-slate-800">
                  {analysisSummary?.status ?? '-'}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Return Path
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
