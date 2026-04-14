export const USE_API_MOCK = false;

const INITIAL_GROUPS = [
  {
    group_id: 'group-platform-core',
    name: 'Platform Core',
    created_at: '2026-04-10T09:00:00.000Z',
    description:
      'Frontend platform team focused on shared architecture, internal tooling, and DX.',
    tech_stacks: {
      framework: 'React 19 + Vite',
      db: 'PostgreSQL',
    },
    culture_fit_priority: 'HIGH',
  },
  {
    group_id: 'group-growth-labs',
    name: 'Growth Labs',
    created_at: '2026-04-08T13:30:00.000Z',
    description:
      'Experiment-heavy product team that values fast iteration, ownership, and crisp communication.',
    tech_stacks: {
      framework: 'Next.js',
      db: 'Supabase',
    },
    culture_fit_priority: 'MEDIUM',
  },
  {
    group_id: 'group-ai-studio',
    name: 'AI Studio',
    created_at: '2026-04-05T16:45:00.000Z',
    description:
      'AI-assisted product squad building interview workflows and candidate analysis features.',
    tech_stacks: {
      framework: 'React + TypeScript',
      db: 'MongoDB',
    },
    culture_fit_priority: 'HIGH',
  },
];

const INITIAL_APPLICANTS = [
  {
    applicant_id: 'applicant-jiyoon-kim',
    group_id: 'group-platform-core',
    name: 'Jiyoon Kim',
    email: 'jiyoon.kim@example.com',
    github_url: 'https://github.com/jiyoonkim',
  },
  {
    applicant_id: 'applicant-minsu-park',
    group_id: 'group-platform-core',
    name: 'Minsu Park',
    email: 'minsu.park@example.com',
    github_url: 'https://github.com/minsupark',
  },
  {
    applicant_id: 'applicant-sohee-lee',
    group_id: 'group-growth-labs',
    name: 'Sohee Lee',
    email: 'sohee.lee@example.com',
    github_url: 'https://github.com/soheelee',
  },
  {
    applicant_id: 'applicant-daniel-choi',
    group_id: 'group-ai-studio',
    name: 'Daniel Choi',
    email: 'daniel.choi@example.com',
    github_url: 'https://github.com/danielchoi',
  },
];
const INITIAL_AUTH_USERS = [
  {
    user_id: 'user-demo',
    name: 'Demo User',
    email: 'demo@coderay.dev',
    password: 'demo1234',
  },
];

let mockGroups = INITIAL_GROUPS.map(cloneMockGroup);
let mockApplicants = INITIAL_APPLICANTS.map(cloneMockApplicant);
let mockAuthUsers = INITIAL_AUTH_USERS.map(cloneMockAuthUser);

function cloneMockGroup(group) {
  return {
    ...group,
    tech_stacks: {
      framework: group.tech_stacks?.framework ?? '',
      db: group.tech_stacks?.db ?? '',
    },
    applicant_count:
      typeof group.applicant_count === 'number' ? group.applicant_count : undefined,
  };
}

function cloneMockApplicant(applicant) {
  return {
    ...applicant,
  };
}

