import Header from "./Header";
import Sidebar from "./Sidebar";

export default function DashboardLayout({
  rooms = [],
  title,
  description,
  actionLabel,
  searchPlaceholder,
  onActionClick,
  children,
}) {
  return (
    <div className="h-screen flex bg-slate-50">
      <Sidebar rooms={rooms} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={title}
          description={description}
          actionLabel={actionLabel}
          searchPlaceholder={searchPlaceholder}
          onActionClick={onActionClick}
        />
        <main className="p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
