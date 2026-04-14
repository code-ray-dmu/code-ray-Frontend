# Implementation Plan: Phase 4 AI Analysis and Question Retrieval

## Overview

This phase integrates the frontend with the async AI analysis flow described by the backend tech spec and the current [`docs/api-spec.md`](../api-spec.md). The target scope is the applicant-specific workflow for requesting AI analysis, tracking async execution through polling, and showing generated interview questions after completion. The preferred user journey is: enter an existing applicant detail page, request analysis once, watch the status machine update in real time, and review the generated questions on the same screen without falling back to the legacy room simulation UI.

This plan keeps the service-layer patterns established in earlier phases. The shared authenticated `api-client` remains the transport source of truth, and all backend response normalization should stay behind dedicated mapper helpers before UI code consumes the data.

## Architecture Decisions

- Phase 4 should use `ApplicantDetailPage` as the primary analysis entry surface.
  Rationale: question generation and analysis status are applicant-specific, and the existing detail route already owns applicant loading, error handling, and back navigation.
- Analysis-related API logic should live in a dedicated `src/services/analysis` domain.
  Rationale: this phase mixes applicant-scoped endpoints (`POST/GET /applicants/{id}/questions`) and analysis-run endpoints (`GET /analysis-runs/{id}`), so one feature-focused service boundary is clearer than spreading async logic across unrelated page files.
- The frontend should normalize raw backend statuses and stages into one applicant-level view model before rendering.
  Rationale: polling may return multiple `analysisRunIds`, and pages/components should not duplicate aggregation rules or string comparisons.
- Polling should track all returned `analysisRunIds`, but the UI should present one aggregated applicant-level progress surface.
  Rationale: the user cares about "this applicant's analysis" more than individual run IDs, while the backend contract still requires per-run polling.
- If any tracked analysis run ends in `FAILED`, the applicant-level aggregate state should be treated as `FAILED`.
  Rationale: the user explicitly chose failure-first aggregation instead of partial success, and the frontend should avoid implying the whole applicant analysis is usable when one required repository pipeline failed.
- The progress UI should be stage-driven and forward-compatible with unknown backend stages.
  Rationale: the backend tech spec confirms `SUMMARY` in the stage sequence, while the checked-in `docs/api-spec.md` is still behind; the UI must not break when a new stage appears.
- Generated questions should be fetched after all tracked runs complete successfully, and they should also auto-load when the backend rejects a new request with `ANALYSIS_RUN_ALREADY_COMPLETED`.
  Rationale: the user explicitly chose automatic existing-result loading so the conflict path remains useful.
- Revisit recovery should use the existing `GET /analysis-runs?applicantId=...` endpoint plus question retrieval instead of relying only on in-memory `analysisRunIds`.
  Rationale: the tech spec confirms applicant-filtered analysis-run listing, which gives the frontend a concrete recovery path after refresh or direct revisit.
- The real result UI for this phase should focus on the generated question list only, and each question card should show `questionText`, `intent`, `category`, and `priority`.
  Rationale: the tech spec already guarantees these fields for generated questions, while the summary report can wait for a later phase.
- The initial polling interval should be fixed at 3 seconds.
  Rationale: the user explicitly chose a 3-second cadence for the first implementation.
- This phase should keep the current JavaScript and JSX structure for touched frontend files.
  Rationale: earlier integration phases in this repository intentionally stayed on the current syntax stack to keep scope focused on API wiring and user flow.

## Dependency Graph

The implementation should move in this order:

1. Shared analysis contract, enum normalization, and mapper boundary
2. Analysis request slice on the applicant detail route
3. Polling state machine and aggregated progress state
4. Completed-result question retrieval and question list UI
5. Revisit recovery through analysis-run listing, conflict handling, and final validation

This order follows the async dependency chain from contract to trigger, then to long-running state tracking, then to final result rendering. It also fails fast on the highest-risk area first: the contract mismatch around `analysisRunIds`.

## Backend Constraints and Contract Gaps

- `GET /analysis-runs/{analysisRunId}` is documented in `docs/api-spec.md` and returns `status`, `current_stage`, `started_at`, and `completed_at`.
- The backend tech spec confirms that `POST /applicants/{applicantId}/questions` should return `{ success: true, analysisRunIds: [...] }`, but the checked-in `docs/api-spec.md` still documents only `{ success: true }`.
- The backend tech spec confirms the full stage order as `REPO_LIST -> FOLDER_STRUCTURE -> FILE_DETAIL -> SUMMARY -> QUESTION_GENERATION`, while the checked-in API spec is still missing `SUMMARY`.
- The backend tech spec defines `ANALYSIS_RUN_ALREADY_COMPLETED` as the HTTP error code when every selected repository already has a completed analysis.
- The backend tech spec confirms `GET /analysis-runs` supports `applicantId` filtering, which gives the frontend a concrete recovery path after refresh or revisit.
- The backend tech spec defines generated-question domain fields as `category`, `question_text`, `intent`, and `priority`, but the checked-in API spec still lacks a concrete response example for `GET /applicants/{applicantId}/questions`.
- The backend tech spec explains that worker failure identifiers such as `GITHUB_RATE_LIMIT_EXCEEDED` and `LLM_RESPONSE_PARSE_FAILED` live inside `analysis_runs.failure_reason`, not as HTTP `error.code` values.
- The aggregation rule for multiple returned `analysisRunIds` is still a frontend decision; this plan now fixes that rule as "any failed run makes the aggregate state `FAILED`".

