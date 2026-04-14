import { getApiClient } from '../api/api-client.js';
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
  ANALYSIS_RUN_API_PREFIX,
  DEFAULT_ANALYSIS_RUN_LIST_PAGE,
  DEFAULT_ANALYSIS_RUN_LIST_SIZE,
  DEFAULT_GENERATED_QUESTION_ORDER,
  DEFAULT_GENERATED_QUESTION_LIST_PAGE,
  DEFAULT_GENERATED_QUESTION_LIST_SIZE,
  DEFAULT_GENERATED_QUESTION_SORT,
  GENERATED_QUESTION_SORT_VALUES,
} from './analysis-types.js';

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
  const response = await getApiClient().get(`${ANALYSIS_RUN_API_PREFIX}/${analysisRunId}`);

  return {
    analysisRun: mapAnalysisRun(response.data.data),
    meta: mapRequestMeta(response.data.meta),
  };
}

export async function getAnalysisRuns(params = {}) {
  const normalizedParams = normalizeAnalysisRunListParams(params);
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
