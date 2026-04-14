import {
  clearStoredTokens,
  getAccessToken,
  getRefreshToken,
  getTokenStorageKeys,
  setAccessToken,
  setRefreshToken,
} from '../api/token-storage.js';

let authSessionRevision = 0;

function bumpAuthSessionRevision() {
  authSessionRevision += 1;

  return authSessionRevision;
}

export function saveAuthTokens(tokens) {
  setAccessToken(tokens.accessToken);
  setRefreshToken(tokens.refreshToken);
  bumpAuthSessionRevision();
}

export function updateStoredAccessToken(accessToken) {
  setAccessToken(accessToken);
  bumpAuthSessionRevision();
}

export function clearAuthSession() {
  clearStoredTokens();
  bumpAuthSessionRevision();
}

export function getStoredAccessToken() {
  return getAccessToken();
}

export function getStoredRefreshToken() {
  return getRefreshToken();
}

export function getAuthSessionSnapshot() {
  return {
    accessToken: getStoredAccessToken(),
    refreshToken: getStoredRefreshToken(),
  };
}

export function hasStoredAuthSession() {
  const { accessToken, refreshToken } = getAuthSessionSnapshot();

  return accessToken !== null && refreshToken !== null;
}

export function getAuthStorageKeys() {
  return getTokenStorageKeys();
}

export function getAuthSessionRevision() {
  return authSessionRevision;
}
