import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CREATE_ROOM_EVENT } from "../../utils/createRoomModal";
import { createRoom } from "../../utils/roomStore";

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

export default function CreateRoomModal() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [techStackInput, setTechStackInput] = useState("");
  const [selectedTechStacks, setSelectedTechStacks] = useState([]);
  const [architecture, setArchitecture] = useState("");
  const [culture, setCulture] = useState("");
  const [primaryFocus, setPrimaryFocus] = useState("Frontend Development");

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener(CREATE_ROOM_EVENT, handleOpen);

    return () => {
      window.removeEventListener(CREATE_ROOM_EVENT, handleOpen);
    };
  }, []);

  const filteredTechOptions = techOptions.filter((option) => {
    const normalizedInput = techStackInput.trim().toLowerCase();

    if (!normalizedInput) {
      return !selectedTechStacks.includes(option);
    }

    return (
      option.toLowerCase().includes(normalizedInput) &&
      !selectedTechStacks.includes(option)
    );
  });

  const addTechStack = (tech) => {
    if (!tech || selectedTechStacks.includes(tech)) {
      return;
    }

    setSelectedTechStacks((prev) => [...prev, tech]);
    setTechStackInput("");
  };

  const removeTechStack = (tech) => {
    setSelectedTechStacks((prev) => prev.filter((item) => item !== tech));
  };

  const handleTechStackKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();

      const exactMatch = techOptions.find(
        (option) => option.toLowerCase() === techStackInput.trim().toLowerCase()
      );

      if (exactMatch) {
        addTechStack(exactMatch);
        return;
      }

      if (techStackInput.trim()) {
        addTechStack(techStackInput.trim());
      }
    }

    if (
      event.key === "Backspace" &&
      !techStackInput &&
      selectedTechStacks.length > 0
    ) {
      removeTechStack(selectedTechStacks[selectedTechStacks.length - 1]);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleCreateRoom = () => {
    const newRoom = createRoom({
      name: roomName || "New Interview Room",
      primaryFocus,
      stack: selectedTechStacks,
      architecture,
      culture,
    });

    setIsOpen(false);
    setRoomName("");
    setTechStackInput("");
    setSelectedTechStacks([]);
    setArchitecture("");
    setCulture("");
    setPrimaryFocus("Frontend Development");
    navigate(`/rooms/${newRoom.id}?tab=summary`);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Create Interview Room
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Set up a room for generating tailored technical interview questions.
            </p>
          </div>

          <button
            onClick={handleClose}
            className="text-2xl leading-none text-slate-400 hover:text-slate-600"
          >
            ×
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Room Name
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
              placeholder="e.g. Frontend Interview"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
            />
          </div>

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
                  onClick={() => setPrimaryFocus(option)}
                  className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${
                    primaryFocus === option
                      ? "bg-blue-500 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Tech Stack
              </label>
              <div className="rounded-xl border border-slate-200 px-3 py-3 focus-within:border-blue-400">
                <div className="flex flex-wrap items-center gap-2">
                  {selectedTechStacks.map((tech) => (
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
                    value={techStackInput}
                    onChange={(event) => setTechStackInput(event.target.value)}
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
                    onClick={() => setArchitecture(option)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      architecture === option
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
              value={culture}
              onChange={(event) => setCulture(event.target.value)}
              placeholder="e.g. Code review focused"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5">
          <button
            onClick={handleClose}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            onClick={handleCreateRoom}
            className="rounded-xl bg-blue-500 px-5 py-2.5 font-medium text-white hover:bg-blue-600"
          >
            Create Room
          </button>
        </div>
      </div>
    </div>
  );
}
