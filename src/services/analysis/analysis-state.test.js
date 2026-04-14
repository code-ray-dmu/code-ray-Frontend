import test from 'node:test';
import assert from 'node:assert/strict';

import { ANALYSIS_STAGE_VALUES, ANALYSIS_STATUS_VALUES } from './analysis-types.js';
import {
  buildStageTimeline,
  createMissingAnalysisRun,
  getAnalysisProgressPercent,
  getAnalysisSummary,
  getFailureReasonMessage,
  getRecoveredAnalysisRuns,
  mergeTrackedAnalysisRuns,
} from './analysis-state.js';

test('getFailureReasonMessage sanitizes unknown failure reasons', () => {
  assert.equal(
    getFailureReasonMessage('SOME_INTERNAL_ERROR: raw backend detail'),
    'The analysis failed due to an internal processing error. Please retry the analysis later.',
  );
});

test('getFailureReasonMessage maps known rate limit failures', () => {
  assert.equal(
    getFailureReasonMessage('GITHUB_RATE_LIMIT_EXCEEDED: resets soon'),
    'The analysis stopped because the GitHub API rate limit was exceeded. Please try again later.',
  );
});

test('getRecoveredAnalysisRuns prefers active runs over older completed history', () => {
  const recoveredRuns = getRecoveredAnalysisRuns([
    {
      id: 'completed-old',
      status: ANALYSIS_STATUS_VALUES.COMPLETED,
      startedAt: '2026-04-10T10:00:00Z',
      completedAt: '2026-04-10T10:05:00Z',
    },
    {
      id: 'in-progress-new',
      status: ANALYSIS_STATUS_VALUES.IN_PROGRESS,
      startedAt: '2026-04-12T10:00:00Z',
      completedAt: null,
    },
    {
      id: 'queued-new',
      status: ANALYSIS_STATUS_VALUES.QUEUED,
      startedAt: null,
      completedAt: null,
    },
  ]);

  assert.deepEqual(
    recoveredRuns.map((analysisRun) => analysisRun.id),
    ['in-progress-new', 'queued-new'],
  );
});

test('getRecoveredAnalysisRuns keeps only the latest completed batch when no active runs exist', () => {
  const recoveredRuns = getRecoveredAnalysisRuns([
    {
      id: 'completed-batch-1',
      status: ANALYSIS_STATUS_VALUES.COMPLETED,
      startedAt: '2026-04-10T10:00:00Z',
      completedAt: '2026-04-10T10:05:00Z',
    },
    {
      id: 'completed-batch-2a',
      status: ANALYSIS_STATUS_VALUES.COMPLETED,
      startedAt: '2026-04-12T10:00:00Z',
      completedAt: '2026-04-12T10:05:00Z',
    },
    {
      id: 'completed-batch-2b',
      status: ANALYSIS_STATUS_VALUES.COMPLETED,
      startedAt: '2026-04-12T10:00:00Z',
      completedAt: '2026-04-12T10:05:00Z',
    },
  ]);

  assert.deepEqual(
    recoveredRuns.map((analysisRun) => analysisRun.id),
    ['completed-batch-2a', 'completed-batch-2b'],
  );
});

test('mergeTrackedAnalysisRuns preserves stale previous runs when one polling request fails', () => {
  const mergedRuns = mergeTrackedAnalysisRuns(
    [
      {
        id: 'run-1',
        status: ANALYSIS_STATUS_VALUES.IN_PROGRESS,
        currentStage: ANALYSIS_STAGE_VALUES.FILE_DETAIL,
      },
      {
        id: 'run-2',
        status: ANALYSIS_STATUS_VALUES.QUEUED,
        currentStage: null,
      },
    ],
    [
      {
        id: 'run-1',
        status: ANALYSIS_STATUS_VALUES.COMPLETED,
        currentStage: ANALYSIS_STAGE_VALUES.QUESTION_GENERATION,
      },
    ],
    ['run-1', 'run-2'],
  );

  assert.deepEqual(
    mergedRuns.map((analysisRun) => ({
      id: analysisRun.id,
      status: analysisRun.status,
      currentStage: analysisRun.currentStage,
    })),
    [
      {
        id: 'run-1',
        status: ANALYSIS_STATUS_VALUES.COMPLETED,
        currentStage: ANALYSIS_STAGE_VALUES.QUESTION_GENERATION,
      },
      {
        id: 'run-2',
        status: ANALYSIS_STATUS_VALUES.QUEUED,
        currentStage: null,
      },
    ],
  );
});

