import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import AddApplicantsModal from "../components/modals/AddApplicantsModal";
import ApplicantDetailModal from "../components/modals/ApplicantDetailModal";
import { getVisibleRooms } from "../utils/roomStore";
import {
  getNextProcessingLog,
  getRoomMetricsFromApplicants,
  getRoomStatusLabel,
  getRoomWorkspaceSeed,
  normalizeApplicant,
} from "../utils/workspaceData";

function EmptyRoomState({ onAddApplicant }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">
        👥
      </div>

      <h3 className="text-2xl font-semibold text-slate-900">
        No applicants yet
      </h3>

      <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-500">
        이 방에는 아직 등록된 지원자가 없습니다. 여러 명을 추가한 뒤 분석을
        시작하면 각 면접자별로 진행도가 실시간으로 표시됩니다.
      </p>

      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          onClick={onAddApplicant}
          className="rounded-xl bg-blue-500 px-5 py-3 text-sm font-medium text-white hover:bg-blue-600"
        >
          + 지원자 추가
        </button>

        <button className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
          CSV 업로드
        </button>
      </div>
    </div>
  );
}

function getStatusBadgeClass(status) {
  if (status === "completed") return "bg-emerald-50 text-emerald-600";
  if (status === "processing") return "bg-blue-50 text-blue-600";
  if (status === "failed") return "bg-red-50 text-red-600";
  if (status === "waiting") return "bg-amber-50 text-amber-600";
  return "bg-slate-100 text-slate-600";
}

