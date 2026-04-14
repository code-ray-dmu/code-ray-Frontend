# Implementation Plan: Phase 1 Auth API Integration

## Overview

This plan covers the first frontend API integration slice for authentication based on [`docs/api-spec.md`](../api-spec.md). The target scope is limited to `POST /v1/users/sign-up`, `POST /v1/users/sign-in`, and `POST /v1/users/refresh-token`, plus the minimum UI work required to verify the flow in the browser. The goal of this phase is to leave the app in a working state where a user can sign up, sign in, persist tokens in `localStorage`, land on `/dashboard`, and manually verify refresh-token behavior from a small dashboard test surface.

## Architecture Decisions

- Token storage uses `localStorage` for both `access_token` and `refresh_token`.
  Rationale: the current API spec returns tokens in the JSON body, and `localStorage` is the simplest option for frontend-only integration and early verification.
- Successful sign-in redirects to `/dashboard`.
  Rationale: `/dashboard` already exists and is the most natural authenticated landing page for this project.
- Successful sign-up redirects to `/login`.
  Rationale: this keeps Phase 1 behavior simple and avoids coupling sign-up and sign-in side effects in one task.
- This phase keeps the current JavaScript and JSX structure instead of introducing a TypeScript migration.
  Rationale: the team decided to avoid a syntax-layer migration during the auth integration phase and keep the scope on API wiring only.
- Refresh handling is implemented in a shared Axios instance with a single retry guard.
  Rationale: token refresh belongs in the transport layer so individual pages and service functions stay simple.
- A small dashboard auth debug panel is used instead of a dedicated `/auth-test` page.
  Rationale: it verifies the real post-login path without adding an extra temporary route.

## Dependency Graph

The work should be implemented in this order:

1. Shared API contract and Axios client foundation
2. Token storage and auth session helpers
3. Sign-up vertical slice
4. Sign-in vertical slice
5. Refresh-token retry flow
6. Dashboard verification UI and final hardening

This order keeps contract and persistence concerns in place before UI wiring, and it surfaces refresh-risk early enough to fail fast before polishing.

## Task List

### Phase 1: Foundation

## Task 1: Create auth API foundation

**Description:** Add the shared transport layer needed for all auth requests. This task establishes the Axios dependency, the base API client, and typed API envelope definitions so later auth tasks can reuse one consistent contract.

**Acceptance criteria:**
- [x] `axios` is added to project dependencies and is available for frontend API calls.
- [x] A shared API client module exists with `baseURL` support from `VITE_API_BASE_URL` and default JSON headers.
- [x] Shared response envelope types exist for success and error responses defined by `docs/api-spec.md`.

**Verification:**
- [ ] Lint passes: `npm run lint` (`src/components/modals/AddApplicantsModal.jsx`, `src/components/modals/ApplicantDetailModal.jsx` have pre-existing repo errors unrelated to Task 1)
- [x] Build succeeds: `npm run build`
- [x] Manual check: run `npm run dev` and confirm the app still starts without runtime import errors after the new API foundation is added.

**Dependencies:** None

**Files likely touched:**
- `package.json`
- `src/services/api/api-client.js`
- `src/services/api/api-types.js`
- `src/main.jsx`
- `src/App.jsx`

**Estimated scope:** Medium: 3-5 files

## Task 2: Add localStorage-based auth session utilities

**Description:** Create the storage and session helper layer that owns all token read, write, and clear behavior. This task isolates `localStorage` access so pages and API functions do not manipulate tokens directly.

**Acceptance criteria:**
- [x] A token storage module exists for saving, reading, and clearing `access_token` and `refresh_token`.
- [x] Auth session helper functions expose explicit return types and named exports only.
- [x] Direct token persistence logic is not duplicated inside page components.

**Verification:**
- [ ] Lint passes: `npm run lint` (`src/components/modals/AddApplicantsModal.jsx`, `src/components/modals/ApplicantDetailModal.jsx` have pre-existing repo errors unrelated to Task 2)
- [x] Build succeeds: `npm run build`
- [ ] Manual check: in the browser console, confirm that calling the session helper flow from the app stores and removes the expected keys in `localStorage` (`window.__CODE_RAY_AUTH__` is exposed in dev mode to support this check)

**Dependencies:** Task 1

**Files likely touched:**
- `src/services/api/token-storage.js`
- `src/services/auth/auth-session.js`
- `src/services/auth/auth-types.js`

**Estimated scope:** Medium: 3-5 files

