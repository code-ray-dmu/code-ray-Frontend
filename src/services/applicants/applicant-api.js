import { getApiClient } from '../api/api-client.js';
import {
  createMockApplicant as createMockApplicantData,
  createMockRequestId,
  getMockApplicantDetail as getMockApplicantDetailData,
  getMockApplicants as getMockApplicantsData,
  USE_API_MOCK,
} from '../mock/mock-api-store.js';
import {
  mapApplicantDetail,
  mapApplicantListItem,
  mapCreatedApplicant,
  mapPaginatedMeta,
  mapRequestMeta,
} from './applicant-mappers.js';
import {
  APPLICANT_API_PREFIX,
  APPLICANT_LIST_SEARCH_PARAM_KEYS,
  DEFAULT_APPLICANT_LIST_PAGE,
  DEFAULT_APPLICANT_LIST_SIZE,
  GITHUB_PROFILE_HOSTNAME,
} from './applicant-types.js';

function normalizePositiveInteger(value, fallbackValue) {
  const nextValue = Number(value);

  if (!Number.isInteger(nextValue) || nextValue < 1) {
    return fallbackValue;
  }

  return nextValue;
}

function normalizeOptionalString(value) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    return undefined;
  }

  return normalizedValue;
}

function normalizeGroupId(groupId) {
  return normalizeOptionalString(groupId);
}

function createUrlCandidate(value) {
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  return `https://${value}`;
}

export function normalizeApplicantListParams(params = {}) {
  const normalizedPage = normalizePositiveInteger(params.page, DEFAULT_APPLICANT_LIST_PAGE);
  const normalizedSize = normalizePositiveInteger(params.size, DEFAULT_APPLICANT_LIST_SIZE);
  const normalizedGroupId = normalizeGroupId(params.groupId);

  return {
    page: normalizedPage,
    size: normalizedSize,
    ...(normalizedGroupId !== undefined ? { groupId: normalizedGroupId } : {}),
  };
}

export function createApplicantListSearchParams(params = {}) {
  const normalizedParams = normalizeApplicantListParams(params);
  const searchParams = new URLSearchParams();

  searchParams.set(APPLICANT_LIST_SEARCH_PARAM_KEYS.PAGE, String(normalizedParams.page));
  searchParams.set(APPLICANT_LIST_SEARCH_PARAM_KEYS.SIZE, String(normalizedParams.size));

  if (normalizedParams.groupId !== undefined) {
    searchParams.set(APPLICANT_LIST_SEARCH_PARAM_KEYS.GROUP_ID, normalizedParams.groupId);
  }

  return searchParams;
}

export function getApplicantListParamsFromSearchParams(searchParams) {
  return normalizeApplicantListParams({
    groupId: searchParams.get(APPLICANT_LIST_SEARCH_PARAM_KEYS.GROUP_ID),
    page: searchParams.get(APPLICANT_LIST_SEARCH_PARAM_KEYS.PAGE),
    size: searchParams.get(APPLICANT_LIST_SEARCH_PARAM_KEYS.SIZE),
  });
}

export function normalizeGitHubProfileUrl(value) {
  const normalizedValue = normalizeOptionalString(value);

  if (normalizedValue === undefined) {
    return null;
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(createUrlCandidate(normalizedValue));
  } catch {
    return null;
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  if (hostname !== GITHUB_PROFILE_HOSTNAME && hostname !== `www.${GITHUB_PROFILE_HOSTNAME}`) {
    return null;
  }

  if (
    (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') ||
    parsedUrl.username.length > 0 ||
    parsedUrl.password.length > 0 ||
    parsedUrl.search.length > 0 ||
    parsedUrl.hash.length > 0
  ) {
    return null;
  }

  const segments = parsedUrl.pathname
    .replace(/\/+$/, '')
    .split('/')
    .filter((segment) => segment.length > 0);

  if (segments.length !== 1) {
    return null;
  }

  const [owner] = segments;

  if (owner === '.' || owner === '..') {
    return null;
  }

  return `https://${GITHUB_PROFILE_HOSTNAME}/${owner}`;
}

export function isGitHubProfileUrl(value) {
  return normalizeGitHubProfileUrl(value) !== null;
}

export async function createApplicant(input) {
  if (USE_API_MOCK) {
    return {
      applicant: mapCreatedApplicant(createMockApplicantData(input)),
      meta: mapRequestMeta({
        request_id: createMockRequestId(),
      }),
    };
  }

  const response = await getApiClient().post(APPLICANT_API_PREFIX, input);

  return {
    applicant: mapCreatedApplicant(response.data.data),
    meta: mapRequestMeta(response.data.meta),
  };
}

export async function getApplicants(params = {}) {
  const normalizedParams = normalizeApplicantListParams(params);

  if (USE_API_MOCK) {
    const result = getMockApplicantsData(normalizedParams);

    return {
      applicants: result.applicants.map(mapApplicantListItem),
      meta: mapPaginatedMeta({
        page: normalizedParams.page,
        size: normalizedParams.size,
        total: result.total,
        request_id: createMockRequestId(),
      }),
      params: normalizedParams,
    };
  }

  const response = await getApiClient().get(APPLICANT_API_PREFIX, {
    params: normalizedParams,
  });

  return {
    applicants: Array.isArray(response.data.data)
      ? response.data.data.map(mapApplicantListItem)
      : [],
    meta: mapPaginatedMeta(response.data.meta),
    params: normalizedParams,
  };
}

export async function getApplicantDetail(applicantId) {
  if (USE_API_MOCK) {
    return {
      applicant: mapApplicantDetail(getMockApplicantDetailData(applicantId)),
      meta: mapRequestMeta({
        request_id: createMockRequestId(),
      }),
    };
  }

  const response = await getApiClient().get(`${APPLICANT_API_PREFIX}/${applicantId}`);

  return {
    applicant: mapApplicantDetail(response.data.data),
    meta: mapRequestMeta(response.data.meta),
  };
}
