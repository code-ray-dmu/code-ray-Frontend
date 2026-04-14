# Implementation Plan: Phase 2 Group Management API Integration

## Overview

This phase connects the frontend to the backend group domain described in [`docs/api-spec.md`](../api-spec.md) and the backend tech spec. The target scope is limited to `POST /groups`, `GET /groups`, and `GET /groups/{groupId}`, plus the minimum routing and UI work needed to leave the app in a working state where an authenticated user can create a group, browse only their own groups, move to a group detail page, and return to the previous paginated list context.

This phase is also the frontend foundation for the next applicant and analysis phases. The group list and group detail surfaces should therefore be designed as stable entry points, not as temporary debug UI.

## Architecture Decisions

- Group API calls use the existing authenticated `getApiClient()` transport.
  Rationale: the backend tech spec makes all group endpoints Access Token protected and relies on owner-based authorization, so Phase 2 should reuse the existing access-token and refresh-token infrastructure rather than introduce a parallel client.
- Group data normalization stays inside the service layer.
  Rationale: the backend contract mixes camelCase request fields (`techStacks`, `cultureFitPriority`) with snake_case response fields (`group_id`, `tech_stacks`, `culture_fit_priority`). Pages and components should consume one stable frontend shape only.
- Pagination defaults follow the backend contract: `page=1`, `size=20`.
  Rationale: the backend tech spec explicitly defines 1-based pagination and a default page size of 20, so the frontend should align with those defaults instead of inventing its own.
- Group list state lives in the URL search params.
  Rationale: `page`, `size`, `sort`, and `order` are part of the server contract. Keeping them in the URL preserves refresh, sharing, back/forward navigation, and detail-return behavior without extra global state.
- Group detail uses a dedicated route and preserves the originating list location.
  Rationale: `GET /groups/{groupId}` has distinct `404 GROUP_NOT_FOUND` and `403 FORBIDDEN_RESOURCE_ACCESS` outcomes, so it deserves its own route, loading state, and error handling rather than an in-place drawer only.
- Keep `/dashboard` as the canonical group list route for Phase 2.
  Rationale: the user decided to keep the existing post-login landing route and use it as the group-management entry point instead of introducing a new top-level `/groups` route in this phase.
- Keep touched UI files on the existing JSX stack for this phase.
  Rationale: the user explicitly chose to keep JSX, so this phase should focus on API integration and route flow rather than syntax-layer migration.

## Dependency Graph

The implementation should move in this order:

1. Shared group contract, pagination defaults, query parsing, and response normalization
2. Authenticated group list slice with URL-synced pagination on `/dashboard`
3. Group detail route with owner-access error handling and preserved return navigation
4. Create-group vertical slice aligned to the real backend request body and list-return behavior
5. Terminology cleanup, legacy room isolation on touched screens, and final validation

This order keeps the backend contract boundary stable first, delivers one working read path early, and pushes the most ambiguous UI mapping work for group creation until the list and detail surfaces are already grounded.

## Backend Constraints That Shape This Plan

- All group endpoints require authentication.
- The backend returns only the current user’s groups on `GET /groups`.
- `GET /groups/{groupId}` can fail with `GROUP_NOT_FOUND` or `FORBIDDEN_RESOURCE_ACCESS`.
- `GET /groups` supports `page`, `size`, `sort`, and `order`, with `page` starting at 1 and `size` defaulting to 20.
- `POST /groups` accepts `name`, optional `description`, `techStacks` as an object, and `cultureFitPriority` as a string.
- The group-create UI for this phase will collect `techStacks.framework` and `techStacks.db` through two text inputs.
- The allowed `cultureFitPriority` values for this phase are `HIGH`, `MEDIUM`, and `LOW`.
- The `GET /groups` list view is planned against items containing `group_id`, `name`, and `created_at`.
- The create response is minimal (`group_id`, `name`, `created_at`), so any richer post-create view should come from a follow-up detail fetch.
- Group information is later used as context for applicant analysis and question generation, so the frontend should treat `techStacks` and `cultureFitPriority` as first-class persisted inputs, not temporary display-only values.

## Pagination and Detail Navigation Design

### Pagination

