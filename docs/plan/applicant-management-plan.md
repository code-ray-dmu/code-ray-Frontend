# Implementation Plan: Phase 3 Applicant Management API Integration

## Overview

This phase connects the frontend to the applicant domain described in [`docs/api-spec.md`](../api-spec.md) and the backend tech spec. The target scope is limited to `POST /applicants`, `GET /applicants`, and `GET /applicants/{applicantId}`, plus the minimum routing and UI work needed to leave the app in a working state where an authenticated user can enter a specific group context, browse that group's applicants, open one applicant detail page, and register a new applicant without falling back to the legacy local room simulation.

This phase should inherit the service-layer patterns established in Phase 2. The existing authenticated `api-client` and mapper boundary remain the source of truth for transport, request normalization, and snake_case-to-camelCase conversion.

## Architecture Decisions

- Applicant API calls reuse the existing authenticated `getApiClient()` transport.
  Rationale: all applicant endpoints require an access token, and Phase 2 already established the shared authenticated client and refresh-token retry behavior.
- Applicant data normalization stays inside a dedicated mapper layer.
  Rationale: the backend returns snake_case fields such as `applicant_id`, `group_id`, and `github_url`, while pages and components should consume one stable frontend shape only.
- Phase 3 keeps the applicant experience group-scoped inside the existing `GroupDetailPage`.
  Rationale: every applicant belongs to a `groupId`, and the requested flow is "select group first, then manage applicants", so the frontend should extend the current group-detail surface instead of starting with a cross-group global list or introducing a new first-step page.
- The primary applicant list should load through `GET /applicants` with an explicit `groupId` filter even though the API makes that filter optional.
  Rationale: this keeps Phase 3 aligned with the group-scoped UX and avoids ambiguity about which group a newly created applicant belongs to.
- Applicant list pagination defaults follow the same backend-aligned values used in Phase 2: `page=1`, `size=20`.
  Rationale: `GET /applicants` exposes `page` and `size`, and using the same defaults as group pagination keeps the service helpers and URL handling predictable.
- Applicant list state should live in the URL search params on the group context screen.
  Rationale: preserving pagination in the URL keeps refresh, back/forward navigation, and applicant-detail return behavior stable without introducing extra global state.
- Applicant detail should use a dedicated route instead of only a modal.
  Rationale: `GET /applicants/{applicantId}` has its own loading and `APPLICANT_NOT_FOUND` failure states, and a route gives better refresh, direct-entry, and return-navigation behavior than a transient modal.
- GitHub URL validation must allow only GitHub profile URLs in the form `https://github.com/{owner}`.
  Rationale: the backend tech spec explicitly rejects repository URLs, so the frontend should block inputs such as `https://github.com/{owner}/{repo}` before submission and explain the expected profile-only format clearly.
- GitHub URL inputs should be auto-normalized to a canonical profile URL when the correction is safe.
  Rationale: the user chose automatic correction, so the form should trim whitespace, tolerate a trailing slash, and submit a canonical profile URL while still rejecting repository paths.
- Phase 3 should prioritize single-applicant registration rather than expanding the legacy CSV batch modal.
  Rationale: the available create API is `POST /applicants` for one applicant at a time, so single-item registration is the safest vertical slice for this phase.

## Dependency Graph

The implementation should move in this order:

1. Shared applicant contract, query normalization, and GitHub profile validation
2. Group-scoped applicant list slice on top of the existing group context
3. Applicant detail route with preserved return navigation
4. Applicant registration slice that submits within the selected group context
5. Legacy applicant-simulation isolation, terminology alignment, and final validation

This order delivers the first real read path before the write path, keeps the contract boundary stable first, and ensures the create flow is built on top of a working group-scoped browse experience.

## Backend Constraints That Shape This Plan

