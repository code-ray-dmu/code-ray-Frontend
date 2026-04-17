import test from 'node:test';
import assert from 'node:assert/strict';

import { mapGroupDetail } from './group-mappers.js';

test('mapGroupDetail supports snake_case group payloads', () => {
  const group = mapGroupDetail({
    group_id: 'group-1',
    name: 'Platform Core',
    created_at: '2026-04-12T10:00:00Z',
    description: 'Core frontend platform group',
    tech_stacks: {
      framework: 'React',
      db: 'PostgreSQL',
    },
    culture_fit_priority: 'HIGH',
    applicant_count: 4,
  });

  assert.deepEqual(group, {
    id: 'group-1',
    name: 'Platform Core',
    createdAt: '2026-04-12T10:00:00Z',
    description: 'Core frontend platform group',
    techStacks: {
      framework: 'React',
      db: 'PostgreSQL',
    },
    cultureFitPriority: 'HIGH',
    applicantCount: 4,
  });
});

test('mapGroupDetail supports camelCase group payloads used by route state fallbacks', () => {
  const group = mapGroupDetail({
    id: 'group-2',
    name: 'Growth Lab',
    createdAt: '2026-04-13T09:30:00Z',
    description: 'Product experiment team',
    techStacks: {
      framework: 'Next.js',
      db: 'Supabase',
    },
    cultureFitPriority: 'MEDIUM',
    applicantCount: 2,
  });

  assert.deepEqual(group, {
    id: 'group-2',
    name: 'Growth Lab',
    createdAt: '2026-04-13T09:30:00Z',
    description: 'Product experiment team',
    techStacks: {
      framework: 'Next.js',
      db: 'Supabase',
    },
    cultureFitPriority: 'MEDIUM',
    applicantCount: 2,
  });
});
