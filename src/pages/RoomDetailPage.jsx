import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { DELETED_ROOMS_KEY, getVisibleRooms } from "../utils/roomStore";

const techOptions = [
  "React",
  "TypeScript",
  "JavaScript",
  "Next.js",
  "Vue",
  "Spring Boot",
  "JPA",
  "Node.js",
  "Express",
  "Python",
  "TensorFlow",
  "PyTorch",
  "MySQL",
  "PostgreSQL",
  "MongoDB",
  "React Query",
  "Redux",
];

const architectureOptions = [
  "SPA",
  "MSA",
  "Monolith",
  "Pipeline",
  "Serverless",
  "MVC",
];

const focusOptions = [
  "Frontend Development",
  "Code Quality",
  "System Design",
  "Performance",
  "Testing",
  "Collaboration",
];

const candidates = [
  {
    id: "devkim",
    roomId: "frontend-interview",
    name: "김개발",
    githubUrl: "github.com/devkim",
    repoName: "frontend-portfolio",
    mainLanguages: ["TypeScript", "JavaScript"],
    commits: 328,
    lastCommit: "2 days ago",
    repositories: 12,
    score: 78,
    summary:
      "The candidate demonstrates solid frontend development skills with strong React and TypeScript usage. Repository structure is generally organized, and commit history shows consistent participation. However, test coverage and documentation practices appear limited, suggesting room for improvement in maintainability and collaboration readiness.",
    strengths: [
      "Strong React component structure",
      "Consistent commit activity",
      "Good understanding of SPA patterns",
    ],
    weaknesses: [
      "Limited testing practices",
      "Minimal documentation",
      "Few examples of team-scale architecture decisions",
    ],
    techInsights: [
      "Uses React hooks and component-based architecture",
      "TypeScript is used consistently across major files",
      "No clear unit/integration test framework detected",
    ],
  },
  {
    id: "parkserver",
    roomId: "backend-interview",
    name: "박서버",
    githubUrl: "github.com/parkserver",
    repoName: "commerce-api",
    mainLanguages: ["Java", "SQL"],
    commits: 412,
    lastCommit: "8 hours ago",
    repositories: 9,
    score: 84,
    summary:
      "The candidate shows strong backend ownership with clear Spring Boot service boundaries and stable persistence design. Commit history suggests active feature delivery, while API structure and repository layering are consistent. Testing coverage is present but could be expanded around failure scenarios and performance bottlenecks.",
    strengths: [
      "Clear Spring Boot service organization",
      "Strong persistence and API design",
      "Consistent backend delivery pace",
    ],
    weaknesses: [
      "Limited observability examples",
      "Performance testing is not obvious",
      "Architecture decisions are not documented deeply",
    ],
    techInsights: [
      "Uses layered backend structure with service and repository separation",
      "JPA usage appears consistent across domain flows",
      "Test setup exists but is focused on core paths",
    ],
  },
  {
    id: "aimin",
    roomId: "ai-engineer",
    name: "최모델",
    githubUrl: "github.com/aimin",
    repoName: "lab-pipeline",
    mainLanguages: ["Python", "TensorFlow"],
    commits: 276,
    lastCommit: "1 day ago",
    repositories: 7,
    score: 81,
    summary:
      "The candidate shows good practical ML engineering habits, especially around data flow, model iteration, and pipeline readability.",
    strengths: [
      "Well-structured ML pipeline flow",
      "Strong experiment iteration pace",
      "Clear model evaluation steps",
    ],
    weaknesses: [
      "Collaboration signals are limited",
      "Deployment artifacts are thin",
      "Monitoring flow is not obvious",
    ],
    techInsights: [
      "Pipeline stages are clearly separated by responsibility",
      "Experiment tracking patterns are visible in project structure",
      "Operational deployment flow is less explicit than training flow",
    ],
  },
];

