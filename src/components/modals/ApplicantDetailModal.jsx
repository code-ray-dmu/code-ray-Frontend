import { useState } from "react";
import { getAnalysisSteps } from "../../utils/workspaceData";

function getStatusBadgeClass(status) {
  if (status === "completed") return "bg-emerald-50 text-emerald-600";
  if (status === "processing") return "bg-blue-50 text-blue-600";
  if (status === "failed") return "bg-red-50 text-red-600";
  if (status === "waiting") return "bg-amber-50 text-amber-600";
  return "bg-slate-100 text-slate-600";
}

function getStepBadgeClass(state) {
  if (state === "done") return "bg-emerald-50 text-emerald-600";
  if (state === "current") return "bg-blue-50 text-blue-600";
  if (state === "failed") return "bg-red-50 text-red-600";
  return "bg-slate-100 text-slate-500";
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-blue-500 text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

function SummaryTab({ applicant }) {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 p-5">
        <h3 className="text-lg font-semibold text-slate-900">AI Summary</h3>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          이 지원자는 저장소 구조와 컴포넌트 분리 관점에서 비교적 안정적인 설계를
          보여주었습니다. React 기반 UI 구조가 명확하고, 기능 단위로 파일이
          정리되어 있어 주요 구현 흐름을 파악하기 쉬웠습니다. 다만 테스트 코드와
          문서화 영역은 상대적으로 제한적으로 보였으며, 협업 관점에서 설계 의도를
          더 잘 드러낼 수 있는 여지가 있습니다.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <section className="rounded-2xl border border-slate-200 p-5">
          <h3 className="text-base font-semibold text-slate-900">Strengths</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li>컴포넌트 구조가 비교적 명확하게 분리되어 있음</li>
            <li>기술 스택 사용 의도가 코드에서 드러남</li>
            <li>질문 생성에 필요한 핵심 구현 포인트가 잘 추출됨</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 p-5">
          <h3 className="text-base font-semibold text-slate-900">
            Improvement Points
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li>테스트 코드와 검증 흐름이 상대적으로 약함</li>
            <li>문서화와 협업 관점의 설명성이 더 필요함</li>
            <li>예외 처리/에러 핸들링 전략을 더 확인할 필요가 있음</li>
          </ul>
        </section>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-400">Overall Score</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {applicant.score ?? "-"}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-400">Generated Questions</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {applicant.generatedQuestions ?? 0}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-400">Repository Readiness</p>
          <p className="mt-2 text-base font-semibold text-slate-900">High</p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-400">Collaboration Fit</p>
          <p className="mt-2 text-base font-semibold text-slate-900">Medium</p>
        </div>
      </div>
    </div>
  );
}

