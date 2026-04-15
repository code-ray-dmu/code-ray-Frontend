import { NavLink, useNavigate } from 'react-router-dom';
import { clearAuthSession } from '../../services/auth/auth-session.js';
import { openCreateRoomModal } from '../../utils/createRoomModal';

const navItems = [
  {
    label: '그룹',
    to: '/dashboard',
    icon: (
      <svg className="w-5 h-5" viewBox="0 -960 960 960" fill="currentColor">
        <path d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z" />
      </svg>
    ),
  },
  {
    label: '워크플로우',
    to: '/workflow',
    icon: (
      <svg className="w-5 h-5" viewBox="0 -960 960 960" fill="currentColor">
        <path d="M280-120q-33 0-56.5-23.5T200-200v-560q0-33 23.5-56.5T280-840h400q33 0 56.5 23.5T760-760v160h-80v-160H280v560h200v80H280Zm360 0v-170q-66-14-103-66t-37-124q0-79 55.5-134.5T690-670q79 0 134.5 55.5T880-480q0 72-37 124t-103 66v170H640Zm50-250q46 0 78-32t32-78q0-46-32-78t-78-32q-46 0-78 32t-32 78q0 46 32 78t78 32Z" />
      </svg>
    ),
  },
];

export default function Sidebar({ rooms = [], recentItemsLabel = '최근 항목' }) {
  const navigate = useNavigate();

  function handleSignOut() {
    clearAuthSession();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="w-72 bg-white border-r px-6 py-8 flex flex-col">
      <div className="mb-8 pl-6">
        <img src="/logo.png" alt="Code-Ray" className="h-16 w-auto" />
      </div>

      <button
        onClick={openCreateRoomModal}
        className="mb-8 w-full rounded-xl bg-blue-500 py-3 font-medium text-white shadow-sm hover:bg-blue-600"
      >
        + 그룹 만들기
      </button>

      <nav className="space-y-2 text-sm">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === "/dashboard"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                isActive
                  ? "bg-blue-50 text-blue-600 font-semibold"
                  : "text-slate-600 hover:bg-slate-100"
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {rooms.length > 0 ? (
        <div className="mt-10">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">{recentItemsLabel}</h3>
          <div className="space-y-2">
            {rooms.map((room) => (
              <NavLink
                key={room.id ?? room.name}
                to={room.href ?? `/rooms/${room.id}`}
                className="block rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-100"
              >
                {room.name}
              </NavLink>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-auto border-t border-slate-200 pt-6">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <span>로그아웃</span>
          <svg className="h-5 w-5" viewBox="0 -960 960 960" fill="currentColor">
            <path d="M186.67-120q-27 0-46.84-19.83Q120-159.67 120-186.67v-586.66q0-27 19.83-46.84Q159.67-840 186.67-840h293.66v66.67H186.67v586.66h293.66V-120H186.67Zm426.66-160-47.66-48L684-446.33H360v-67.34h324L565.67-632l47.66-48L814.67-480 613.33-280Z" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