- The group list page should read `page`, `size`, `sort`, and `order` from the URL search string.
- Missing or invalid query params should be normalized to backend-aligned defaults: `page=1`, `size=20`.
- The list should refetch whenever those query params change.
- Pagination controls should derive total pages from `meta.total` and `meta.size`.
- The current pagination state should remain intact when the user visits a detail page and comes back.
- If sorting is not explicitly chosen, the frontend should only send a default `sort` when the backend-supported field is confirmed.
- After a successful group creation, the app should return to `/dashboard`, preserve the current query-string state when possible, and refetch the list.

### Detail Navigation

- Selecting a group from the list should navigate to `/groups/:groupId`.
- The navigation should preserve the originating list location by passing the current `pathname + search` in router state.
- The detail page should offer a back action that prefers the preserved list location and falls back to the chosen list entry route.
- Direct entry to `/groups/:groupId` should still work without prior router state.
- The detail page should distinguish:
  - `GROUP_NOT_FOUND`: the group does not exist
  - `FORBIDDEN_RESOURCE_ACCESS`: the group exists but is not owned by the current user

## Task List

### Phase 1: Foundation

## Task 1: Define the group service contract and normalization boundary

**Description:** Add the shared group service layer on top of the existing authenticated API client. This task establishes the contract boundary for the whole phase by centralizing request builders, backend-aligned pagination defaults, response normalization, and group-specific error-code extraction.

**Acceptance criteria:**
- [ ] A group service module exposes named functions for create, list, and detail requests using the shared authenticated API client.
- [ ] Group list query helpers normalize invalid or missing pagination input to `page=1` and `size=20`.
- [ ] Raw backend field names such as `group_id`, `tech_stacks`, and `culture_fit_priority` are mapped once in the service layer before UI consumption.

**Verification:**
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Manual check: confirm that pages and components consume normalized group objects and do not reference raw snake_case fields directly.

**Dependencies:** None

**Files likely touched:**
- `src/services/groups/group-api.js`
- `src/services/groups/group-mappers.js`
- `src/services/groups/group-types.js`
- `src/services/api/api-types.js`

**Estimated scope:** Medium: 3-4 files

## Task 2: Implement the authenticated group list slice with URL-synced pagination

**Description:** Replace the local room-backed dashboard list on `/dashboard` with a real authenticated group list powered by `GET /groups`. This task delivers the first complete Phase 2 user flow by fetching the current user’s groups, rendering loading and empty states, synchronizing pagination with the URL, and showing list cards built from the confirmed minimal fields: `group_id`, `name`, and `created_at`.

**Acceptance criteria:**
- [ ] Visiting the chosen group-list entry route fetches groups from `GET /groups` through the new service layer.
- [ ] The page reads and writes `page`, `size`, `sort`, and `order` through URL search params, with defaults normalized to `page=1` and `size=20`.
- [ ] The UI renders loading, empty, error, and populated states, and pagination controls reflect `meta.page`, `meta.size`, and `meta.total`.

**Verification:**
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Manual check: opening the list route with `?page=2&size=20` sends those exact query params and shows matching active pagination state.

**Dependencies:** Task 1

**Files likely touched:**
- `src/pages/DashboardPage.jsx`
- `src/components/groups/group-list-section.jsx`
- `src/components/groups/group-pagination.jsx`
- `src/components/layout/DashboardLayout.jsx`

**Estimated scope:** Medium: 4 files

### Checkpoint: After Tasks 1-2

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] An authenticated user can reach the group list and page through their own groups
- [ ] Human review confirms the list entry route and pagination behavior before detail work begins

### Phase 2: Core Browsing Flows

## Task 3: Add the group detail route with owner-access error handling

**Description:** Add a dedicated group detail page and wire list selection to it. This task completes the read-only browse loop by fetching `GET /groups/{groupId}`, rendering the group’s full context fields, handling `404` and `403` cases explicitly, and restoring the previous `/dashboard` pagination state when the user navigates back.

**Acceptance criteria:**
- [ ] A route exists for `/groups/:groupId`.
- [ ] Selecting a group from the list navigates to the detail route and fetches that group by ID.
- [ ] The detail page renders the group name, description, `techStacks`, and `cultureFitPriority`, and distinguishes `GROUP_NOT_FOUND` from `FORBIDDEN_RESOURCE_ACCESS`.

**Verification:**
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Manual check: from the paginated list, open one group, return, and confirm the previous `page` and `size` state is preserved.

**Dependencies:** Tasks 1-2

**Files likely touched:**
- `src/App.jsx`
- `src/pages/GroupDetailPage.jsx`
- `src/pages/DashboardPage.jsx`
- `src/components/groups/group-detail-panel.jsx`

