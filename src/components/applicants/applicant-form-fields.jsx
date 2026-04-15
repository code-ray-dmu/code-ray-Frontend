export function ApplicantFormFields({
  formValues,
  fieldErrors,
  isDisabled,
  onNameChange,
  onEmailChange,
  onGitHubUrlChange,
  onGitHubUrlBlur,
}) {
  return (
    <div className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">지원자 이름</label>
        <input
          type="text"
          value={formValues.name}
          onChange={onNameChange}
          disabled={isDisabled}
          placeholder="예: 김개발"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
        {fieldErrors.name.length > 0 ? (
          <p className="mt-2 text-sm text-red-600">{fieldErrors.name}</p>
        ) : null}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">이메일</label>
        <input
          type="email"
          value={formValues.email}
          onChange={onEmailChange}
          disabled={isDisabled}
          placeholder="예: developer@example.com"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
        {fieldErrors.email.length > 0 ? (
          <p className="mt-2 text-sm text-red-600">{fieldErrors.email}</p>
        ) : null}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">GitHub 프로필 URL</label>
        <input
          type="url"
          value={formValues.githubUrl}
          onChange={onGitHubUrlChange}
          onBlur={onGitHubUrlBlur}
          disabled={isDisabled}
          placeholder="https://github.com/username"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
        <p className="mt-2 text-sm text-slate-500">
          GitHub 프로필 주소만 입력할 수 있습니다. 저장소 URL은 허용되지 않습니다.
        </p>
        {fieldErrors.githubUrl.length > 0 ? (
          <p className="mt-2 text-sm text-red-600">{fieldErrors.githubUrl}</p>
        ) : null}
      </div>
    </div>
  );
}
