import {
  ANALYSIS_STAGE_LABELS,
  ANALYSIS_STAGE_ORDER,
  ANALYSIS_STATUS_VALUES,
  TERMINAL_ANALYSIS_STATUS_VALUES,
} from './analysis-types.js';

export function getFailureReasonMessage(failureReason) {
  if (typeof failureReason !== 'string' || failureReason.length === 0) {
    return 'The analysis failed before a detailed reason was recorded.';
  }

  if (failureReason.startsWith('GITHUB_RATE_LIMIT_EXCEEDED')) {
    return 'The analysis stopped because the GitHub API rate limit was exceeded. Please try again later.';
  }

  if (failureReason.startsWith('GITHUB_REPOSITORY_ACCESS_DENIED')) {
    return 'The analysis could not access one of the selected repositories. The repository may be private or unavailable.';
  }

  if (failureReason.startsWith('LLM_RESPONSE_PARSE_FAILED')) {
    return 'The AI response could not be converted into a valid analysis result. Please retry the analysis.';
  }

  if (failureReason.startsWith('ANALYSIS_RUN_NOT_FOUND')) {
    return 'The analysis run could not be found anymore. Please retry the analysis for this applicant.';
  }

  return 'The analysis failed due to an internal processing error. Please retry the analysis later.';
}

export function getAnalysisRunTimestamp(analysisRun) {
  const timestampCandidate = analysisRun?.completedAt ?? analysisRun?.startedAt;

  if (typeof timestampCandidate !== 'string' || timestampCandidate.length === 0) {
    return Number.NEGATIVE_INFINITY;
  }

  const parsedTimestamp = Date.parse(timestampCandidate);

  if (Number.isNaN(parsedTimestamp)) {
    return Number.NEGATIVE_INFINITY;
  }

  return parsedTimestamp;
}

export function sortAnalysisRunsByRecency(analysisRuns) {
  return [...analysisRuns].sort((leftRun, rightRun) => {
    return getAnalysisRunTimestamp(rightRun) - getAnalysisRunTimestamp(leftRun);
  });
}

function getAnalysisStageOrderIndex(stage) {
  return ANALYSIS_STAGE_ORDER.indexOf(stage);
}

function getRepresentativeAnalysisRun(analysisRuns) {
  if (analysisRuns.length === 0) {
    return undefined;
  }

  return [...analysisRuns].sort((leftRun, rightRun) => {
    const stageDifference =
      getAnalysisStageOrderIndex(rightRun.currentStage) -
      getAnalysisStageOrderIndex(leftRun.currentStage);

    if (stageDifference !== 0) {
      return stageDifference;
    }

    return getAnalysisRunTimestamp(rightRun) - getAnalysisRunTimestamp(leftRun);
  })[0];
}

export function getStageLabel(stage) {
  if (typeof stage !== 'string' || stage.length === 0) {
    return null;
  }

  return ANALYSIS_STAGE_LABELS[stage] ?? stage;
}

export function getRecoveredAnalysisRuns(analysisRuns) {
  const activeRuns = sortAnalysisRunsByRecency(
    analysisRuns.filter(
      (analysisRun) =>
        analysisRun.status === ANALYSIS_STATUS_VALUES.QUEUED ||
        analysisRun.status === ANALYSIS_STATUS_VALUES.IN_PROGRESS,
    ),
  );

  if (activeRuns.length > 0) {
    return activeRuns;
  }

  const terminalRuns = sortAnalysisRunsByRecency(
    analysisRuns.filter((analysisRun) =>
      TERMINAL_ANALYSIS_STATUS_VALUES.includes(analysisRun.status),
    ),
  );

  if (terminalRuns.length === 0) {
    return [];
  }

  const latestTerminalTimestamp = getAnalysisRunTimestamp(terminalRuns[0]);

  return terminalRuns.filter((analysisRun) => {
    return getAnalysisRunTimestamp(analysisRun) === latestTerminalTimestamp;
  });
}

export function createMissingAnalysisRun(analysisRunId) {
  return {
    id: analysisRunId,
    status: ANALYSIS_STATUS_VALUES.FAILED,
    currentStage: null,
    startedAt: null,
    completedAt: null,
    failureReason: 'ANALYSIS_RUN_NOT_FOUND',
  };
}

export function mergeTrackedAnalysisRuns(
  previousRuns,
  nextRuns,
  trackedRunIds,
  missingRunIds = [],
) {
  const previousRunMap = new Map(
    previousRuns.map((analysisRun) => [analysisRun.id, analysisRun]),
  );
  const nextRunMap = new Map(nextRuns.map((analysisRun) => [analysisRun.id, analysisRun]));
  const missingRunMap = new Map(
    missingRunIds.map((analysisRunId) => [analysisRunId, createMissingAnalysisRun(analysisRunId)]),
  );

  return trackedRunIds
    .map(
      (analysisRunId) =>
        nextRunMap.get(analysisRunId) ??
        missingRunMap.get(analysisRunId) ??
        previousRunMap.get(analysisRunId),
    )
    .filter((analysisRun) => analysisRun !== undefined);
}

