export default function Header({
  title,
  description,
  actionLabel,
  searchPlaceholder,
  onActionClick,
}) {
  return (
    <header className="flex h-24 items-center justify-between border-b bg-white px-8">
      <div className="min-w-0">
        <h2 className="text-2xl font-semibold leading-tight text-slate-900">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 whitespace-nowrap text-sm leading-5 text-slate-500">
            {description}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {searchPlaceholder ? (
          <div className="w-72">
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-blue-400"
            />
          </div>
        ) : null}

        {actionLabel ? (
          <button
            onClick={onActionClick}
            className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </header>
  );
}