const questionsByRoom = {
  "frontend-interview": [
    {
      id: "q1",
      title: "State Management",
      category: "React",
      difficulty: "Medium",
      status: "Generated",
      question:
        "How did you manage state across reusable components in this project, and what trade-offs did you consider?",
      reason:
        "Repeated local state handling patterns were detected across multiple React components.",
      followUps: [
        "Why did you prefer local state over a global store here?",
        "How would this scale if the number of shared interactions increased?",
      ],
      evaluationPoints: [
        "State ownership clarity",
        "Trade-off explanation",
        "Scalability thinking",
      ],
    },
    {
      id: "q2",
      title: "Component Reusability",
      category: "Architecture",
      difficulty: "Medium",
      status: "Reviewed",
      question:
        "What principles did you use to decide whether a UI pattern should become a reusable component?",
      reason:
        "The repository shows repeated visual structures with partial abstraction.",
      followUps: [
        "Where would over-abstraction become a problem?",
        "How would you document reusable component rules for teammates?",
      ],
      evaluationPoints: [
        "Abstraction judgment",
        "Team maintainability",
        "Design consistency",
      ],
    },
    {
      id: "q3",
      title: "Testing Strategy",
      category: "Testing",
      difficulty: "Hard",
      status: "Generated",
      question:
        "If you had one day to improve confidence in this frontend codebase, what tests would you add first and why?",
      reason:
        "There is little visible unit or integration test coverage in key UI flows.",
      followUps: [
        "Which user flows are highest priority to protect?",
        "How would you balance test speed and coverage?",
      ],
      evaluationPoints: [
        "Risk prioritization",
        "Testing strategy",
        "Quality mindset",
      ],
    },
  ],
  "backend-interview": [
    {
      id: "q4",
      title: "Service Boundaries",
      category: "Backend",
      difficulty: "Medium",
      status: "Generated",
      question:
        "How did you decide the service boundaries in this Spring Boot project?",
      reason:
        "The repository uses layered services with domain-specific repositories and APIs.",
      followUps: [
        "What signals tell you a service is doing too much?",
        "How would these boundaries evolve if the system grew further?",
      ],
      evaluationPoints: [
        "Domain modeling",
        "Separation of concerns",
        "Scalability thinking",
      ],
    },
    {
      id: "q5",
      title: "Persistence Design",
      category: "JPA",
      difficulty: "Hard",
      status: "Reviewed",
      question:
        "What trade-offs did you make in your entity and repository design for this project?",
      reason:
        "The data access layer suggests deliberate repository layering and entity relationships.",
      followUps: [
        "Where would lazy loading become risky here?",
        "What would you change if query volume doubled?",
      ],
      evaluationPoints: [
        "Persistence trade-offs",
        "Performance awareness",
        "Backend judgment",
      ],
    },
  ],
  "ai-engineer": [
    {
      id: "q6",
      title: "Pipeline Reliability",
      category: "ML Pipeline",
      difficulty: "Medium",
      status: "Generated",
      question:
        "How did you make this ML pipeline reliable across repeated experiments?",
      reason:
        "The repository suggests a staged data and model workflow with reusable steps.",
      followUps: [
        "Which step is most fragile today?",
        "How would you monitor failures in production?",
      ],
      evaluationPoints: [
        "Pipeline thinking",
        "Reliability mindset",
        "Operational awareness",
      ],
    },
  ],
};

