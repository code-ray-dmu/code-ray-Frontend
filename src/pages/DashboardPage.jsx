import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { openCreateRoomModal } from "../utils/createRoomModal";
import { getVisibleRooms } from "../utils/roomStore";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [visibleRooms] = useState(() => getVisibleRooms());

  return (
    <DashboardLayout
      rooms={visibleRooms}
      title="Interview Rooms"
      description="Manage your AI interview sessions"
      searchPlaceholder="Search by room name..."
    >
      <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-6">
        <section className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {visibleRooms.map((room) => (
              <div
                key={room.name}
                onClick={() => navigate(`/rooms/${room.id}`)}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">
                      {room.name}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Updated {room.updatedAt}
                    </p>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
                    {room.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {room.stack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                    {room.architecture}
                  </span>
                </div>

                <p className="text-sm text-slate-600 mb-5">{room.culture}</p>

                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>{room.questions} Questions</span>
                  <span>{room.evaluations} Evaluations</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Quick Start
            </h3>
            <ol className="space-y-3 text-sm text-slate-600">
              <li>1. Create a new interview room</li>
              <li>2. Add GitHub repository URL</li>
              <li>3. Generate questions and start interview</li>
            </ol>

            <button
              onClick={openCreateRoomModal}
              className="mt-5 w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium"
            >
              Create Room
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium text-slate-800">Frontend Interview</p>
                <p className="text-slate-500">Questions generated 1 hour ago</p>
              </div>
              <div>
                <p className="font-medium text-slate-800">Backend Interview</p>
                <p className="text-slate-500">Evaluation completed today</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </DashboardLayout>
  );
}
