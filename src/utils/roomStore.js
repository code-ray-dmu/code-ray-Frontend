export const DELETED_ROOMS_KEY = "code-ray-deleted-rooms-v2";
export const CREATED_ROOMS_KEY = "code-ray-created-rooms-v1";

export const BASE_ROOMS = [
  {
    id: "frontend-interview",
    name: "Frontend Interview",
    primaryFocus: "Frontend Development",
    stack: ["React", "TypeScript"],
    architecture: "SPA",
    culture: "Code Review 중심",
    repoUrl: "github.com/devkim/frontend-portfolio",
    status: "Ready",
    updatedAt: "2h ago",
    questions: 12,
    evaluations: 3,
  },
  {
    id: "backend-interview",
    name: "Backend Interview",
    primaryFocus: "System Design",
    stack: ["Spring Boot", "JPA"],
    architecture: "MSA",
    culture: "테스트 중심",
    repoUrl: "github.com/parkserver/commerce-api",
    status: "In Progress",
    updatedAt: "5h ago",
    questions: 9,
    evaluations: 2,
  },
  {
    id: "ai-engineer",
    name: "AI Engineer",
    primaryFocus: "Performance",
    stack: ["Python", "TensorFlow"],
    architecture: "Pipeline",
    culture: "실험 기반",
    repoUrl: "github.com/aimin/lab-pipeline",
    status: "Ready",
    updatedAt: "1d ago",
    questions: 15,
    evaluations: 4,
  },
];

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) ?? JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function slugifyRoomId(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCreatedRooms() {
  return readJson(CREATED_ROOMS_KEY, []);
}

export function getDeletedRoomIds() {
  return readJson(DELETED_ROOMS_KEY, []);
}

export function getAllRooms() {
  return [...BASE_ROOMS, ...getCreatedRooms()];
}

export function getVisibleRooms() {
  const deletedRoomIds = new Set(getDeletedRoomIds());
  return getAllRooms().filter((room) => !deletedRoomIds.has(room.id));
}

export function createRoom(roomData) {
  const existingRooms = getAllRooms();
  const baseId = slugifyRoomId(roomData.name) || "new-room";
  let nextId = baseId;
  let suffix = 2;

  while (existingRooms.some((room) => room.id === nextId)) {
    nextId = `${baseId}-${suffix}`;
    suffix += 1;
  }

  const newRoom = {
    id: nextId,
    name: roomData.name,
    primaryFocus: roomData.primaryFocus,
    stack: roomData.stack,
    architecture: roomData.architecture,
    culture: roomData.culture,
    repoUrl: "",
    status: "Draft",
    updatedAt: "Just now",
    questions: 0,
    evaluations: 0,
  };

  writeJson(CREATED_ROOMS_KEY, [...getCreatedRooms(), newRoom]);
  return newRoom;
}
