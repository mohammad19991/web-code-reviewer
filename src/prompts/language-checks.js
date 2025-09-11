/**
 * QA Automation specific checks
 */
const QA_SPECIFIC_CHECKS = {
  qa: `QA Automation best practices (only if visible in diff)
- Flakiness:
  • Prefer data-test-id or accessibility identifiers over absolute XPath/CSS selectors.
  • Avoid brittle locators (auto-generated IDs, deeply nested selectors).
  • Use explicit waits/conditions (cy.intercept + wait) instead of hard sleeps (cy.wait).
- Test design:
  • Keep tests atomic and independent (no shared global state between tests).
  • Follow AAA (Arrange–Act–Assert) structure for clarity.
  • Use page objects/helpers to avoid duplication and centralize locator logic.
  • Avoid long monolithic test methods (>200 LOC); split into reusable steps.
- Maintainability:
  • Consistent naming for test data and accounts (qa_user, sandbox_key).
  • Centralize environment/config handling; avoid hardcoding URLs or envs in multiple places.
  • Cleanup created data (test accounts, browser storage, cookies) at teardown.
  • Use fixtures/factories for repeatable test data instead of inline hardcoded blobs.
- Performance:
  • Minimize heavy setup/teardown in every test (favor suite-level setup with isolation).
  • Parallelize tests safely (ensure isolation of sessions/data).
  • Avoid loading large datasets directly into test memory (stream/generate as needed).
- Reporting & observability:
  • Ensure failures produce actionable logs, screenshots, or videos.
  • Redact secrets/tokens from test output and reports.
  • Tag/annotate tests by category (smoke, regression, e2e) for selective runs.
- Framework specifics:
  • Cypress/Web: prefer cy.intercept() over stubbing XHR manually; use cypress-testing-library for user-centric queries.
`
};

/**
 * Language-specific code review checks
 */

