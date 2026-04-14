import {
  DEFAULT_APPLICANT_LIST_PAGE,
  DEFAULT_APPLICANT_LIST_SIZE,
} from './applicant-types.js';

function normalizeString(value) {
  return typeof value === 'string' ? value : null;
}

function normalizePositiveInteger(value, fallbackValue) {
  if (!Number.isInteger(value) || value < 1) {
    return fallbackValue;
  }

  return value;
}

function normalizeNonNegativeInteger(value, fallbackValue) {
  if (!Number.isInteger(value) || value < 0) {
    return fallbackValue;
  }

  return value;
}

function mapApplicantBase(applicant) {
  return {
    id: normalizeString(applicant?.applicant_id),
    groupId: normalizeString(applicant?.group_id),
    name: normalizeString(applicant?.name),
    email: normalizeString(applicant?.email),
    githubUrl: normalizeString(applicant?.github_url),
  };
}

export function mapCreatedApplicant(applicant) {
  return {
    ...mapApplicantBase(applicant),
    groupId: null,
    name: null,
    email: null,
    githubUrl: null,
  };
}

export function mapApplicantListItem(applicant) {
  return mapApplicantBase(applicant);
}

export function mapApplicantDetail(applicant) {
  return mapApplicantBase(applicant);
}

export function mapRequestMeta(meta) {
  return {
    requestId: normalizeString(meta?.request_id),
  };
}

export function mapPaginatedMeta(meta) {
  return {
    ...mapRequestMeta(meta),
    page: normalizePositiveInteger(meta?.page, DEFAULT_APPLICANT_LIST_PAGE),
    size: normalizePositiveInteger(meta?.size, DEFAULT_APPLICANT_LIST_SIZE),
    total: normalizeNonNegativeInteger(meta?.total, 0),
  };
}
