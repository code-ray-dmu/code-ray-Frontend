import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isGeneratedQuestion,
  mapAnalysisRequestResult,
  mapAnalysisRun,
  mapGeneratedQuestion,
  mapPaginatedMeta,
  normalizeGeneratedQuestionListMeta,
} from './analysis-mappers.js';
import {
  resetMockApiStore,
} from '../mock/mock-api-store.js';
import {
  getAnalysisRun,
  getApplicantGeneratedQuestions,
  normalizeAnalysisRunListParams,
  normalizeGeneratedQuestionListParams,
  requestApplicantAnalysis,
} from './analysis-api.js';

test('mapAnalysisRequestResult supports snake_case analysis run ids', () => {
  const result = mapAnalysisRequestResult({
    success: true,
    analysis_run_ids: ['run-1', '', null, 'run-2'],
  });

  assert.deepEqual(result, {
    success: true,
    analysisRunIds: ['run-1', 'run-2'],
  });
});

test('mapAnalysisRun normalizes backend fields to frontend shape', () => {
  const analysisRun = mapAnalysisRun({
    analysis_run_id: 'run-1',
    status: 'IN_PROGRESS',
    current_stage: 'SUMMARY',
    started_at: '2026-04-12T10:00:00Z',
    completed_at: null,
    failure_reason: null,
  });

  assert.deepEqual(analysisRun, {
    id: 'run-1',
    status: 'IN_PROGRESS',
    currentStage: 'SUMMARY',
    startedAt: '2026-04-12T10:00:00Z',
    completedAt: null,
    failureReason: null,
  });
});

test('mapGeneratedQuestion supports snake_case question payload', () => {
  const question = mapGeneratedQuestion({
    generated_question_id: 'question-1',
    analysis_run_id: 'run-1',
    applicant_id: 'applicant-1',
    category: 'SKILL',
    question_text: 'Why did you structure the service layer this way?',
    intent: 'Understand service layer design intent.',
    priority: 2,
  });

  assert.deepEqual(question, {
    id: 'question-1',
    analysisRunId: 'run-1',
    applicantId: 'applicant-1',
    category: 'SKILL',
    questionText: 'Why did you structure the service layer this way?',
    intent: 'Understand service layer design intent.',
    priority: 2,
  });
});

test('isGeneratedQuestion rejects missing question text or intent', () => {
  assert.equal(
    isGeneratedQuestion({
      questionText: '',
      intent: 'Has intent',
    }),
    false,
  );
  assert.equal(
    isGeneratedQuestion({
      questionText: 'Valid question',
      intent: '',
    }),
    false,
  );
  assert.equal(
    isGeneratedQuestion({
      questionText: 'Valid question',
      intent: 'Valid intent',
    }),
    true,
  );
});

test('mapPaginatedMeta and generated question meta normalize invalid pagination', () => {
  assert.deepEqual(
    mapPaginatedMeta({
      page: 0,
      size: -1,
      total: -10,
      request_id: 'request-1',
    }),
    {
      requestId: 'request-1',
      page: 1,
      size: 20,
      total: 0,
    },
  );

  assert.deepEqual(
    normalizeGeneratedQuestionListMeta({
      page: 0,
      size: 0,
      total: 3,
      request_id: 'request-2',
    }),
    {
      requestId: 'request-2',
      page: 1,
      size: 20,
      total: 3,
    },
  );
});

test('normalizeAnalysisRunListParams keeps applicant filter and normalizes pagination', () => {
  assert.deepEqual(
    normalizeAnalysisRunListParams({
      applicantId: ' applicant-1 ',
      page: '0',
      size: 'abc',
    }),
    {
      applicantId: 'applicant-1',
      page: 1,
      size: 20,
    },
  );
});

test('normalizeGeneratedQuestionListParams defaults to priority asc ordering', () => {
  assert.deepEqual(
    normalizeGeneratedQuestionListParams({
      page: '2',
      size: '5',
    }),
    {
      page: 2,
      size: 5,
      sort: 'priority',
      order: 'asc',
    },
  );
});

test('normalizeGeneratedQuestionListParams falls back on invalid sort and order values', () => {
  assert.deepEqual(
    normalizeGeneratedQuestionListParams({
      page: '1',
      size: '20',
      sort: 'unknown',
      order: 'sideways',
    }),
    {
      page: 1,
      size: 20,
      sort: 'priority',
      order: 'asc',
    },
  );
});

test('mock analysis api progresses from queued to completed every 3 seconds', async () => {
  const originalDateNow = Date.now;
  let currentTimeMs = Date.parse('2026-04-15T00:00:00.000Z');

  Date.now = () => currentTimeMs;

  try {
    resetMockApiStore();

    const applicantId = 'applicant-jiyoon-kim';
    const requestResult = await requestApplicantAnalysis(applicantId);
    const analysisRunId = requestResult.analysisRunIds[0];

    assert.equal(typeof analysisRunId, 'string');
    assert.ok(analysisRunId.length > 0);

    const queuedResult = await getAnalysisRun(analysisRunId);

    assert.equal(queuedResult.analysisRun.status, 'QUEUED');
    assert.equal(queuedResult.analysisRun.currentStage, 'REPO_LIST');
    assert.equal(queuedResult.analysisRun.completedAt, null);

    currentTimeMs += 3_000;

    const inProgressResult = await getAnalysisRun(analysisRunId);

    assert.equal(inProgressResult.analysisRun.status, 'IN_PROGRESS');
    assert.equal(inProgressResult.analysisRun.currentStage, 'FILE_DETAIL');
    assert.equal(inProgressResult.analysisRun.completedAt, null);

    currentTimeMs += 3_000;

    const completedResult = await getAnalysisRun(analysisRunId);
    const generatedQuestionsResult = await getApplicantGeneratedQuestions(applicantId);

    assert.equal(completedResult.analysisRun.status, 'COMPLETED');
    assert.equal(completedResult.analysisRun.currentStage, 'QUESTION_GENERATION');
    assert.match(
      completedResult.analysisRun.completedAt ?? '',
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.000Z$/,
    );
    assert.equal(generatedQuestionsResult.questions.length, 3);
    assert.deepEqual(
      generatedQuestionsResult.questions.map((question) => question.analysisRunId),
      [analysisRunId, analysisRunId, analysisRunId],
    );
  } finally {
    Date.now = originalDateNow;
  }
});