test('mergeTrackedAnalysisRuns converts missing run ids into failed synthetic runs', () => {
  const mergedRuns = mergeTrackedAnalysisRuns(
    [
      {
        id: 'run-1',
        status: ANALYSIS_STATUS_VALUES.IN_PROGRESS,
        currentStage: ANALYSIS_STAGE_VALUES.FILE_DETAIL,
      },
      {
        id: 'run-2',
        status: ANALYSIS_STATUS_VALUES.IN_PROGRESS,
        currentStage: ANALYSIS_STAGE_VALUES.SUMMARY,
      },
    ],
    [
      {
        id: 'run-1',
        status: ANALYSIS_STATUS_VALUES.COMPLETED,
        currentStage: ANALYSIS_STAGE_VALUES.QUESTION_GENERATION,
      },
    ],
    ['run-1', 'run-2'],
    ['run-2'],
  );

  assert.deepEqual(mergedRuns.at(1), createMissingAnalysisRun('run-2'));
});

test('getAnalysisSummary marks mixed completed and failed runs as failed', () => {
  const summary = getAnalysisSummary(
    [
      {
        id: 'run-1',
        status: ANALYSIS_STATUS_VALUES.COMPLETED,
        currentStage: ANALYSIS_STAGE_VALUES.QUESTION_GENERATION,
        failureReason: null,
      },
      {
        id: 'run-2',
        status: ANALYSIS_STATUS_VALUES.FAILED,
        currentStage: ANALYSIS_STAGE_VALUES.SUMMARY,
        failureReason: 'LLM_RESPONSE_PARSE_FAILED: invalid json',
      },
    ],
    '2026-04-12T10:10:00Z',
  );

  assert.equal(summary.status, ANALYSIS_STATUS_VALUES.FAILED);
  assert.equal(summary.currentStage, ANALYSIS_STAGE_VALUES.SUMMARY);
  assert.equal(
    summary.failureReasonMessage,
    'The AI response could not be converted into a valid analysis result. Please retry the analysis.',
  );
});

test('getAnalysisSummary uses the most advanced active stage across multiple runs', () => {
  const summary = getAnalysisSummary(
    [
      {
        id: 'run-1',
        status: ANALYSIS_STATUS_VALUES.IN_PROGRESS,
        currentStage: ANALYSIS_STAGE_VALUES.FILE_DETAIL,
        startedAt: '2026-04-12T10:00:00Z',
      },
      {
        id: 'run-2',
        status: ANALYSIS_STATUS_VALUES.IN_PROGRESS,
        currentStage: ANALYSIS_STAGE_VALUES.SUMMARY,
        startedAt: '2026-04-12T10:01:00Z',
      },
    ],
    '2026-04-12T10:10:00Z',
  );

  assert.equal(summary.status, ANALYSIS_STATUS_VALUES.IN_PROGRESS);
  assert.equal(summary.currentStage, ANALYSIS_STAGE_VALUES.SUMMARY);
});

test('getAnalysisProgressPercent returns stable values for queued, in-progress, and completed states', () => {
  assert.equal(
    getAnalysisProgressPercent({
      status: ANALYSIS_STATUS_VALUES.QUEUED,
      currentStage: null,
    }),
    8,
  );
  assert.equal(
    getAnalysisProgressPercent({
      status: ANALYSIS_STATUS_VALUES.IN_PROGRESS,
      currentStage: ANALYSIS_STAGE_VALUES.FILE_DETAIL,
    }),
    60,
  );
  assert.equal(
    getAnalysisProgressPercent({
      status: ANALYSIS_STATUS_VALUES.COMPLETED,
      currentStage: ANALYSIS_STAGE_VALUES.QUESTION_GENERATION,
    }),
    100,
  );
});

test('buildStageTimeline appends unknown stages safely', () => {
  const stages = buildStageTimeline({
    status: ANALYSIS_STATUS_VALUES.IN_PROGRESS,
    currentStage: 'CUSTOM_STAGE',
  });

  assert.equal(stages.at(-1)?.key, 'CUSTOM_STAGE');
  assert.equal(stages.at(-1)?.state, 'current');
});
