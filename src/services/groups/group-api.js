import { getApiClient } from '../api/api-client.js';
import {
  createMockGroup as createMockGroupData,
  createMockRequestId,
  getMockGroupDetail as getMockGroupDetailData,
  getMockGroups as getMockGroupsData,
  USE_API_MOCK,
} from '../mock/mock-api-store.js';
import {
  mapCreatedGroup,
  mapGroupDetail,
  mapGroupListItem,
  mapPaginatedMeta,
  mapRequestMeta,
} from './group-mappers.js';
import {
  DEFAULT_GROUP_LIST_PAGE,
  DEFAULT_GROUP_LIST_SIZE,
  GROUP_API_PREFIX,
  GROUP_LIST_ORDER_VALUES,
} from './group-types.js';

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

function normalizeGroupListOrder(order) {
  const normalizedOrder = normalizeOptionalString(order)?.toLowerCase();

  if (
    normalizedOrder !== GROUP_LIST_ORDER_VALUES.ASC &&
    normalizedOrder !== GROUP_LIST_ORDER_VALUES.DESC
  ) {
    return undefined;
  }

  return normalizedOrder;
}

export function normalizeGroupListParams(params = {}) {
  const normalizedPage = normalizePositiveInteger(params.page, DEFAULT_GROUP_LIST_PAGE);
  const normalizedSize = normalizePositiveInteger(params.size, DEFAULT_GROUP_LIST_SIZE);
  const normalizedSort = normalizeOptionalString(params.sort);
  const normalizedOrder = normalizeGroupListOrder(params.order);

  return {
    page: normalizedPage,
    size: normalizedSize,
    ...(normalizedSort !== undefined ? { sort: normalizedSort } : {}),
    ...(normalizedOrder !== undefined ? { order: normalizedOrder } : {}),
  };
}

export function createGroupListSearchParams(params = {}) {
  const normalizedParams = normalizeGroupListParams(params);
  const searchParams = new URLSearchParams();

  searchParams.set('page', String(normalizedParams.page));
  searchParams.set('size', String(normalizedParams.size));

  if (normalizedParams.sort !== undefined) {
    searchParams.set('sort', normalizedParams.sort);
  }

  if (normalizedParams.order !== undefined) {
    searchParams.set('order', normalizedParams.order);
  }

  return searchParams;
}

export async function createGroup(input) {
  if (USE_API_MOCK) {
    return {
      group: mapCreatedGroup(createMockGroupData(input)),
      meta: mapRequestMeta({
        request_id: createMockRequestId(),
      }),
    };
  }

  const response = await getApiClient().post(GROUP_API_PREFIX, input);

  return {
    group: mapCreatedGroup(response.data.data),
    meta: mapRequestMeta(response.data.meta),
  };
}

export async function getGroups(params = {}) {
  const normalizedParams = normalizeGroupListParams(params);

  if (USE_API_MOCK) {
    const result = getMockGroupsData(normalizedParams);

    return {
      groups: result.groups.map(mapGroupListItem),
      meta: mapPaginatedMeta({
        page: normalizedParams.page,
        size: normalizedParams.size,
        total: result.total,
        request_id: createMockRequestId(),
      }),
      params: normalizedParams,
    };
  }

  const response = await getApiClient().get(GROUP_API_PREFIX, {
    params: normalizedParams,
  });

  return {
    groups: Array.isArray(response.data.data) ? response.data.data.map(mapGroupListItem) : [],
    meta: mapPaginatedMeta(response.data.meta),
    params: normalizedParams,
  };
}

export async function getGroupDetail(groupId) {
  if (USE_API_MOCK) {
    return {
      group: mapGroupDetail(getMockGroupDetailData(groupId)),
      meta: mapRequestMeta({
        request_id: createMockRequestId(),
      }),
    };
  }

  const response = await getApiClient().get(`${GROUP_API_PREFIX}/${groupId}`);

  return {
    group: mapGroupDetail(response.data.data),
    meta: mapRequestMeta(response.data.meta),
  };
}