const LANGUAGE_SPECIFIC_CHECKS = {
  js: `JavaScript/TypeScript Checks (only if visible in diff; do not assume unseen code)
React:
- Unstable hook deps (useEffect/useMemo/useCallback) when deps omit referenced vars or include unstable inline values. Anchor hook + deps. Default: evidence_strength=3, confidence=0.7.
- Heavy work in render (expensive ops in component/JSX). Anchor call chain. Default: 3, 0.7 (cap to 2, 0.5 if data size unknown).
- Missing cleanup in useEffect for subscriptions/timers/sockets. Anchor effect body; Default: 4, 0.8.
- dangerouslySetInnerHTML: user-controlled → auto-critical (security); static → suggestion.
- Index-as-key in dynamic lists. Anchor JSX key; Default: 2, 0.5.
- Un-memoized context values/expensive props passed deep; consider useMemo/useCallback. Default: 2–3, 0.5–0.7.
- Consider React.lazy/Suspense for clearly large modules.

TypeScript:
- any/unknown leakage across module boundaries (exports). Anchor export signature. Default: 3, 0.7.
- Unsafe narrowing/non-null (!) where undefined is possible. Default: 3, 0.7.
- Ambient/global type mutations widening types. Default: 3, 0.6.

Fetch/IO:
- Missing AbortController/timeout on fetch/axios; no cancellation for long-lived calls. Default: 3, 0.7.
- No retry/backoff for critical idempotent calls. Default: 2, 0.5.
- Leaking subscriptions/websockets or unbounded setInterval. Default: 4, 0.8 if no cleanup.
- URL.createObjectURL without revokeObjectURL. Default: 3, 0.7.

Performance:
- N+1 renders/effects (loop-triggered state/effects). Default: impact=2, exploitability=2, likelihood=2, blast_radius=1, evidence_strength=2, confidence=0.5–0.7.
- O(n^2) work in render over props/state. Default: impact=3, exploitability=2, likelihood=2, blast_radius=2, evidence_strength=3, confidence=0.7.
- Large lists without virtualization when clearly large. Default: impact=2, exploitability=2, likelihood=2, blast_radius=1, evidence_strength=2, confidence=0.5.

- Event burst control (debounce/throttle in high-frequency handlers such as onChange, scroll, resize, keypress):
  • If no debounce/throttle and heavy work is observed → impact=3–4, exploitability=3, likelihood=3, blast_radius=2, evidence_strength=3–4, confidence=0.7–0.8. Severity_proposed = critical if severity_score ≥ 3.60.
  • If debounce/throttle exists but is misused (e.g., recreated on every render, wait=0, unstable deps, no cleanup) → impact=2–3, exploitability=2, likelihood=2, blast_radius=1, evidence_strength=2–3, confidence=0.5–0.6. Severity_proposed = suggestion unless severity_score ≥ 3.60.
  • If effective debounce/throttle is present (stable via useMemo/useCallback/useRef and wait ≥ ~100ms for text input) → impact=0, exploitability=0, likelihood=0, blast_radius=0, evidence_strength=2, confidence=0.5. Severity_proposed = suggestion or no issue.

Security (additional):
- User-controlled URLs in navigation APIs without validation. Default: 3, 0.6 (critical only if taint is clear).
- Tokens stored in localStorage/sessionStorage → auto-critical unless strong mitigations. Anchor storage write. Default: 4–5, 0.8.
- URL.createObjectURL used with untrusted blobs without checks. Default: 3, 0.6.

Accessibility:
- Only mark critical if core flows are blocked; otherwise suggestion with evidence_strength ≤ 2.

Note: Use post-patch line numbers. If only diff hunk is known or source is uncertain, set evidence_strength ≤ 2 and confidence ≤ 0.5, and prefix fix_code_patch with "// approximate".`,

  python: `Python-Specific Checks (apply only if visible in the diff; do not assume unseen code). 

Performance:
- Whole-dataset loads: pandas/json/db result sets fully materialized where streaming/chunking is feasible. Default evidence=3, confidence=0.7.
- Blocking I/O in async: requests/file/db sync calls inside async def. Default 4, 0.8.
- Unbounded recursion on large inputs. Default 3, 0.7.
- Global caches without eviction (LRU maxsize=None, custom caches). Default 3, 0.7.

Maintainability:
- Circular imports / tight coupling across changed modules. Default 3, 0.6.
- Monolithic scripts accumulating unrelated concerns. Default 2, 0.5.
- Bare except / broad except without re-raise or logging. Default 3, 0.7.
- Mutable default arguments (def f(x=[], y={})). Default 4, 0.8.

Best practices:
- Missing context managers (with open/socket/lock). Default 4, 0.8 if leaks likely.
- requests without timeout / no retry/backoff for critical idempotent calls. Default 3, 0.7.
- Weak logging / no redaction of secrets/PII. Default 4, 0.8.
- Globals shared in concurrency without locks/async primitives. Default 3, 0.7.

Concurrency & Async:
- Thread/task leaks (no join/cancel), unbounded executors. Default 4, 0.8.
- Blocking calls (time.sleep/CPU loops) inside async def without executor. Default 4, 0.8.

Web (Django/Flask/FastAPI):
- CSRF disabled/missing on state-changing routes → auto-critical.
- debug=True in production paths/config → auto-critical if unguarded.
- Open CORS (*) with credentials → 4, 0.8 (critical if prod).
- Template autoescape disabled → auto-critical.
- Unsanitized input passed to render_template/context → critical if taint is clear.

Note: Use post-patch line numbers. If only diff hunk is known or source is uncertain, set evidence_strength ≤ 2 and confidence ≤ 0.5, and prefix fix_code_patch with "// approximate".
`,

  java: `Java Language-Specific Checks (apply only if visible in the diff; do not assume unseen code). 
  
Performance:
- N+1 queries / queries in loops. Anchor loop + query. Default 4,0.8.
- O(n^2) hot paths in request/critical code. Anchor nested loops. Default 3,0.7.
- Blocking I/O without timeouts/retries. Anchor client call. Default 3,0.7.
- Inefficient collections/boxing; String concat in loops. Anchor site. Default 2–3,0.6–0.7.
- Whole-object loads vs streaming. Anchor repo/service call. Default 3,0.6.

Maintainability:
- Bare catch(Exception)/swallow. Anchor try/catch. Default 3,0.7.
- Missing try-with-resources (leaks). Anchor resource acquisition. Default 4,0.8.
- Cyclic deps/god classes. Anchor imports/large class. Default 2,0.5.
- Ignoring InterruptedException. Anchor catch block. Default 3,0.7.
- equals/hashCode contract issues. Anchor methods. Default 3,0.7.

Best practices:
- Missing Bean Validation on DTO/controller params. Anchor annotations/sigs. Default 3,0.7.
- Null handling/Optional misuse. Anchor method sigs. Default 2,0.6.
- Concurrency misuse (unsafe publish, non-threadsafe collections). Anchor shared field + access. Default 4,0.8.
- Streams misuse in hot paths. Anchor pipeline. Default 2–3,0.6–0.7.

Web (Spring/Jakarta):
- Open CORS (* with credentials). Anchor CORS config. Default 3,0.7.
- Missing @Transactional around multi-step DB ops. Anchor service method. Default 3,0.7.
- Exception leakage (no ControllerAdvice). Anchor config. Default 3,0.7.
- HTTP clients without timeouts/backoff. Anchor builder. Default 3,0.7.

Note: Use post-patch line numbers. If only diff hunk is known or source is uncertain, set evidence_strength ≤ 2 and confidence ≤ 0.5, and prefix fix_code_patch with "// approximate".
`,

  php: `PHP Language-Specific Checks

Performance:
- N+1: queries in loops. Anchor loop + query. Default 4,0.8.
- Expensive ops in request path (large arrays, heavy regex, repeated json_encode). Anchor site. Default 3,0.7.
- Unbounded output buffering. Anchor buffering usage. Default 2,0.6.

Maintainability:
- Mixed concerns/monolithic scripts. Anchor sections. Default 2,0.5.
- Broad catch/silent errors; error suppression with "@". Anchor site. Default 3,0.7.
- Global state across modules/superglobals. Anchor usage. Default 3,0.7.
- Missing param/return types in modern PHP. Anchor function sigs. Default 2–3,0.6–0.7.

Best practices:
- Missing declare(strict_types=1) where standard applies. Anchor header. Default 2,0.6.
- Loose comparisons (==) in sensitive contexts. Anchor comparison. Default 3,0.7.
- include/require without checks vs Composer autoload. Anchor include. Default 2,0.5.
- HTTP clients without timeouts/backoff. Anchor options. Default 3,0.7.
- Logging PII/secrets without redaction. Anchor logger. Default 4,0.8.

Web (Laravel/Symfony/Vanilla):
- Missing validation for user input (FormRequest/Validator). Anchor controller. Default 3,0.7.
- Mass assignment via Model::create($request->all()) without $fillable. Anchor model usage. Default 3,0.7.
- display_errors/Debug enabled in prod. Anchor config. Default 3,0.7.
- Session/cookie flags (secure/httponly/samesite) missing. Anchor config. Default 3,0.7.
- File uploads missing validation or stored under webroot. Anchor handler. Default 3,0.7.

Note: Use post-patch line numbers. If only diff hunk is known or source is uncertain, set evidence_strength ≤ 2 and confidence ≤ 0.5, and prefix fix_code_patch with "// approximate".`,

  qa_web: QA_SPECIFIC_CHECKS.qa,
  qa_android: QA_SPECIFIC_CHECKS.qa,
  qa_backend: QA_SPECIFIC_CHECKS.qa
};

module.exports = LANGUAGE_SPECIFIC_CHECKS;
