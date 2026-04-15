const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50];

function buildVisiblePageNumbers(currentPage, totalPages) {
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  const pageNumbers = [];

  for (let pageNumber = startPage; pageNumber <= endPage; pageNumber += 1) {
    pageNumbers.push(pageNumber);
  }

  return pageNumbers;
}

function buildPageSizeOptions(currentSize) {
  const options = new Set([...DEFAULT_PAGE_SIZE_OPTIONS, currentSize]);

  return [...options].sort((left, right) => left - right);
}

export function ApplicantPagination({
  page,
  size,
  total,
  isDisabled,
  onPageChange,
  onPageSizeChange,
}) {
  const safeTotal = Math.max(total, 0);
  const totalPages = Math.max(1, Math.ceil(safeTotal / size));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const pageNumbers = buildVisiblePageNumbers(currentPage, totalPages);
  const pageSizeOptions = buildPageSizeOptions(size);
  const isPreviousDisabled = isDisabled || currentPage <= 1;
  const isNextDisabled = isDisabled || currentPage >= totalPages;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            지원자 페이지 이동
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {currentPage} / {totalPages}페이지 · 총 {safeTotal}명 지원자
          </p>
        </div>

        <label className="flex items-center gap-3 text-sm text-slate-600">
          <span>페이지당 개수</span>
          <select
            value={size}
            disabled={isDisabled}
            onChange={onPageSizeChange}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isPreviousDisabled}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
        >
          이전
        </button>

        {pageNumbers.map((pageNumber) => (
          <button
            key={pageNumber}
            onClick={() => onPageChange(pageNumber)}
            disabled={isDisabled}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              pageNumber === currentPage
                ? 'bg-blue-500 text-white'
                : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
            } disabled:cursor-not-allowed`}
          >
            {pageNumber}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isNextDisabled}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
        >
          다음
        </button>
      </div>
    </section>
  );
}
