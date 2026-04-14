import { getAuthApiClient } from '../api/api-client.js';

const AUTH_API_PREFIX = '/v1/users';

export async function signUp(input) {
  const response = await getAuthApiClient().post(`${AUTH_API_PREFIX}/sign-up`, input);

  return response.data.data;
}

export async function signIn(input) {
  const response = await getAuthApiClient().post(`${AUTH_API_PREFIX}/sign-in`, input);

  return response.data.data;
}

export async function refreshAccessToken(input) {
  const response = await getAuthApiClient().post(`${AUTH_API_PREFIX}/refresh-token`, input);

  return response.data.data;
}