- All applicant endpoints require authentication.
- Every applicant must be created with a specific `groupId`.
- `POST /applicants` accepts only `groupId`, `name`, `email`, and `githubUrl`.
- `POST /applicants` returns only `applicant_id`, so any richer success UI needs a list refetch or follow-up detail fetch.
- `GET /applicants` supports `groupId`, `page`, and `size`.
- `GET /applicants/{applicantId}` returns `applicant_id`, `group_id`, `name`, `email`, and `github_url`.
- `GET /applicants/{applicantId}` can fail with `APPLICANT_NOT_FOUND`.
- `POST /applicants` can fail with `GROUP_NOT_FOUND` if the selected group no longer exists.
- The API spec text says `githubUrl` can be a profile or repository URL, but the backend tech spec narrows that contract to profile URLs only.
- The `GET /applicants` item shape is not fully enumerated in the API spec, so the mapper boundary should remain flexible until the real payload is verified.

## Applicant Flow Design

### List

- The first applicant-management surface should live inside the existing `GroupDetailPage` rather than on `/dashboard` or a separate first-step applicant page.
- Entering a group should expose an applicant list section that calls `GET /applicants` with that group's `groupId`.
- Applicant pagination should use applicant-specific search params so it does not collide with the existing group-list search params.
- Missing or invalid applicant pagination params should normalize to `page=1` and `size=20`.
- The applicant list should render loading, empty, error, and populated states.

### Detail

- Selecting an applicant from the group-scoped list should navigate to a dedicated applicant detail route.
- The navigation should preserve the originating group path and applicant-list query state in router state.
- The detail page should offer a back action that prefers the preserved list location and falls back to the selected group page.
- Direct entry to the applicant detail route should still work without prior router state.
- The detail page should distinguish `APPLICANT_NOT_FOUND`, expired-session errors, and generic network failures.

### Create

- Applicant registration should only be available after the user has entered a selected group context.
- The create form should derive `groupId` from the current group context instead of asking the user to type it manually.
- The form should collect `name`, `email`, and `githubUrl`, auto-normalize safe GitHub profile URL input, and validate the canonical result before calling `POST /applicants`.
- Repository URLs such as `https://github.com/owner/repository` should be rejected in the UI with a clear validation message.
- On success, the app should return the user to the same group-scoped applicant list context, refetch the list, and show a success message even if the new applicant is not immediately visible due to backend ordering.

## Task List

### Phase 1: Foundation and First Read Slice

## Task 1: Define the applicant service contract, query helpers, and GitHub validation boundary

**Description:** Add the shared applicant service layer on top of the existing authenticated API client. This task establishes the contract boundary for the whole phase by centralizing request builders, backend-aligned pagination defaults, `groupId`-aware query normalization, snake_case response normalization, and GitHub profile URL validation helpers.

**Acceptance criteria:**
- [ ] An applicant service module exposes named functions for create, list, and detail requests using the shared authenticated API client.
- [ ] Applicant query helpers normalize invalid or missing pagination input to `page=1` and `size=20`, and preserve an explicit `groupId` filter when present.
- [ ] Raw backend field names such as `applicant_id`, `group_id`, and `github_url` are mapped once in the service layer before UI consumption.
- [ ] A shared validation helper accepts only GitHub profile URLs in the form `https://github.com/{owner}`, auto-normalizes safe input variants to that canonical format, and rejects repository URLs.

**Verification:**
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Manual check: confirm pages and components consume normalized applicant objects and do not reference raw snake_case fields directly.
- [ ] Manual check: confirm the shared GitHub validation helper rejects `https://github.com/owner/repository`.

**Dependencies:** None

**Files likely touched:**
- `src/services/applicants/applicant-api.js`
- `src/services/applicants/applicant-mappers.js`
- `src/services/applicants/applicant-types.js`
- `src/services/api/api-types.js`

**Estimated scope:** Medium: 4 files

## Task 2: Implement the group-scoped applicant list slice

**Description:** Extend the selected-group experience so the user can fetch and browse applicants for one group through `GET /applicants`. This task delivers the first complete Phase 3 user flow by showing the current group's applicants, rendering loading and empty states, syncing applicant pagination with the URL, and keeping the list grounded in the existing group-management entry flow.

