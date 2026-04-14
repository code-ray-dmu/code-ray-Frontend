import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AuthDebugPanel } from '../components/auth/auth-debug-panel.jsx';
import { BatchAnalysisProgressModal } from '../components/analysis/batch-analysis-progress-modal.jsx';
import { CreateApplicantModal } from '../components/applicants/create-applicant-modal.jsx';
import { ApplicantListSection } from '../components/applicants/applicant-list-section.jsx';
import { ApplicantPagination } from '../components/applicants/applicant-pagination.jsx';
import { GroupDetailPanel } from '../components/groups/group-detail-panel.jsx';
import DashboardLayout from '../components/layout/DashboardLayout';
import { getApiErrorCode } from '../services/api/api-types.js';
import {
  getAnalysisRun,
  getAnalysisRuns,
  requestApplicantAnalysis,
} from '../services/analysis/analysis-api.js';
import {
  getAnalysisProgressPercent,
  getAnalysisSummary,
  getRecoveredAnalysisRuns,
  mergeTrackedAnalysisRuns,
} from '../services/analysis/analysis-state.js';
import {
  ANALYSIS_STATUS_VALUES,
  DEFAULT_ANALYSIS_POLLING_INTERVAL_MS,
  TERMINAL_ANALYSIS_STATUS_VALUES,
} from '../services/analysis/analysis-types.js';
import {
  createApplicantListSearchParams,
  getApplicantListParamsFromSearchParams,
  getApplicants,
} from '../services/applicants/applicant-api.js';
import {
  DEFAULT_APPLICANT_LIST_PAGE,
  DEFAULT_APPLICANT_LIST_SIZE,
} from '../services/applicants/applicant-types.js';
import { getGroupDetail } from '../services/groups/group-api.js';

