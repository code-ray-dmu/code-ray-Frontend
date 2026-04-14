import {
  ANALYSIS_REQUEST_SUCCESS_VALUE,
  ANALYSIS_STAGE_VALUES,
  ANALYSIS_STATUS_VALUES,
  DEFAULT_ANALYSIS_RUN_LIST_PAGE,
  DEFAULT_ANALYSIS_RUN_LIST_SIZE,
  DEFAULT_GENERATED_QUESTION_LIST_PAGE,
  DEFAULT_GENERATED_QUESTION_LIST_SIZE,
  GENERATED_QUESTION_ORDER_VALUES,
} from './analysis-types.js';

function normalizeString(value) {
  return typeof value === 'string' ? value : null;
}

function normalizePositiveInteger(value, fallbackValue) {
  if (!Number.isInteger(value) || value < 1) {
    return fallbackValue;
  }

  return value;
}

function normalizeNonNegativeInteger(value, fallbackValue) {
  if (!Number.isInteger(value) || value < 0) {
    return fallbackValue;
  }

  return value;
}

function normalizeAnalysisStatus(status) {
  const normalizedStatus = normalizeString(status);

  if (normalizedStatus === null) {
    return null;
  }

  return Object.values(ANALYSIS_STATUS_VALUES).includes(normalizedStatus)
    ? normalizedStatus
    : normalizedStatus;
}

function normalizeAnalysisStage(stage) {
  const normalizedStage = normalizeString(stage);

  if (normalizedStage === null) {
    return null;
  }

  return Object.values(ANALYSIS_STAGE_VALUES).includes(normalizedStage)
    ? normalizedStage
    : normalizedStage;
}

function normalizeGeneratedQuestionCategory(category) {
  const normalizedCategory = normalizeString(category);

  if (normalizedCategory === null) {
    return null;
  }

  return normalizedCategory;
}

function normalizeGeneratedQuestionPriority(priority) {
  if (!Number.isInteger(priority) || priority < 0) {
    return 0;
  }

  return priority;
}

function normalizeGeneratedQuestionText(question) {
  return normalizeString(question?.question_text ?? question?.questionText);
}

function normalizeGeneratedQuestionOrder(order) {
  const normalizedOrder = normalizeString(order)?.toLowerCase();

  if (
    normalizedOrder !== GENERATED_QUESTION_ORDER_VALUES.ASC &&
    normalizedOrder !== GENERATED_QUESTION_ORDER_VALUES.DESC
  ) {
    return null;
  }

  return normalizedOrder;
}

export function mapRequestMeta(meta) {
  return {
    requestId: normalizeString(meta?.request_id),
  };
}

export function mapPaginatedMeta(
  meta,
  fallbackPage = DEFAULT_ANALYSIS_RUN_LIST_PAGE,
  fallbackSize = DEFAULT_ANALYSIS_RUN_LIST_SIZE,
) {
  return {
    ...mapRequestMeta(meta),
    page: normalizePositiveInteger(meta?.page, fallbackPage),
    size: normalizePositiveInteger(meta?.size, fallbackSize),
    total: normalizeNonNegativeInteger(meta?.total, 0),
  };
}

export function mapAnalysisRequestResult(data) {
  const rawAnalysisRunIds = data?.analysisRunIds ?? data?.analysis_run_ids;

  return {
    success: data?.success === ANALYSIS_REQUEST_SUCCESS_VALUE,
    analysisRunIds: Array.isArray(rawAnalysisRunIds)
      ? rawAnalysisRunIds.filter((value) => typeof value === 'string' && value.length > 0)
      : [],
  };
}

export function mapAnalysisRun(analysisRun) {
  return {
    id: normalizeString(analysisRun?.analysis_run_id ?? analysisRun?.analysisRunId),
    status: normalizeAnalysisStatus(analysisRun?.status),
    currentStage: normalizeAnalysisStage(analysisRun?.current_stage ?? analysisRun?.currentStage),
    startedAt: normalizeString(analysisRun?.started_at ?? analysisRun?.startedAt),
    completedAt: normalizeString(analysisRun?.completed_at ?? analysisRun?.completedAt),
    failureReason: normalizeString(analysisRun?.failure_reason ?? analysisRun?.failureReason),
  };
}

export function mapAnalysisRunListItem(analysisRun) {
  return mapAnalysisRun(analysisRun);
}

export function mapGeneratedQuestion(question) {
  return {
    id: normalizeString(question?.generated_question_id ?? question?.question_id ?? question?.id),
    analysisRunId: normalizeString(
      question?.analysis_run_id ?? question?.analysisRunId,
    ),
    applicantId: normalizeString(question?.applicant_id ?? question?.applicantId),
    category: normalizeGeneratedQuestionCategory(question?.category),
    questionText: normalizeGeneratedQuestionText(question),
    intent: normalizeString(question?.intent),
    priority: normalizeGeneratedQuestionPriority(question?.priority),
  };
}

export function isGeneratedQuestion(question) {
  return (
    typeof question?.questionText === 'string' &&
    question.questionText.length > 0 &&
    typeof question?.intent === 'string' &&
    question.intent.length > 0
  );
}

export function normalizeGeneratedQuestionListMeta(meta) {
  return mapPaginatedMeta(
    meta,
    DEFAULT_GENERATED_QUESTION_LIST_PAGE,
    DEFAULT_GENERATED_QUESTION_LIST_SIZE,
  );
}

export function normalizeGeneratedQuestionListOrder(order) {
  return normalizeGeneratedQuestionOrder(order);
}
