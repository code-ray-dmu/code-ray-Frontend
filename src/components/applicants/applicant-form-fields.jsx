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
        <label className="mb-2 block text-sm font-medium text-slate-700">Applicant Name</label>
        <input
          type="text"
          value={formValues.name}
          onChange={onNameChange}
          disabled={isDisabled}
          placeholder="e.g. Kim Developer"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
        {fieldErrors.name.length > 0 ? (
          <p className="mt-2 text-sm text-red-600">{fieldErrors.name}</p>
        ) : null}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
        <input
          type="email"
          value={formValues.email}
          onChange={onEmailChange}
          disabled={isDisabled}
          placeholder="e.g. developer@example.com"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
        {fieldErrors.email.length > 0 ? (
          <p className="mt-2 text-sm text-red-600">{fieldErrors.email}</p>
        ) : null}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">GitHub Profile URL</label>
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
          Only GitHub profile URLs are allowed. Repository URLs are rejected.
        </p>
        {fieldErrors.githubUrl.length > 0 ? (
          <p className="mt-2 text-sm text-red-600">{fieldErrors.githubUrl}</p>
        ) : null}
      </div>
    </div>
  );
}
