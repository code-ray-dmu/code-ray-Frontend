import { getApiClient } from '../api/api-client.js';
import {
  createMockRequestId,
  hasMockApplicant,
  USE_API_MOCK,
} from '../mock/mock-api-store.js';
import {
  isGeneratedQuestion,
  mapAnalysisRequestResult,
  mapAnalysisRun,
  mapAnalysisRunListItem,
  mapGeneratedQuestion,
  mapPaginatedMeta,
  mapRequestMeta,
  normalizeGeneratedQuestionListMeta,
  normalizeGeneratedQuestionListOrder,
} from './analysis-mappers.js';
import {
  ANALYSIS_STAGE_VALUES,
  ANALYSIS_RUN_API_PREFIX,
  ANALYSIS_STATUS_VALUES,
  DEFAULT_ANALYSIS_RUN_LIST_PAGE,
  DEFAULT_ANALYSIS_RUN_LIST_SIZE,
  DEFAULT_GENERATED_QUESTION_ORDER,
  DEFAULT_GENERATED_QUESTION_LIST_PAGE,
  DEFAULT_GENERATED_QUESTION_LIST_SIZE,
  DEFAULT_GENERATED_QUESTION_SORT,
  GENERATED_QUESTION_SORT_VALUES,
} from './analysis-types.js';

const USE_ANALYSIS_API_MOCK = USE_API_MOCK;
const MOCK_ANALYSIS_STEP_DURATION_MS = 3_000;
const MOCK_ANALYSIS_STEPS = [
  {
    status: ANALYSIS_STATUS_VALUES.QUEUED,
    currentStage: ANALYSIS_STAGE_VALUES.REPO_LIST,
  },
  {
    status: ANALYSIS_STATUS_VALUES.IN_PROGRESS,
    currentStage: ANALYSIS_STAGE_VALUES.FILE_DETAIL,
  },
  {
    status: ANALYSIS_STATUS_VALUES.COMPLETED,
    currentStage: ANALYSIS_STAGE_VALUES.QUESTION_GENERATION,
  },
];
const mockAnalysisRunStore = new Map();
const mockGeneratedQuestionStore = new Map();

function normalizePositiveInteger(value, fallbackValue) {
  const nextValue = Number(value);

  if (!Number.isInteger(nextValue) || nextValue < 1) {
    return fallbackValue;
  }

  return nextValue;
}

function normalizeOptionalString(value) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    return undefined;
  }

  return normalizedValue;
}

function normalizeGeneratedQuestionSort(sort) {
  const normalizedSort = normalizeOptionalString(sort);

  if (normalizedSort === undefined) {
    return undefined;
  }

  return Object.values(GENERATED_QUESTION_SORT_VALUES).includes(normalizedSort)
    ? normalizedSort
    : undefined;
}

function createMockAnalysisRunId(applicantId) {
  const normalizedApplicantId = applicantId.replace(/[^a-zA-Z0-9-]/g, '-');

  return `mock-analysis-${normalizedApplicantId}-${Date.now()}`;
}

function createMockAnalysisRunNotFoundError(analysisRunId) {
  const error = new Error(`Mock analysis run "${analysisRunId}" was not found.`);

  error.response = {
    data: {
      data: null,
      meta: {
        request_id: createMockRequestId(),
      },
      error: {
        code: 'ANALYSIS_RUN_NOT_FOUND',
        message: 'Analysis run not found',
      },
    },
  };

  return error;
}

function createMockGeneratedQuestions(applicantId, analysisRunId) {
  return [
    {
      generated_question_id: `${analysisRunId}-question-1`,
      analysis_run_id: analysisRunId,
      applicant_id: applicantId,
      category: 'SKILL',
      question_text:
        'How would you explain the most important architectural decision you made in this project?',
      intent:
        'Check whether the applicant can clearly justify a technical choice and discuss tradeoffs.',
      priority: 1,
    },
    {
      generated_question_id: `${analysisRunId}-question-2`,
      analysis_run_id: analysisRunId,
      applicant_id: applicantId,
      category: 'COLLABORATION',
      question_text:
        'Describe a moment when you had to align frontend work with backend or product constraints.',
      intent:
        'Understand how the applicant communicates constraints, negotiates scope, and collaborates across roles.',
      priority: 2,
    },
    {
      generated_question_id: `${analysisRunId}-question-3`,
      analysis_run_id: analysisRunId,
      applicant_id: applicantId,
      category: 'CULTURE_FIT',
      question_text:
        'If you were given one more day on this codebase, what would you improve first and why?',
      intent:
        'Reveal product judgment, ownership, and how the applicant prioritizes improvement work.',
      priority: 3,
    },
  ];
}

function createMockAnalysisRunRecord(applicantId) {
  const requestedAtMs = Date.now();
  const analysisRunId = createMockAnalysisRunId(applicantId);

  return {
    analysisRunId,
    applicantId,
    requestedAtMs,
    startedAt: new Date(requestedAtMs).toISOString(),
  };
}

