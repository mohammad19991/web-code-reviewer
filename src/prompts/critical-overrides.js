/**
 * QA Automation critical overrides
 */
const QA_CRITICAL_OVERRIDES = {
  qa_web: `Auto-Critical Overrides for Cypress Tests — deterministic and absolute
Policy:
- Test automation best practices violations = severity_proposed="critical", evidence_strength=4–5, confidence≥0.8.
- Minor maintainability or code quality issues = "suggestion", evidence_strength≤3, confidence≤0.7.
- Always anchor ≤12-line snippet including the problematic test pattern. Use post-patch line numbers.

Auto-critical items (internal qa-frontend-cypress architectural violations):
- Actions/methods in PO files → Anchor: function definition or cy.get() call in PO file. Fix: move actions to corresponding CC file, keep only string selectors in PO. Default: evidence=5, confidence=0.9.
- Direct selectors in test files → Anchor: cy.get(), $body.find(), or any selector usage in spec.js files. Fix: use CC functions instead of direct selector calls. Default: evidence=4, confidence=0.8.
- Missing corresponding PO file for CC → Anchor: CC file without matching PO import. Fix: create corresponding PO file following [module][component]PO.js pattern. Default: evidence=4, confidence=0.8.
- Hardcoded POS/currency/language values → Anchor: hardcoded strings 'sa', 'ae', 'SAR', 'AED', 'ar', 'en' without imports from customHelpers/configuration. Fix: use posConfiguration, currencyHelper, languageHelper imports. Default: evidence=5, confidence=0.9.
- Hardcoded calendar/session/environment values → Anchor: hardcoded month names, session properties, environment strings without imports from customHelpers/configuration. Fix: use calendarConfiguration, sessionConfiguration helpers. Default: evidence=5, confidence=0.9.
- API calls without handler pattern → Anchor: cy.request() in test/CC files. Fix: use apiHandlers from fixtures/api/[module]/apiHandlers/. Default: evidence=4, confidence=0.8.
- Configuration helper functions in spec.js files → Anchor: configuration-related functions like const setupPOS, const configHelper in spec.js. Fix: move to customHelpers/configuration/ directory and import. Default: evidence=4, confidence=0.8.
- Action/utility methods in spec.js files → Anchor: action methods, utility functions, or reusable logic blocks in spec.js. Fix: move to CC files and import, keep spec.js for test scenarios only. Default: evidence=4, confidence=0.8.
- Wrong file directory structure → Anchor: file not in fixtures/pageClasses/[platform]/[module]/[component]/ pattern. Fix: move to correct directory structure. Default: evidence=5, confidence=0.9.
- Naming convention violations → Anchor: file not following [module][component]PO.js or [module][component]CC.js pattern. Fix: rename following established naming convention. Default: evidence=4, confidence=0.8.
- README.md files in subdirectories → Anchor: new README.md file in subdirectory. Fix: remove auto-generated README.md files, keep only project root README.md. Default: evidence=4, confidence=0.8.

Auto-critical items (general cypress/web automation best practices):
- Missing test isolation (shared state, no cleanup) → Anchor: test without proper setup/teardown. Fix: add beforeEach/afterEach hooks. Default: evidence=3, confidence=0.8.
- Hardcoded waits (cy.wait ≥ 5000ms) → Anchor: cy.wait(number) call where number ≥ 5000. Fix: use cy.intercept() or conditional waits with cy.should(). Default: evidence=3, confidence=0.8.
- Non-deterministic selectors (brittle XPath, auto-generated classes) → Anchor: brittle selector. Fix: use data-testid or accessibility queries. Default: evidence=3, confidence=0.8.
- Missing Page Object patterns causing code duplication → Anchor: repeated selectors/actions. Fix: extract to page objects or custom commands. Default: evidence=3, confidence=0.8.
- Unbounded operations or infinite loops in tests → Anchor: loop without exit condition. Fix: add proper bounds and timeouts. Default: evidence=3, confidence=0.8.
- Tests disabling browser security without proper guards → Anchor: security config. Fix: guard with environment checks or remove. Default: evidence=3, confidence=0.8.
- Focused/skipped tests (it.only, it.skip, xit) committed → Anchor: test modifier. Fix: remove modifier before merge. Default: evidence=3, confidence=0.8.

Note: Test credentials and controlled security bypasses are acceptable in automation context.

Evidence defaults:
- Test automation principle violations: evidence_strength=4-5, confidence=0.8-0.9.
- Code maintainability issues: evidence_strength=2-3, confidence=0.6-0.7.
- Unclear or context-dependent patterns: evidence_strength=2, confidence=0.5.

Tests (≤2 lines examples):
Internal architectural violations:
- PO with action: export function click() → move to CC file, keep only selectors in PO.
- Direct selector: cy.get('[data-testid="btn"]') in spec.js → use CC function like clickButton().
- Config helper in spec: const setupPOS = (posKey) => { ... } in spec.js → move to customHelpers/configuration/ and import.
- Action method in spec: const clickButton = () => { ... } in spec.js → move to CC file and import.
- Hardcoded config: const pos = 'sa' → import { posSa } from customHelpers/configuration/posConfiguration.
- Missing JSDoc: export function search() → /** @description Performs search */ export function search().
- Wrong directory: desktop/flights/search.js → fixtures/pageClasses/desktop/flights/flightsSearch/.

General cypress best practices:
- Long wait: cy.wait(5000) → cy.get('[data-testid="loading"]').should('not.exist').
- Brittle selector: cy.get('.btn:nth-child(2)') → cy.get('[data-testid="submit-btn"]').
- Focused test: it.only('test') → it('test').
- Auto-generated README: cypress/e2e/README.md → remove file, keep only root README.md.`,

  qa_android: `Auto-Critical Overrides for Appium Tests — deterministic and absolute
Policy:
- Test automation best practices violations = severity_proposed="critical", evidence_strength=4–5, confidence≥0.8.
- Minor maintainability or code quality issues = "suggestion", evidence_strength≤3, confidence≤0.7.
- Always anchor ≤12-line snippet including the problematic test pattern. Use post-patch line numbers.

Auto-critical items (test automation principles):
- Non-deterministic locators (absolute XPath, index-based selectors, UI hierarchy dependencies) → Anchor: brittle locator. Fix: use resource-id or accessibility-id. Default: evidence=5, confidence=0.9.
- Hardcoded waits (Thread.sleep ≥ 5000ms) → Anchor: Thread.sleep() call where duration ≥ 5000. Fix: use WebDriverWait with ExpectedConditions. Default: evidence=5, confidence=0.9.
- Hardcoded waits (Thread.sleep 3000-4999ms) → Anchor: Thread.sleep() call where 3000 ≤ duration < 5000. Fix: consider WebDriverWait with ExpectedConditions. Default: evidence=3, confidence=0.6.
- Ignored tests (@Ignore, assumeTrue) committed to main branches → Anchor: test annotation. Fix: remove ignore or fix underlying issue. Default: evidence=5, confidence=0.9.
- Tests without app state isolation → Anchor: @Test without app reset. Fix: add driver.resetApp() in @BeforeEach. Default: evidence=4, confidence=0.8.
- Tests hitting real backend services without mocking → Anchor: HTTP client call to external service. Fix: mock with WireMock or stubs. Default: evidence=4, confidence=0.8.
- Tests bypassing device security without proper justification → Anchor: security bypass code. Fix: document justification or use proper test accounts. Default: evidence=4, confidence=0.8.

Auto-critical items (code maintainability & reusability):
- Tests without descriptive method names → Anchor: unclear @Test method name. Fix: use descriptive test method names. Default: evidence=3, confidence=0.7.
- Missing Page Object patterns causing code duplication → Anchor: repeated locator/action code. Fix: extract to page object classes. Default: evidence=3, confidence=0.7.
- Missing proper exception handling in test flows → Anchor: @Test without try-catch for expected failures. Fix: add appropriate exception handling. Default: evidence=3, confidence=0.7.
- Unbounded operations or loops in test methods → Anchor: loop without exit condition. Fix: add proper bounds and timeouts. Default: evidence=4, confidence=0.8.

Note: Test credentials and controlled device security bypasses are acceptable in automation context.

Evidence defaults:
- Test automation principle violations: evidence_strength=4-5, confidence=0.8-0.9.
- Code maintainability issues: evidence_strength=2-3, confidence=0.6-0.7.
- Unclear or context-dependent patterns: evidence_strength=2, confidence=0.5.

Tests (≤2 lines examples):
- Brittle locator: "//android.widget.Button[2]" → By.id("submit_button").
- Long wait (critical): Thread.sleep(5000) → wait.until(ExpectedConditions.visibilityOf(element)).
- Medium wait (suggestion): Thread.sleep(3000) → consider WebDriverWait with ExpectedConditions.
- Ignored test: @Ignore @Test → @Test (fix or remove).`,

  qa_backend: `Auto-Critical Overrides for RestAssured API Tests — deterministic and absolute
Policy:
- Test automation best practices violations = severity_proposed="critical", evidence_strength=4–5, confidence≥0.8.
- Minor maintainability or code quality issues = "suggestion", evidence_strength≤3, confidence≤0.7.
- Always anchor ≤12-line snippet including the problematic test pattern. Use post-patch line numbers.

Auto-critical items (internal qa-backend architectural violations):
- Direct RestAssured calls in test files → Anchor: RestAssured given()/when()/then() chains directly in @Test methods without using project's API caller patterns. Fix: use existing API caller classes (e.g., ApiControllerApiCaller) or activator patterns from project. Default: evidence=4, confidence=0.8.
- Hardcoded API URLs/endpoints → Anchor: baseURI() or literal URL strings in test/activator files. Fix: use ConfigProperties.getProperty() methods or similar configuration classes. Default: evidence=5, confidence=0.9.
- Hardcoded test data when alternatives exist → Anchor: literal values for IDs, codes, dates when TestDataProviders, validDataFaker, or Constants are available in project. Fix: use existing data generation patterns (TestDataProviders, validDataFaker.fillObject(), or Constants classes). Default: evidence=4, confidence=0.8.
- Direct database connections in tests → Anchor: DriverManager.getConnection() or new MongoClient() in test files. Fix: use database connector classes or connection utilities. Default: evidence=4, confidence=0.8.
- Missing reusable component pattern → Anchor: repeated API call sequences in multiple test methods. Fix: extract to helper classes, steps, or service classes. Default: evidence=4, confidence=0.8.
- Complex test logic in @Test methods → Anchor: multi-step business logic directly in @Test methods (>50 lines). Fix: extract to flow/service classes or helper methods. Default: evidence=4, confidence=0.8.
- Improper package structure → Anchor: test files not following logical organization (feature/domain/service grouping). Fix: organize tests by business domain, feature, or service. Default: evidence=4, confidence=0.8.
- Missing test categorization when required → Anchor: @Test methods in integration/functional test suites without @Tag annotations when project uses tags for test organization. Fix: add appropriate @Tag annotations following project patterns (e.g., @Tag("hotels"), @Tag("flights")). Default: evidence=2, confidence=0.6.
- Hardcoded business constants → Anchor: literal strings for business codes, IDs, or domain-specific values without constants. Fix: use Constants classes or configuration values. Default: evidence=4, confidence=0.8.

Auto-critical items (general RestAssured/API automation best practices):
- Tests hitting production/live endpoints → Anchor: production domain URLs in test configurations. Fix: use test environment endpoints with proper configuration. Default: evidence=5, confidence=0.9.
- Excessive hardcoded waits (Thread.sleep ≥ 10000ms) → Anchor: Thread.sleep() call where duration ≥ 10000ms without clear justification. Fix: use polling with await(), proper retry logic, or document reason for long wait. Default: evidence=4, confidence=0.8.
- Ignored tests (@Ignore, @Disabled) committed → Anchor: test annotation. Fix: remove ignore or fix underlying issue. Default: evidence=5, confidence=0.9.
- Tests without proper data isolation → Anchor: @Test without cleanup or shared state. Fix: add @AfterEach cleanup or use test transactions. Default: evidence=4, confidence=0.8.
- Tests disabling SSL verification → Anchor: relaxedHTTPSValidation() or similar calls. Fix: use proper certificates or environment-specific guards. Default: evidence=4, confidence=0.8.
- Missing response validation → Anchor: API calls without any response validation (status code, response time, or content validation). Fix: add appropriate response validation using project's patterns (expectStatusCode, expectResponseTime, or schema validation). Default: evidence=3, confidence=0.7.
- Unbounded loops or retry logic → Anchor: while loops without proper exit conditions. Fix: add timeout bounds and proper exit conditions. Default: evidence=4, confidence=0.8.

Note: Test credentials and controlled SSL relaxation are acceptable in automation context when properly isolated.

Evidence defaults:
- Internal architectural violations: evidence_strength=4-5, confidence=0.8-0.9.
- General automation best practices: evidence_strength=3-4, confidence=0.7-0.8.
- Code maintainability issues: evidence_strength=2-3, confidence=0.6-0.7.

Tests (≤2 lines examples):
Internal architectural violations:
- Direct RestAssured call: given().when().get("/search") in @Test → use ApiControllerApiCaller or similar project pattern.
- Hardcoded URL: baseURI("https://api-staging.com") → ConfigProperties.getApiUrl() or similar configuration method.
- Hardcoded data when alternatives exist: String hotelId = "12345" → use validDataFaker.fillObject() or existing Constants/TestDataProviders.
- Direct DB: new MongoClient() in test → DatabaseConnector.getConnection() or similar utility.
- Missing reusable: repeated API sequences → extract to helper/service classes.
- Wrong structure: src/test/java/RandomTest.java → src/test/java/domain/feature/FeatureTests.java.

General automation best practices:
- Production URL: production domain in config → test environment configuration.
- Excessive wait: Thread.sleep(10000) without justification → use polling, await(), or document async operation reason.
- Ignored test: @Ignore @Test → @Test (fix or remove).
- Missing validation: .get("/users") → .get("/users").then().body(matchesJsonSchema(schema)).`
};

