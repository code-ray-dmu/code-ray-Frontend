const ANALYSIS_STEPS = [
  "Waiting",
  "GitHub validation",
  "Repository structure analysis",
  "Key file extraction",
  "Tech stack detection",
  "LLM request",
  "Question generation",
  "Scoring",
  "Summary formatting",
  "Completed",
];

export const roomWorkspaceData = {
  "frontend-interview": {
    analysisStarted: true,
    applicants: [
      {
        id: "devkim",
        name: "김개발",
        email: "dev1@email.com",
        githubUrl: "github.com/devkim",
        status: "completed",
        currentStep: "Completed",
        currentStepIndex: 10,
        totalSteps: 10,
        progress: 100,
        recentLog: "질문 12개와 평가 기준 정리가 완료되었습니다.",
        score: 78,
        generatedQuestions: 12,
      },
      {
        id: "choi-react",
        name: "최리액트",
        email: "dev2@email.com",
        githubUrl: "github.com/choi-react",
        status: "processing",
        currentStep: "Question generation",
        currentStepIndex: 7,
        totalSteps: 10,
        progress: 70,
        recentLog: "컴포넌트 구조를 기반으로 React 질문 4개를 추출했습니다.",
        score: null,
        generatedQuestions: 4,
      },
      {
        id: "frontend-lee",
        name: "이프론트",
        email: "dev3@email.com",
        githubUrl: "github.com/frontendlee",
        status: "processing",
        currentStep: "Repository structure analysis",
        currentStepIndex: 3,
        totalSteps: 10,
        progress: 30,
        recentLog: "pages, components, hooks 디렉터리 구조를 스캔 중입니다.",
        score: null,
        generatedQuestions: 0,
      },
      {
        id: "ui-jung",
        name: "정UI",
        email: "dev4@email.com",
        githubUrl: "github.com/ui-jung",
        status: "waiting",
        currentStep: "Waiting",
        currentStepIndex: 1,
        totalSteps: 10,
        progress: 0,
        recentLog: "분석 대기열에 등록되었습니다.",
        score: null,
        generatedQuestions: 0,
      },
    ],
    activityFeed: [
      "김개발 - 요약 생성 완료",
      "최리액트 - 질문 4개 생성",
      "이프론트 - 저장소 구조 분석 중",
      "정UI - 대기열 등록 완료",
    ],
  },

  "backend-interview": {
    analysisStarted: true,
    applicants: [
      {
        id: "parkserver",
        name: "박서버",
        email: "backend1@email.com",
        githubUrl: "github.com/parkserver",
        status: "completed",
        currentStep: "Completed",
        currentStepIndex: 10,
        totalSteps: 10,
        progress: 100,
        recentLog: "서비스 경계 분석과 질문 세트 생성이 완료되었습니다.",
        score: 84,
        generatedQuestions: 9,
      },
      {
        id: "lee-backend",
        name: "이백엔드",
        email: "backend2@email.com",
        githubUrl: "github.com/backendlee",
        status: "processing",
        currentStep: "Scoring",
        currentStepIndex: 8,
        totalSteps: 10,
        progress: 80,
        recentLog: "질문 세트 기반 평가 기준을 계산 중입니다.",
        score: null,
        generatedQuestions: 7,
      },
      {
        id: "choi-api",
        name: "최API",
        email: "backend3@email.com",
        githubUrl: "github.com/choi-api",
        status: "failed",
        currentStep: "GitHub validation",
        currentStepIndex: 2,
        totalSteps: 10,
        progress: 10,
        recentLog: "저장소 접근 권한을 확인할 수 없습니다.",
        score: null,
        generatedQuestions: 0,
      },
    ],
    activityFeed: [
      "박서버 - 평가 기준 생성 완료",
      "이백엔드 - 점수 계산 중",
      "최API - 저장소 검증 실패",
    ],
  },

  "ai-engineer": {
    analysisStarted: true,
    applicants: [
      {
        id: "aimin",
        name: "최모델",
        email: "ai1@email.com",
        githubUrl: "github.com/aimin",
        status: "completed",
        currentStep: "Completed",
        currentStepIndex: 10,
        totalSteps: 10,
        progress: 100,
        recentLog: "파이프라인 기반 요약과 질문 생성을 완료했습니다.",
        score: 81,
        generatedQuestions: 15,
      },
      {
        id: "park-model",
        name: "박모델",
        email: "ai2@email.com",
        githubUrl: "github.com/modelpark",
        status: "processing",
        currentStep: "Question generation",
        currentStepIndex: 7,
        totalSteps: 10,
        progress: 70,
        recentLog: "모델 파이프라인 관련 follow-up을 정리 중입니다.",
        score: null,
        generatedQuestions: 6,
      },
    ],
    activityFeed: [
      "최모델 - 질문 15개 생성 완료",
      "박모델 - 후속 질문 정리 중",
    ],
  },

  "new-interview-room": {
    analysisStarted: false,
    applicants: [],
    activityFeed: [],
  },
};

