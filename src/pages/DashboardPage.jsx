import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthDebugPanel } from '../components/auth/auth-debug-panel.jsx';
import DashboardLayout from '../components/layout/DashboardLayout';
import { openCreateRoomModal } from '../utils/createRoomModal';
import { getVisibleRooms } from '../utils/roomStore';
import {
  getRoomMetricsFromApplicants,
  getRoomStatusLabel,
  getRoomWorkspaceSeed,
} from '../utils/workspaceData';

export function DashboardPage() {
  const navigate = useNavigate();
  const [visibleRooms] = useState(() => getVisibleRooms());

  return (
    <DashboardLayout
      rooms={visibleRooms}
      title="Interview Rooms"
      description="Manage your AI interview sessions"
      searchPlaceholder="Search by room name..."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {visibleRooms.map((room) => {
              const seed = getRoomWorkspaceSeed(room.id);
              const metrics = getRoomMetricsFromApplicants(seed.applicants);
              const roomStatus = getRoomStatusLabel(seed.applicants, seed.analysisStarted);

              return (
                <div
                  key={room.id}
                  onClick={() => navigate(`/rooms/${room.id}`)}
                  className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">{room.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">Updated {room.updatedAt}</p>
                    </div>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                      {roomStatus}
                    </span>
                  </div>

                  {metrics.total === 0 ? (
                    <div className="mb-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-medium text-slate-800">No applicants yet</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Add candidates to start batch analysis.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                          <span>
                            {metrics.completed}/{metrics.total} analyzed
                          </span>
                          <span>{metrics.progressPercent}%</span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all"
                            style={{ width: `${metrics.progressPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-slate-400">Applicants</p>
                          <p className="font-semibold text-slate-900">{metrics.total}</p>
                        </div>

                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-slate-400">In Progress</p>
                          <p className="font-semibold text-slate-900">{metrics.inProgress}</p>
                        </div>

                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-slate-400">Waiting</p>
                          <p className="font-semibold text-slate-900">{metrics.waiting}</p>
                        </div>

                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-slate-400">Failed</p>
                          <p className="font-semibold text-slate-900">{metrics.failed}</p>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {room.stack?.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                      >
                        {tech}
                      </span>
                    ))}

                    {room.architecture ? (
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {room.architecture}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="space-y-6">
          <AuthDebugPanel />

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Quick Start</h3>

            <ol className="space-y-3 text-sm text-slate-600">
              <li>1. Create a room</li>
              <li>2. Add multiple applicants</li>
              <li>3. Start batch analysis</li>
            </ol>

            <button
              onClick={openCreateRoomModal}
              className="mt-5 w-full rounded-xl bg-blue-500 py-3 font-medium text-white hover:bg-blue-600"
            >
              Create Room
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Batch Overview</h3>

            <div className="space-y-4 text-sm">
              {visibleRooms.map((room) => {
                const seed = getRoomWorkspaceSeed(room.id);
                const metrics = getRoomMetricsFromApplicants(seed.applicants);

                return (
                  <div key={`overview-${room.id}`} className="rounded-xl bg-slate-50 p-4">
                    <p className="font-medium text-slate-800">{room.name}</p>

                    {metrics.total === 0 ? (
                      <p className="mt-1 text-slate-500">No applicants registered yet</p>
                    ) : (
                      <p className="mt-1 text-slate-500">
                        {metrics.completed}/{metrics.total} completed · {metrics.inProgress}{' '}
                        processing
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </DashboardLayout>
  );
}
