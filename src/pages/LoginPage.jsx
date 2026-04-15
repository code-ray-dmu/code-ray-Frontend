import axios from 'axios';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { signIn } from '../services/auth/auth-api.js';
import { saveAuthTokens } from '../services/auth/auth-session.js';

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function getLoginValidationMessage(input) {
  if (input.email.length === 0) {
    return '이메일을 입력해 주세요.';
  }

  if (input.password.length === 0) {
    return '비밀번호를 입력해 주세요.';
  }

  return null;
}

function getApiErrorCode(error) {
  if (!axios.isAxiosError(error)) {
    return null;
  }

  return error.response?.data?.error?.code ?? null;
}

function getSignInErrorMessage(error) {
  const errorCode = getApiErrorCode(error);

  if (errorCode === 'AUTH_INVALID_CREDENTIALS') {
    return '이메일 또는 비밀번호가 올바르지 않습니다.';
  }

  if (errorCode === 'VALIDATION_ERROR') {
    return '입력한 내용을 다시 확인해 주세요.';
  }

  if (axios.isAxiosError(error) && error.response === undefined) {
    return '서버에 연결할 수 없습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.';
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return '로그인에 실패했습니다. 다시 시도해 주세요.';
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state ?? null;

  const [email, setEmail] = useState(locationState?.email ?? '');
  const [password, setPassword] = useState('');
  const [submitErrorMessage, setSubmitErrorMessage] = useState('');
  const [signupSuccessMessage, setSignupSuccessMessage] = useState(
    locationState?.signupSuccessMessage ?? '',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const normalizedInput = {
      email: normalizeEmail(email),
      password,
    };

    const validationMessage = getLoginValidationMessage(normalizedInput);

    if (validationMessage !== null) {
      setSubmitErrorMessage(validationMessage);
      return;
    }

    setSubmitErrorMessage('');
    setSignupSuccessMessage('');
    setIsSubmitting(true);

    try {
      const response = await signIn(normalizedInput);

      saveAuthTokens({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
      });

      navigate('/dashboard', { replace: true });
    } catch (error) {
      setSubmitErrorMessage(getSignInErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEmailChange(event) {
    setEmail(event.target.value);
    setSubmitErrorMessage('');
  }

  function handlePasswordChange(event) {
    setPassword(event.target.value);
    setSubmitErrorMessage('');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
          <img src="/logo.png" alt="Code-Ray" className="mx-auto h-14 w-auto" />
          <p className="mt-2 text-sm text-gray-500">다시 오신 것을 환영합니다</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="이메일"
            className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400"
            value={email}
            onChange={handleEmailChange}
          />

          <input
            type="password"
            placeholder="비밀번호"
            className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400"
            value={password}
            onChange={handlePasswordChange}
          />

          {signupSuccessMessage.length > 0 ? (
            <p className="text-xs text-emerald-600">{signupSuccessMessage}</p>
          ) : null}

          {submitErrorMessage.length > 0 ? (
            <p className="text-xs text-red-500">{submitErrorMessage}</p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full rounded-lg bg-blue-500 py-2 font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          아직 계정이 없으신가요?{' '}
          <span onClick={() => navigate('/signup')} className="cursor-pointer text-blue-500">
            회원가입
          </span>
        </div>

        <div className="mt-2 text-center text-xs text-gray-400">
          <span onClick={() => navigate('/')} className="cursor-pointer hover:underline">
            홈으로 돌아가기
          </span>
        </div>
      </div>
    </div>
  );
}
