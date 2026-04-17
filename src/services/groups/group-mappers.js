import { DEFAULT_GROUP_LIST_PAGE, DEFAULT_GROUP_LIST_SIZE } from './group-types.js';

function normalizeString(value) {
  return typeof value === 'string' ? value : null;
}

function normalizeFirstString(...values) {
  for (const value of values) {
    const normalizedValue = normalizeString(value);

    if (normalizedValue !== null) {
      return normalizedValue;
    }
  }

  return null;
}

function normalizeTechStacks(techStacks) {
  if (techStacks === null || typeof techStacks !== 'object' || Array.isArray(techStacks)) {
    return {
      framework: '',
      db: '',
    };
  }

  return {
    framework: typeof techStacks.framework === 'string' ? techStacks.framework : '',
    db: typeof techStacks.db === 'string' ? techStacks.db : '',
  };
}

function mapGroupBase(group) {
  return {
    id: normalizeFirstString(group?.group_id, group?.id),
    name: normalizeFirstString(group?.name),
    createdAt: normalizeFirstString(group?.created_at, group?.createdAt),
  };
}

function normalizeApplicantCount(value) {
  if (!Number.isInteger(value) || value < 0) {
    return null;
  }

  return value;
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

export function mapCreatedGroup(group) {
  return {
    ...mapGroupBase(group),
    description: normalizeFirstString(group?.description),
    techStacks: normalizeTechStacks(group?.tech_stacks ?? group?.techStacks),
    cultureFitPriority: normalizeFirstString(
      group?.culture_fit_priority,
      group?.cultureFitPriority,
    ),
    applicantCount: normalizeApplicantCount(group?.applicant_count ?? group?.applicantCount),
  };
}

export function mapGroupListItem(group) {
  return mapCreatedGroup(group);
}

export function mapGroupDetail(group) {
  return mapCreatedGroup(group);
}

export function mapRequestMeta(meta) {
  return {
    requestId: normalizeString(meta?.request_id),
  };
}

export function mapPaginatedMeta(meta) {
  return {
    ...mapRequestMeta(meta),
    page: normalizePositiveInteger(meta?.page, DEFAULT_GROUP_LIST_PAGE),
    size: normalizePositiveInteger(meta?.size, DEFAULT_GROUP_LIST_SIZE),
    total: normalizeNonNegativeInteger(meta?.total, 0),
  };
}
