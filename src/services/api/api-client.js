import axios, { AxiosHeaders } from 'axios';
import {
  clearAuthSession,
  getAuthSessionRevision,
  getStoredAccessToken,
  getStoredRefreshToken,
  updateStoredAccessToken,
} from '../auth/auth-session.js';
import { TERMINAL_REFRESH_ERROR_CODES } from '../auth/auth-types.js';

const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;
const REFRESH_TOKEN_PATH = '/v1/users/refresh-token';
const MISSING_API_BASE_URL_ERROR_MESSAGE =
  'VITE_API_BASE_URL is not configured. Add it to your local environment before using auth APIs.';

export function getApiBaseUrl() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (apiBaseUrl === undefined || apiBaseUrl.length === 0) {
    throw new Error(MISSING_API_BASE_URL_ERROR_MESSAGE);
  }

  return apiBaseUrl;
}

function createBaseApiConfig() {
  return {
    baseURL: getApiBaseUrl(),
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: DEFAULT_REQUEST_TIMEOUT_MS,
  };
}

function setAuthorizationHeader(headers, accessToken) {
  const nextHeaders = AxiosHeaders.from(headers);

  nextHeaders.set('Authorization', `Bearer ${accessToken}`);

  return nextHeaders;
}

function shouldClearSessionAfterRefreshFailure(error) {
  const errorCode = error?.response?.data?.error?.code;

  return errorCode !== undefined && TERMINAL_REFRESH_ERROR_CODES.includes(errorCode);
}

async function refreshAccessToken() {
  const authSessionRevision = getAuthSessionRevision();
  const refreshToken = getStoredRefreshToken();

  if (refreshToken === null) {
    clearAuthSession();
    throw new Error('Refresh token is not available.');
  }

  try {
    const response = await getAuthApiClient().post(REFRESH_TOKEN_PATH, {
      refreshToken,
    });

    if (authSessionRevision !== getAuthSessionRevision()) {
      throw new Error('Auth session changed while refreshing the access token.');
    }

    updateStoredAccessToken(response.data.data.access_token);

    return response.data.data.access_token;
  } catch (error) {
    if (shouldClearSessionAfterRefreshFailure(error)) {
      clearAuthSession();
    }

    throw error;
  }
}

let refreshAccessTokenState = null;
let authApiClientInstance = null;
let apiClientInstance = null;

function configureApiClientInterceptors(client) {
  client.interceptors.request.use((config) => {
    const accessToken = getStoredAccessToken();

    if (accessToken === null) {
      return config;
    }

    return {
      ...config,
      headers: setAuthorizationHeader(config.headers, accessToken),
    };
  });

  client.interceptors.response.use(undefined, async (error) => {
    const responseStatus = error.response?.status;
    const originalRequest = error.config;

    if (
      responseStatus !== 401 ||
      originalRequest === undefined ||
      originalRequest._retry === true ||
      originalRequest.url === undefined ||
      originalRequest.url.includes(REFRESH_TOKEN_PATH)
    ) {
      throw error;
    }

    const authSessionRevision = getAuthSessionRevision();

    if (
      refreshAccessTokenState === null ||
      refreshAccessTokenState.revision !== authSessionRevision
    ) {
      const nextRefreshState = {
        revision: authSessionRevision,
        promise: refreshAccessToken().finally(() => {
          if (refreshAccessTokenState === nextRefreshState) {
            refreshAccessTokenState = null;
          }
        }),
      };

      refreshAccessTokenState = nextRefreshState;
    }

    const nextAccessToken = await refreshAccessTokenState.promise;

    originalRequest._retry = true;
    originalRequest.headers = setAuthorizationHeader(originalRequest.headers, nextAccessToken);

    return await client.request(originalRequest);
  });
}

export function getAuthApiClient() {
  if (authApiClientInstance === null) {
    authApiClientInstance = axios.create(createBaseApiConfig());
  }

  return authApiClientInstance;
}

export function getApiClient() {
  if (apiClientInstance === null) {
    apiClientInstance = axios.create(createBaseApiConfig());
    configureApiClientInterceptors(apiClientInstance);
  }

  return apiClientInstance;
}
