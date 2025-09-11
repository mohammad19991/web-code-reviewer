/**
 * QA Automation specific checks
 */
const QA_SPECIFIC_CHECKS = {
  qa_web: `Cypress Web Automation Checks (only if visible in diff; do not assume unseen code)

Test Reliability & Stability:
- Hardcoded waits (cy.wait ≥ 3000ms) → Anchor: cy.wait(number) call. Default: evidence=4, confidence=0.8 (≥5000ms); evidence=3, confidence=0.6 (3000-4999ms).
- Brittle selectors (nth-child, complex CSS, auto-generated classes) → Anchor: selector string. Default: evidence=4, confidence=0.8.
- Missing proper waits (no cy.should or cy.intercept before actions) → Anchor: action without wait. Default: evidence=3, confidence=0.7.
- Tests without proper isolation (shared beforeEach state) → Anchor: shared variable usage. Default: evidence=3, confidence=0.7.
- Missing cleanup hooks (no afterEach for browser state) → Anchor: test without cleanup. Default: evidence=3, confidence=0.7.

Cypress Best Practices:
- Missing cy.intercept() for API calls → Anchor: cy.request or network call. Default: evidence=3, confidence=0.7.
- Not using cy.session() for authentication → Anchor: repeated login in beforeEach. Default: evidence=3, confidence=0.7.
- Accessing DOM elements without proper commands → Anchor: direct DOM access. Default: evidence=2, confidence=0.6.
- Missing custom commands for repeated actions → Anchor: duplicated action sequences. Default: evidence=2, confidence=0.5.
- Using cy.get() without data-testid or accessibility attributes → Anchor: CSS selector usage. Default: evidence=2, confidence=0.6.

Test Organization & Maintainability:
- Tests without descriptive names → Anchor: it() or describe() with unclear names. Default: evidence=2, confidence=0.6.
- Missing Page Object Model for complex flows → Anchor: repeated selector/action patterns. Default: evidence=2, confidence=0.5.
- Monolithic test methods (>100 lines) → Anchor: large test function. Default: evidence=2, confidence=0.6.
- Missing test categorization (no proper describe blocks) → Anchor: flat test structure. Default: evidence=2, confidence=0.5.

Performance & Resource Management:
- Loading large fixtures unnecessarily → Anchor: fixture loading. Default: evidence=2, confidence=0.6.
- Not using cy.session() causing repeated authentication → Anchor: repeated login calls. Default: evidence=3, confidence=0.7.
- Missing viewport configuration for responsive tests → Anchor: responsive test without viewport. Default: evidence=2, confidence=0.5.

Test Data & Environment:
- Hardcoded environment URLs in test code → Anchor: URL string. Default: evidence=3, confidence=0.7.
- Missing proper test data cleanup → Anchor: data creation without cleanup. Default: evidence=3, confidence=0.7.
- Using production-like data without proper isolation → Anchor: real data usage. Default: evidence=2, confidence=0.6.

Note: Use post-patch line numbers. If only diff hunk is known or source is uncertain, set evidence_strength ≤ 2 and confidence ≤ 0.5, and prefix fix_code_patch with "// approximate".`,

  qa_android: `Appium Android Automation Checks (only if visible in diff; do not assume unseen code)

Test Reliability & Stability:
- Hardcoded waits (Thread.sleep ≥ 3000ms) → Anchor: Thread.sleep() call. Default: evidence=4, confidence=0.8 (≥5000ms); evidence=3, confidence=0.6 (3000-4999ms).
- Brittle locators (absolute XPath, index-based, UI hierarchy) → Anchor: locator string. Default: evidence=4, confidence=0.8.
- Missing proper waits (no WebDriverWait with ExpectedConditions) → Anchor: action without wait. Default: evidence=3, confidence=0.7.
- Tests without app state isolation → Anchor: @Test without app reset. Default: evidence=3, confidence=0.7.
- Missing proper device cleanup → Anchor: test without @AfterEach cleanup. Default: evidence=3, confidence=0.7.

Appium Best Practices:
- Not using resource-id or accessibility-id → Anchor: XPath or className locator. Default: evidence=3, confidence=0.7.
- Missing proper capability management → Anchor: hardcoded capabilities. Default: evidence=2, confidence=0.6.
- Not handling device permissions properly → Anchor: permission-related operations. Default: evidence=2, confidence=0.6.
- Missing proper app lifecycle management → Anchor: app state changes. Default: evidence=3, confidence=0.7.
- Using deprecated locator strategies → Anchor: outdated locator methods. Default: evidence=2, confidence=0.6.

Test Organization & Maintainability:
- Tests without descriptive method names → Anchor: @Test method with unclear name. Default: evidence=2, confidence=0.6.
- Missing Page Object Model for screen interactions → Anchor: repeated locator/action patterns. Default: evidence=2, confidence=0.5.
- Monolithic test methods (>150 lines) → Anchor: large test method. Default: evidence=2, confidence=0.6.
- Missing proper test categorization (@Category, @Tag) → Anchor: test without categories. Default: evidence=2, confidence=0.5.

Performance & Resource Management:
- Creating driver instances in every test → Anchor: new driver creation. Default: evidence=3, confidence=0.7.
- Not reusing app sessions efficiently → Anchor: repeated app installation. Default: evidence=2, confidence=0.6.
- Missing proper timeout configurations → Anchor: missing timeout settings. Default: evidence=2, confidence=0.6.
- Loading large test data sets inefficiently → Anchor: large data loading. Default: evidence=2, confidence=0.5.

Device & Environment Management:
- Hardcoded device configurations → Anchor: hardcoded device properties. Default: evidence=3, confidence=0.7.
- Missing proper error handling for device-specific issues → Anchor: device operation without error handling. Default: evidence=2, confidence=0.6.
- Not handling different Android versions properly → Anchor: version-specific code without checks. Default: evidence=2, confidence=0.6.

Note: Use post-patch line numbers. If only diff hunk is known or source is uncertain, set evidence_strength ≤ 2 and confidence ≤ 0.5, and prefix fix_code_patch with "// approximate".`,

  qa_backend: `RestAssured API Testing Checks (only if visible in diff; do not assume unseen code)

Test Reliability & Stability:
- Hardcoded waits (Thread.sleep ≥ 3000ms) → Anchor: Thread.sleep() call. Default: evidence=4, confidence=0.8 (≥5000ms); evidence=3, confidence=0.6 (3000-4999ms).
- Tests hitting production endpoints → Anchor: baseURI with production domain. Default: evidence=5, confidence=0.9.
- Missing proper retry logic for flaky network operations → Anchor: network call without retry. Default: evidence=3, confidence=0.7.
- Tests without proper data isolation → Anchor: @Test without cleanup. Default: evidence=3, confidence=0.7.
- Missing timeout configurations for HTTP calls → Anchor: request without timeout. Default: evidence=3, confidence=0.7.

RestAssured Best Practices:
- Not using given-when-then pattern consistently → Anchor: request without proper structure. Default: evidence=2, confidence=0.6.
- Missing response schema validation → Anchor: API call without schema check. Default: evidence=3, confidence=0.7.
- Not validating HTTP status codes properly → Anchor: request without status validation. Default: evidence=3, confidence=0.7.
- Missing proper request/response logging → Anchor: request without logging configuration. Default: evidence=2, confidence=0.5.
- Using deprecated RestAssured methods → Anchor: outdated method usage. Default: evidence=2, confidence=0.6.

Test Organization & Maintainability:
- Tests without descriptive method names → Anchor: @Test method with unclear name. Default: evidence=2, confidence=0.6.
- Missing proper test data builders/factories → Anchor: inline test data creation. Default: evidence=2, confidence=0.5.
- Monolithic test methods (>100 lines) → Anchor: large test method. Default: evidence=2, confidence=0.6.
- Missing proper test categorization (@Category, @Tag) → Anchor: test without categories. Default: evidence=2, confidence=0.5.

API Testing Patterns:
- Missing proper error scenario testing → Anchor: only positive test cases. Default: evidence=2, confidence=0.6.
- Not testing different content types → Anchor: single content-type usage. Default: evidence=2, confidence=0.5.
- Missing boundary value testing for API parameters → Anchor: single parameter value testing. Default: evidence=2, confidence=0.5.
- Not validating response headers → Anchor: response validation without headers. Default: evidence=2, confidence=0.6.

Performance & Resource Management:
- Creating new HTTP clients for every request → Anchor: repeated client creation. Default: evidence=2, confidence=0.6.
- Not reusing authentication tokens efficiently → Anchor: repeated authentication. Default: evidence=3, confidence=0.7.
- Missing proper connection pooling → Anchor: connection management. Default: evidence=2, confidence=0.5.
- Loading large response payloads unnecessarily → Anchor: full response processing. Default: evidence=2, confidence=0.5.

Environment & Configuration:
- Hardcoded environment configurations → Anchor: hardcoded URLs or configs. Default: evidence=3, confidence=0.7.
- Missing proper test data cleanup strategies → Anchor: data creation without cleanup. Default: evidence=3, confidence=0.7.
- Not handling different environment authentication properly → Anchor: environment-specific auth. Default: evidence=2, confidence=0.6.

Note: Use post-patch line numbers. If only diff hunk is known or source is uncertain, set evidence_strength ≤ 2 and confidence ≤ 0.5, and prefix fix_code_patch with "// approximate".`
};

