import { useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { getVisibleRooms } from "../utils/roomStore";

const sessions = [
  {
    id: 1,
    roomName: "Frontend Interview",
    candidateName: "김개발",
    githubId: "devkim",
    status: "in_progress",
    progress: 3,
    totalQuestions: 10,
    updatedAt: "10 min ago",
    focus: "Frontend Development",
  },
  {
    id: 2,
    roomName: "Backend Interview",
    candidateName: "이백엔드",
    githubId: "backendlee",
    status: "in_progress",
    progress: 6,
    totalQuestions: 12,
    updatedAt: "1 hour ago",
    focus: "System Design",
  },
  {
    id: 3,
    roomName: "AI Engineer",
    candidateName: "박모델",
    githubId: "modelpark",
    status: "completed",
    score: 84,
    completedAt: "Today",
    focus: "Performance",
  },
  {
    id: 4,
    roomName: "Frontend Interview",
    candidateName: "최리액트",
    githubId: "choi-react",
    status: "completed",
    score: 76,
    completedAt: "Yesterday",
    focus: "Code Quality",
  },
];

function StatusBadge({ status }) {
  if (status === "in_progress") {
    return (
      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
        In Progress
      </span>
    );
  }

  return (
    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
      Completed
    </span>
  );
}

function ProgressBar({ value, max }) {
  const percent = Math.round((value / max) * 100);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
        <span>
          Progress {value}/{max}
        </span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function EmptyState({ activeTab }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <svg
          className="h-7 w-7 text-slate-400"
          viewBox="0 -960 960 960"
          fill="currentColor"
        >
          <path d="M320-240h320v-80H320v80Zm0-160h320v-80H320v80Zm-80 320q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520Z" />
        </svg>
      </div>

      <h3 className="mb-2 text-xl font-semibold text-slate-900">
        {activeTab === "in_progress"
          ? "No sessions in progress"
          : "No completed sessions yet"}
      </h3>

      <p className="mx-auto max-w-md text-slate-500">
        {activeTab === "in_progress"
          ? "Start an interview from a room to track progress here."
          : "Completed interview results will appear here once the session is finished."}
      </p>
    </div>
  );
}

function SessionCard({ session }) {
  const isInProgress = session.status === "in_progress";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-blue-600">{session.roomName}</p>
          <h3 className="text-2xl font-semibold text-slate-900">
            {session.candidateName}
          </h3>
          <p className="mt-2 text-sm text-slate-500">github.com/{session.githubId}</p>
        </div>

        <StatusBadge status={session.status} />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
          {session.focus}
        </span>
      </div>

      {isInProgress ? (
        <div className="space-y-5">
          <ProgressBar value={session.progress} max={session.totalQuestions} />

          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Last updated {session.updatedAt}</span>
            <button className="rounded-xl bg-blue-500 px-4 py-2 font-medium text-white transition hover:bg-blue-600">
              Continue
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-end justify-between">
          <div>
            <p className="mb-2 text-sm text-slate-500">Final Score</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-slate-900">
                {session.score}
              </span>
              <span className="mb-1 text-slate-400">/ 100</span>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Completed {session.completedAt}
            </p>
          </div>

          <button className="rounded-xl border border-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50">
            View Result
          </button>
        </div>
      )}
    </div>
  );
}

export default function SessionsPage() {
  const [activeTab, setActiveTab] = useState("in_progress");
  const [visibleRooms] = useState(() => getVisibleRooms());

  const filteredSessions = sessions.filter(
    (session) => session.status === activeTab
  );

  const inProgressCount = sessions.filter(
    (session) => session.status === "in_progress"
  ).length;

  const completedCount = sessions.filter(
    (session) => session.status === "completed"
  ).length;

  return (
    <DashboardLayout
      rooms={visibleRooms}
      title="My Session"
      description="Review your recent interview sessions and progress"
      searchPlaceholder="Search by candidate or room..."
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-6">
            <div>
              <h2 className="mb-2 text-2xl font-semibold text-slate-900">
                Interview Sessions
              </h2>
              <p className="text-slate-500">
                Track ongoing interviews and review completed results.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="inline-flex rounded-2xl bg-slate-100 p-1.5">
                <button
                  onClick={() => setActiveTab("in_progress")}
                  className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                    activeTab === "in_progress"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  In Progress
                  <span className="ml-2 text-xs text-slate-400">
                    {inProgressCount}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("completed")}
                  className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                    activeTab === "completed"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Completed
                  <span className="ml-2 text-xs text-slate-400">
                    {completedCount}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {filteredSessions.length === 0 ? (
          <EmptyState activeTab={activeTab} />
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {filteredSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
