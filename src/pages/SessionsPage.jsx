import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { getVisibleRooms } from "../utils/roomStore";

const sessions = [
  {
    id: 1,
    roomId: "frontend-interview",
    roomName: "Frontend Interview",
    candidateName: "김개발",
    githubId: "devkim",
    repositoriesAnalyzed: 3,
    generatedQuestions: 12,
    analysisStatus: "completed",
    updatedAt: "10 min ago",
    focus: "Frontend Development",
  },
  {
    id: 2,
    roomId: "backend-interview",
    roomName: "Backend Interview",
    candidateName: "이백엔드",
    githubId: "backendlee",
    repositoriesAnalyzed: 2,
    generatedQuestions: 9,
    analysisStatus: "completed",
    updatedAt: "1 hour ago",
    focus: "System Design",
  },
  {
    id: 3,
    roomId: "ai-engineer",
    roomName: "AI Engineer",
    candidateName: "박모델",
    githubId: "modelpark",
    repositoriesAnalyzed: 4,
    generatedQuestions: 15,
    analysisStatus: "completed",
    updatedAt: "Today",
    focus: "Performance",
  },
  {
    id: 4,
    roomId: "frontend-interview",
    roomName: "Frontend Interview",
    candidateName: "최리액트",
    githubId: "choi-react",
    repositoriesAnalyzed: 1,
    generatedQuestions: 6,
    analysisStatus: "completed",
    updatedAt: "Yesterday",
    focus: "Code Quality",
  },
];

function AnalysisBadge({ status }) {
  if (status === "completed") {
    return (
      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
        AI Analysis Completed
      </span>
    );
  }

  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
      Waiting
    </span>
  );
}

function EmptyState() {
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
        No sessions yet
      </h3>

      <p className="mx-auto max-w-md text-slate-500">
        Add a candidate in a room and run AI analysis to see generated interview
        results here.
      </p>
    </div>
  );
}

function SessionCard({ session, onContinue }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-blue-600">
            {session.roomName}
          </p>
          <h3 className="text-2xl font-semibold text-slate-900">
            {session.candidateName}
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            github.com/{session.githubId}
          </p>
        </div>

        <AnalysisBadge status={session.analysisStatus} />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
          {session.focus}
        </span>
      </div>

      <div className="mb-6 space-y-3 rounded-2xl bg-slate-50 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Repositories Analyzed</span>
          <span className="font-semibold text-slate-900">
            {session.repositoriesAnalyzed}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Generated Questions</span>
          <span className="font-semibold text-slate-900">
            {session.generatedQuestions}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Last Updated</span>
          <span className="font-semibold text-slate-900">
            {session.updatedAt}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Review summary, generated questions, and evaluation results.
        </p>

        <button
          onClick={() => onContinue(session)}
          className="rounded-xl bg-blue-500 px-4 py-2 font-medium text-white transition hover:bg-blue-600"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

export default function SessionsPage() {
  const navigate = useNavigate();
  const [visibleRooms] = useState(() => getVisibleRooms());
  const [search, setSearch] = useState("");

  const filteredSessions = sessions.filter((session) => {
    const keyword = search.toLowerCase();

    return (
      session.candidateName.toLowerCase().includes(keyword) ||
      session.roomName.toLowerCase().includes(keyword) ||
      session.githubId.toLowerCase().includes(keyword)
    );
  });

  const handleContinue = (session) => {
    navigate(`/rooms/${session.roomId}?tab=summary`);
  };

  return (
    <DashboardLayout
      rooms={visibleRooms}
      title="My Session"
      description="Review AI-generated interview results for each candidate"
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-6">
            <div>
              <h2 className="mb-2 text-2xl font-semibold text-slate-900">
                Interview Sessions
              </h2>
              <p className="text-slate-500">
                Browse analyzed candidates and review generated interview content.
              </p>
            </div>

            <div className="w-72">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by candidate or room..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-blue-400"
              />
            </div>
          </div>
        </div>

        {filteredSessions.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {filteredSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onContinue={handleContinue}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}