/**
 * Language-specific auto-critical overrides for security issues
 */

const LANGUAGE_CRITICAL_OVERRIDES = {
  js: `Auto-Critical Overrides — deterministic and absolute

Instruction precedence (apply in this order):
1) Explicit Exceptions and Gates (this section)
2) Category-specific rules (e.g., Performance → Event burst control)
3) General scoring formula and tie-breakers

Performance Critical Gate (Debounce present) — ABSOLUTE:
If the same event path shows any debounce/throttle import OR call (e.g., lodash debounce/throttle, custom debounce):
- You MUST NOT mark a performance issue as "critical" unless you also anchor code that satisfies IneffectiveProof (see below).
- If IneffectiveProof is NOT satisfied, you MUST:
  - set severity_proposed = "suggestion"
  - set evidence_strength ≤ 2
  - set confidence ≤ 0.5
  - cap severity_score ≤ 2.00

IneffectiveProof (must anchor at least ONE of):
- Debounced wrapper is recreated each render (created in component body without useMemo/useRef and depends on unstable values), OR
- Debounce is created inside the handler (new instance per keystroke), OR
- wait < 32ms for text input (effectively no delay), OR
- Unstable deps cause identity churn of the debounced function, OR
- Async side-effect without unmount cleanup AND a directly observable stale update/race.

**CRITICAL CLARIFICATION for IneffectiveProof:**
- useMemo(() => debounce(callback, delay), [callback]) is CORRECT React pattern - callback dependency is required to prevent stale closures
- Only flag as ineffective if callback is unstable due to missing useCallback/useMemo in PARENT component
- Do not assume parent component issues from props alone - mark as "suggestion" with evidence_strength ≤ 2, confidence ≤ 0.5
- Debounce recreation when props change is NORMAL and NECESSARY React behavior, not a performance issue

Do not assume absence of a proper debounce just because its definition is outside the diff hunk. Missing definition ≠ proof of ineffectiveness.

Auto-critical items (other categories):
- Unescaped user input into dangerous DOM sinks: innerHTML, outerHTML, document.write, eval, Function, setTimeout/setInterval(string). Fix: safe DOM APIs, sanitization, templating.
- Direct database queries without parameterization. Fix: parameterized queries, prepared statements, ORM builders.
- Missing authentication/authorization checks in API routes or sensitive ops. Fix: explicit auth guard, RBAC/ABAC.
- Hardcoded secrets, API keys, or credentials in source. Fix: remove from code, load via env/secret manager, rotate keys.
- Unsafe deserialization of user data (JSON.parse untrusted, unsafe libs). Fix: schema validation, safe parser.
- Prototype pollution (user input merged into Object.prototype). Fix: allowlist clone, patched libs.
- Logging PII (names, emails, tokens, profiles) unless demonstrably stripped in production builds. Fix: remove/redact/gate logs.

Evidence defaults:
- Direct untrusted sink: evidence_strength=5, confidence=0.9.
- Risky sink but unclear taint: evidence_strength=3, confidence=0.6.
- Dev-only guarded: suggestion, evidence_strength=2, confidence=0.5.
- Debounce/Throttle evidence and score caps (Claude-specific):
  • Mitigation observed but definition/cleanup not visible → evidence_strength ≤ 2, confidence ≤ 0.5, cap severity_score ≤ 2.00, severity_proposed="suggestion".
  • IneffectiveProof satisfied with heavy work observed → impact=3–4, exploitability=3, likelihood=3, blast_radius=2, evidence_strength=3–4, confidence=0.7–0.8 (may reach "critical" if severity_score ≥ 3.60).
  • Do not infer ineffectiveness from absence of the definition in the hunk; lack of definition is not evidence.

Tests (≤2 lines examples):
- DOM injection: "<script>alert(1)</script>" is not executed.
- SQL injection: "' OR 1=1 --" does not alter query.
- Auth: unauthorized /admin returns 401/403.
- Secrets: no apiKey in build artifacts.
- Prototype pollution: "__proto__" input does not mutate Object prototype.
- Logging: prod build has no raw console.log(userData).
`,

  python: `Auto-critical Overrides — deterministic and absolute
Policy:
- If directly observed and reachable in production: severity_proposed="critical", evidence_strength=4–5, confidence≥0.8.
- If clearly dev/test-only or guarded and unreachable in prod: downgrade to "suggestion", set evidence_strength≤2 and confidence≤0.5, and prefix fix_code_patch with "// approximate" if anchoring is uncertain.
- Always anchor with a ≤12-line snippet including the risky call (and tainted source if applicable); use post-patch line numbers. If only a diff hunk is known, also cap evidence_strength≤2 and confidence≤0.5. Deduplicate via "occurrences".

Auto-critical items (with anchors & fixes):
- eval/exec on user input → Anchor: eval/exec call. Fix: remove dynamic eval; use safe parser/dispatch map.
- pickle.load or unsafe yaml.load on untrusted data → Anchor: call site. Fix: yaml.safe_load; avoid pickle for untrusted inputs.
- pandas.read_pickle/joblib.load/numpy.load(allow_pickle=True) on untrusted data → Anchor: call site. Fix: use safe formats (CSV/JSON/Parquet); numpy.load with allow_pickle=False.
- subprocess/os.system with shell=True + untrusted input → Anchor: call site. Fix: list args, shell=False, validate inputs.
- Raw SQL via f-strings/%/.format (no params) → Anchor: execute call. Fix: parameterized queries/placeholders.
- HTTP verify=False (requests/urllib) → Anchor: call site. Fix: verify TLS; pin cert/CA; guard dev-only.
- DEBUG=True or template autoescape disabled in prod → Anchor: settings/config. Fix: DEBUG=False; enable autoescape.
- Template injection (unescaped user input) → Anchor: render_template/context. Fix: rely on autoescape; sanitize/escape.
- CSRF disabled/missing on state-changing routes → Anchor: exempt/setting. Fix: enable CSRF tokens/policy.
- Path traversal in file I/O → Anchor: path build + open/remove. Fix: canonicalize/resolve + allow-list base dir.
- Weak crypto (MD5/SHA1 passwords, DES/ECB) or hardcoded keys → Anchor: hash/crypto call or literal key. Fix: modern KDF/algos; move secrets to env/secret store.
- Embedded API keys/secrets in code (api_key, access_token, client_secret, private_key, etc.) → Anchor: literal. Fix: remove/rotate; use secrets manager.
- Unbounded threads/async tasks/loops (leak/DoS) → Anchor: creation loop, infinite loop, unbounded queue. Fix: bounded pools/sem, joins/cancellation, backpressure.

Defaults:
- Direct & prod-reachable: evidence_strength=4 (5 if crystal-clear), confidence=0.8–0.9.
- Guarded or uncertain: evidence_strength≤2, confidence≤0.5.

Tests (≤2 lines examples):
- eval/exec: malicious string is rejected.
- SQL: "' OR 1=1 --" does not alter results (params used).
- TLS: MITM with untrusted CA fails (verify=True).
- Path traversal: "../../etc/passwd" rejected; path resolved inside base.`,

  java: `Auto-Critical Overrides — deterministic and absolute
Policy:
- Directly observed + prod-reachable => severity_proposed="critical", evidence_strength=4–5, confidence≥0.8.
- Dev/test-only or unreachable in prod => suggestion, evidence_strength≤2, confidence≤0.5, prefix patch with "// approximate" if anchoring uncertain.
- Always anchor ≤12-line snippet with risky sink and tainted input when possible. Use post-patch line numbers; if only diff hunk known, lower evidence/confidence.

Auto-critical items:
- SQL injection via string concatenation in Statement/native queries. Fix: PreparedStatement/ORM parameters.
- Command injection via Runtime.exec/ProcessBuilder with untrusted strings. Fix: arg lists, allowlists, no shell.
- Unsafe deserialization of untrusted data (ObjectInputStream, unsafe Jackson settings). Fix: avoid Java serialization; strict schema; ObjectInputFilter.
- Log4j/logback JNDI/expression injection in log statements. Anchor: logger call with user input. Fix: upgrade Log4j 2.17+; disable JNDI lookups.
- XXE in XML parsers without secure processing. Anchor: DocumentBuilder/SAXParser config. Fix: setFeature(DISALLOW_DOCTYPE_DECL, true); secure defaults.
- XSS: unescaped user input in JSP/Thymeleaf/FreeMarker/HTML. Fix: auto-escape/encoders.
- Missing authentication/authorization on sensitive endpoints. Fix: Spring Security guards (RBAC/ABAC).
- CSRF disabled/missing for state-changing endpoints. Fix: enable CSRF tokens.
- Insecure TLS/hostname verification (trust-all). Fix: proper trust store + hostname verification.
- Hardcoded secrets/API keys/credentials in code. Fix: externalize to secrets manager; rotate.
- Path traversal in file I/O without canonicalization/allowlist. Fix: canonicalize + enforce base dir.
- Insecure crypto (MD5/SHA1, AES/ECB, weak RNG). Fix: modern KDF; AES-GCM; secure RNG.
- Template injection by interpreting untrusted expressions. Fix: sandbox/disable expression eval.
- Unbounded thread pools/schedulers causing DoS. Fix: bounded pools, queue limits, backpressure, shutdown.

Evidence defaults:
- Direct & prod-reachable: evidence_strength=5, confidence=0.9 (or 4/0.8).
- Guarded/unclear: evidence_strength=2, confidence=0.5.

Tests (≤2 lines):
- SQLi: "' OR 1=1 --" inert with params.
- Command: untrusted arg not executed.
- XSS: "<script>" inert.
- Auth: unauthorized -> 401/403.
- TLS: MITM with untrusted CA fails.
- Path traversal: "../../etc/passwd" rejected.
`,

  php: `Auto-Critical Overrides — deterministic and absolute
Policy:
- Direct + prod-reachable => severity_proposed="critical", evidence_strength=4–5, confidence≥0.8.
- Dev/test-only or unreachable => suggestion with evidence_strength≤2, confidence≤0.5; prefix patch with "// approximate" if uncertain.
- Always anchor ≤12-line snippet with risky sink and tainted input. Use post-patch line numbers; if only diff hunk, lower evidence/confidence. Deduplicate via "occurrences".

Auto-critical items:
- SQL injection via string interpolation/concatenation (PDO/mysqli). Fix: prepared statements with bound params.
- Command injection (exec/shell_exec/passthru/backticks) using untrusted input. Fix: avoid shell; allowlists; native APIs.
- XSS: unescaped user data echoed into HTML/JS. Fix: htmlspecialchars/Twig auto-escape.
- File inclusion (RFI/LFI) from user input. Fix: strict allowlists; no dynamic includes.
- Path traversal in file I/O. Fix: realpath/canonicalize + base dir allowlist.
- Insecure deserialization via unserialize on untrusted input. Fix: avoid; use JSON + schema.
- Type confusion via unfiltered user input to sensitive functions (array_merge, extract, $$variable). Anchor: call site with user data. Fix: strict input validation; avoid variable variables.
- PHP object injection via phar:// wrapper with user-controlled paths. Anchor: file operation with phar://. Fix: disable phar in stream wrappers; validate file paths.
- CSRF missing on state-changing routes. Fix: CSRF tokens/middleware.
- Weak password hashing/crypto (md5/sha1, mcrypt ECB). Fix: password_hash (Bcrypt/Argon2), libsodium.
- Hardcoded secrets/API keys/credentials in code. Fix: env/secret manager; rotate keys.
- Open redirects using unvalidated user-controlled URLs. Fix: allowlist domains/paths.
- TLS verification disabled in cURL. Fix: enable verify; pin CA/certs if needed.
- Session fixation/misconfig (no regenerate on login; insecure cookie flags). Fix: regenerate ID; secure/httponly cookies.
- Unbounded processes/loops causing DoS. Fix: resource/time bounds, backpressure.

Evidence defaults:
- Direct & prod-reachable: evidence_strength=5, confidence=0.9 (or 4/0.8).
- Guarded/unclear: evidence_strength=2, confidence=0.5.

Tests (≤2 lines):
- SQLi: "' OR 1=1 --" inert with prepared statements.
- Command: untrusted input not executed.
- XSS: "<script>" inert in output.
- CSRF: missing token -> 403/validation error.
- TLS: cURL with untrusted CA fails when verification on.
- Path traversal: "../../etc/passwd" rejected.
`,

  qa_web: QA_CRITICAL_OVERRIDES.qa_web,
  qa_android: QA_CRITICAL_OVERRIDES.qa_android,
  qa_backend: QA_CRITICAL_OVERRIDES.qa_backend
};

module.exports = LANGUAGE_CRITICAL_OVERRIDES;
