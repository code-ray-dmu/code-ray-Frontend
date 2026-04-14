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
    return 'Please enter your email.';
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(normalizedEmail)) {
    return 'Please enter a valid email address.';
  }

  return null;
}

function getPasswordConfirmationMessage(password, confirmPassword) {
  if (confirmPassword.length === 0) {
    return null;
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match.';
  }

  return 'Passwords match.';
}

function getFormValidationMessage(input, confirmPassword) {
  if (input.name.trim().length === 0) {
    return 'Please enter your name.';
  }

  const emailValidationMessage = getEmailValidationMessage(input.email);

  if (emailValidationMessage !== null) {
    return emailValidationMessage;
  }

  if (input.password.length === 0) {
    return 'Please enter your password.';
  }

  if (confirmPassword.length === 0) {
    return 'Please confirm your password.';
  }

  if (input.password !== confirmPassword) {
    return 'Passwords do not match.';
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
    return 'This email is already in use.';
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

  return 'Sign up failed. Please try again.';
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
          signupSuccessMessage: 'Your account has been created. Please sign in.',
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
          <p className="mt-2 text-sm text-gray-500">Create your account</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name"
            className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400"
            value={name}
            onChange={handleNameChange}
          />

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

          <input
            type="password"
            placeholder="Confirm Password"
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
            {isSubmitting ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <span onClick={() => navigate('/login')} className="cursor-pointer text-blue-500">
            Sign in
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