function getGroupDetailErrorState(error) {
  const errorCode = getApiErrorCode(error);

  if (errorCode === 'GROUP_NOT_FOUND') {
    return {
      title: 'Group not found',
      description: 'The requested group does not exist or is no longer available.',
    };
  }

  if (errorCode === 'FORBIDDEN_RESOURCE_ACCESS') {
    return {
      title: 'Access denied',
      description: 'You do not have permission to view this group.',
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
    title: 'Unable to load group',
    description:
      error instanceof Error && error.message.length > 0
        ? error.message
        : 'The group detail request failed. Please try again.',
  };
}

function getApplicantListErrorMessage(error) {
  const errorCode = getApiErrorCode(error);

  if (errorCode === 'UNAUTHORIZED' || errorCode === 'AUTH_TOKEN_EXPIRED') {
    return 'Your session is no longer valid. Please sign in again and retry.';
  }

  if (errorCode === 'FORBIDDEN_RESOURCE_ACCESS') {
    return 'You do not have permission to view applicants for this group.';
  }

  if (errorCode === 'GROUP_NOT_FOUND') {
    return 'This group no longer exists, so its applicants cannot be loaded.';
  }

  if (error?.response === undefined) {
    return 'Unable to reach the server. Please check your connection and try again.';
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return 'The applicant list request failed. Please try again.';
}

function getBatchAnalysisRequestErrorMessage(error) {
  const errorCode = getApiErrorCode(error);

  if (errorCode === 'ANALYSIS_RUN_ALREADY_COMPLETED') {
    return 'Completed analysis already exists for this applicant.';
  }

  if (errorCode === 'APPLICANT_NOT_FOUND') {
    return 'This applicant no longer exists, so analysis could not be started.';
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

  return 'Unable to start the AI analysis for this applicant.';
}

function getBatchAnalysisRecoveryErrorMessage(error) {
  const errorCode = getApiErrorCode(error);

  if (errorCode === 'FORBIDDEN_RESOURCE_ACCESS') {
    return 'You do not have permission to recover saved analysis for this applicant.';
  }

  if (errorCode === 'UNAUTHORIZED' || errorCode === 'AUTH_TOKEN_EXPIRED') {
    return 'Your session is no longer valid. Please sign in again and retry.';
  }

  if (error?.response === undefined) {
    return 'Unable to recover saved analysis because the server could not be reached.';
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return 'Unable to recover the saved analysis state for this applicant.';
}

function getBatchAnalysisPollingErrorMessage(error) {
  const errorCode = getApiErrorCode(error);

  if (errorCode === 'ANALYSIS_RUN_NOT_FOUND') {
    return 'One of the tracked analysis runs could not be found anymore.';
  }

  if (errorCode === 'FORBIDDEN_RESOURCE_ACCESS') {
    return 'You do not have permission to track this applicant analysis.';
  }

  if (errorCode === 'UNAUTHORIZED' || errorCode === 'AUTH_TOKEN_EXPIRED') {
    return 'Your session is no longer valid. Please sign in again and retry.';
  }

  if (error?.response === undefined) {
    return 'Unable to refresh analysis progress because the server could not be reached.';
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return 'Unable to refresh analysis progress right now.';
}

function createEmptyApplicantAnalysisState() {
  return {
    analysisRunIds: [],
    analysisRuns: [],
    lastUpdatedAt: null,
    isRequesting: false,
    requestErrorMessage: '',
    pollingErrorMessage: '',
    infoMessage: '',
  };
}

function createQueuedAnalysisRuns(analysisRunIds) {
  return analysisRunIds.map((analysisRunId) => ({
    id: analysisRunId,
    status: ANALYSIS_STATUS_VALUES.QUEUED,
    currentStage: null,
    startedAt: null,
    completedAt: null,
    failureReason: null,
  }));
}

function hasValidApplicantId(applicant) {
  return typeof applicant?.id === 'string' && applicant.id.length > 0;
}

function getTrackedAnalysisRunIds(analysisRuns) {
  return analysisRuns
    .filter((analysisRun) => {
      return (
        analysisRun.status === ANALYSIS_STATUS_VALUES.QUEUED ||
        analysisRun.status === ANALYSIS_STATUS_VALUES.IN_PROGRESS
      );
    })
    .map((analysisRun) => analysisRun.id)
    .filter((analysisRunId) => typeof analysisRunId === 'string' && analysisRunId.length > 0);
}

function hasCompletedAnalysisRuns(analysisRuns) {
  return analysisRuns.some((analysisRun) => {
    return analysisRun.status === ANALYSIS_STATUS_VALUES.COMPLETED;
  });
}

function buildApplicantAnalysisItem(applicant, analysisState) {
  const nextAnalysisState = analysisState ?? createEmptyApplicantAnalysisState();
  const summary = getAnalysisSummary(
    nextAnalysisState.analysisRuns,
    nextAnalysisState.lastUpdatedAt,
  );

  return {
    applicant,
    ...nextAnalysisState,
    summary,
    progressPercent: nextAnalysisState.isRequesting ? 5 : getAnalysisProgressPercent(summary),
    canStartAnalysis:
      !nextAnalysisState.isRequesting &&
      summary?.status !== ANALYSIS_STATUS_VALUES.QUEUED &&
      summary?.status !== ANALYSIS_STATUS_VALUES.IN_PROGRESS,
    canViewQuestions:
      summary?.status === ANALYSIS_STATUS_VALUES.COMPLETED ||
      hasCompletedAnalysisRuns(nextAnalysisState.analysisRuns),
  };
}

async function loadRecoveredApplicantAnalysisState(applicantId) {
  const recoveredAnalysisRuns = [];
  let nextPage = 1;
  let totalPages = 1;

  while (nextPage <= totalPages) {
    const response = await getAnalysisRuns({
      applicantId,
      page: nextPage,
      size: 20,
    });

    recoveredAnalysisRuns.push(...response.analysisRuns);
    totalPages = Math.max(1, Math.ceil(response.meta.total / response.meta.size));
    nextPage += 1;
  }

  const analysisRuns = getRecoveredAnalysisRuns(recoveredAnalysisRuns);

  return {
    analysisRuns,
    analysisRunIds: getTrackedAnalysisRunIds(analysisRuns),
    lastUpdatedAt: analysisRuns.length > 0 ? new Date().toISOString() : null,
  };
}

function GroupDetailLoadingState() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="animate-pulse space-y-5">
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="h-8 w-2/5 rounded bg-slate-200" />
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

function GroupDetailErrorState({ title, description, onBack, onRetry }) {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-8 shadow-sm">
      <h2 className="text-2xl font-semibold text-red-900">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-red-700">{description}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={onBack}
          className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
        >
          Back to Groups
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

export function GroupDetailPage() {
  const { groupId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [group, setGroup] = useState(null);
  const [isLoadingGroup, setIsLoadingGroup] = useState(true);
  const [groupErrorState, setGroupErrorState] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [applicantListMeta, setApplicantListMeta] = useState({
    page: DEFAULT_APPLICANT_LIST_PAGE,
    size: DEFAULT_APPLICANT_LIST_SIZE,
    total: 0,
    requestId: null,
  });
  const [isLoadingApplicants, setIsLoadingApplicants] = useState(true);
  const [applicantListErrorMessage, setApplicantListErrorMessage] = useState(null);
  const [applicantCreationSuccessMessage, setApplicantCreationSuccessMessage] = useState('');
  const [isCreateApplicantModalOpen, setIsCreateApplicantModalOpen] = useState(false);
  const [groupRetryCount, setGroupRetryCount] = useState(0);
  const [applicantRetryCount, setApplicantRetryCount] = useState(0);
  const [applicantAnalysisStates, setApplicantAnalysisStates] = useState({});
  const [batchAnalysisInfoMessage, setBatchAnalysisInfoMessage] = useState('');
  const [batchAnalysisErrorMessage, setBatchAnalysisErrorMessage] = useState('');
  const [isStartingBatchAnalysis, setIsStartingBatchAnalysis] = useState(false);
  const [isBatchAnalysisModalOpen, setIsBatchAnalysisModalOpen] = useState(false);
  const [batchAnalysisModalApplicantIds, setBatchAnalysisModalApplicantIds] = useState([]);
  const [selectedBatchAnalysisApplicantId, setSelectedBatchAnalysisApplicantId] = useState(null);

  const applicantListRequestIdRef = useRef(0);
  const analysisRecoveryRequestIdRef = useRef(0);
  const analysisPollRequestIdRef = useRef(0);
  const applicantAnalysisStatesRef = useRef({});

  const applicantListParams = getApplicantListParamsFromSearchParams(searchParams);
  const normalizedApplicantSearchParams = createApplicantListSearchParams({
    page: applicantListParams.page,
    size: applicantListParams.size,
  });
  const currentApplicantSearchParamState = new URLSearchParams();
  const normalizedApplicantSearchParamState = new URLSearchParams();

  currentApplicantSearchParamState.set('applicantPage', searchParams.get('applicantPage') ?? '');
  currentApplicantSearchParamState.set('applicantSize', searchParams.get('applicantSize') ?? '');

  normalizedApplicantSearchParamState.set(
    'applicantPage',
    normalizedApplicantSearchParams.get('applicantPage') ?? '',
  );
  normalizedApplicantSearchParamState.set(
    'applicantSize',
    normalizedApplicantSearchParams.get('applicantSize') ?? '',
  );

  const areApplicantSearchParamsNormalized =
    currentApplicantSearchParamState.toString() === normalizedApplicantSearchParamState.toString();
  const applicantCurrentPage = applicantListParams.page;
  const applicantCurrentSize = applicantListParams.size;

  const backDestination = location.state?.from ?? '/dashboard';
  const recentGroups =
    group === null
      ? []
      : [
          {
            id: group.id,
            name: group.name ?? 'Untitled Group',
            href: typeof group.id === 'string' ? `/groups/${group.id}` : '/dashboard',
          },
        ];
  const applicantAnalysisItems = applicants.map((applicant) => {
    return buildApplicantAnalysisItem(applicant, applicantAnalysisStates[applicant.id]);
  });
  const startableApplicantCount = applicantAnalysisItems.filter((item) => item.canStartAnalysis).length;
  const batchSummary = applicantAnalysisItems.reduce(
    (summary, item) => {
      if (item.isRequesting) {
        return {
          ...summary,
          queued: summary.queued + 1,
        };
      }

      if (item.summary?.status === ANALYSIS_STATUS_VALUES.QUEUED) {
        return {
          ...summary,
          queued: summary.queued + 1,
        };
      }

      if (item.summary?.status === ANALYSIS_STATUS_VALUES.IN_PROGRESS) {
        return {
          ...summary,
          inProgress: summary.inProgress + 1,
        };
      }

      if (item.summary?.status === ANALYSIS_STATUS_VALUES.COMPLETED) {
        return {
          ...summary,
          completed: summary.completed + 1,
        };
      }

      if (item.summary?.status === ANALYSIS_STATUS_VALUES.FAILED) {
        return {
          ...summary,
          failed: summary.failed + 1,
        };
      }

      return {
        ...summary,
        ready: summary.ready + 1,
      };
    },
    {
      ready: 0,
      queued: 0,
      inProgress: 0,
      completed: 0,
      failed: 0,
    },
  );
  const activePollTargetKey = applicantAnalysisItems
    .filter((item) => item.analysisRunIds.length > 0)
    .map((item) => `${item.applicant.id}:${item.analysisRunIds.join(',')}`)
    .join('|');

  useEffect(() => {
    applicantAnalysisStatesRef.current = applicantAnalysisStates;
  }, [applicantAnalysisStates]);

  useEffect(() => {
    setApplicantAnalysisStates({});
    applicantAnalysisStatesRef.current = {};
    setBatchAnalysisInfoMessage('');
    setBatchAnalysisErrorMessage('');
    setIsStartingBatchAnalysis(false);
    setIsBatchAnalysisModalOpen(false);
    setBatchAnalysisModalApplicantIds([]);
    setSelectedBatchAnalysisApplicantId(null);
    analysisRecoveryRequestIdRef.current += 1;
    analysisPollRequestIdRef.current += 1;
  }, [groupId]);

  useEffect(() => {
    if (batchAnalysisModalApplicantIds.length === 0) {
      return;
    }

    const hasSelectedApplicant = batchAnalysisModalApplicantIds.includes(selectedBatchAnalysisApplicantId);

    if (hasSelectedApplicant) {
      return;
    }

    setSelectedBatchAnalysisApplicantId(batchAnalysisModalApplicantIds[0]);
  }, [batchAnalysisModalApplicantIds, selectedBatchAnalysisApplicantId]);

  useEffect(() => {
    if (areApplicantSearchParamsNormalized) {
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams);

    nextSearchParams.set('applicantPage', String(applicantCurrentPage));
    nextSearchParams.set('applicantSize', String(applicantCurrentSize));

    setSearchParams(nextSearchParams, { replace: true });
  }, [
    applicantCurrentPage,
    applicantCurrentSize,
    areApplicantSearchParamsNormalized,
    searchParams,
    setSearchParams,
  ]);

  useEffect(() => {
    if (typeof groupId !== 'string' || groupId.length === 0) {
      setGroup(null);
      setGroupErrorState({
        title: 'Invalid group',
        description: 'A valid group identifier is required to load this page.',
      });
      setIsLoadingGroup(false);
      return;
    }

    let isMounted = true;

    async function loadGroupDetail() {
      setIsLoadingGroup(true);
      setGroupErrorState(null);

      try {
        const response = await getGroupDetail(groupId);

        if (!isMounted) {
          return;
        }

        setGroup(response.group);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setGroup(null);
        setGroupErrorState(getGroupDetailErrorState(error));
      } finally {
        if (isMounted) {
          setIsLoadingGroup(false);
        }
      }
    }

    void loadGroupDetail();

    return () => {
      isMounted = false;
    };
  }, [groupId, groupRetryCount]);

  useEffect(() => {
    setApplicantCreationSuccessMessage('');
    setIsCreateApplicantModalOpen(false);
  }, [groupId]);

  useEffect(() => {
    if (!areApplicantSearchParamsNormalized) {
      return;
    }

    if (typeof groupId !== 'string' || groupId.length === 0) {
      setApplicants([]);
      setApplicantListMeta({
        page: DEFAULT_APPLICANT_LIST_PAGE,
        size: DEFAULT_APPLICANT_LIST_SIZE,
        total: 0,
        requestId: null,
      });
      setApplicantListErrorMessage('A valid group identifier is required to load applicants.');
      setIsLoadingApplicants(false);
      return;
    }

    let isMounted = true;

    async function loadApplicants() {
      const requestId = applicantListRequestIdRef.current + 1;

      applicantListRequestIdRef.current = requestId;
      setIsLoadingApplicants(true);
      setApplicantListErrorMessage(null);
      setApplicantListMeta((previousMeta) => ({
        ...previousMeta,
        page: applicantCurrentPage,
        size: applicantCurrentSize,
      }));

      try {
        const response = await getApplicants({
          groupId,
          page: applicantCurrentPage,
          size: applicantCurrentSize,
        });

        if (!isMounted || applicantListRequestIdRef.current !== requestId) {
          return;
        }

        setApplicants(response.applicants);
        setApplicantListMeta(response.meta);
      } catch (error) {
        if (!isMounted || applicantListRequestIdRef.current !== requestId) {
          return;
        }

        setApplicants([]);
        setApplicantListMeta((previousMeta) => ({
          ...previousMeta,
          page: applicantCurrentPage,
          size: applicantCurrentSize,
          total: 0,
        }));
        setApplicantListErrorMessage(getApplicantListErrorMessage(error));
      } finally {
        if (isMounted && applicantListRequestIdRef.current === requestId) {
          setIsLoadingApplicants(false);
        }
      }
    }

    void loadApplicants();

    return () => {
      isMounted = false;
    };
  }, [
    applicantCurrentPage,
    applicantCurrentSize,
    applicantRetryCount,
    areApplicantSearchParamsNormalized,
    groupId,
  ]);

  useEffect(() => {
    if (
      isLoadingApplicants ||
      applicantListErrorMessage !== null ||
      applicants.length === 0
    ) {
      return;
    }

    let isMounted = true;
    const requestId = analysisRecoveryRequestIdRef.current + 1;

    analysisRecoveryRequestIdRef.current = requestId;

    async function recoverVisibleApplicantAnalysis() {
      const validApplicants = applicants.filter(hasValidApplicantId);
      const recoveredResults = await Promise.allSettled(
        validApplicants.map((applicant) => loadRecoveredApplicantAnalysisState(applicant.id)),
      );

      if (!isMounted || analysisRecoveryRequestIdRef.current !== requestId) {
        return;
      }

      setApplicantAnalysisStates((previousStates) => {
        const nextStates = { ...previousStates };

        validApplicants.forEach((applicant, index) => {
          const previousState =
            nextStates[applicant.id] ?? createEmptyApplicantAnalysisState();
          const recoveredResult = recoveredResults[index];

          if (recoveredResult.status === 'fulfilled') {
            if (
              recoveredResult.value.analysisRuns.length === 0 &&
              hasCompletedAnalysisRuns(previousState.analysisRuns)
            ) {
              nextStates[applicant.id] = {
                ...previousState,
                isRequesting: false,
                requestErrorMessage: '',
                pollingErrorMessage: '',
              };

              return;
            }

            nextStates[applicant.id] = {
              ...previousState,
              ...recoveredResult.value,
              isRequesting: false,
              requestErrorMessage: '',
              pollingErrorMessage: '',
            };

            return;
          }

          nextStates[applicant.id] = {
            ...previousState,
            isRequesting: false,
            pollingErrorMessage: getBatchAnalysisRecoveryErrorMessage(recoveredResult.reason),
          };
        });

        return nextStates;
      });
    }

    void recoverVisibleApplicantAnalysis();

    return () => {
      isMounted = false;
    };
  }, [applicants, applicantListErrorMessage, isLoadingApplicants]);

  useEffect(() => {
    if (activePollTargetKey.length === 0) {
      return;
    }

    let isMounted = true;

    async function pollApplicantAnalyses() {
      const requestId = analysisPollRequestIdRef.current + 1;

      analysisPollRequestIdRef.current = requestId;

      const activeApplicants = applicants
        .filter(hasValidApplicantId)
        .map((applicant) => ({
          applicantId: applicant.id,
          analysisState:
            applicantAnalysisStatesRef.current[applicant.id] ?? createEmptyApplicantAnalysisState(),
        }))
        .filter((entry) => entry.analysisState.analysisRunIds.length > 0);
      const pollResults = await Promise.all(
        activeApplicants.map(async ({ applicantId, analysisState }) => {
          const settledAnalysisRuns = await Promise.allSettled(
            analysisState.analysisRunIds.map(async (analysisRunId) => {
              const response = await getAnalysisRun(analysisRunId);

              return response.analysisRun;
            }),
          );
          const nextAnalysisRuns = settledAnalysisRuns
            .filter((result) => result.status === 'fulfilled')
            .map((result) => result.value);
          const missingAnalysisRunIds = settledAnalysisRuns
            .map((result, index) => {
              if (result.status !== 'rejected') {
                return null;
              }

              return getApiErrorCode(result.reason) === 'ANALYSIS_RUN_NOT_FOUND'
                ? analysisState.analysisRunIds[index]
                : null;
            })
            .filter((analysisRunId) => typeof analysisRunId === 'string');
          const mergedAnalysisRuns = mergeTrackedAnalysisRuns(
            analysisState.analysisRuns,
            nextAnalysisRuns,
            analysisState.analysisRunIds,
            missingAnalysisRunIds,
          );
          const rejectedResult = settledAnalysisRuns.find((result) => {
            return (
              result.status === 'rejected' &&
              getApiErrorCode(result.reason) !== 'ANALYSIS_RUN_NOT_FOUND'
            );
          });

          return {
            applicantId,
            analysisRuns: mergedAnalysisRuns,
            analysisRunIds: getTrackedAnalysisRunIds(mergedAnalysisRuns).filter((analysisRunId) => {
              return !missingAnalysisRunIds.includes(analysisRunId);
            }),
            lastUpdatedAt: new Date().toISOString(),
            pollingErrorMessage:
              rejectedResult === undefined
                ? ''
                : getBatchAnalysisPollingErrorMessage(rejectedResult.reason),
            infoMessage:
              mergedAnalysisRuns.length > 0 &&
              mergedAnalysisRuns.every((analysisRun) => {
                return TERMINAL_ANALYSIS_STATUS_VALUES.includes(analysisRun.status);
              }) &&
              mergedAnalysisRuns.some((analysisRun) => {
                return analysisRun.status === ANALYSIS_STATUS_VALUES.COMPLETED;
              })
                ? 'Questions are ready to review.'
                : '',
          };
        }),
      );

      if (!isMounted || analysisPollRequestIdRef.current !== requestId) {
        return;
      }

      setApplicantAnalysisStates((previousStates) => {
        const nextStates = { ...previousStates };

        pollResults.forEach((result) => {
          const previousState =
            nextStates[result.applicantId] ?? createEmptyApplicantAnalysisState();

          nextStates[result.applicantId] = {
            ...previousState,
            analysisRuns: result.analysisRuns,
            analysisRunIds: result.analysisRunIds,
            lastUpdatedAt: result.lastUpdatedAt,
            pollingErrorMessage: result.pollingErrorMessage,
            infoMessage:
              result.infoMessage.length > 0 ? result.infoMessage : previousState.infoMessage,
            isRequesting: false,
          };
        });

        return nextStates;
      });
    }

    void pollApplicantAnalyses();

    const intervalId = window.setInterval(() => {
      void pollApplicantAnalyses();
    }, DEFAULT_ANALYSIS_POLLING_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [activePollTargetKey, applicants]);

  function handleBack() {
    navigate(backDestination);
  }

  function handleGroupRetry() {
    setGroupRetryCount((previousRetryCount) => previousRetryCount + 1);
  }

  function updateApplicantSearchParams(nextParams) {
    const nextSearchParams = new URLSearchParams(searchParams);
    const nextApplicantSearchParams = createApplicantListSearchParams(nextParams);

    nextSearchParams.set('applicantPage', nextApplicantSearchParams.get('applicantPage') ?? '1');
    nextSearchParams.set('applicantSize', nextApplicantSearchParams.get('applicantSize') ?? '20');

    setSearchParams(nextSearchParams);
  }

  function handleApplicantPageChange(nextPage) {
    if (nextPage < 1 || nextPage === applicantCurrentPage) {
      return;
    }

    updateApplicantSearchParams({
      page: nextPage,
      size: applicantCurrentSize,
    });
  }

  function handleApplicantPageSizeChange(event) {
    const nextSize = Number(event.target.value);

    updateApplicantSearchParams({
      page: DEFAULT_APPLICANT_LIST_PAGE,
      size: nextSize,
    });
  }

  function handleApplicantRetry() {
    setApplicantRetryCount((previousRetryCount) => previousRetryCount + 1);
  }

  function handleOpenCreateApplicantModal() {
    setIsCreateApplicantModalOpen(true);
  }

  function handleCloseCreateApplicantModal() {
    setIsCreateApplicantModalOpen(false);
  }

  function handleCloseBatchAnalysisModal() {
    setIsBatchAnalysisModalOpen(false);
  }

  function handleSelectBatchAnalysisApplicant(applicantId) {
    setSelectedBatchAnalysisApplicantId(applicantId);
  }

  function handleApplicantCreated({ applicantName }) {
    setApplicantCreationSuccessMessage(
      applicantName.length > 0
        ? `Applicant "${applicantName}" was created successfully. The list has been refreshed.`
        : 'Applicant was created successfully. The list has been refreshed.',
    );
    setApplicantRetryCount((previousRetryCount) => previousRetryCount + 1);
  }

  function handleViewApplicantQuestions(applicant) {
    if (!hasValidApplicantId(applicant) || typeof groupId !== 'string') {
      return;
    }

    navigate(`/groups/${groupId}/applicants/${applicant.id}`, {
      state: {
        from: `${location.pathname}${location.search}`,
      },
    });
  }

  async function handleStartBatchAnalysis() {
    const targetApplicants = applicantAnalysisItems
      .filter((item) => hasValidApplicantId(item.applicant) && item.canStartAnalysis)
      .map((item) => item.applicant);

    if (targetApplicants.length === 0) {
      return;
    }

    setBatchAnalysisModalApplicantIds(targetApplicants.map((applicant) => applicant.id));
    setSelectedBatchAnalysisApplicantId(targetApplicants[0]?.id ?? null);
    setIsBatchAnalysisModalOpen(true);
    setIsStartingBatchAnalysis(true);
    setBatchAnalysisInfoMessage('');
    setBatchAnalysisErrorMessage('');
    setApplicantAnalysisStates((previousStates) => {
      const nextStates = { ...previousStates };

      targetApplicants.forEach((applicant) => {
        const previousState =
          nextStates[applicant.id] ?? createEmptyApplicantAnalysisState();

        nextStates[applicant.id] = {
          ...previousState,
          isRequesting: true,
          requestErrorMessage: '',
          pollingErrorMessage: '',
          infoMessage: '',
        };
      });

      return nextStates;
    });

    try {
      const requestResults = await Promise.allSettled(
        targetApplicants.map(async (applicant) => {
          return {
            applicantId: applicant.id,
            response: await requestApplicantAnalysis(applicant.id),
          };
        }),
      );
      const queuedStateUpdates = new Map();
      const failureStateUpdates = new Map();
      const conflictApplicantIds = [];
      const queuedApplicantIds = [];

      requestResults.forEach((result, index) => {
        const applicantId = targetApplicants[index].id;

        if (result.status === 'fulfilled') {
          queuedApplicantIds.push(applicantId);
          queuedStateUpdates.set(applicantId, {
            analysisRunIds: result.value.response.analysisRunIds,
            analysisRuns: createQueuedAnalysisRuns(result.value.response.analysisRunIds),
            lastUpdatedAt: new Date().toISOString(),
            isRequesting: false,
            requestErrorMessage: '',
            pollingErrorMessage: '',
            infoMessage: 'Analysis queued. Live progress updates started.',
          });

          return;
        }

        if (getApiErrorCode(result.reason) === 'ANALYSIS_RUN_ALREADY_COMPLETED') {
          conflictApplicantIds.push(applicantId);
          return;
        }

        failureStateUpdates.set(applicantId, {
          isRequesting: false,
          requestErrorMessage: getBatchAnalysisRequestErrorMessage(result.reason),
          pollingErrorMessage: '',
          infoMessage: '',
        });
      });

      const recoveredStateUpdates = new Map();

      if (conflictApplicantIds.length > 0) {
        const recoveredResults = await Promise.allSettled(
          conflictApplicantIds.map((applicantId) => loadRecoveredApplicantAnalysisState(applicantId)),
        );

        recoveredResults.forEach((result, index) => {
          const applicantId = conflictApplicantIds[index];

          if (result.status === 'fulfilled') {
            recoveredStateUpdates.set(applicantId, {
              ...result.value,
              isRequesting: false,
              requestErrorMessage: '',
              pollingErrorMessage: '',
              infoMessage: 'Existing completed analysis found. Saved questions are ready.',
            });

            return;
          }

          failureStateUpdates.set(applicantId, {
            isRequesting: false,
            requestErrorMessage: getBatchAnalysisRecoveryErrorMessage(result.reason),
            pollingErrorMessage: '',
            infoMessage: '',
          });
        });
      }

      setApplicantAnalysisStates((previousStates) => {
        const nextStates = { ...previousStates };

        targetApplicants.forEach((applicant) => {
          const previousState =
            nextStates[applicant.id] ?? createEmptyApplicantAnalysisState();

          nextStates[applicant.id] = {
            ...previousState,
            isRequesting: false,
          };
        });

        queuedStateUpdates.forEach((nextState, applicantId) => {
          const previousState =
            nextStates[applicantId] ?? createEmptyApplicantAnalysisState();

          nextStates[applicantId] = {
            ...previousState,
            ...nextState,
          };
        });

        recoveredStateUpdates.forEach((nextState, applicantId) => {
          const previousState =
            nextStates[applicantId] ?? createEmptyApplicantAnalysisState();

          nextStates[applicantId] = {
            ...previousState,
            ...nextState,
          };
        });

        failureStateUpdates.forEach((nextState, applicantId) => {
          const previousState =
            nextStates[applicantId] ?? createEmptyApplicantAnalysisState();

          nextStates[applicantId] = {
            ...previousState,
            ...nextState,
          };
        });

        return nextStates;
      });

      const failureCount = failureStateUpdates.size;
      const infoMessages = [];

      if (queuedApplicantIds.length > 0) {
        infoMessages.push(`${queuedApplicantIds.length} applicants were queued for analysis.`);
      }

      if (recoveredStateUpdates.size > 0) {
        infoMessages.push(
          `${recoveredStateUpdates.size} applicants already had completed analysis and were recovered.`,
        );
      }

      setBatchAnalysisInfoMessage(infoMessages.join(' '));
      setBatchAnalysisErrorMessage(
        failureCount > 0 ? `${failureCount} applicants could not start analysis.` : '',
      );
    } finally {
      setIsStartingBatchAnalysis(false);
    }
  }

  return (
    <DashboardLayout
      rooms={[]}
      recentItems={recentGroups}
      recentItemsLabel="Recent Groups"
      title="Group Detail"
      description="Run parallel applicant analysis from one list and watch every row update live."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-6">
          <button
            onClick={handleBack}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Back to Groups
          </button>

          {isLoadingGroup ? <GroupDetailLoadingState /> : null}

          {!isLoadingGroup && groupErrorState !== null ? (
            <GroupDetailErrorState
              title={groupErrorState.title}
              description={groupErrorState.description}
              onBack={handleBack}
              onRetry={handleGroupRetry}
            />
          ) : null}

          {!isLoadingGroup && groupErrorState === null && group !== null ? (
            <>
              <GroupDetailPanel group={group} />

              {applicantCreationSuccessMessage.length > 0 ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
                  {applicantCreationSuccessMessage}
                </div>
              ) : null}

              <ApplicantListSection
                analysisItems={applicantAnalysisItems}
                batchErrorMessage={batchAnalysisErrorMessage}
                batchInfoMessage={batchAnalysisInfoMessage}
                canStartAnalysis={startableApplicantCount > 0}
                emptyActionLabel="Add Applicant"
                isLoading={isLoadingApplicants}
                isStartingAnalysis={isStartingBatchAnalysis}
                errorMessage={applicantListErrorMessage}
                onAddApplicant={handleOpenCreateApplicantModal}
                onRetry={handleApplicantRetry}
                onStartAnalysis={handleStartBatchAnalysis}
                onViewQuestions={handleViewApplicantQuestions}
                totalApplicants={applicantListMeta.total}
              />

              <ApplicantPagination
                page={applicantListMeta.page}
                size={applicantListMeta.size}
                total={applicantListMeta.total}
                isDisabled={isLoadingApplicants}
                onPageChange={handleApplicantPageChange}
                onPageSizeChange={handleApplicantPageSizeChange}
              />
            </>
          ) : null}
        </section>

        <aside className="space-y-6">
          <AuthDebugPanel />

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Batch Overview</h3>

            <div className="space-y-4 text-sm text-slate-600">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Ready to Start
                </p>
                <p className="mt-2 break-all font-medium text-slate-800">{batchSummary.ready}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Queued
                </p>
                <p className="mt-2 break-all font-medium text-slate-800">{batchSummary.queued}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  In Progress
                </p>
                <p className="mt-2 break-all font-medium text-slate-800">
                  {batchSummary.inProgress}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Completed
                </p>
                <p className="mt-2 break-all font-medium text-slate-800">
                  {batchSummary.completed}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Failed
                </p>
                <p className="mt-2 break-all font-medium text-slate-800">{batchSummary.failed}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Polling
                </p>
                <p className="mt-2 break-all font-medium text-slate-800">
                  Every {DEFAULT_ANALYSIS_POLLING_INTERVAL_MS / 1000} seconds
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <CreateApplicantModal
        key={group?.id ?? 'no-group'}
        group={group}
        isOpen={isCreateApplicantModalOpen}
        onClose={handleCloseCreateApplicantModal}
        onCreated={handleApplicantCreated}
      />

      <BatchAnalysisProgressModal
        analysisItems={applicantAnalysisItems.filter((item) => {
          return batchAnalysisModalApplicantIds.includes(item.applicant.id);
        })}
        isOpen={isBatchAnalysisModalOpen}
        onClose={handleCloseBatchAnalysisModal}
        onSelectApplicant={handleSelectBatchAnalysisApplicant}
        selectedApplicantId={selectedBatchAnalysisApplicantId}
      />
    </DashboardLayout>
  );
}
