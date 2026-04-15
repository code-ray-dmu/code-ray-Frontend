import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CREATE_ROOM_EVENT } from "../../utils/createRoomModal";
import { getApiErrorCode } from "../../services/api/api-types.js";
import { createGroup } from "../../services/groups/group-api.js";
import { GROUP_CULTURE_FIT_PRIORITY_VALUES } from "../../services/groups/group-types.js";

function getCultureFitPriorityLabel(option) {
  if (option === "HIGH") {
    return "높음";
  }

  if (option === "MEDIUM") {
    return "보통";
  }

  if (option === "LOW") {
    return "낮음";
  }

  return option;
}

function getCreateGroupValidationMessage(input) {
  if (input.name.length === 0) {
    return "그룹 이름을 입력해 주세요.";
  }

  if (input.techStacks.framework.length === 0) {
    return "이 그룹에서 사용하는 프레임워크를 입력해 주세요.";
  }

  if (input.techStacks.db.length === 0) {
    return "이 그룹에서 사용하는 데이터베이스를 입력해 주세요.";
  }

  if (!GROUP_CULTURE_FIT_PRIORITY_VALUES.includes(input.cultureFitPriority)) {
    return "컬처 핏 우선순위를 선택해 주세요.";
  }

  return null;
}

function getCreateGroupErrorMessage(error) {
  const errorCode = getApiErrorCode(error);

  if (errorCode === "VALIDATION_ERROR") {
    return "그룹 정보를 다시 확인한 뒤 시도해 주세요.";
  }

  if (errorCode === "UNAUTHORIZED" || errorCode === "AUTH_TOKEN_EXPIRED") {
    return "세션이 만료되었습니다. 다시 로그인한 뒤 시도해 주세요.";
  }

  if (error?.response === undefined) {
    return "서버에 연결할 수 없습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.";
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return "그룹 생성에 실패했습니다. 다시 시도해 주세요.";
}

export default function CreateRoomModal() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [framework, setFramework] = useState("");
  const [database, setDatabase] = useState("");
  const [cultureFitPriority, setCultureFitPriority] = useState("");
  const [submitErrorMessage, setSubmitErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener(CREATE_ROOM_EVENT, handleOpen);

    return () => {
      window.removeEventListener(CREATE_ROOM_EVENT, handleOpen);
    };
  }, []);

  function resetForm() {
    setGroupName("");
    setDescription("");
    setFramework("");
    setDatabase("");
    setCultureFitPriority("");
    setSubmitErrorMessage("");
    setIsSubmitting(false);
  }

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    setIsOpen(false);
    resetForm();
  };

  async function handleCreateGroup() {
    const normalizedInput = {
      name: groupName.trim(),
      description: description.trim().length > 0 ? description.trim() : null,
      techStacks: {
        framework: framework.trim(),
        db: database.trim(),
      },
      cultureFitPriority,
    };

    const validationMessage = getCreateGroupValidationMessage(normalizedInput);

    if (validationMessage !== null) {
      setSubmitErrorMessage(validationMessage);
      return;
    }

    setSubmitErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await createGroup(normalizedInput);
      const backDestination =
        location.pathname === "/dashboard"
          ? `${location.pathname}${location.search}`
          : typeof location.state?.from === "string"
            ? location.state.from
            : "/dashboard";

      setIsOpen(false);
      resetForm();
      navigate(backDestination, {
        replace: true,
        state: {
          createdGroupName: response.group.name,
          refreshGroupsAt: Date.now(),
        },
      });
    } catch (error) {
      setSubmitErrorMessage(getCreateGroupErrorMessage(error));
      setIsSubmitting(false);
    }
  }

  function handleGroupNameChange(event) {
    setGroupName(event.target.value);
    setSubmitErrorMessage("");
  }

  function handleDescriptionChange(event) {
    setDescription(event.target.value);
    setSubmitErrorMessage("");
  }

  function handleFrameworkChange(event) {
    setFramework(event.target.value);
    setSubmitErrorMessage("");
  }

  function handleDatabaseChange(event) {
    setDatabase(event.target.value);
    setSubmitErrorMessage("");
  }

  function handleCultureFitPriorityChange(event) {
    setCultureFitPriority(event.target.value);
    setSubmitErrorMessage("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    void handleCreateGroup();
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              그룹 만들기
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              새 면접 그룹을 추가하고 필요한 팀 정보를 입력해 주세요.
            </p>
          </div>

          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-2xl leading-none text-slate-400 hover:text-slate-600 disabled:cursor-not-allowed disabled:text-slate-300"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                그룹 이름
              </label>
              <input
                type="text"
                value={groupName}
                onChange={handleGroupNameChange}
                placeholder="예: 백엔드 팀 면접"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                설명
              </label>
              <textarea
                value={description}
                onChange={handleDescriptionChange}
                placeholder="e.g. msa 기반 팀"
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  프레임워크
                </label>
                <input
                  type="text"
                  value={framework}
                  onChange={handleFrameworkChange}
                  placeholder="e.g. Spring"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  데이터베이스
                </label>
                <input
                  type="text"
                  value={database}
                  onChange={handleDatabaseChange}
                  placeholder="e.g. PostgreSQL"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                컬처 핏 우선순위
              </label>
              <select
                value={cultureFitPriority}
                onChange={handleCultureFitPriorityChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400"
              >
                <option value="">우선순위를 선택해 주세요</option>
                {GROUP_CULTURE_FIT_PRIORITY_VALUES.map((option) => (
                  <option key={option} value={option}>
                    {getCultureFitPriorityLabel(option)}
                  </option>
                ))}
              </select>
            </div>

            {submitErrorMessage.length > 0 ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitErrorMessage}
              </div>
            ) : null}
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-white px-6 py-5">
            <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              취소
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-blue-500 px-5 py-2.5 font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? "그룹 생성 중..." : "그룹 생성"}
            </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
