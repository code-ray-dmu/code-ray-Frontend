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
    return 'Please enter your email.';
  }

  if (input.password.length === 0) {
    return 'Please enter your password.';
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
    return 'Invalid email or password.';
  }

  if (errorCode === 'VALIDATION_ERROR') {
    return 'Please review your input and try again.';
  }

  if (axios.isAxiosError(error) && error.response === undefined) {
    return 'Unable to reach the server. Please check your connection and try again.';
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return 'Sign in failed. Please try again.';
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
          <p className="mt-2 text-sm text-gray-500">Welcome back</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400"
            value={email}
            onChange={handleEmailChange}
          />

          <input
            type="password"
            placeholder="Password"
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
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <span onClick={() => navigate('/signup')} className="cursor-pointer text-blue-500">
            Sign up
          </span>
        </div>

        <div className="mt-2 text-center text-xs text-gray-400">
          <span onClick={() => navigate('/')} className="cursor-pointer hover:underline">
            Back to Home
          </span>
        </div>
      </div>
    </div>
  );
}