function getMockCompletedAt(record, stepIndex) {
  if (stepIndex < MOCK_ANALYSIS_STEPS.length - 1) {
    return null;
  }

  return new Date(
    record.requestedAtMs + MOCK_ANALYSIS_STEP_DURATION_MS * (MOCK_ANALYSIS_STEPS.length - 1),
  ).toISOString();
}

function buildMockAnalysisRunPayload(record) {
  const elapsedMs = Math.max(0, Date.now() - record.requestedAtMs);
  const stepIndex = Math.min(
    Math.floor(elapsedMs / MOCK_ANALYSIS_STEP_DURATION_MS),
    MOCK_ANALYSIS_STEPS.length - 1,
  );
  const currentStep = MOCK_ANALYSIS_STEPS[stepIndex];

  return {
    analysis_run_id: record.analysisRunId,
    status: currentStep.status,
    current_stage: currentStep.currentStage,
    started_at: record.startedAt,
    completed_at: getMockCompletedAt(record, stepIndex),
    failure_reason: null,
  };
}

function getMockAnalysisRunRecordOrThrow(analysisRunId) {
  const record = mockAnalysisRunStore.get(analysisRunId);

  if (record === undefined) {
    throw createMockAnalysisRunNotFoundError(analysisRunId);
  }

  return record;
}

function sortMockQuestions(questions, sort, order) {
  const direction = order === 'desc' ? -1 : 1;

  return [...questions].sort((leftQuestion, rightQuestion) => {
    if (sort === GENERATED_QUESTION_SORT_VALUES.CATEGORY) {
      return leftQuestion.category.localeCompare(rightQuestion.category) * direction;
    }

    if (sort === GENERATED_QUESTION_SORT_VALUES.CREATED_AT) {
      return leftQuestion.generated_question_id.localeCompare(
        rightQuestion.generated_question_id,
      ) * direction;
    }

    return (leftQuestion.priority - rightQuestion.priority) * direction;
  });
}

function paginateItems(items, page, size) {
  const startIndex = (page - 1) * size;

  return items.slice(startIndex, startIndex + size);
}

export function normalizeAnalysisRunListParams(params = {}) {
  const normalizedApplicantId = normalizeOptionalString(params.applicantId);

  return {
    page: normalizePositiveInteger(params.page, DEFAULT_ANALYSIS_RUN_LIST_PAGE),
    size: normalizePositiveInteger(params.size, DEFAULT_ANALYSIS_RUN_LIST_SIZE),
    ...(normalizedApplicantId !== undefined ? { applicantId: normalizedApplicantId } : {}),
  };
}

export function normalizeGeneratedQuestionListParams(params = {}) {
  const normalizedSort =
    normalizeGeneratedQuestionSort(params.sort) ?? DEFAULT_GENERATED_QUESTION_SORT;
  const normalizedOrder =
    normalizeGeneratedQuestionListOrder(params.order) ?? DEFAULT_GENERATED_QUESTION_ORDER;

  return {
    page: normalizePositiveInteger(params.page, DEFAULT_GENERATED_QUESTION_LIST_PAGE),
    size: normalizePositiveInteger(params.size, DEFAULT_GENERATED_QUESTION_LIST_SIZE),
    sort: normalizedSort,
    order: normalizedOrder,
  };
}

export async function requestApplicantAnalysis(applicantId) {
  if (USE_ANALYSIS_API_MOCK) {
    const normalizedApplicantId = normalizeOptionalString(applicantId);

    if (normalizedApplicantId === undefined) {
      throw new Error('A valid applicantId is required to request mock analysis.');
    }

    if (!hasMockApplicant(normalizedApplicantId)) {
      const error = new Error('Applicant not found');

      error.response = {
        data: {
          data: null,
          meta: {
            request_id: createMockRequestId(),
          },
          error: {
            code: 'APPLICANT_NOT_FOUND',
            message: 'Applicant not found',
          },
        },
      };

      throw error;
    }

    const record = createMockAnalysisRunRecord(normalizedApplicantId);

    mockAnalysisRunStore.set(record.analysisRunId, record);
    mockGeneratedQuestionStore.set(
      record.analysisRunId,
      createMockGeneratedQuestions(normalizedApplicantId, record.analysisRunId),
    );

    const mappedResult = mapAnalysisRequestResult({
      success: true,
      analysis_run_ids: [record.analysisRunId],
    });

    return {
      ...mappedResult,
      meta: mapRequestMeta({
        request_id: createMockRequestId(),
      }),
    };
  }

  const response = await getApiClient().post(`/v1/applicants/${applicantId}/questions`);
  const mappedResult = mapAnalysisRequestResult(response.data.data);

  if (mappedResult.success && mappedResult.analysisRunIds.length === 0) {
    throw new Error('Analysis request response is missing analysisRunIds.');
  }

  return {
    ...mappedResult,
    meta: mapRequestMeta(response.data.meta),
  };
}

