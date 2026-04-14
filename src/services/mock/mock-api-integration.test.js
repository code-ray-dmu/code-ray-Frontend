import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createApplicant,
  getApplicantDetail,
  getApplicants,
} from '../applicants/applicant-api.js';
import {
  refreshAccessToken,
  signIn,
  signUp,
} from '../auth/auth-api.js';
import { createGroup, getGroupDetail, getGroups } from '../groups/group-api.js';
import { resetMockApiStore } from './mock-api-store.js';

test('mock group api returns seeded groups and supports detail lookup', async () => {
  resetMockApiStore();

  const groupListResponse = await getGroups({
    page: 1,
    size: 20,
  });

  assert.equal(groupListResponse.groups.length, 3);
  assert.equal(groupListResponse.meta.total, 3);
  assert.equal(groupListResponse.groups[0].id, 'group-platform-core');

  const groupDetailResponse = await getGroupDetail('group-platform-core');

  assert.equal(groupDetailResponse.group.name, 'Platform Core');
  assert.equal(groupDetailResponse.group.techStacks.framework, 'React 19 + Vite');
  assert.equal(groupDetailResponse.group.cultureFitPriority, 'HIGH');
});

test('mock applicant api stays in sync with created groups and applicants', async () => {
  resetMockApiStore();

  const createdGroupResponse = await createGroup({
    name: 'Frontend Infra',
    description: 'Shared UI infrastructure and tooling.',
    techStacks: {
      framework: 'React',
      db: 'Firebase',
    },
    cultureFitPriority: 'MEDIUM',
  });
  const createdGroupId = createdGroupResponse.group.id;

  assert.equal(typeof createdGroupId, 'string');
  assert.ok(createdGroupId.length > 0);

  await createApplicant({
    groupId: createdGroupId,
    name: 'Hyeon Im',
    email: 'hyeon.im@example.com',
    githubUrl: 'https://github.com/imhyeon',
  });

  const applicantListResponse = await getApplicants({
    groupId: createdGroupId,
    page: 1,
    size: 20,
  });
  const createdApplicantId = applicantListResponse.applicants[0]?.id;

  assert.equal(applicantListResponse.meta.total, 1);
  assert.equal(applicantListResponse.applicants[0]?.name, 'Hyeon Im');
  assert.equal(applicantListResponse.applicants[0]?.groupId, createdGroupId);

  const applicantDetailResponse = await getApplicantDetail(createdApplicantId);

  assert.equal(applicantDetailResponse.applicant.email, 'hyeon.im@example.com');
  assert.equal(applicantDetailResponse.applicant.githubUrl, 'https://github.com/imhyeon');
});

test('mock auth api supports demo sign-in, sign-up, and refresh', async () => {
  resetMockApiStore();

  const demoSignInResponse = await signIn({
    email: 'demo@coderay.dev',
    password: 'demo1234',
  });

  assert.match(demoSignInResponse.access_token, /^mock-access-user-demo-/);
  assert.equal(demoSignInResponse.refresh_token, 'mock-refresh-user-demo');

  const signUpResponse = await signUp({
    name: 'New User',
    email: 'new.user@example.com',
    password: 'secret123',
  });

  assert.equal(signUpResponse.email, 'new.user@example.com');

  const newUserSignInResponse = await signIn({
    email: 'new.user@example.com',
    password: 'secret123',
  });
  const refreshResponse = await refreshAccessToken({
    refreshToken: newUserSignInResponse.refresh_token,
  });

  assert.match(newUserSignInResponse.refresh_token, /^mock-refresh-user-/);
  assert.match(refreshResponse.access_token, /^mock-access-user-/);
});