The implementation should therefore treat the backend tech spec as the Phase 4 behavior source of truth, while keeping mapper and UI logic flexible enough to survive minor contract drift.

## Progress UI Shape

The main progress surface on `ApplicantDetailPage` should be designed around three layers:

### Request Layer

- Primary CTA to start analysis when no run is active
- Immediate pending/queued feedback after `POST /applicants/{applicantId}/questions`
- Friendly handling for already-completed analysis conflicts
- Automatic existing-question loading when `ANALYSIS_RUN_ALREADY_COMPLETED` is returned

### Live Progress Layer

- Overall status badge: `QUEUED`, `IN_PROGRESS`, `COMPLETED`, `FAILED`
- Aggregate run summary: total runs, completed runs, failed runs, latest update time
- Stage timeline: `REPO_LIST`, `FOLDER_STRUCTURE`, `FILE_DETAIL`, `SUMMARY`, `QUESTION_GENERATION` first, unknown backend stages appended dynamically
- Clear real-time labels for the active stage and terminal outcome
- Failure messaging that can surface a safe, user-facing interpretation of `failure_reason`

### Result Layer

- Completed banner or summary card
- Generated question list with loading, empty, error, and populated states
- Question cards that surface `questionText`, `intent`, `category`, and `priority`
- Retry or refresh affordance only where the backend allows it

## Task List

### Phase 1: Foundation and Request Slice

## Task 1: Define the analysis service contract and normalization boundary

**Description:** Add the shared Phase 4 service layer on top of the authenticated API client. This task establishes the contract boundary for the whole phase by centralizing request helpers, mapper functions, status/stage constants, run aggregation helpers, and question-response normalization.

**Acceptance criteria:**
- [ ] A dedicated analysis service module exposes named functions for requesting applicant analysis, fetching one analysis run, and fetching an applicant's generated questions.
- [ ] Raw backend fields such as `analysis_run_id`, `current_stage`, `started_at`, and `completed_at` are mapped once before UI consumption.
- [ ] Shared constants or helpers exist for `QUEUED`, `IN_PROGRESS`, `COMPLETED`, `FAILED` and for the confirmed stage order including `SUMMARY`, while still allowing unknown future stage strings to render safely.
- [ ] The service layer documents or guards the current contract gap where the checked-in API spec still omits `analysisRunIds` from the request response example.
- [ ] Generated-question mappers normalize the tech-spec-backed fields `category`, `questionText`, `intent`, and `priority` behind one frontend shape.
- [ ] Shared analysis constants include the fixed initial polling interval of 3 seconds.

**Verification:**
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Manual check: confirm pages/components consume camelCase analysis objects and do not reference raw snake_case response fields directly.

**Dependencies:** None

**Files likely touched:**
- `src/services/analysis/analysis-api.js`
- `src/services/analysis/analysis-mappers.js`
- `src/services/analysis/analysis-types.js`
- `src/services/api/api-types.js`

**Estimated scope:** Medium: 4 files

## Task 2: Implement the analysis request vertical slice on applicant detail

**Description:** Extend `ApplicantDetailPage` so the user can request analysis from the real backend and immediately see a stable request state. This task should add the first usable Phase 4 path: open one applicant, start analysis, receive `analysisRunIds`, disable duplicate submission while the request is in flight, and surface reanalysis conflicts clearly.

**Acceptance criteria:**
- [ ] `ApplicantDetailPage` includes a clear Phase 4 action area that can request analysis for the currently loaded applicant.
- [ ] Clicking the primary action calls `POST /applicants/{applicantId}/questions` and stores the returned `analysisRunIds` in local page state.
- [ ] The UI renders pending and request-error states, including a dedicated message for the `ANALYSIS_RUN_ALREADY_COMPLETED` path.
- [ ] If the backend rejects a new request because completed analysis already exists, the page automatically loads the existing question list instead of leaving the user on a generic failure state.

**Verification:**
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Manual check: from an applicant detail route, trigger the request once and confirm the UI moves into a queued/requested state without leaving the page.
- [ ] Manual check: trigger the known reanalysis-rejected backend path and confirm the page shows a specific recovery message instead of a generic network error.