**Acceptance criteria:**
- [ ] Entering the chosen applicant-management surface fetches applicants from `GET /applicants` with the current `groupId`.
- [ ] The page reads and writes applicant pagination state through applicant-specific URL search params, with defaults normalized to `page=1` and `size=20`.
- [ ] The UI renders loading, empty, error, and populated states for the applicant list without depending on local room workspace data.

**Verification:**
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Manual check: opening the selected group route with applicant pagination query params sends those exact `groupId`, `page`, and `size` values to `GET /applicants`.

**Dependencies:** Task 1

**Files likely touched:**
- `src/pages/GroupDetailPage.jsx`
- `src/components/applicants/applicant-list-section.jsx`
- `src/components/applicants/applicant-pagination.jsx`
- `src/components/groups/group-detail-panel.jsx`

**Estimated scope:** Medium: 4 files

### Checkpoint: After Tasks 1-2

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] An authenticated user can enter a group and browse that group's applicant list
- [ ] Human review confirms the chosen group-scoped applicant entry surface before detail work begins

### Phase 2: Applicant Browsing Flow

## Task 3: Add the applicant detail route with preserved group return navigation

**Description:** Add a dedicated applicant detail page and wire list selection to it. This task completes the read-only applicant browse loop by fetching `GET /applicants/{applicantId}`, rendering the applicant's core identity fields, handling not-found and session errors explicitly, and restoring the previous group applicant-list context when the user navigates back.

**Acceptance criteria:**
- [ ] A route exists for the selected applicant detail path.
- [ ] Selecting an applicant from the group-scoped list navigates to the detail route and fetches that applicant by ID.
- [ ] The detail page renders the applicant name, email, GitHub profile URL, and owning `groupId`, and distinguishes `APPLICANT_NOT_FOUND` from session and network failures.

**Verification:**
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Manual check: from the group-scoped applicant list, open one applicant, return, and confirm the previous applicant pagination state is preserved.

**Dependencies:** Tasks 1-2

**Files likely touched:**
- `src/App.jsx`
- `src/pages/ApplicantDetailPage.jsx`
- `src/pages/GroupDetailPage.jsx`
- `src/components/applicants/applicant-detail-panel.jsx`

**Estimated scope:** Medium: 4 files

### Checkpoint: After Task 3

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] The user can browse from a group-scoped applicant list to applicant detail and back without losing list context
- [ ] Human review confirms the applicant detail route behavior before create work begins

### Phase 3: Registration Flow

## Task 4: Implement the applicant registration slice inside the selected group context

**Description:** Add the real applicant-create flow that submits `POST /applicants` from an already selected group. This task should collect `name`, `email`, and `githubUrl`, enforce the GitHub profile-only rule in the UI, surface validation and request errors, and return the user to the same group applicant list with a refetch after success.

**Acceptance criteria:**
- [ ] The create flow submits `groupId`, `name`, `email`, and `githubUrl` exactly as defined by the backend contract.
- [ ] The UI auto-normalizes safe GitHub profile URL input to the canonical `https://github.com/{owner}` format and still rejects repository URLs.
- [ ] On success, the app keeps the user on the same selected-group applicant list context, refreshes the list, and shows a success confirmation.

**Verification:**
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Manual check: submit a valid applicant from a selected group and confirm the request body includes that group's `groupId`.
- [ ] Manual check: try `https://github.com/owner/repository` and confirm the form blocks submission before the API request is sent.

**Dependencies:** Tasks 1-3

**Files likely touched:**
- `src/components/applicants/create-applicant-modal.jsx`
- `src/components/applicants/applicant-form-fields.jsx`
- `src/pages/GroupDetailPage.jsx`
- `src/services/applicants/applicant-api.js`

**Estimated scope:** Medium: 4 files

### Checkpoint: After Task 4

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] The user can browse a group's applicants, open one applicant detail page, and register a new applicant inside that same group context
- [ ] Human review confirms the GitHub URL validation copy and create-flow UX before final cleanup

### Phase 4: Cleanup and Validation

## Task 5: Align touched applicant entry points and complete final validation