### Checkpoint: After Tasks 1-2

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] The app boots with the new API and storage foundation in place
- [ ] Human review confirms the auth foundation matches the API spec before UI work begins

### Phase 2: Core Auth Flows

## Task 3: Implement the sign-up vertical slice

**Description:** Connect the existing signup page to the real `POST /v1/users/sign-up` endpoint with typed request and response handling, client-side validation, and a redirect to `/login` after success.

**Acceptance criteria:**
- [x] A typed `signUp` API function exists and posts the exact request body defined by the spec: `email`, `password`, `name`.
- [x] The signup page submits to the real API, shows pending and error states, and handles `USER_EMAIL_CONFLICT` with a user-friendly message.
- [x] On successful sign-up, the user is redirected to `/login` without automatically creating a signed-in session.

**Verification:**
- [ ] Lint passes: `npm run lint` (`src/components/modals/AddApplicantsModal.jsx`, `src/components/modals/ApplicantDetailModal.jsx` have pre-existing repo errors unrelated to Task 3)
- [x] Build succeeds: `npm run build`
- [ ] Manual check: sign up with a new email and confirm redirect to `/login` (backend/manual browser flow not executed in this CLI turn)
- [ ] Manual check: attempt sign-up with an already used email and confirm the conflict message is shown (backend/manual browser flow not executed in this CLI turn)

**Dependencies:** Tasks 1-2

**Files likely touched:**
- `src/services/auth/auth-api.js`
- `src/services/auth/auth-types.js`
- `src/pages/SignupPage.jsx`
- `src/App.jsx`

**Estimated scope:** Medium: 3-5 files

## Task 4: Implement the sign-in vertical slice

**Description:** Connect the existing login page to the real `POST /v1/users/sign-in` endpoint, persist both tokens through the session layer, and redirect the user to `/dashboard` on success.

**Acceptance criteria:**
- [x] A typed `signIn` API function exists and maps `data.access_token` and `data.refresh_token` from the API spec.
- [x] The login page submits to the real API, shows pending and error states, and handles `AUTH_INVALID_CREDENTIALS` with a user-friendly message.
- [x] On successful sign-in, both tokens are stored through the auth session helpers and the user is redirected to `/dashboard`.

**Verification:**
- [ ] Lint passes: `npm run lint` (`src/components/modals/AddApplicantsModal.jsx`, `src/components/modals/ApplicantDetailModal.jsx` have pre-existing repo errors unrelated to Task 4)
- [x] Build succeeds: `npm run build`
- [ ] Manual check: sign in with a valid account, confirm redirect to `/dashboard`, and confirm both tokens exist in `localStorage` (backend/manual browser flow not executed in this CLI turn)
- [ ] Manual check: sign in with invalid credentials and confirm the error message is shown (backend/manual browser flow not executed in this CLI turn)

**Dependencies:** Tasks 1-2

**Files likely touched:**
- `src/services/auth/auth-api.js`
- `src/services/auth/auth-session.js`
- `src/pages/LoginPage.jsx`
- `src/App.jsx`

**Estimated scope:** Medium: 3-5 files

## Task 5: Implement refresh-token retry behavior

**Description:** Add the `POST /v1/users/refresh-token` call and wire the shared Axios client so protected requests can attempt a one-time access-token refresh before failing. This task completes the core auth transport behavior.

**Acceptance criteria:**
- [x] A typed `refreshAccessToken` API function exists and posts `{ refreshToken }` exactly as defined by the spec.
- [x] The shared Axios response interceptor retries a failed protected request once after a successful refresh and prevents infinite retry loops.
- [x] If refresh fails with `AUTH_TOKEN_EXPIRED`, `AUTH_TOKEN_INVALID`, or `AUTH_REFRESH_TOKEN_REVOKED`, the stored auth session is cleared.

**Verification:**
- [ ] Lint passes: `npm run lint` (`src/components/modals/AddApplicantsModal.jsx`, `src/components/modals/ApplicantDetailModal.jsx` have pre-existing repo errors unrelated to Task 5)
- [x] Build succeeds: `npm run build`
- [ ] Manual check: with valid stored tokens, trigger a protected request that requires refresh and confirm the request eventually succeeds (no protected API route is wired in the UI yet, so this browser/backend validation remains pending)
- [ ] Manual check: simulate refresh failure and confirm auth tokens are removed from `localStorage` (browser/backend validation remains pending)

**Dependencies:** Tasks 1-4

**Files likely touched:**
- `src/services/api/api-client.js`
- `src/services/api/token-storage.js`
- `src/services/auth/auth-api.js`
- `src/services/auth/auth-session.js`
- `src/services/auth/auth-types.js`

