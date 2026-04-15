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
    nextErrors.name = '지원자 이름을 입력해 주세요.';
  }

  if (formValues.email.trim().length === 0) {
    nextErrors.email = '지원자 이메일을 입력해 주세요.';
  } else if (!isValidEmail(formValues.email.trim())) {
    nextErrors.email = '올바른 이메일 주소를 입력해 주세요.';
  }

  if (formValues.githubUrl.trim().length === 0) {
    nextErrors.githubUrl = 'GitHub 프로필 주소를 입력해 주세요.';
  } else if (normalizedGitHubUrl === null) {
    nextErrors.githubUrl =
      'https://github.com/username 형식의 GitHub 프로필 주소를 입력해 주세요. 저장소 URL은 사용할 수 없습니다.';
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
    return '지원자 정보를 다시 확인한 뒤 시도해 주세요.';
  }

  if (errorCode === 'GROUP_NOT_FOUND') {
    return '이 그룹을 찾을 수 없습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.';
  }

  if (errorCode === 'UNAUTHORIZED' || errorCode === 'AUTH_TOKEN_EXPIRED') {
    return '세션이 만료되었습니다. 다시 로그인한 뒤 시도해 주세요.';
  }

  if (error?.response === undefined) {
    return '서버에 연결할 수 없습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.';
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return '지원자 생성에 실패했습니다. 다시 시도해 주세요.';
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
      setSubmitErrorMessage('지원자를 추가하려면 올바른 그룹 정보가 필요합니다.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">지원자 추가</h2>
            <p className="mt-1 text-sm text-slate-500">
              {group?.name ?? '선택한 그룹'}에 지원자 한 명을 등록합니다.
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
                대상 그룹
              </p>
              <p className="mt-2 font-medium text-slate-900">{group?.name ?? '알 수 없는 그룹'}</p>
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

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-slate-200 px-5 py-2.5 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 sm:w-auto"
            >
              취소
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-blue-500 px-5 py-2.5 font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
            >
              {isSubmitting ? '지원자 생성 중...' : '지원자 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
