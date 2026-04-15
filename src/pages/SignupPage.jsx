import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUp } from '../services/auth/auth-api.js';

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function getEmailValidationMessage(email) {
  const normalizedEmail = normalizeEmail(email);

  if (normalizedEmail.length === 0) {
    return '이메일을 입력해 주세요.';
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(normalizedEmail)) {
    return '올바른 이메일 주소를 입력해 주세요.';
  }

  return null;
}

function getPasswordConfirmationMessage(password, confirmPassword) {
  if (confirmPassword.length === 0) {
    return null;
  }

  if (password !== confirmPassword) {
    return '비밀번호가 일치하지 않습니다.';
  }

  return '비밀번호가 일치합니다.';
}

function getFormValidationMessage(input, confirmPassword) {
  if (input.name.trim().length === 0) {
    return '이름을 입력해 주세요.';
  }

  const emailValidationMessage = getEmailValidationMessage(input.email);

  if (emailValidationMessage !== null) {
    return emailValidationMessage;
  }

  if (input.password.length === 0) {
    return '비밀번호를 입력해 주세요.';
  }

  if (confirmPassword.length === 0) {
    return '비밀번호 확인을 입력해 주세요.';
  }

  if (input.password !== confirmPassword) {
    return '비밀번호가 일치하지 않습니다.';
  }

  return null;
}

function getApiErrorCode(error) {
  if (!axios.isAxiosError(error)) {
    return null;
  }

  return error.response?.data?.error?.code ?? null;
}

function getSignUpErrorMessage(error) {
  const errorCode = getApiErrorCode(error);

  if (errorCode === 'USER_EMAIL_CONFLICT') {
    return '이미 사용 중인 이메일입니다.';
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

  return '회원가입에 실패했습니다. 다시 시도해 주세요.';
}

export function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitErrorMessage, setSubmitErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordConfirmationMessage = getPasswordConfirmationMessage(password, confirmPassword);
  const isPasswordConfirmed = password.length > 0 && password === confirmPassword;

  async function handleSubmit(event) {
    event.preventDefault();

    const normalizedInput = {
      name: name.trim(),
      email: normalizeEmail(email),
      password,
    };

    const validationMessage = getFormValidationMessage(normalizedInput, confirmPassword);

    if (validationMessage !== null) {
      setSubmitErrorMessage(validationMessage);
      return;
    }

    setSubmitErrorMessage('');
    setIsSubmitting(true);

    try {
      await signUp(normalizedInput);

      navigate('/login', {
        replace: true,
        state: {
          email: normalizedInput.email,
          signupSuccessMessage: '회원가입이 완료되었습니다. 로그인해 주세요.',
        },
      });
    } catch (error) {
      setSubmitErrorMessage(getSignUpErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleNameChange(event) {
    setName(event.target.value);
    setSubmitErrorMessage('');
  }

  function handleEmailChange(event) {
    setEmail(event.target.value);
    setSubmitErrorMessage('');
  }

  function handlePasswordChange(event) {
    setPassword(event.target.value);
    setSubmitErrorMessage('');
  }

  function handleConfirmPasswordChange(event) {
    setConfirmPassword(event.target.value);
    setSubmitErrorMessage('');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
          <img src="/logo.png" alt="Code-Ray" className="mx-auto h-14 w-auto" />
          <p className="mt-2 text-sm text-gray-500">새 계정을 만들어 보세요</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="이름"
            className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400"
            value={name}
            onChange={handleNameChange}
          />

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

          <input
            type="password"
            placeholder="비밀번호 확인"
            className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
          />

          {passwordConfirmationMessage !== null ? (
            <p className={`text-xs ${isPasswordConfirmed ? 'text-emerald-600' : 'text-red-500'}`}>
              {passwordConfirmationMessage}
            </p>
          ) : null}

          {submitErrorMessage.length > 0 ? (
            <p className="text-xs text-red-500">{submitErrorMessage}</p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full rounded-lg bg-blue-500 py-2 font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <span onClick={() => navigate('/login')} className="cursor-pointer text-blue-500">
            로그인
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