function ScoreBar({ label, value }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm text-slate-600">{label}</span>
        <span className="text-sm font-medium text-slate-800">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function RoomTabButton({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-white text-blue-600 shadow-sm"
          : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {label}
    </button>
  );
}

function createFallbackCandidate(room) {
  return {
    id: `${room.id}-candidate`,
    roomId: room.id,
    name: "Candidate TBD",
    githubUrl: "github.com/",
    repoName: room.name.toLowerCase().replace(/\s+/g, "-"),
    mainLanguages: room.stack?.length ? room.stack : ["Not specified"],
    commits: 0,
    lastCommit: "No repository activity yet",
    repositories: 0,
    score: 0,
    summary:
      "No candidate has been connected to this room yet. Add a repository and generate interview context to start reviewing insights here.",
    strengths: [
      "Room structure is ready for candidate analysis",
      "Tech stack and evaluation focus are already defined",
    ],
    weaknesses: [
      "No repository has been linked yet",
      "No candidate-specific summary is available",
    ],
    techInsights: [
      "Generated insights will appear after repository analysis",
      "Question sets will stay empty until interview content is created",
    ],
  };
}

export default function RoomDetailPage() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const visibleRooms = getVisibleRooms();
  const room = visibleRooms.find((item) => item.id === roomId) ?? visibleRooms[0];
  const [roomOverrides, setRoomOverrides] = useState({});
  const [addedCandidatesByRoom, setAddedCandidatesByRoom] = useState({});
  const currentRoom = room
    ? roomOverrides[room.id]
      ? { ...room, ...roomOverrides[room.id] }
      : room
    : null;
  const roomCandidates = currentRoom
    ? [
        ...candidates.filter((candidate) => candidate.roomId === currentRoom.id),
        ...(addedCandidatesByRoom[currentRoom.id] ?? []),
      ]
    : [];
  const candidateOptions =
    roomCandidates.length > 0 && currentRoom
      ? roomCandidates
      : currentRoom
        ? [createFallbackCandidate(currentRoom)]
        : [];
  const allowedTabs = new Set(["summary", "questions", "evaluation"]);
  const requestedTab = searchParams.get("tab");
  const [selectedCandidateId, setSelectedCandidateId] = useState(
    candidateOptions[0]?.id ?? null
  );
  const [activeTab, setActiveTab] = useState(
    allowedTabs.has(requestedTab) ? requestedTab : "summary"
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddCandidateModalOpen, setIsAddCandidateModalOpen] = useState(false);
  const [editRoomName, setEditRoomName] = useState(currentRoom?.name ?? "");
  const [editTechStackInput, setEditTechStackInput] = useState("");
  const [editSelectedTechStacks, setEditSelectedTechStacks] = useState(
    currentRoom?.stack ?? []
  );
  const [editArchitecture, setEditArchitecture] = useState(
    currentRoom?.architecture ?? ""
  );
  const [editCulture, setEditCulture] = useState(currentRoom?.culture ?? "");
  const [editPrimaryFocus, setEditPrimaryFocus] = useState(
    currentRoom?.primaryFocus ?? "Frontend Development"
  );
  const [candidateGithubUrl, setCandidateGithubUrl] = useState("");
  const selectedCandidate =
    candidateOptions.find((candidate) => candidate.id === selectedCandidateId) ??
    candidateOptions[0];
  const questions = currentRoom ? questionsByRoom[currentRoom.id] ?? [] : [];
  const hasQuestions = questions.length > 0;
  const [selectedQuestionId, setSelectedQuestionId] = useState(questions[0]?.id ?? null);
  const selectedQuestion =
    questions.find((question) => question.id === selectedQuestionId) ?? questions[0];
  const filteredTechOptions = techOptions.filter((option) => {
    const normalizedInput = editTechStackInput.trim().toLowerCase();

    if (!normalizedInput) {
      return !editSelectedTechStacks.includes(option);
    }

    return (
      option.toLowerCase().includes(normalizedInput) &&
      !editSelectedTechStacks.includes(option)
    );
  });

  useEffect(() => {
    setSelectedCandidateId(candidateOptions[0]?.id ?? null);
  }, [currentRoom?.id]);

  useEffect(() => {
    setSelectedQuestionId((currentRoom ? questionsByRoom[currentRoom.id] ?? [] : [])[0]?.id ?? null);
  }, [currentRoom?.id, selectedCandidateId]);

  useEffect(() => {
    setActiveTab(allowedTabs.has(requestedTab) ? requestedTab : "summary");
  }, [requestedTab]);

  useEffect(() => {
    if (!currentRoom) {
      return;
    }

    setEditRoomName(currentRoom.name);
    setEditSelectedTechStacks(currentRoom.stack);
    setEditTechStackInput("");
    setEditArchitecture(currentRoom.architecture);
    setEditCulture(currentRoom.culture);
    setEditPrimaryFocus(currentRoom.primaryFocus ?? "Frontend Development");
  }, [currentRoom]);

  useEffect(() => {
    if (!roomId || currentRoom?.id === roomId || visibleRooms.length === 0) {
      return;
    }

    navigate(`/rooms/${visibleRooms[0].id}?tab=${activeTab}`, { replace: true });
  }, [activeTab, currentRoom?.id, navigate, roomId, visibleRooms]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const addTechStack = (tech) => {
    if (!tech || editSelectedTechStacks.includes(tech)) {
      return;
    }

    setEditSelectedTechStacks((prev) => [...prev, tech]);
    setEditTechStackInput("");
  };

  const removeTechStack = (tech) => {
    setEditSelectedTechStacks((prev) => prev.filter((item) => item !== tech));
  };

  const handleTechStackKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();

      const exactMatch = techOptions.find(
        (option) => option.toLowerCase() === editTechStackInput.trim().toLowerCase()
      );

      if (exactMatch) {
        addTechStack(exactMatch);
        return;
      }

      if (editTechStackInput.trim()) {
        addTechStack(editTechStackInput.trim());
      }
    }

    if (
      event.key === "Backspace" &&
      !editTechStackInput &&
      editSelectedTechStacks.length > 0
    ) {
      removeTechStack(editSelectedTechStacks[editSelectedTechStacks.length - 1]);
    }
  };

  const openEditModal = () => {
    if (!currentRoom) {
      return;
    }

    setEditRoomName(currentRoom.name);
    setEditSelectedTechStacks(currentRoom.stack);
    setEditTechStackInput("");
    setEditArchitecture(currentRoom.architecture);
    setEditCulture(currentRoom.culture);
    setEditPrimaryFocus(currentRoom.primaryFocus ?? "Frontend Development");
    setIsEditModalOpen(true);
  };

  const handleAddCandidate = () => {
    if (!currentRoom) {
      return;
    }

    const trimmedUrl = candidateGithubUrl.trim();
    if (!trimmedUrl) {
      return;
    }

    const normalizedUrl = trimmedUrl
      .replace(/^https?:\/\/(www\.)?/i, "")
      .replace(/^www\./i, "")
      .replace(/\/+$/g, "");
    const githubId = normalizedUrl.split("/").filter(Boolean).pop() || "candidate";
    const nextCandidate = {
      id: `${currentRoom.id}-${githubId.toLowerCase()}`,
      roomId: currentRoom.id,
      name: githubId,
      githubUrl: normalizedUrl.startsWith("github.com/")
        ? normalizedUrl
        : `github.com/${githubId}`,
      repoName: `${githubId}-repo`,
      mainLanguages: currentRoom.stack?.length ? currentRoom.stack : ["Not specified"],
      commits: 0,
      lastCommit: "No repository activity yet",
      repositories: 1,
      score: 0,
      summary:
        "This candidate was added from a GitHub profile. Repository analysis has not been generated yet.",
      strengths: [
        "Candidate profile has been linked to this room",
        "Ready for summary and question generation",
      ],
      weaknesses: [
        "No interview summary generated yet",
        "No evaluation data available yet",
      ],
      techInsights: [
        "Detailed insights will appear after repository analysis",
        "Questions can be generated once the candidate context is prepared",
      ],
    };

    setAddedCandidatesByRoom((prev) => ({
      ...prev,
      [currentRoom.id]: [...(prev[currentRoom.id] ?? []), nextCandidate],
    }));
    setSelectedCandidateId(nextCandidate.id);
    setCandidateGithubUrl("");
    setIsAddCandidateModalOpen(false);
  };

  const handleSaveRoomChanges = () => {
    if (!currentRoom) {
      return;
    }

    setRoomOverrides((prev) => ({
      ...prev,
      [currentRoom.id]: {
        name: editRoomName,
        primaryFocus: editPrimaryFocus,
        stack: editSelectedTechStacks,
        architecture: editArchitecture,
        culture: editCulture,
        repoUrl: currentRoom.repoUrl,
      },
    }));
    setIsEditModalOpen(false);
  };

  const handleDeleteRoom = () => {
    const deletedRoomIds = (() => {
      try {
        return JSON.parse(localStorage.getItem(DELETED_ROOMS_KEY) ?? "[]");
      } catch {
        return [];
      }
    })();

    if (!currentRoom) {
      return;
    }

    const nextDeletedRoomIds = Array.from(new Set([...deletedRoomIds, currentRoom.id]));
    localStorage.setItem(DELETED_ROOMS_KEY, JSON.stringify(nextDeletedRoomIds));
    setIsEditModalOpen(false);
    navigate("/");
  };

  const titleMap = {
    summary: "Room Summary",
    questions: "Interview Questions",
    evaluation: "Candidate Evaluation",
  };

  const descriptionMap = {
    summary: "Review repository insights and interview readiness",
    questions: "Inspect generated questions and prepare for the interview",
    evaluation: "Capture interview notes and candidate fit assessment",
  };

  if (!currentRoom) {
    return (
      <DashboardLayout
        rooms={visibleRooms}
        title={titleMap[activeTab]}
        description={descriptionMap[activeTab]}
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">No room available</h3>
          <p className="mt-2 text-sm text-slate-600">
            Create a new room to start generating interview content.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const renderSummaryTab = () => (
    <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-6">
      <section className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="mb-2 text-sm font-medium text-blue-600">{currentRoom.name}</p>
              <h2 className="text-2xl font-semibold text-slate-900">
                {selectedCandidate?.name}
              </h2>
              <p className="mt-2 text-slate-500">{selectedCandidate?.githubUrl}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {currentRoom.stack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
                >
                  {tech}
                </span>
              ))}
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                {currentRoom.architecture}
              </span>
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">AI Summary</h3>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
              Generated
            </span>
          </div>

          <p className="leading-7 text-slate-600">{selectedCandidate?.summary}</p>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => handleTabChange("questions")}
              className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
            >
              View Questions
            </button>
            <button
              onClick={() => handleTabChange("evaluation")}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              View Evaluation
            </button>
          </div>
        </section>

        <div className="grid grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              Repository Overview
            </h3>

            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-4">
                <span>Total Repositories</span>
                <span className="text-right font-medium text-slate-800">
                  {selectedCandidate?.repositories}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Main Repo</span>
                <span className="text-right font-medium text-slate-800">
                  {selectedCandidate?.repoName}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Main Languages</span>
                <span className="text-right font-medium text-slate-800">
                  {selectedCandidate?.mainLanguages?.join(", ")}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Activity</h3>

            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-4">
                <span>Total Commits</span>
                <span className="text-right font-medium text-slate-800">
                  {selectedCandidate?.commits}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Last Commit</span>
                <span className="text-right font-medium text-slate-800">
                  {selectedCandidate?.lastCommit}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Interview Room</span>
                <span className="text-right font-medium text-slate-800">
                  {currentRoom.name}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              Tech Insights
            </h3>

            <ul className="space-y-3 text-sm text-slate-600">
              {selectedCandidate?.techInsights?.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Overall Score</h3>

          <div className="mb-5 flex items-end gap-2">
            <span className="text-4xl font-bold text-slate-900">
              {selectedCandidate?.score}
            </span>
            <span className="mb-1 text-slate-400">/ 100</span>
          </div>

          <div className="space-y-4">
            <ScoreBar label="Code Quality" value={85} />
            <ScoreBar label="Architecture" value={80} />
            <ScoreBar label="Testing" value={60} />
            <ScoreBar label="Collaboration" value={75} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Strengths</h3>
          <ul className="space-y-3 text-sm text-slate-600">
            {selectedCandidate?.strengths.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Weaknesses</h3>
          <ul className="space-y-3 text-sm text-slate-600">
            {selectedCandidate?.weaknesses.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-slate-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );

  const renderQuestionsTab = () => (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-blue-600">
              {currentRoom.name} / {selectedCandidate?.name}
            </p>
            <h3 className="mt-1 text-xl font-semibold text-slate-900">
              Question Set Review
            </h3>
            <p className="mt-2 text-sm text-slate-500">Repo: {currentRoom.repoUrl}</p>
          </div>

          <div className="flex gap-3">
            {!hasQuestions ? (
              <button className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600">
                Generate Questions
              </button>
            ) : (
              <>
                <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                  Regenerate
                </button>
                <button className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600">
                  Start Interview
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {!hasQuestions ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">No questions yet</h3>
          <p className="mt-2 text-sm text-slate-500">
            Generate AI-based interview questions from this repository context.
          </p>
          <button className="mt-6 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-600">
            Generate Questions
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-[320px_minmax(0,1fr)] gap-6">
          <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Question List</h3>
              <span className="text-sm text-slate-400">{questions.length} items</span>
            </div>

            <div className="space-y-3">
              {questions.map((question, index) => (
                <button
                  key={question.id}
                  onClick={() => setSelectedQuestionId(question.id)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                    selectedQuestion?.id === question.id
                      ? "border-blue-200 bg-blue-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-900">
                      Q{index + 1} {question.title}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                      {question.difficulty}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {question.category} · {question.status}
                  </p>
                </button>
              ))}
            </div>
          </aside>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {selectedQuestion ? (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                      {selectedQuestion.category}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {selectedQuestion.difficulty}
                    </span>
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold text-slate-900">
                    {selectedQuestion.question}
                  </h3>
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                    Why this was generated
                  </h4>
                  <p className="text-sm leading-6 text-slate-600">{selectedQuestion.reason}</p>
                </div>

                <div>
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                    Follow-ups
                  </h4>
                  <ul className="space-y-3 text-sm text-slate-600">
                    {selectedQuestion.followUps.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                    Evaluation Points
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedQuestion.evaluationPoints.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                    Interviewer Notes
                  </h4>
                  <textarea
                    placeholder="Add notes for this question..."
                    className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            ) : null}
          </section>
        </div>
      )}
    </div>
  );

  const renderEvaluationTab = () => (
    <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-6">
      <section className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">Evaluation Notes</h3>
          <p className="mt-2 text-sm text-slate-500">
            Capture interview observations for {selectedCandidate?.name} in {currentRoom.name}.
          </p>

          <div className="mt-6 space-y-4">
            <textarea
              placeholder="Technical strengths, concerns, and trade-off explanations..."
              className="min-h-[140px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400"
            />
            <textarea
              placeholder="Team fit, communication style, and collaboration notes..."
              className="min-h-[140px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400"
            />
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Strengths</h3>
          <ul className="space-y-3 text-sm text-slate-600">
            {selectedCandidate?.strengths.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Weaknesses</h3>
          <ul className="space-y-3 text-sm text-slate-600">
            {selectedCandidate?.weaknesses.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-slate-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );

  return (
    <DashboardLayout
      rooms={visibleRooms}
      title={{
        summary: "Room Summary",
        questions: "Interview Questions",
        evaluation: "Candidate Evaluation",
      }[activeTab]}
      description={{
        summary: "Review repository insights and interview readiness",
        questions: "Inspect generated questions and prepare for the interview",
        evaluation: "Capture interview notes and candidate fit assessment",
      }[activeTab]}
      actionLabel="Edit Room"
      onActionClick={openEditModal}
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="mb-2 text-sm font-medium text-blue-600">Room Context</p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-lg font-semibold text-slate-900">
                  {currentRoom.name}
                </div>
                <span className="text-xl font-semibold text-slate-300">&gt;</span>
                <select
                  value={selectedCandidateId}
                  onChange={(event) => setSelectedCandidateId(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-lg font-semibold text-slate-900 outline-none focus:border-blue-400"
                >
                  {candidateOptions.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setIsAddCandidateModalOpen(true)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                >
                  + Add
                </button>
              </div>
              <p className="mt-3 text-slate-500">{currentRoom.repoUrl}</p>
            </div>

            <div className="inline-flex items-center rounded-2xl bg-slate-100 p-1.5">
              <RoomTabButton
                active={activeTab === "summary"}
                label="Summary"
                onClick={() => handleTabChange("summary")}
              />
              <RoomTabButton
                active={activeTab === "questions"}
                label="Questions"
                onClick={() => handleTabChange("questions")}
              />
              <RoomTabButton
                active={activeTab === "evaluation"}
                label="Evaluation"
                onClick={() => handleTabChange("evaluation")}
              />
            </div>
          </div>
        </div>

        {activeTab === "summary" ? renderSummaryTab() : null}
        {activeTab === "questions" ? renderQuestionsTab() : null}
        {activeTab === "evaluation" ? renderEvaluationTab() : null}
      </div>

      {isEditModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-200 px-6 py-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                Edit
              </p>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Edit Interview Room
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Update room settings for candidate analysis and question generation.
                  </p>
                </div>

                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-2xl leading-none text-slate-400 hover:text-slate-600"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Primary Focus
                </label>
                <p className="mb-3 text-xs text-slate-500">
                  Choose the main evaluation goal for this room.
                </p>
                <div className="flex flex-wrap gap-2">
                  {focusOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setEditPrimaryFocus(option)}
                      className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${
                        editPrimaryFocus === option
                          ? "bg-blue-500 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Room Name
                </label>
                <input
                  type="text"
                  value={editRoomName}
                  onChange={(event) => setEditRoomName(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Tech Stack
                  </label>
                  <div className="rounded-xl border border-slate-200 px-3 py-3 focus-within:border-blue-400">
                    <div className="flex flex-wrap items-center gap-2">
                      {editSelectedTechStacks.map((tech) => (
                        <span
                          key={tech}
                          className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600"
                        >
                          {tech}
                          <button
                            type="button"
                            onClick={() => removeTechStack(tech)}
                            className="text-blue-400 hover:text-blue-600"
                          >
                            ×
                          </button>
                        </span>
                      ))}

                      <input
                        type="text"
                        value={editTechStackInput}
                        onChange={(event) => setEditTechStackInput(event.target.value)}
                        onKeyDown={handleTechStackKeyDown}
                        placeholder="e.g. React, TypeScript"
                        className="min-w-[160px] flex-1 border-none bg-transparent text-sm outline-none"
                      />
                    </div>
                  </div>

                  {filteredTechOptions.length > 0 ? (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                      {filteredTechOptions.slice(0, 5).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => addTechStack(option)}
                          className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Architecture
                  </label>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {architectureOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setEditArchitecture(option)}
                        className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                          editArchitecture === option
                            ? "bg-blue-50 text-blue-600"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Team Culture
                </label>
                <input
                  type="text"
                  value={editCulture}
                  onChange={(event) => setEditCulture(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
                />
              </div>

            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5">
              <button
                onClick={handleDeleteRoom}
                className="mr-auto rounded-xl px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50"
              >
                Delete Room
              </button>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRoomChanges}
                className="rounded-xl bg-blue-500 px-5 py-2.5 font-medium text-white hover:bg-blue-600"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isAddCandidateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                    Candidate
                  </p>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Add Candidate
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Add a candidate to {currentRoom.name} using a GitHub profile URL.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setIsAddCandidateModalOpen(false);
                    setCandidateGithubUrl("");
                  }}
                  className="text-2xl leading-none text-slate-400 hover:text-slate-600"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-4 px-6 py-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  GitHub Profile URL
                </label>
                <input
                  type="text"
                  value={candidateGithubUrl}
                  onChange={(event) => setCandidateGithubUrl(event.target.value)}
                  placeholder="e.g. github.com/devkim"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
                />
                <p className="mt-2 text-xs text-slate-500">
                  We will use the GitHub handle as the candidate name for now.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5">
              <button
                onClick={() => {
                  setIsAddCandidateModalOpen(false);
                  setCandidateGithubUrl("");
                }}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCandidate}
                className="rounded-xl bg-blue-500 px-5 py-2.5 font-medium text-white hover:bg-blue-600"
              >
                Add Candidate
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