export async function getAnalysisRun(analysisRunId) {
  if (USE_ANALYSIS_API_MOCK) {
    const record = getMockAnalysisRunRecordOrThrow(analysisRunId);

    return {
      analysisRun: mapAnalysisRun(buildMockAnalysisRunPayload(record)),
      meta: mapRequestMeta({
        request_id: createMockRequestId(),
      }),
    };
  }

  const response = await getApiClient().get(`${ANALYSIS_RUN_API_PREFIX}/${analysisRunId}`);

  return {
    analysisRun: mapAnalysisRun(response.data.data),
    meta: mapRequestMeta(response.data.meta),
  };
}

export async function getAnalysisRuns(params = {}) {
  const normalizedParams = normalizeAnalysisRunListParams(params);

  if (USE_ANALYSIS_API_MOCK) {
    const filteredAnalysisRuns = [...mockAnalysisRunStore.values()]
      .filter((record) => {
        if (normalizedParams.applicantId === undefined) {
          return true;
        }

        return record.applicantId === normalizedParams.applicantId;
      })
      .map(buildMockAnalysisRunPayload)
      .sort((leftRun, rightRun) => {
        return Date.parse(rightRun.started_at) - Date.parse(leftRun.started_at);
      });
    const paginatedAnalysisRuns = paginateItems(
      filteredAnalysisRuns,
      normalizedParams.page,
      normalizedParams.size,
    );

    return {
      analysisRuns: paginatedAnalysisRuns.map(mapAnalysisRunListItem),
      meta: mapPaginatedMeta(
        {
          page: normalizedParams.page,
          size: normalizedParams.size,
          total: filteredAnalysisRuns.length,
          request_id: createMockRequestId(),
        },
        DEFAULT_ANALYSIS_RUN_LIST_PAGE,
        DEFAULT_ANALYSIS_RUN_LIST_SIZE,
      ),
      params: normalizedParams,
    };
  }

  const response = await getApiClient().get(ANALYSIS_RUN_API_PREFIX, {
    params: normalizedParams,
  });

  return {
    analysisRuns: Array.isArray(response.data.data)
      ? response.data.data.map(mapAnalysisRunListItem)
      : [],
    meta: mapPaginatedMeta(
      response.data.meta,
      DEFAULT_ANALYSIS_RUN_LIST_PAGE,
      DEFAULT_ANALYSIS_RUN_LIST_SIZE,
    ),
    params: normalizedParams,
  };
}

export async function getApplicantGeneratedQuestions(applicantId, params = {}) {
  const normalizedParams = normalizeGeneratedQuestionListParams(params);

  if (USE_ANALYSIS_API_MOCK) {
    if (!hasMockApplicant(applicantId)) {
      const error = new Error('Applicant not found');

      error.response = {
        data: {
          data: null,
          meta: {
            request_id: createMockRequestId(),
          },
          error: {
            code: 'APPLICANT_NOT_FOUND',
            message: 'Applicant not found',
          },
        },
      };

      throw error;
    }

    const latestCompletedRun = [...mockAnalysisRunStore.values()]
      .filter((record) => record.applicantId === applicantId)
      .map((record) => buildMockAnalysisRunPayload(record))
      .filter((analysisRun) => analysisRun.status === ANALYSIS_STATUS_VALUES.COMPLETED)
      .sort((leftRun, rightRun) => {
        return Date.parse(rightRun.completed_at ?? '') - Date.parse(leftRun.completed_at ?? '');
      })[0];
    const questions =
      latestCompletedRun === undefined
        ? []
        : mockGeneratedQuestionStore.get(latestCompletedRun.analysis_run_id) ?? [];
    const sortedQuestions = sortMockQuestions(
      questions,
      normalizedParams.sort,
      normalizedParams.order,
    );
    const paginatedQuestions = paginateItems(
      sortedQuestions,
      normalizedParams.page,
      normalizedParams.size,
    );

    return {
      questions: paginatedQuestions.map(mapGeneratedQuestion).filter(isGeneratedQuestion),
      meta: normalizeGeneratedQuestionListMeta({
        page: normalizedParams.page,
        size: normalizedParams.size,
        total: sortedQuestions.length,
        request_id: createMockRequestId(),
      }),
      params: normalizedParams,
    };
  }

  const response = await getApiClient().get(`/v1/applicants/${applicantId}/questions`, {
    params: normalizedParams,
  });

  return {
    questions: Array.isArray(response.data.data)
      ? response.data.data.map(mapGeneratedQuestion).filter(isGeneratedQuestion)
      : [],
    meta: normalizeGeneratedQuestionListMeta(response.data.meta),
    params: normalizedParams,
  };
}
