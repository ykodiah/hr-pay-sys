## Regression Test Capture Plan

This plan outlines the unit and integration tests that must be automated once the promotion, change request, communication, and meetings APIs are available in staging. Each suite references the key backend endpoints the new pages rely on and the regression scenarios we need to guard.

### Promotions Service (`/promotions`)
- **Unit** `lib/api/promotions-service`: mock `fetch` and assert request payloads, error fallback to in-memory store, and salary delta calculations remain deterministic across retries.
- **Integration** `app/app/promotions/page`: mount with MSW to simulate API; verify pipeline fetch, case creation happy-path, reject/approve flows emit sync calls, and RBAC redirect when unauthorized roles visit the route.
- **Performance Budget**: track time to first byte for pipeline load (`<1.5s`) via Playwright trace to catch regressions after backend wiring.

### Change Requests Service (`/change-requests`)
- **Unit** `submitChangeRequest` + `updateChangeRequestStatus`: ensure request bodies include masked PII and reviewer metadata; assert toast errors when API rejects.
- **Integration** Self-service + HR reviewer pages: record playwright specs to submit change, verify HR console reflects new request, and status transitions propagate back to employee view.
- **Security Regression**: add contract test confirming RBAC denies non `hr-admin` roles (expects 403 + fallback panel).

### Communication Hub (`/communication/*`)
- **Unit** channel/message service wrappers: validate optimistic cache updates roll back on API failure and acknowledgements debounce duplicate calls.
- **Integration** conversation flow: spin up socket/mock server, send critical priority message requiring acknowledgement, ensure compliance panes update and audit log entries persist.
- **Accessibility Snapshot**: capture axe-core audits for composer and message inspector components to detect regressions when iterating on UI.

### Meetings Workspace (`/meetings`)
- **Unit** scheduling helper: confirm boolean flags for passcode/E2EE/recording translated to API payload and minutes update handles retries.
- **Integration** scheduling + AI pipeline: simulate API downtime to assert toast warnings trigger and cached state persists; verify minutes generation writes back to backend once service restored.
- **Cross-module Regression**: run nightly smoke hitting promotions + meetings sequentially to surface shared http-client regressions.

### Tooling & Automation
- Add **MSW** fixtures for all endpoints to support deterministic integration tests in CI.
- Introduce **Jest** project `tests/regression/*.test.ts` for service unit coverage and **Playwright** suite `tests/e2e/*.spec.ts` for page flows.
- Wire suites into `package.json` scripts (`test:regression`, `test:e2e`) and gate merges via CI once APIs are stable.

### Pending Actions
1. Provision staging API credentials and store via environment variables (`PROMOTIONS_API_URL`, `COMMUNICATION_API_URL`, etc.).
2. Implement MSW handlers mirroring backend contracts.
3. Add CI job running unit + e2e suites with nightly schedule.
4. Track pass/fail history in QA dashboard for audit readiness prior to release.