**Dependencies:** Task 1

**Files likely touched:**
- `src/pages/ApplicantDetailPage.jsx`
- `src/components/applicants/applicant-detail-panel.jsx`
- `src/services/analysis/analysis-api.js`
- `src/services/api/api-types.js`

**Estimated scope:** Medium: 4 files

### Checkpoint: After Tasks 1-2

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] An authenticated user can open an applicant detail page and submit one real analysis request
- [ ] Human review confirms the chosen request CTA location and conflict copy before polling work begins

### Phase 2: Async Progress Tracking

## Task 3: Implement the polling state machine for multiple analysis runs

**Description:** Build the async engine that polls each returned `analysisRunId`, derives one applicant-level status machine, and stops safely when terminal states are reached or the page unmounts. This task should own interval setup/cleanup, terminal-state detection, and run aggregation rules.

**Acceptance criteria:**
- [ ] The page starts polling `GET /analysis-runs/{id}` for every returned `analysisRunId` after a successful request.
- [ ] Polling stops automatically when all tracked runs reach terminal states or when the user leaves the page.
- [ ] The frontend derives one applicant-level state from all tracked runs and distinguishes `QUEUED`, `IN_PROGRESS`, `COMPLETED`, and `FAILED` explicitly.
- [ ] The aggregation rule treats any failed run as applicant-level `FAILED`, even if another run completed.
- [ ] The aggregation logic is deterministic for mixed run states and does not rely on component-local ad hoc string checks.

**Verification:**
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Manual check: simulate or observe `QUEUED -> IN_PROGRESS -> COMPLETED` and confirm the page updates without a full reload.
- [ ] Manual check: navigate away during polling and confirm no duplicate polling loop continues in the background.

**Dependencies:** Tasks 1-2

**Files likely touched:**
- `src/pages/ApplicantDetailPage.jsx`
- `src/services/analysis/analysis-api.js`
- `src/services/analysis/analysis-mappers.js`
- `src/services/analysis/analysis-types.js`

**Estimated scope:** Medium: 4 files

## Task 4: Build the progress UI components and real-time stage feedback

**Description:** Add the visible progress layer that turns the polling state into a trustworthy user experience. This task should focus on the new progress component design: overall status badge, aggregate run summary, stage timeline, active-stage emphasis, and terminal-state messaging.

**Acceptance criteria:**
- [ ] A dedicated progress UI component renders the applicant-level analysis state on `ApplicantDetailPage`.
- [ ] The UI visibly reflects `QUEUED`, `IN_PROGRESS`, `COMPLETED`, and `FAILED`, plus the current backend stage such as `REPO_LIST`, `FOLDER_STRUCTURE`, `FILE_DETAIL`, `SUMMARY`, `QUESTION_GENERATION`, and any unknown future stage.
- [ ] The progress surface shows meaningful aggregate context when multiple runs are being tracked.
- [ ] Failed and terminal states have distinct copy and styling, not just a color change on one badge.
- [ ] Failed-state copy can incorporate a safe interpretation of backend `failure_reason` without exposing raw internal-only identifiers blindly.

**Verification:**
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Manual check: while polling is active, confirm the page visibly changes stage labels and progress messaging as backend state changes.
- [ ] Manual check: force a failed run path and confirm the user can understand that the analysis stopped and what to do next.

**Dependencies:** Task 3

**Files likely touched:**
- `src/components/analysis/analysis-progress-panel.jsx`
- `src/components/analysis/analysis-stage-timeline.jsx`
- `src/pages/ApplicantDetailPage.jsx`
- `src/services/analysis/analysis-types.js`

**Estimated scope:** Medium: 4 files

### Checkpoint: After Tasks 3-4

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] The applicant detail page can request analysis, poll run status, and show a live progress surface end to end
- [ ] Human review confirms the progress UI is understandable before question-result work begins

### Phase 3: Result Exposure and Recovery

## Task 5: Implement the generated question retrieval and question list UI

**Description:** Complete the happy-path Phase 4 workflow by loading generated questions after successful analysis and presenting them in a polished, applicant-focused layout. This task should cover the result fetch, mapping, and question-list states without reusing the legacy mock modal content directly.

**Acceptance criteria:**
- [ ] When all tracked runs complete successfully, the page fetches `GET /applicants/{applicantId}/questions`.
- [ ] The question result area renders loading, empty, error, and populated states.
- [ ] Generated questions are displayed in a dedicated result section that is visually distinct from the progress area.
- [ ] The question list defaults to backend-aligned priority ordering and can display the normalized fields `category`, `questionText`, `intent`, and `priority` in each card.
- [ ] The question list UI uses normalized frontend data only and remains stable even if the checked-in API spec example lags behind the tech spec.