/**
 * Language-specific code review checks
 */

const LANGUAGE_SPECIFIC_CHECKS = {
  js: `

JavaScript/TypeScript Checks (only if visible in diff; do not assume unseen code)
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
- Event burst control (debounce/throttle in high-frequency handlers: onChange, scroll, resize, keypress):
  • Mitigation present but effectiveness unknown (definition/cleanup not shown):
    impact=1, exploitability=1, likelihood=1, blast_radius=1, evidence_strength=2, confidence=0.5
    ⇒ severity_proposed="suggestion", cap severity_score ≤ 2.00
  • Mitigation proven ineffective (IneffectiveProof satisfied) with heavy work observed:
    impact=3–4, exploitability=3, likelihood=3, blast_radius=2, evidence_strength=3–4, confidence=0.7–0.8
    ⇒ may be "critical" only if severity_score ≥ 3.60
  • Effective mitigation clearly shown (stable memo/ref and reasonable wait ≥ ~100–200ms for text input; optional .cancel() cleanup):
    impact=0, exploitability=0, likelihood=0, blast_radius=0, evidence_strength=2, confidence=0.5
    ⇒ "suggestion" (e.g., consider .cancel() or adjust wait) or no issue
  • To propose "critical", include a ≤12-line snippet showing BOTH the high-frequency handler path AND at least one IneffectiveProof condition.
  • If IneffectiveProof is not anchored, you MUST NOT propose "critical".

Security (additional):
- User-controlled URLs in navigation APIs without validation. Default: 3, 0.6 (critical only if taint is clear).
- Tokens stored in localStorage/sessionStorage → auto-critical unless strong mitigations. Anchor storage write. Default: 4–5, 0.8.
- URL.createObjectURL used with untrusted blobs without checks. Default: 3, 0.6.

Accessibility:
- Only mark critical if core flows are blocked; otherwise suggestion with evidence_strength ≤ 2.

Note: Use post-patch line numbers. If only diff hunk is known or source is uncertain, set evidence_strength ≤ 2 and confidence ≤ 0.5, and prefix fix_code_patch with "// approximate".
`,

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
- asyncio.create_task() without exception handling or cancellation cleanup. Default 4, 0.8.

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
- Reflection/annotation scanning in hot paths. Anchor: getClass().getMethod()/reflection calls. Default 4,0.8.
- Large object creation in tight loops (StringBuilder, collections). Anchor: new in loop. Default 3,0.7.
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
- Resource leaks: missing AutoCloseable.close() or try-with-resources. Anchor: resource creation without proper cleanup. Default 4,0.8.
- JPA N+1 from lazy loading without fetch joins/graphs. Anchor: entity access in loop. Default 4,0.8.
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
- Memory exhaustion from unbounded user input (file uploads, POST data). Anchor: processing without limits. Default 4,0.8.
- Inefficient regex with backtracking (ReDoS). Anchor: preg_* with complex patterns. Default 3,0.7.
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
- XML external entity (XXE) in XML parsing without libxml_disable_entity_loader(). Anchor: SimpleXML/DOMDocument. Default 4,0.8.
- Server-Side Template Injection (SSTI) in Twig/Smarty with user-controlled templates. Anchor: template rendering. Default 4,0.8.

Modern PHP Security:
- Composer packages with known vulnerabilities (check composer.lock changes). Anchor: new dependencies. Default 3,0.7.
- Missing Content Security Policy headers on HTML responses. Anchor: response headers. Default 3,0.7.

Note: Use post-patch line numbers. If only diff hunk is known or source is uncertain, set evidence_strength ≤ 2 and confidence ≤ 0.5, and prefix fix_code_patch with "// approximate".`,

  qa_web: QA_SPECIFIC_CHECKS.qa_web,
  qa_android: QA_SPECIFIC_CHECKS.qa_android,
  qa_backend: QA_SPECIFIC_CHECKS.qa_backend
};

module.exports = LANGUAGE_SPECIFIC_CHECKS;
