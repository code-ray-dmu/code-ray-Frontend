import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { refreshAccessToken } from '../../services/auth/auth-api.js';
import {
  clearAuthSession,
  getAuthSessionSnapshot,
  getStoredRefreshToken,
  updateStoredAccessToken,
} from '../../services/auth/auth-session.js';

const TERMINAL_REFRESH_ERROR_CODES = [
  'AUTH_TOKEN_EXPIRED',
  'AUTH_TOKEN_INVALID',
  'AUTH_REFRESH_TOKEN_REVOKED',
];

function getAuthStateLabel(token) {
  return token === null ? 'Missing' : 'Stored';
}

function maskToken(token) {
  if (token === null || token.length === 0) {
    return '-';
  }

  if (token.length <= 10) {
    return token;
  }

  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

function getApiErrorCode(error) {
  if (!axios.isAxiosError(error)) {
    return null;
  }

  return error.response?.data?.error?.code ?? null;
}

function getRefreshErrorMessage(error) {
  const errorCode = getApiErrorCode(error);

  if (errorCode !== null && TERMINAL_REFRESH_ERROR_CODES.includes(errorCode)) {
    return 'Refresh token is no longer valid. The local session has been cleared.';
  }

  if (axios.isAxiosError(error) && error.response === undefined) {
    return 'Unable to reach the server for refresh. Please try again.';
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return 'Refresh failed. Please try again.';
}

function hasTerminalRefreshError(error) {
  const errorCode = getApiErrorCode(error);

  return errorCode !== null && TERMINAL_REFRESH_ERROR_CODES.includes(errorCode);
}

export function AuthDebugPanel() {
  const navigate = useNavigate();
  const [sessionSnapshot, setSessionSnapshot] = useState(() => getAuthSessionSnapshot());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Ready');

  function syncSessionSnapshot() {
    setSessionSnapshot(getAuthSessionSnapshot());
  }

  async function handleManualRefresh() {
    const refreshToken = getStoredRefreshToken();

    if (refreshToken === null) {
      setStatusMessage('Refresh token is not stored.');
      syncSessionSnapshot();
      return;
    }

    setIsRefreshing(true);
    setStatusMessage('Refreshing access token...');

    try {
      const response = await refreshAccessToken({ refreshToken });

      updateStoredAccessToken(response.access_token);
      syncSessionSnapshot();
      setStatusMessage('Access token refreshed successfully.');
    } catch (error) {
      if (hasTerminalRefreshError(error)) {
        clearAuthSession();
        syncSessionSnapshot();
      }

      setStatusMessage(getRefreshErrorMessage(error));
    } finally {
      setIsRefreshing(false);
    }
  }

  function handleSignOut() {
    setIsSigningOut(true);
    clearAuthSession();
    syncSessionSnapshot();
    setStatusMessage('Signed out and cleared local tokens.');
    navigate('/login', { replace: true });
    setIsSigningOut(false);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Auth Debug</h3>
          <p className="mt-1 text-sm text-slate-500">Check local auth state and test refresh.</p>
        </div>
        <button
          type="button"
          onClick={syncSessionSnapshot}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          Refresh View
        </button>
      </div>

      <div className="space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">Access token</span>
          <span className="font-medium text-slate-900">
            {getAuthStateLabel(sessionSnapshot.accessToken)}
          </span>
        </div>

        <div className="rounded-lg bg-white px-3 py-2 font-mono text-xs text-slate-500">
          {maskToken(sessionSnapshot.accessToken)}
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">Refresh token</span>
          <span className="font-medium text-slate-900">
            {getAuthStateLabel(sessionSnapshot.refreshToken)}
          </span>
        </div>

        <div className="rounded-lg bg-white px-3 py-2 font-mono text-xs text-slate-500">
          {maskToken(sessionSnapshot.refreshToken)}
        </div>

        <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
          {statusMessage}
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={isRefreshing || isSigningOut}
          className="flex-1 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Token'}
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isRefreshing || isSigningOut}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
        >
          {isSigningOut ? 'Signing Out...' : 'Sign Out'}
        </button>
      </div>
    </div>
  );
}
