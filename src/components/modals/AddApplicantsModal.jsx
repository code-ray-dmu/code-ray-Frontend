import { useEffect, useState } from "react";
import Papa from "papaparse";
import { createEmptyApplicant } from "../../utils/workspaceData";

export default function AddApplicantsModal({
  isOpen,
  onClose,
  onSave,
}) {
  const [rows, setRows] = useState([createEmptyApplicant()]);

  useEffect(() => {
    if (isOpen) {
      setRows([createEmptyApplicant()]);
    }
  }, [isOpen]);

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
      <div className="w-full max-w-5xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Add Applicants
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              이름, 이메일, GitHub 주소를 여러 명 한 번에 추가할 수 있습니다.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <button
              onClick={handleAddRow}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              + Add Row
            </button>

            <label className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              CSV Upload
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleCSVUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-[1fr_1.2fr_1.4fr_100px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <div>Name</div>
              <div>Email</div>
              <div>GitHub URL</div>
              <div>Action</div>
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
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                  />

                  <input
                    value={row.email}
                    onChange={(e) =>
                      handleChangeRow(row.id, "email", e.target.value)
                    }
                    placeholder="dev@email.com"
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                  />

                  <input
                    value={row.githubUrl}
                    onChange={(e) =>
                      handleChangeRow(row.id, "githubUrl", e.target.value)
                    }
                    placeholder="github.com/username/repo"
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                  />

                  <button
                    onClick={() => handleRemoveRow(row.id)}
                    disabled={rows.length === 1 && index === 0}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-5">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            Save Applicants
          </button>
        </div>
      </div>
    </div>
  );
}
