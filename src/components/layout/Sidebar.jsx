import { NavLink } from "react-router-dom";
import { openCreateRoomModal } from "../../utils/createRoomModal";

const navItems = [
  {
    label: "Groups",
    to: "/dashboard",
    icon: (
      <svg className="w-5 h-5" viewBox="0 -960 960 960" fill="currentColor">
        <path d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z" />
      </svg>
    ),
  },
  {
    label: "My Session",
    to: "/sessions",
    icon: (
      <svg className="w-5 h-5" viewBox="0 -960 960 960" fill="currentColor">
        <path d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q43-49 66.5-110.5T816-520q0-141-97.5-238.5T480-856q-141 0-238.5 97.5T144-520q0 72 23.5 133.5T234-276Zm246-204q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm0 400q-83 0-156-31.5t-127.5-86Q142-252 110-325t-32-155q0-83 32-156t86.5-127.5q54.5-54.5 127.5-86T480-882q83 0 156 32.5T763.5-763q54.5 54.5 86.5 127.5T882-480q0 82-32 155T763.5-197q-54.5 54.5-127.5 86T480-80Z" />
      </svg>
    ),
  },
];

export default function Sidebar({ rooms = [], recentItemsLabel = "Recent Rooms" }) {
  return (
    <aside className="w-72 bg-white border-r px-6 py-8 flex flex-col">
      <div className="mb-8 pl-6">
        <img src="/logo.png" alt="Code-Ray" className="h-16 w-auto" />
      </div>

      <button
        onClick={openCreateRoomModal}
        className="w-full mb-8 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium shadow-sm"
      >
        + Create Group
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
    </aside>
  );
}
