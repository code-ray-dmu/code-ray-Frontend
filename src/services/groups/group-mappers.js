import { DEFAULT_GROUP_LIST_PAGE, DEFAULT_GROUP_LIST_SIZE } from './group-types.js';

function normalizeString(value) {
  return typeof value === 'string' ? value : null;
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
    id: normalizeString(group?.group_id),
    name: normalizeString(group?.name),
    createdAt: normalizeString(group?.created_at),
  };
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
    description: null,
    techStacks: normalizeTechStacks(null),
    cultureFitPriority: null,
  };
}

export function mapGroupListItem(group) {
  return {
    ...mapGroupBase(group),
    description: null,
    techStacks: normalizeTechStacks(null),
    cultureFitPriority: null,
  };
}

export function mapGroupDetail(group) {
  return {
    ...mapGroupBase(group),
    description: normalizeString(group?.description),
    techStacks: normalizeTechStacks(group?.tech_stacks),
    cultureFitPriority: normalizeString(group?.culture_fit_priority),
  };
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