export function getAnalysisSummary(analysisRuns, lastUpdatedAt) {
  if (!Array.isArray(analysisRuns) || analysisRuns.length === 0) {
    return null;
  }

  const failedRun = getRepresentativeAnalysisRun(
    analysisRuns.filter((analysisRun) => analysisRun.status === ANALYSIS_STATUS_VALUES.FAILED),
  );
  const inProgressRun = getRepresentativeAnalysisRun(
    analysisRuns.filter(
      (analysisRun) => analysisRun.status === ANALYSIS_STATUS_VALUES.IN_PROGRESS,
    ),
  );
  const queuedRun = getRepresentativeAnalysisRun(
    analysisRuns.filter((analysisRun) => analysisRun.status === ANALYSIS_STATUS_VALUES.QUEUED),
  );
  const completedRun = getRepresentativeAnalysisRun(
    analysisRuns.filter(
      (analysisRun) => analysisRun.status === ANALYSIS_STATUS_VALUES.COMPLETED,
    ),
  );

  let status = ANALYSIS_STATUS_VALUES.QUEUED;
  let currentStage = null;
  let failureReasonMessage = '';

  if (failedRun !== undefined) {
    status = ANALYSIS_STATUS_VALUES.FAILED;
    currentStage = failedRun.currentStage;
    failureReasonMessage = getFailureReasonMessage(failedRun.failureReason);
  } else if (inProgressRun !== undefined) {
    status = ANALYSIS_STATUS_VALUES.IN_PROGRESS;
    currentStage = inProgressRun.currentStage;
  } else if (queuedRun !== undefined) {
    status = ANALYSIS_STATUS_VALUES.QUEUED;
    currentStage = queuedRun.currentStage;
  } else if (completedRun !== undefined) {
    status = ANALYSIS_STATUS_VALUES.COMPLETED;
    currentStage = completedRun.currentStage ?? ANALYSIS_STAGE_ORDER.at(-1) ?? null;
  }

  return {
    status,
    currentStage,
    currentStageLabel: getStageLabel(currentStage),
    totalRuns: analysisRuns.length,
    completedRuns: analysisRuns.filter(
      (analysisRun) => analysisRun.status === ANALYSIS_STATUS_VALUES.COMPLETED,
    ).length,
    failedRuns: analysisRuns.filter(
      (analysisRun) => analysisRun.status === ANALYSIS_STATUS_VALUES.FAILED,
    ).length,
    lastUpdatedAt,
    failureReasonMessage,
  };
}

export function getAnalysisProgressPercent(summary) {
  if (summary === null) {
    return 0;
  }

  if (summary.status === ANALYSIS_STATUS_VALUES.COMPLETED) {
    return 100;
  }

  if (summary.status === ANALYSIS_STATUS_VALUES.QUEUED) {
    return 8;
  }

  const stageOrder = [...ANALYSIS_STAGE_ORDER];
  const currentStageIndex = stageOrder.indexOf(summary.currentStage);

  if (
    typeof summary.currentStage === 'string' &&
    summary.currentStage.length > 0 &&
    currentStageIndex === -1
  ) {
    stageOrder.push(summary.currentStage);
  }

  const normalizedStageIndex = stageOrder.indexOf(summary.currentStage);

  if (normalizedStageIndex === -1) {
    return summary.status === ANALYSIS_STATUS_VALUES.FAILED ? 20 : 15;
  }

  const rawProgress = Math.round(((normalizedStageIndex + 1) / stageOrder.length) * 100);

  if (summary.status === ANALYSIS_STATUS_VALUES.FAILED) {
    return rawProgress;
  }

  return Math.min(95, Math.max(15, rawProgress));
}

export function buildStageTimeline(summary) {
  if (summary === null) {
    return [];
  }

  const stageOrder = [...ANALYSIS_STAGE_ORDER];
  const currentStageIndex = stageOrder.indexOf(summary.currentStage);

  if (
    typeof summary.currentStage === 'string' &&
    summary.currentStage.length > 0 &&
    currentStageIndex === -1
  ) {
    stageOrder.push(summary.currentStage);
  }

  return stageOrder.map((stage) => {
    const stageIndex = stageOrder.indexOf(stage);
    let state = 'pending';

    if (summary.status === ANALYSIS_STATUS_VALUES.COMPLETED) {
      state = 'done';
    } else if (summary.currentStage === stage) {
      state = summary.status === ANALYSIS_STATUS_VALUES.FAILED ? 'failed' : 'current';
    } else if (currentStageIndex !== -1 && stageIndex < currentStageIndex) {
      state = 'done';
    }

    return {
      key: stage,
      label: getStageLabel(stage) ?? stage,
      state,
    };
  });
}