**Verification:**
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Manual check: complete one real analysis flow and confirm the generated questions appear on the applicant detail page without a full page reload.
- [ ] Manual check: force an empty-result path and confirm the UI explains that analysis completed but no questions were returned.

**Dependencies:** Tasks 1-4

**Files likely touched:**
- `src/services/analysis/analysis-api.js`
- `src/services/analysis/analysis-mappers.js`
- `src/components/analysis/question-list-section.jsx`
- `src/components/analysis/question-card.jsx`
- `src/pages/ApplicantDetailPage.jsx`

**Estimated scope:** Medium: 5 files

## Task 6: Recover existing analysis state, finalize conflict handling, and complete validation

**Description:** Finish the phase by handling revisit scenarios cleanly, tightening the reanalysis-rejected path, and completing the final validation pass. This task should make the page coherent when the user reloads or returns to an applicant who already has analysis history by using the applicant-filtered analysis-run list plus generated-question retrieval.

**Acceptance criteria:**
- [ ] On revisit or refresh, the page uses `GET /analysis-runs?applicantId=...` to recover recent runs for the current applicant and rebuild the Phase 4 state.
- [ ] The page can recover a meaningful Phase 4 state for both existing completed analysis and still-active runs, according to the agreed backend contract.
- [ ] Reanalysis rejection falls back to existing results automatically instead of leaving the page in a dead-end error state.
- [ ] Final validation status, skipped checks, and remaining backend contract gaps are documented before handoff.
- [ ] Touched applicant and analysis surfaces use consistent terminology such as analysis, progress, stage, and generated questions.

**Verification:**
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `npm run dev`
- [ ] `npm run preview`
- [ ] Manual check: revisit an applicant with existing completed analysis and confirm the page shows coherent results without requiring a fresh request.

**Dependencies:** Tasks 1-5

**Files likely touched:**
- `src/pages/ApplicantDetailPage.jsx`
- `src/services/analysis/analysis-api.js`
- `src/components/analysis/analysis-progress-panel.jsx`
- `src/components/analysis/question-list-section.jsx`
- `src/components/applicants/applicant-list-section.jsx`

**Estimated scope:** Medium: 5 files

### Checkpoint: Complete

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] `npm run dev` starts successfully
- [ ] `npm run preview` starts successfully
- [ ] An authenticated user can request analysis, watch live progress, and review generated questions for one applicant
- [ ] Reanalysis rejection is handled intentionally and existing results remain accessible
- [ ] The finished implementation is ready for human review

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `POST /applicants/{applicantId}/questions` is still documented without `analysisRunIds` in `docs/api-spec.md` | High | Treat the backend tech spec as the source of truth for Phase 4 and keep a clear guard/failure path if the response shape is incomplete |
| The backend may return multiple run IDs with undocumented mixed-state behavior | High | Centralize aggregation rules in the analysis service layer and avoid duplicating them across components |
| The stage list may evolve beyond the currently checked-in API spec | High | Render known stages first, but allow unknown stage names to appear as dynamic timeline items rather than crashing or hiding progress |
| The checked-in API spec still lags the tech spec for question-response examples | Medium | Keep the mapper boundary thin but explicit and design the question cards around the tech-spec-backed minimal field set |
| Revisit and reload behavior can lose in-memory `analysisRunIds` | Medium | Recover state from `GET /analysis-runs?applicantId=...` plus question retrieval before final handoff |

## Resolved Decisions

- Primary entry surface: keep the start-analysis CTA on `ApplicantDetailPage` first.
- Multi-run aggregation: if any tracked run fails, the applicant-level aggregate state is `FAILED`.
- Reanalysis conflict UX: when `ANALYSIS_RUN_ALREADY_COMPLETED` is returned, the frontend auto-loads existing generated questions.
- Revisit recovery: use `GET /analysis-runs?applicantId=...` to recover recent run state after refresh or direct revisit.
- Conflict contract: use the backend tech-spec error code `ANALYSIS_RUN_ALREADY_COMPLETED` instead of matching human-readable message text.
- Result exposure scope: limit this phase to the generated question list, and show `questionText`, `intent`, `category`, and `priority` in each question card.
- Initial polling cadence: use a fixed 3-second interval.

## Open Questions / Decisions Needed

- None at the planning level. The primary entry surface, failure aggregation rule, automatic existing-result loading, revisit recovery path, result scope, conflict contract, and initial polling cadence have been resolved for Phase 4 planning.

## Verification

- [ ] Every task has acceptance criteria
- [ ] Every task has a verification step
- [ ] Dependencies are identified and ordered correctly
- [ ] No task is expected to touch more than about five files
- [ ] Checkpoints exist between major phases
- [ ] The human has reviewed and approved the plan
