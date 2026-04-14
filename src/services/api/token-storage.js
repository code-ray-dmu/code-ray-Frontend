const ACCESS_TOKEN_STORAGE_KEY = 'access_token';
const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token';

function getStorage() {
  return window.localStorage;
}

export function setAccessToken(accessToken) {
  getStorage().setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
}

export function getAccessToken() {
  return getStorage().getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function removeAccessToken() {
  getStorage().removeItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function setRefreshToken(refreshToken) {
  getStorage().setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
}

export function getRefreshToken() {
  return getStorage().getItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function removeRefreshToken() {
  getStorage().removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function clearStoredTokens() {
  removeAccessToken();
  removeRefreshToken();
}

export function getTokenStorageKeys() {
  return {
    accessTokenKey: ACCESS_TOKEN_STORAGE_KEY,
    refreshTokenKey: REFRESH_TOKEN_STORAGE_KEY,
  };
}
