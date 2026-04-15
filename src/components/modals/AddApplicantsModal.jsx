import { useState } from "react";
import Papa from "papaparse";
import { createEmptyApplicant } from "../../utils/workspaceData";

export default function AddApplicantsModal({
  isOpen,
  onClose,
  onSave,
}) {
  const [rows, setRows] = useState([createEmptyApplicant()]);

  if (!isOpen) return null;

  const handleChangeRow = (rowId, field, value) => {
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    );
  };

  const handleAddRow = () => {
    setRows((prev) => [...prev, createEmptyApplicant()]);
  };

  const handleRemoveRow = (rowId) => {
    setRows((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((row) => row.id !== rowId);
    });
  };

  const handleSave = () => {
    const validRows = rows.filter(
      (row) =>
        row.name.trim() !== "" &&
        row.email.trim() !== "" &&
        row.githubUrl.trim() !== ""
    );

    onSave(validRows);
    onClose();
  };

  const handleCSVUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedRows = results.data
          .map((row) => ({
            ...createEmptyApplicant(),
            name: row.name?.trim() ?? "",
            email: row.email?.trim() ?? "",
            githubUrl: row.githubUrl?.trim() ?? "",
          }))
          .filter(
            (row) => row.name !== "" || row.email !== "" || row.githubUrl !== ""
          );

        setRows(parsedRows.length > 0 ? parsedRows : [createEmptyApplicant()]);
      },
    });

    event.target.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              지원자 추가
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              이름, 이메일, GitHub 주소를 여러 명 한 번에 추가할 수 있습니다.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            닫기
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <button
              onClick={handleAddRow}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              + 행 추가
            </button>

            <label className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              CSV 업로드
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleCSVUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[1fr_1.2fr_1.4fr_100px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <div>이름</div>
                <div>이메일</div>
                <div>GitHub URL</div>
                <div>동작</div>
              </div>

              <div>
                {rows.map((row, index) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-[1fr_1.2fr_1.4fr_100px] gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0"
                  >
                    <input
                      value={row.name}
                      onChange={(e) =>
                        handleChangeRow(row.id, "name", e.target.value)
                      }
                      placeholder="김개발"
                      className="min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />

                    <input
                      value={row.email}
                      onChange={(e) =>
                        handleChangeRow(row.id, "email", e.target.value)
                      }
                      placeholder="dev@email.com"
                      className="min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />

                    <input
                      value={row.githubUrl}
                      onChange={(e) =>
                        handleChangeRow(row.id, "githubUrl", e.target.value)
                      }
                      placeholder="https://github.com/username"
                      className="min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />

                    <button
                      onClick={() => handleRemoveRow(row.id)}
                      disabled={rows.length === 1 && index === 0}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 px-6 py-5">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            취소
          </button>

          <button
            onClick={handleSave}
            className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            지원자 저장
          </button>
        </div>
      </div>
    </div>
  );
}