**Description:** Finish the phase by aligning touched navigation and terminology around the real group-plus-applicant flow, isolating legacy local applicant simulation from the main path, and running the final validation pass. The goal is to leave the repository coherent for the later analysis-run phases without performing an unrelated app-wide rewrite.

**Acceptance criteria:**
- [ ] The touched list, detail, and create surfaces use consistent applicant-management terminology.
- [ ] The primary applicant-management flow no longer depends on local `workspaceData` or room-simulation state.
- [ ] Final validation status, skipped checks, and any remaining contract gaps are documented before handoff.

**Verification:**
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `npm run dev`
- [ ] `npm run preview`
- [ ] Manual check: sign in, open a group, browse applicants, open applicant detail, create an applicant with a valid GitHub profile URL, and return to the applicant list successfully.

**Dependencies:** Tasks 1-4

**Files likely touched:**
- `src/pages/GroupDetailPage.jsx`
- `src/pages/ApplicantDetailPage.jsx`
- `src/components/applicants/create-applicant-modal.jsx`
- `src/components/modals/AddApplicantsModal.jsx`

**Estimated scope:** Medium: 4 files

### Checkpoint: Complete

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] `npm run dev` starts successfully
- [ ] `npm run preview` starts successfully
- [ ] Authenticated users can browse a group's applicants, open applicant detail, and register a new applicant with a valid GitHub profile URL
- [ ] The finished implementation is ready for human review

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| The exact `GET /applicants` item shape is not fully spelled out in `docs/api-spec.md` | High | Keep list-item normalization in one mapper module and verify the real payload before polishing applicant cards |
| The API spec text and backend tech spec disagree on allowed `githubUrl` values | High | Treat the backend tech spec as the implementation source of truth and centralize GitHub profile validation in one shared helper used by the create UI |
| `POST /applicants` returns only `applicant_id`, so the new applicant may not be visibly present after create depending on backend ordering | Medium | Refetch the current list after create and show a success message even if the item is not immediately visible |
| The repository still contains legacy room-based applicant simulation components | Medium | Keep Phase 3 focused on the real group-scoped path and avoid mixing local simulated data into touched applicant pages |
| Introducing applicant UI in the wrong route can fragment the user journey between group detail and applicant management | Medium | Anchor Phase 3 in the existing group selection flow and confirm the final entry surface before implementation starts |

## Open Questions / Decisions Needed

- Resolved: keep the applicant list entry surface inside the existing `GroupDetailPage`.
- Resolved: after a successful applicant registration, keep the user on the applicant list instead of redirecting away from it.
- Resolved: auto-normalize safe GitHub profile URL input to a canonical form before submission.
- Applicant detail presentation: should detail use a dedicated route or reuse the legacy modal pattern?
  Recommended default: use a dedicated route for refresh, direct-entry, and clearer error handling.
- Registration scope: should Phase 3 cover only single-applicant registration, or also include CSV/batch upload?
  Recommended default: single-applicant registration only, because the available backend create API is one-applicant-per-request.
- Group selection in the create form: should the user be allowed to change the target group during applicant creation?
  Recommended default: no; keep `groupId` fixed to the currently selected group context to prevent accidental cross-group submissions.

## Verification

- [ ] Every task has acceptance criteria
- [ ] Every task has a verification step
- [ ] Dependencies are identified and ordered correctly
- [ ] No task is expected to touch more than about five files
- [ ] Checkpoints exist between major phases
- [ ] The human has reviewed and approved the plan

## Current Validation Notes

- Frontend-only verification completed in the current implementation turn:
  `npm run lint`, `npm run build`, `npm run dev`, and `npm run preview`
- `npm run dev` started successfully on an alternate local port because `5173` was already in use during validation.
- Backend-dependent manual checks remain pending because no backend was available in this environment.
- Pending backend-dependent checks:
  confirm the real `GET /applicants` response item shape matches the current mapper assumptions
  verify `POST /applicants` success plus list refetch behavior against the live API
  verify server-driven error branches such as `GROUP_NOT_FOUND`, `APPLICANT_NOT_FOUND`, and auth-expiry retry behavior