function stepsLabelByIndex(index) {
  const labels = [
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

  return labels[index - 1] ?? "Waiting";
}

function randomScore() {
  return Math.floor(Math.random() * 16) + 75;
}

export default function RoomDetailPage() {
  const { roomId } = useParams();
  const rooms = getVisibleRooms();
  const room = rooms.find((item) => item.id === roomId);

  const initialSeed = useMemo(() => getRoomWorkspaceSeed(roomId), [roomId]);

  const [analysisStarted, setAnalysisStarted] = useState(
    initialSeed.analysisStarted
  );
  const [applicants, setApplicants] = useState(initialSeed.applicants);
  const [activityFeed, setActivityFeed] = useState(initialSeed.activityFeed);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isApplicantModalOpen, setIsApplicantModalOpen] = useState(false);
  const [selectedApplicantId, setSelectedApplicantId] = useState(
    initialSeed.applicants[0]?.id ?? null
  );

  const metrics = useMemo(
    () => getRoomMetricsFromApplicants(applicants),
    [applicants]
  );

  const roomStatus = useMemo(
    () => getRoomStatusLabel(applicants, analysisStarted),
    [applicants, analysisStarted]
  );

  const selectedApplicant = useMemo(() => {
    if (!applicants.length) return null;
    return (
      applicants.find((item) => item.id === selectedApplicantId) || applicants[0]
    );
  }, [applicants, selectedApplicantId]);

  useEffect(() => {
    if (!analysisStarted) return;
    if (!applicants.length) return;

    const hasPendingWork = applicants.some(
      (item) => item.status === "waiting" || item.status === "processing"
    );

    if (!hasPendingWork) return;

    const interval = setInterval(() => {
      setApplicants((prevApplicants) => {
        const nextApplicants = [...prevApplicants];

        const processingIndexes = nextApplicants
          .map((applicant, index) =>
            applicant.status === "processing" ? index : -1
          )
          .filter((index) => index !== -1);

        const waitingIndexes = nextApplicants
          .map((applicant, index) =>
            applicant.status === "waiting" ? index : -1
          )
          .filter((index) => index !== -1);

        const maxParallel = 2;

        while (
          processingIndexes.length < maxParallel &&
          waitingIndexes.length > 0
        ) {
          const nextIndex = waitingIndexes.shift();
          if (nextIndex === undefined) break;

          nextApplicants[nextIndex] = {
            ...nextApplicants[nextIndex],
            status: "processing",
            currentStepIndex: 2,
            currentStep: "GitHub validation",
            progress: 10,
            recentLog: "GitHub 저장소 연결을 확인하고 있습니다.",
          };

          processingIndexes.push(nextIndex);

          setActivityFeed((prev) =>
            [
              `${nextApplicants[nextIndex].name} - GitHub validation 시작`,
              ...prev,
            ].slice(0, 12)
          );
        }

        processingIndexes.forEach((index) => {
          const applicant = nextApplicants[index];
          const nextStepIndex = applicant.currentStepIndex + 1;
          const totalSteps = applicant.totalSteps || 10;

          if (nextStepIndex > totalSteps) return;

          const nextStepLabel =
            nextStepIndex === totalSteps
              ? "Completed"
              : stepsLabelByIndex(nextStepIndex);

          const isCompleted = nextStepIndex === totalSteps;

          nextApplicants[index] = {
            ...applicant,
            status: isCompleted ? "completed" : "processing",
            currentStepIndex: nextStepIndex,
            currentStep: nextStepLabel,
            progress: Math.min(
              100,
              Math.round((nextStepIndex / totalSteps) * 100)
            ),
            recentLog: getNextProcessingLog(nextStepLabel, applicant.name),
            generatedQuestions:
              nextStepLabel === "Question generation" ||
              applicant.generatedQuestions > 0
                ? Math.max(applicant.generatedQuestions || 0, 4)
                : applicant.generatedQuestions || 0,
            score: isCompleted ? applicant.score ?? randomScore() : null,
          };

          setActivityFeed((prev) =>
            [getNextProcessingLog(nextStepLabel, applicant.name), ...prev].slice(
              0,
              12
            )
          );
        });

        return nextApplicants;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [analysisStarted, applicants]);

  const handleAddApplicants = (rows) => {
    const normalizedApplicants = rows.map((row) =>
      normalizeApplicant({
        ...row,
        status: "waiting",
        currentStep: "Waiting",
        currentStepIndex: 1,
        totalSteps: 10,
        progress: 0,
        recentLog: "분석 대기열에 등록되었습니다.",
      })
    );

    if (normalizedApplicants.length === 0) return;

    setApplicants((prev) => [...prev, ...normalizedApplicants]);

    setActivityFeed((prev) =>
      [
        ...normalizedApplicants.map((item) => `${item.name} - 대기열 등록 완료`),
        ...prev,
      ].slice(0, 12)
    );

    if (!selectedApplicantId && normalizedApplicants[0]) {
      setSelectedApplicantId(normalizedApplicants[0].id);
    }
  };

  const handleStartAnalysis = () => {
    if (!applicants.length) return;

    setApplicants((prev) =>
      prev.map((applicant) => {
        if (
          applicant.status === "completed" ||
          applicant.status === "processing" ||
          applicant.status === "failed"
        ) {
          return applicant;
        }

        return {
          ...applicant,
          status: "waiting",
          currentStep: "Waiting",
          currentStepIndex: 1,
          progress: 0,
          recentLog: "분석 대기열에 등록되었습니다.",
        };
      })
    );

    setActivityFeed((prev) => ["Batch analysis started", ...prev].slice(0, 12));
    setAnalysisStarted(true);
  };

  const handleOpenApplicantDetail = (applicantId) => {
    setSelectedApplicantId(applicantId);
    setIsApplicantModalOpen(true);
  };

  return (
    <DashboardLayout
      rooms={rooms}
      title={room?.name ?? "Room Summary"}
      description="Track batch interview analysis progress"
    >
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                {room?.name ?? "Room"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                지원자 분석과 질문 생성 현황을 관리하는 공간입니다.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                + Add Applicants
              </button>

              <button
                onClick={handleStartAnalysis}
                disabled={applicants.length === 0}
                className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Start Analysis
              </button>
            </div>
          </div>
        </section>

        {roomStatus === "Empty" ? (
          <EmptyRoomState onAddApplicant={() => setIsAddModalOpen(true)} />
        ) : (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Batch Status
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    전체 진행도는 요약 정보로만 표시됩니다.
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-400">Completed</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {metrics.completed}/{metrics.total}
                  </p>
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${metrics.progressPercent}%` }}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <div className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
                  Total {metrics.total}
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
                  Completed {metrics.completed}
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
                  In Progress {metrics.inProgress}
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
                  Waiting {metrics.waiting}
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
                  Failed {metrics.failed}
                </div>
              </div>
            </section>

            <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-6">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">
                      Applicants
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      지원자별 분석 상태와 결과 진입점을 확인할 수 있습니다.
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700">
                    {metrics.total} applicants
                  </span>
                </div>

                <div className="space-y-4">
                  {applicants.map((applicant) => (
                    <div
                      key={applicant.id}
                      className="rounded-2xl border border-slate-200 p-5 transition hover:border-slate-300"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <h4 className="text-xl font-semibold text-slate-900">
                              {applicant.name}
                            </h4>
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(
                                applicant.status
                              )}`}
                            >
                              {applicant.status}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-slate-500">
                            {applicant.email}
                          </p>
                          <p className="text-sm text-slate-500">
                            {applicant.githubUrl}
                          </p>
                        </div>

                        <button
                          onClick={() => handleOpenApplicantDetail(applicant.id)}
                          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          View Detail
                        </button>
                      </div>

                      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_180px] items-center gap-4">
                        <div>
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-slate-500">
                              {applicant.currentStep}
                            </span>
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

                        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
                          <p className="text-slate-400">Step</p>
                          <p className="mt-1 font-medium text-slate-900">
                            {applicant.currentStepIndex}/{applicant.totalSteps}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          Recent Log
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {applicant.recentLog}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <aside className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Live Activity
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    전체 작업 흐름을 보조적으로 확인할 수 있습니다.
                  </p>

                  <div className="mt-4 space-y-3">
                    {activityFeed.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        아직 활동 로그가 없습니다.
                      </p>
                    ) : (
                      activityFeed.map((item, index) => (
                        <div
                          key={index}
                          className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600"
                        >
                          {item}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {roomStatus === "Completed" ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Batch Summary
                    </h3>

                    <div className="mt-4 space-y-4">
                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-400">Average Score</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                          {metrics.averageScore}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-400">
                          Completed Applicants
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                          {metrics.completed}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </aside>
            </div>
          </>
        )}
      </div>

      <AddApplicantsModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddApplicants}
      />

      <ApplicantDetailModal
        isOpen={isApplicantModalOpen}
        applicant={selectedApplicant}
        onClose={() => setIsApplicantModalOpen(false)}
      />
    </DashboardLayout>
  );
}