**Estimated scope:** Medium: 3-5 files

### Checkpoint: After Tasks 3-5

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Sign-up works end-to-end and redirects to `/login`
- [ ] Sign-in works end-to-end and redirects to `/dashboard`
- [ ] Refresh-token retry works once and clears the session on terminal failure
- [ ] Human review confirms the auth flow is understandable before debug UI polish

### Phase 3: Verification UI and Hardening

## Task 6: Add dashboard auth verification UI

**Description:** Add a small auth debug panel to the dashboard so the team can inspect current session state and manually verify refresh behavior without needing a separate temporary route.

**Acceptance criteria:**
- [x] The dashboard includes a small auth debug area visible after login.
- [x] The debug UI shows whether `access_token` and `refresh_token` are currently stored.
- [x] The debug UI provides a manual refresh action and a sign-out action that clears the stored session.

**Verification:**
- [ ] Lint passes: `npm run lint` (`src/components/modals/AddApplicantsModal.jsx`, `src/components/modals/ApplicantDetailModal.jsx` have pre-existing repo errors unrelated to Task 6)
- [x] Build succeeds: `npm run build`
- [ ] Manual check: after login, open `/dashboard` and verify the panel shows token presence correctly (browser/backend validation remains pending)
- [ ] Manual check: click the manual refresh action and confirm the latest auth state is reflected (browser/backend validation remains pending)
- [ ] Manual check: click sign out and confirm tokens are cleared and protected session state is removed (browser/backend validation remains pending)

**Dependencies:** Tasks 4-5

**Files likely touched:**
- `src/pages/DashboardPage.jsx`
- `src/components/auth/auth-debug-panel.jsx`
- `src/services/auth/auth-session.js`

**Estimated scope:** Medium: 3-5 files

## Task 7: Final polish, route cleanup, and validation

**Description:** Finish the phase by cleaning up auth-related file transitions, aligning error copy and route imports, and running the final validation pass so the repository remains in a working state.

**Acceptance criteria:**
- [x] Only auth-related files and directly modified pages are updated in this phase without a broad syntax migration.
- [x] Route imports and app entry files are updated so the auth pages build correctly in the current JavaScript and JSX setup.
- [x] Final validation is complete and any skipped checks or known gaps are documented before implementation handoff.

**Verification:**
- [x] Lint passes: `npm run lint`
- [x] Build succeeds: `npm run build`
- [ ] Manual check: `npm run dev` starts successfully and the sign-up, sign-in, dashboard landing, refresh, and sign-out flow still work after cleanup (`npm run dev` and `npm run preview` start successfully; full browser/backend flow remains pending manual verification)

**Dependencies:** Tasks 1-6

**Files likely touched:**
- `src/App.jsx`
- `src/main.jsx`
- `src/pages/LoginPage.jsx`
- `src/pages/SignupPage.jsx`
- `src/pages/DashboardPage.jsx`

**Estimated scope:** Medium: 3-5 files

### Checkpoint: Complete

- [x] `npm run lint` passes
- [x] `npm run build` passes
- [x] `npm run dev` starts without runtime errors
- [ ] User can sign up, sign in, land on `/dashboard`, refresh a token, and sign out (full browser/backend validation remains pending manual verification)
- [x] Token persistence uses `localStorage` only through the shared session layer
- [x] The finished implementation is ready for human review

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| The real backend response may differ from `docs/api-spec.md` | High | Keep shared API envelope types centralized and adjust only the service layer if contract mismatches appear |
| Automatic refresh can create retry loops or duplicate requests | High | Add a single retry guard on Axios request config and do not retry the refresh request itself |
| A syntax-layer migration during auth work could create avoidable import friction | Medium | Keep the auth phase on the existing JavaScript and JSX stack and limit changes to API wiring |
| `localStorage` is less secure than cookie-based auth | Medium | Isolate persistence in one module so a future cookie migration can replace storage without rewriting page logic |
| Existing dashboard UI may not be designed for auth state display | Low | Keep the debug panel visually small and isolated so it does not disturb current dashboard flows |

## Open Questions

- None for Phase 1. The required human decisions for token storage, post-login route, post-sign-up route, and syntax migration scope have been resolved.

## Verification

- [x] Every task has acceptance criteria
- [x] Every task has a verification step
- [x] Dependencies are identified and ordered correctly
- [ ] No task is expected to touch more than about five files
- [x] Checkpoints exist between major phases
- [x] The human has reviewed and approved the plan
