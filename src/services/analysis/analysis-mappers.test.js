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
  normalizeAnalysisRunListParams,
  normalizeGeneratedQuestionListParams,
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
