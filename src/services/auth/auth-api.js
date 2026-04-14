import { getAuthApiClient } from '../api/api-client.js';
import {
  refreshMockAuthToken,
  signInWithMockAuth,
  signUpWithMockAuth,
  USE_API_MOCK,
} from '../mock/mock-api-store.js';

const AUTH_API_PREFIX = '/v1/users';

export async function signUp(input) {
  if (USE_API_MOCK) {
    return signUpWithMockAuth(input);
  }

  const response = await getAuthApiClient().post(`${AUTH_API_PREFIX}/sign-up`, input);

  return response.data.data;
}

export async function signIn(input) {
  if (USE_API_MOCK) {
    return signInWithMockAuth(input);
  }

  const response = await getAuthApiClient().post(`${AUTH_API_PREFIX}/sign-in`, input);

  return response.data.data;
}

export async function refreshAccessToken(input) {
  if (USE_API_MOCK) {
    return refreshMockAuthToken(input);
  }

  const response = await getAuthApiClient().post(`${AUTH_API_PREFIX}/refresh-token`, input);

  return response.data.data;
}