function QuestionCard({ question, index }) {
  return (
    <section className="rounded-2xl border border-slate-200 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Question {index + 1}
          </p>
          <h3 className="mt-2 text-base font-semibold text-slate-900">
            {question.title}
          </h3>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {question.category}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-900">Why this question?</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {question.intent}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-900">What to assess</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {question.assessmentPoint}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-900">Follow-up Questions</p>
        <div className="mt-3 space-y-2">
          {question.followUps.map((followUp, followIndex) => (
            <div
              key={followIndex}
              className="rounded-lg bg-white px-3 py-2 text-sm text-slate-700"
            >
              - {followUp}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuestionsTab() {
  const questions = [
    {
      title: "프로젝트에서 상태 관리를 어떤 기준으로 분리했나요?",
      category: "Architecture",
      intent:
        "상태 관리 구조를 어떤 기준으로 설계했는지 확인하기 위한 질문입니다. 단순 구현이 아니라 상태의 책임 분리와 유지보수 관점을 함께 봅니다.",
      assessmentPoint:
        "전역 상태와 지역 상태의 구분 기준, 확장성, 복잡도 관리 능력, 설계 근거 설명 능력",
      followUps: [
        "전역 상태로 올린 기준은 무엇인가요?",
        "현재 구조가 커졌을 때 어떤 문제가 생길 수 있나요?",
        "다시 설계한다면 바꾸고 싶은 부분이 있나요?",
      ],
    },
    {
      title: "컴포넌트 구조를 이렇게 나눈 이유는 무엇인가요?",
      category: "Component Design",
      intent:
        "컴포넌트 분리가 단순 파일 쪼개기가 아니라 재사용성과 역할 분리를 고려한 것인지 확인하기 위한 질문입니다.",
      assessmentPoint:
        "컴포넌트 책임 분리, 재사용 가능성, UI 구조화 능력, 설계 의도 전달력",
      followUps: [
        "공통 컴포넌트와 페이지 전용 컴포넌트는 어떻게 구분했나요?",
        "props drilling 문제는 없었나요?",
        "구조를 나누며 가장 고민했던 기준은 무엇이었나요?",
      ],
    },
    {
      title: "에러 처리나 예외 상황은 어떻게 설계했나요?",
      category: "Stability",
      intent:
        "정상 흐름뿐 아니라 실패 상황까지 고려했는지 확인하기 위한 질문입니다.",
      assessmentPoint:
        "실패 케이스 대응, 사용자 경험 관점, 방어적 코딩, 예외 상황 설계 능력",
      followUps: [
        "API 실패 시 사용자에게 어떻게 보여주나요?",
        "로딩/에러/빈 상태를 분리해서 다뤘나요?",
        "실제 서비스였다면 어떤 예외 처리를 더 넣고 싶나요?",
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <QuestionCard key={index} question={question} index={index} />
      ))}
    </div>
  );
}

function EvaluationTab() {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 p-5">
        <h3 className="text-lg font-semibold text-slate-900">
          Evaluation Overview
        </h3>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-400">Code Quality</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">85</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              구조가 비교적 안정적이고, 일관된 스타일이 보입니다.
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-400">Architecture</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">80</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              역할 분리는 잘 되어 있으나 확장성 검토는 추가로 필요합니다.
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-400">Testing</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">60</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              테스트 관점의 근거가 약해 보이며 보완 가능성이 있습니다.
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-400">Collaboration</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">75</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              코드 설명력과 문서화가 조금 더 갖춰지면 협업 적합도가 높아집니다.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 p-5">
        <h3 className="text-lg font-semibold text-slate-900">
          Final Comment
        </h3>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          이 지원자는 실제 구현 역량을 충분히 보여주고 있으며, 특히 구조 분해와
          기술 스택 활용 측면에서 긍정적인 신호가 있습니다. 다만 테스트와 예외 처리,
          문서화 전략에 대한 추가 검증 질문이 필요합니다.
        </p>

        <div className="mt-5 rounded-xl bg-slate-50 p-4">
          <p className="text-sm text-slate-400">Recommended Interview Focus</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            상태 관리 기준, 컴포넌트 설계 의도, 테스트 전략, 예외 처리 방식 중심
          </p>
        </div>
      </section>
    </div>
  );
}

function ProgressSection({ applicant }) {
  return (
    <section className="rounded-2xl border border-slate-200 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Analysis Progress
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            현재 분석 단계와 처리 상태입니다.
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-400">Progress</p>
          <p className="text-2xl font-semibold text-slate-900">
            {applicant.progress}%
          </p>
        </div>
      </div>

      <div className="mb-5 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{ width: `${applicant.progress}%` }}
        />
      </div>

      <div className="space-y-3">
        {getAnalysisSteps(applicant).map((step) => (
          <div
            key={step.label}
            className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
          >
            <span className="text-sm text-slate-700">{step.label}</span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStepBadgeClass(
                step.state
              )}`}
            >
              {step.state}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ApplicantDetailModal({
  isOpen,
  applicant,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState("summary");

  if (!isOpen || !applicant) return null;

  const isCompleted = applicant.status === "completed";
  const showProcessInfo =
    applicant.status === "processing" ||
    applicant.status === "waiting" ||
    applicant.status === "failed";

  let tabContent = null;

  if (showProcessInfo) {
    tabContent = <ProgressSection applicant={applicant} />;
  } else if (activeTab === "summary") {
    tabContent = <SummaryTab applicant={applicant} />;
  } else if (activeTab === "questions") {
    tabContent = <QuestionsTab />;
  } else {
    tabContent = <EvaluationTab />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h2 className="truncate text-2xl font-semibold text-slate-900">
                  {applicant.name}
                </h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClass(
                    applicant.status
                  )}`}
                >
                  {applicant.status}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-500">{applicant.email}</p>
              <p className="text-sm text-slate-500">{applicant.githubUrl}</p>
            </div>

            <button
              onClick={onClose}
              className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
          </div>

          {showProcessInfo ? (
            <div className="mt-5 grid grid-cols-[minmax(0,1fr)_120px_120px] items-center gap-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-500">{applicant.currentStep}</span>
                  <span className="font-medium text-slate-700">
                    {applicant.progress}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${applicant.progress}%` }}
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-400">Step</p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {applicant.currentStepIndex}/{applicant.totalSteps}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-400">Score</p>
                <p className="mt-1 text-base font-semibold text-slate-900">-</p>
              </div>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-4 gap-4">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-400">Overall Score</p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {applicant.score ?? "-"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-400">Generated Questions</p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {applicant.generatedQuestions ?? 0}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-400">Final Step</p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {applicant.currentStep}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-400">Recent Log</p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  완료
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-y-auto px-6 py-6">
          {isCompleted ? (
            <>
              <div className="mb-5 flex items-center gap-3">
                <TabButton
                  active={activeTab === "summary"}
                  onClick={() => setActiveTab("summary")}
                >
                  Summary
                </TabButton>

                <TabButton
                  active={activeTab === "questions"}
                  onClick={() => setActiveTab("questions")}
                >
                  Questions
                </TabButton>

                <TabButton
                  active={activeTab === "evaluation"}
                  onClick={() => setActiveTab("evaluation")}
                >
                  Evaluation
                </TabButton>
              </div>

              {tabContent}
            </>
          ) : (
            tabContent
          )}
        </div>
      </div>
    </div>
  );
}