**Estimated scope:** Medium: 4 files

## Task 4: Implement the create-group vertical slice against the real request body

**Description:** Adapt the current create entry point into a real group-creation flow that matches the backend contract exactly. This task should collect `name`, optional `description`, two tech-stack text fields for `framework` and `db`, and a select box for `cultureFitPriority`, then submit `POST /groups`, show validation and network errors, and return the user to the dashboard list with a refetch.

**Acceptance criteria:**
- [ ] The create-group flow submits `name`, optional `description`, `techStacks` as `{ framework, db }`, and `cultureFitPriority` as one of `HIGH`, `MEDIUM`, or `LOW`.
- [ ] The UI surfaces pending, validation, and request-failure states without mutating unrelated room flows.
- [ ] On success, the app returns to `/dashboard`, refreshes the list, and keeps the user inside the main group-management flow.

**Verification:**
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Manual check: submit a valid group, confirm the request body matches the backend contract, and confirm the user returns to `/dashboard` with refreshed list data.

**Dependencies:** Tasks 1-3

**Files likely touched:**
- `src/components/modals/CreateRoomModal.jsx`
- `src/components/groups/group-form-fields.jsx`
- `src/services/groups/group-api.js`
- `src/pages/DashboardPage.jsx`

**Estimated scope:** Medium: 4 files

### Checkpoint: After Tasks 3-4

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] The user can browse from group list to group detail and back without losing pagination context
- [ ] The user can create a group and immediately continue from the agreed destination
- [ ] Human review confirms the group form shape before applicant-phase planning starts

### Phase 3: Cleanup and Validation

## Task 5: Align touched navigation and terminology, then complete final validation

**Description:** Finish the phase by aligning touched screens and navigation entry points around the group domain, containing legacy room-specific placeholders to unaffected areas, and running the final validation pass. The goal is to leave the repository coherent for the next applicant phase without performing an unrelated app-wide rename.

**Acceptance criteria:**
- [ ] The touched list, detail, and create surfaces use consistent group-management terminology.
- [ ] The main group-management entry flow no longer depends on local `roomStore` data.
- [ ] Final validation status, skipped checks, and any remaining contract gaps are documented before handoff.

**Verification:**
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `npm run dev`
- [ ] `npm run preview`
- [ ] Manual check: sign in, open the group list, change pagination, open detail, create a group, and return to the list successfully.

**Dependencies:** Tasks 1-4

**Files likely touched:**
- `src/components/layout/Sidebar.jsx`
- `src/pages/DashboardPage.jsx`
- `src/pages/GroupDetailPage.jsx`
- `src/components/modals/CreateRoomModal.jsx`

**Estimated scope:** Medium: 4 files

### Checkpoint: Complete

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] `npm run dev` starts successfully
- [ ] `npm run preview` starts successfully
- [ ] Authenticated users can create a group, browse the paginated list, open detail, and return to the previous list context
- [ ] The finished implementation is ready for human review

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| The assumed `GET /groups` item shape (`group_id`, `name`, `created_at`) may differ from the real backend payload | High | Keep list-item normalization in one mapper module and verify against the real API before polishing the dashboard cards |
| The current create modal models room data, not the backend group domain | High | Re-scope the create UI around the actual request body and confirm unresolved field modeling decisions before implementation |
| `techStacks` is an object in the API contract, but the current UI favors free-form tags and architecture labels | High | Replace the current room-oriented inputs on the create path with explicit `framework` and `db` fields so the request shape is deterministic |
| Returning to the list after creation may not visibly show the new group on the current page depending on sort order | Medium | Refetch the list after create and consider a success message even if the new item is not on the current page |
| JSX 유지 결정이 repo의 TypeScript-only 규칙과 충돌할 수 있다 | Medium | Keep the phase on JSX as explicitly requested and call out this exception clearly in implementation notes if needed |

## Open Questions

- None at the planning level. The route, post-create flow, form shape, allowed `cultureFitPriority` values, list-card assumptions, and JSX decision have been resolved for Phase 2 planning.

## Verification

- [ ] Every task has acceptance criteria
- [ ] Every task has a verification step
- [ ] Dependencies are identified and ordered correctly
- [ ] No task is expected to touch more than about five files
- [ ] Checkpoints exist between major phases
- [ ] The human has reviewed and approved the plan
