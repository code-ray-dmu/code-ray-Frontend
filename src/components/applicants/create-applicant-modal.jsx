import { useState } from 'react';
import { getApiErrorCode } from '../../services/api/api-types.js';
import {
  createApplicant,
  normalizeGitHubProfileUrl,
} from '../../services/applicants/applicant-api.js';
import { ApplicantFormFields } from './applicant-form-fields.jsx';

function createEmptyFieldErrors() {
  return {
    name: '',
    email: '',
    githubUrl: '',
  };
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateApplicantInput(formValues) {
  const nextErrors = createEmptyFieldErrors();
  const normalizedGitHubUrl = normalizeGitHubProfileUrl(formValues.githubUrl);

  if (formValues.name.trim().length === 0) {
    nextErrors.name = 'Please enter the applicant name.';
  }

  if (formValues.email.trim().length === 0) {
    nextErrors.email = 'Please enter the applicant email.';
  } else if (!isValidEmail(formValues.email.trim())) {
    nextErrors.email = 'Please enter a valid email address.';
  }

  if (formValues.githubUrl.trim().length === 0) {
    nextErrors.githubUrl = 'Please enter the GitHub profile URL.';
  } else if (normalizedGitHubUrl === null) {
    nextErrors.githubUrl =
      'Enter a GitHub profile URL like https://github.com/username. Repository URLs are not allowed.';
  }

  return {
    fieldErrors: nextErrors,
    normalizedGitHubUrl,
    hasError: Object.values(nextErrors).some((value) => value.length > 0),
  };
}

function getCreateApplicantErrorMessage(error) {
  const errorCode = getApiErrorCode(error);

  if (errorCode === 'VALIDATION_ERROR') {
    return 'Please review the applicant details and try again.';
  }

  if (errorCode === 'GROUP_NOT_FOUND') {
    return 'This group no longer exists. Refresh the page and try again.';
  }

  if (errorCode === 'UNAUTHORIZED' || errorCode === 'AUTH_TOKEN_EXPIRED') {
    return 'Your session is no longer valid. Please sign in again and retry.';
  }

  if (error?.response === undefined) {
    return 'Unable to reach the server. Please check your connection and try again.';
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return 'Applicant creation failed. Please try again.';
}

export function CreateApplicantModal({ group, isOpen, onClose, onCreated }) {
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    githubUrl: '',
  });
  const [fieldErrors, setFieldErrors] = useState(createEmptyFieldErrors());
  const [submitErrorMessage, setSubmitErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setFormValues({
      name: '',
      email: '',
      githubUrl: '',
    });
    setFieldErrors(createEmptyFieldErrors());
    setSubmitErrorMessage('');
    setIsSubmitting(false);
  }

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    resetForm();
    onClose();
  }

  function updateFieldError(fieldName, message = '') {
    setFieldErrors((previousErrors) => ({
      ...previousErrors,
      [fieldName]: message,
    }));
  }

  function handleNameChange(event) {
    const nextValue = event.target.value;

    setFormValues((previousValues) => ({
      ...previousValues,
      name: nextValue,
    }));
    updateFieldError('name');
    setSubmitErrorMessage('');
  }

  function handleEmailChange(event) {
    const nextValue = event.target.value;

    setFormValues((previousValues) => ({
      ...previousValues,
      email: nextValue,
    }));
    updateFieldError('email');
    setSubmitErrorMessage('');
  }

  function handleGitHubUrlChange(event) {
    const nextValue = event.target.value;

    setFormValues((previousValues) => ({
      ...previousValues,
      githubUrl: nextValue,
    }));
    updateFieldError('githubUrl');
    setSubmitErrorMessage('');
  }

  function handleGitHubUrlBlur() {
    const normalizedGitHubUrl = normalizeGitHubProfileUrl(formValues.githubUrl);

    if (normalizedGitHubUrl !== null && normalizedGitHubUrl !== formValues.githubUrl) {
      setFormValues((previousValues) => ({
        ...previousValues,
        githubUrl: normalizedGitHubUrl,
      }));
      updateFieldError('githubUrl');
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (typeof group?.id !== 'string' || group.id.length === 0) {
      setSubmitErrorMessage('A valid group context is required to create an applicant.');
      return;
    }

    const validationResult = validateApplicantInput(formValues);

    if (validationResult.hasError || validationResult.normalizedGitHubUrl === null) {
      setSubmitErrorMessage('');
      setFieldErrors(validationResult.fieldErrors);
      return;
    }

    const normalizedInput = {
      groupId: group.id,
      name: formValues.name.trim(),
      email: formValues.email.trim(),
      githubUrl: validationResult.normalizedGitHubUrl,
    };

    setFieldErrors(createEmptyFieldErrors());
    setSubmitErrorMessage('');
    setIsSubmitting(true);

    try {
      await createApplicant(normalizedInput);

      resetForm();
      onClose();
      onCreated({
        applicantName: normalizedInput.name,
      });
    } catch (error) {
      setSubmitErrorMessage(getCreateApplicantErrorMessage(error));
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Add Applicant</h2>
            <p className="mt-1 text-sm text-slate-500">
              Register one applicant inside {group?.name ?? 'the selected group'}.
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

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Target Group
              </p>
              <p className="mt-2 font-medium text-slate-900">{group?.name ?? 'Unknown Group'}</p>
              <p className="mt-1 break-all text-slate-500">{group?.id ?? '-'}</p>
            </div>

            <ApplicantFormFields
              formValues={formValues}
              fieldErrors={fieldErrors}
              isDisabled={isSubmitting}
              onNameChange={handleNameChange}
              onEmailChange={handleEmailChange}
              onGitHubUrlChange={handleGitHubUrlChange}
              onGitHubUrlBlur={handleGitHubUrlBlur}
            />

            {submitErrorMessage.length > 0 ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitErrorMessage}
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-blue-500 px-5 py-2.5 font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? 'Creating Applicant...' : 'Create Applicant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