function cloneApplicants(applicants = []) {
  return applicants.map((applicant) => ({
    ...applicant,
  }));
}

export function getRoomWorkspaceSeed(roomId) {
  const roomData = roomWorkspaceData[roomId];

  if (!roomData) {
    return {
      analysisStarted: false,
      applicants: [],
      activityFeed: [],
    };
  }

  return {
    analysisStarted: roomData.analysisStarted ?? false,
    applicants: cloneApplicants(roomData.applicants),
    activityFeed: [...(roomData.activityFeed ?? [])],
  };
}

export function createEmptyApplicant() {
  return {
    id: `applicant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    email: "",
    githubUrl: "",
    status: "draft",
    currentStep: "Waiting",
    currentStepIndex: 1,
    totalSteps: ANALYSIS_STEPS.length,
    progress: 0,
    recentLog: "지원자 정보 입력 대기 중입니다.",
    score: null,
    generatedQuestions: 0,
  };
}

export function normalizeApplicant(applicant) {
  return {
    id:
      applicant.id ||
      `applicant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: applicant.name ?? "",
    email: applicant.email ?? "",
    githubUrl: applicant.githubUrl ?? "",
    status: applicant.status ?? "waiting",
    currentStep: applicant.currentStep ?? "Waiting",
    currentStepIndex: applicant.currentStepIndex ?? 1,
    totalSteps: applicant.totalSteps ?? ANALYSIS_STEPS.length,
    progress: applicant.progress ?? 0,
    recentLog: applicant.recentLog ?? "분석 대기열에 등록되었습니다.",
    score: applicant.score ?? null,
    generatedQuestions: applicant.generatedQuestions ?? 0,
  };
}

export function getRoomMetricsFromApplicants(applicants = []) {
  const total = applicants.filter((item) => item.status !== "draft").length;
  const completed = applicants.filter(
    (item) => item.status === "completed"
  ).length;
  const inProgress = applicants.filter(
    (item) => item.status === "processing"
  ).length;
  const waiting = applicants.filter(
    (item) => item.status === "waiting"
  ).length;
  const failed = applicants.filter((item) => item.status === "failed").length;

  const progressPercent = total
    ? Math.round(((completed + failed) / total) * 100)
    : 0;

  const averageScore =
    completed > 0
      ? Math.round(
          applicants
            .filter((item) => item.status === "completed")
            .reduce((sum, item) => sum + (item.score ?? 0), 0) / completed
        )
      : 0;

  return {
    total,
    completed,
    inProgress,
    waiting,
    failed,
    progressPercent,
    averageScore,
  };
}

export function getRoomStatusLabel(applicants = [], analysisStarted = false) {
  const metrics = getRoomMetricsFromApplicants(applicants);

  if (metrics.total === 0) return "Empty";
  if (!analysisStarted) return "Draft";
  if (metrics.inProgress > 0 || metrics.waiting > 0) return "In Progress";
  if (metrics.completed + metrics.failed === metrics.total) return "Completed";
  return "Ready";
}

export function getAnalysisSteps(applicant) {
  return ANALYSIS_STEPS.map((step, index) => ({
    label: step,
    state:
      index + 1 < applicant.currentStepIndex
        ? "done"
        : index + 1 === applicant.currentStepIndex
        ? applicant.status === "failed"
          ? "failed"
          : "current"
        : "todo",
  }));
}

export function getNextProcessingLog(stepLabel, applicantName) {
  switch (stepLabel) {
    case "GitHub validation":
      return `${applicantName} - GitHub 저장소 연결을 확인했습니다.`;
    case "Repository structure analysis":
      return `${applicantName} - 레포지토리 파일 구조를 분석 중입니다.`;
    case "Key file extraction":
      return `${applicantName} - 핵심 파일을 추출하고 있습니다.`;
    case "Tech stack detection":
      return `${applicantName} - 기술 스택을 감지했습니다.`;
    case "LLM request":
      return `${applicantName} - LLM으로 분석 데이터를 전송했습니다.`;
    case "Question generation":
      return `${applicantName} - 면접 질문을 생성하고 있습니다.`;
    case "Scoring":
      return `${applicantName} - 평가 기준과 점수를 계산 중입니다.`;
    case "Summary formatting":
      return `${applicantName} - 개인 summary를 정리하고 있습니다.`;
    case "Completed":
      return `${applicantName} - 분석이 완료되었습니다.`;
    default:
      return `${applicantName} - 분석 대기 중입니다.`;
  }
}