function cloneMockAuthUser(user) {
  return {
    ...user,
  };
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

function paginateItems(items, page, size) {
  const startIndex = (page - 1) * size;

  return items.slice(startIndex, startIndex + size);
}

function buildMockApiError(code, message) {
  const error = new Error(message);

  error.response = {
    data: {
      data: null,
      meta: {
        request_id: createMockRequestId(),
      },
      error: {
        code,
        message,
      },
    },
  };

  return error;
}

function createMockGroupId(name) {
  const normalizedName =
    normalizeOptionalString(name)
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') ?? 'group';

  return `group-${normalizedName}-${Date.now()}`;
}

function createMockApplicantId(name) {
  const normalizedName =
    normalizeOptionalString(name)
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') ?? 'applicant';

  return `applicant-${normalizedName}-${Date.now()}`;
}

function getSortableGroupValue(group, sort) {
  if (sort === 'name') {
    return group.name;
  }

  return group.created_at;
}

function compareSortableValues(leftValue, rightValue, order) {
  const normalizedLeftValue = typeof leftValue === 'string' ? leftValue : '';
  const normalizedRightValue = typeof rightValue === 'string' ? rightValue : '';
  const comparison = normalizedLeftValue.localeCompare(normalizedRightValue);

  return order === 'asc' ? comparison : comparison * -1;
}

export function createMockRequestId() {
  return `mock-request-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function resetMockApiStore() {
  mockGroups = INITIAL_GROUPS.map(cloneMockGroup);
  mockApplicants = INITIAL_APPLICANTS.map(cloneMockApplicant);
  mockAuthUsers = INITIAL_AUTH_USERS.map(cloneMockAuthUser);
}

export function hasMockApplicant(applicantId) {
  return mockApplicants.some((applicant) => applicant.applicant_id === applicantId);
}

export function createMockGroup(input) {
  const createdGroup = {
    group_id: createMockGroupId(input?.name),
    name: input?.name ?? null,
    created_at: new Date(Date.now()).toISOString(),
    description: input?.description ?? null,
    tech_stacks: {
      framework: input?.techStacks?.framework ?? '',
      db: input?.techStacks?.db ?? '',
    },
    culture_fit_priority: input?.cultureFitPriority ?? null,
  };

  mockGroups = [createdGroup, ...mockGroups];

  return cloneMockGroup(createdGroup);
}

export function getMockGroups(params) {
  const sort = normalizeOptionalString(params?.sort) ?? 'created_at';
  const order = normalizeOptionalString(params?.order) ?? 'desc';
  const sortedGroups = [...mockGroups].sort((leftGroup, rightGroup) => {
    return compareSortableValues(
      getSortableGroupValue(leftGroup, sort),
      getSortableGroupValue(rightGroup, sort),
      order,
    );
  });

  return {
    groups: paginateItems(sortedGroups, params.page, params.size).map((group) => {
      const applicantCount = mockApplicants.filter((applicant) => {
        return applicant.group_id === group.group_id;
      }).length;

      return cloneMockGroup({
        ...group,
        applicant_count: applicantCount,
      });
    }),
    total: sortedGroups.length,
  };
}

export function getMockGroupDetail(groupId) {
  const group = mockGroups.find((currentGroup) => currentGroup.group_id === groupId);

  if (group === undefined) {
    throw buildMockApiError('GROUP_NOT_FOUND', 'Group not found');
  }

  return cloneMockGroup({
    ...group,
    applicant_count: mockApplicants.filter((applicant) => {
      return applicant.group_id === group.group_id;
    }).length,
  });
}

export function createMockApplicant(input) {
  const group = mockGroups.find((currentGroup) => currentGroup.group_id === input?.groupId);

  if (group === undefined) {
    throw buildMockApiError('GROUP_NOT_FOUND', 'Group not found');
  }

  const createdApplicant = {
    applicant_id: createMockApplicantId(input?.name),
    group_id: input?.groupId ?? null,
    name: input?.name ?? null,
    email: input?.email ?? null,
    github_url: input?.githubUrl ?? null,
  };

  mockApplicants = [createdApplicant, ...mockApplicants];

  return cloneMockApplicant(createdApplicant);
}

export function getMockApplicants(params) {
  if (
    typeof params?.groupId === 'string' &&
    !mockGroups.some((group) => group.group_id === params.groupId)
  ) {
    throw buildMockApiError('GROUP_NOT_FOUND', 'Group not found');
  }

  const filteredApplicants =
    typeof params?.groupId === 'string'
      ? mockApplicants.filter((applicant) => applicant.group_id === params.groupId)
      : mockApplicants;

  return {
    applicants: paginateItems(filteredApplicants, params.page, params.size).map(
      cloneMockApplicant,
    ),
    total: filteredApplicants.length,
  };
}

export function getMockApplicantDetail(applicantId) {
  const applicant = mockApplicants.find(
    (currentApplicant) => currentApplicant.applicant_id === applicantId,
  );

  if (applicant === undefined) {
    throw buildMockApiError('APPLICANT_NOT_FOUND', 'Applicant not found');
  }

  return cloneMockApplicant(applicant);
}

export function signUpWithMockAuth(input) {
  const normalizedEmail = normalizeOptionalString(input?.email)?.toLowerCase();

  if (
    normalizedEmail !== undefined &&
    mockAuthUsers.some((user) => user.email.toLowerCase() === normalizedEmail)
  ) {
    throw buildMockApiError('USER_EMAIL_CONFLICT', 'This email is already in use');
  }

  const createdUser = {
    user_id: `user-${Date.now()}`,
    name: input?.name ?? null,
    email: normalizedEmail ?? null,
    password: input?.password ?? '',
  };

  mockAuthUsers = [createdUser, ...mockAuthUsers];

  return {
    user_id: createdUser.user_id,
    name: createdUser.name,
    email: createdUser.email,
  };
}

export function signInWithMockAuth(input) {
  const normalizedEmail = normalizeOptionalString(input?.email)?.toLowerCase();
  const user = mockAuthUsers.find((currentUser) => currentUser.email === normalizedEmail);

  if (user === undefined || user.password !== input?.password) {
    throw buildMockApiError('AUTH_INVALID_CREDENTIALS', 'Invalid email or password');
  }

  return {
    access_token: `mock-access-${user.user_id}-${Date.now()}`,
    refresh_token: `mock-refresh-${user.user_id}`,
  };
}

export function refreshMockAuthToken(input) {
  const refreshToken = normalizeOptionalString(input?.refreshToken);
  const user = mockAuthUsers.find((currentUser) => {
    return refreshToken === `mock-refresh-${currentUser.user_id}`;
  });

  if (user === undefined) {
    throw buildMockApiError('AUTH_TOKEN_INVALID', 'Refresh token is invalid');
  }

  return {
    access_token: `mock-access-${user.user_id}-${Date.now()}`,
  };
}
