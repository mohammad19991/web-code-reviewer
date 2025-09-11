/**
 * QA Automation critical overrides
 */
const QA_CRITICAL_OVERRIDES = {
  qa: `Auto-critical overrides (regardless of score)
- Non-deterministic selectors that can cause flakiness in web tests (avoid brittle CSS/XPath; prefer data-test-id or accessibility queries).
- Unbounded retries or long sleeps (cy.wait) that can significantly increase execution time or make tests flaky.
- Tests that disable core security controls in the browser (e.g., SSL/TLS validation, insecure flags).
- Sensitive artifacts (logs, screenshots, videos) exposing PII or secrets published outside QA infra.
- Skipped or force-passed tests (it.skip, it.only) committed into main branches.
  `
};

/**
 * Language-specific auto-critical overrides for security issues
 */

const LANGUAGE_CRITICAL_OVERRIDES = {
  js: `Auto-Critical Overrides — regardless of score
Policy:
- Directly observed + prod-reachable = severity_proposed="critical", evidence_strength=4–5, confidence≥0.8.
- If clearly dev/test-only or unreachable in prod = downgrade to "suggestion", evidence_strength≤2, confidence≤0.5, prefix fix_code_patch with "// approximate" if anchoring is uncertain.
- Always anchor a ≤12-line snippet including the risky sink and input. Use post-patch line numbers; if only diff hunk is known, lower evidence/confidence.

Auto-critical items:
- Unescaped user input into dangerous DOM sinks: innerHTML, outerHTML, document.write, eval, Function, setTimeout/setInterval(string). Fix: safe DOM APIs, sanitization, templating.
- Direct database queries without parameterization. Fix: parameterized queries, prepared statements, ORM builders.
- Missing authentication/authorization checks in API routes or sensitive ops. Fix: explicit auth guard, RBAC/ABAC.
- Hardcoded secrets, API keys, or credentials in source. Fix: remove from code, load via env/secret manager, rotate keys.
- Unsafe deserialization of user data (JSON.parse untrusted, unsafe libs). Fix: schema validation, safe parser.
- Prototype pollution (user input merged into Object.prototype). Fix: allowlist clone, patched libs.
- Logging PII (names, emails, tokens, profiles) unless demonstrably stripped in production builds. Fix: remove/redact/gate logs.

Exception for performance:
If a stable debounce/throttle is present in the same event path, do not mark it as a critical performance issue. At most, emit a suggestion.

Evidence defaults:
- Direct untrusted sink: evidence_strength=5, confidence=0.9.
- Risky sink but unclear taint: evidence_strength=3, confidence=0.6.
- Dev-only guarded: suggestion, evidence_strength=2, confidence=0.5.

Debounce/Throttle evidence rules:
- Effective debounce/throttle present → evidence_strength ≤ 2, confidence ≤ 0.5, severity = suggestion or no issue.
- Missing or misused debounce/throttle (inline recreation, wait=0, no cleanup, unstable deps) → evidence_strength ≥ 3, confidence ≥ 0.7, severity = critical if heavy work is observed.

Tests (≤2 lines examples):
- DOM injection: "<script>alert(1)</script>" is not executed.
- SQL injection: "' OR 1=1 --" does not alter query.
- Auth: unauthorized /admin returns 401/403.
- Secrets: no apiKey in build artifacts.
- Prototype pollution: "__proto__" input does not mutate Object prototype.
- Logging: prod build has no raw console.log(userData).
`,

  python: `Auto-critical Overrides — regardless of score
Policy:
- If directly observed and reachable in production: severity_proposed="critical", evidence_strength=4–5, confidence≥0.8.
- If clearly dev/test-only or guarded and unreachable in prod: downgrade to "suggestion", set evidence_strength≤2 and confidence≤0.5, and prefix fix_code_patch with "// approximate" if anchoring is uncertain.
- Always anchor with a ≤12-line snippet including the risky call (and tainted source if applicable); use post-patch line numbers. If only a diff hunk is known, also cap evidence_strength≤2 and confidence≤0.5. Deduplicate via "occurrences".

Auto-critical items (with anchors & fixes):
- eval/exec on user input → Anchor: eval/exec call. Fix: remove dynamic eval; use safe parser/dispatch map.
- pickle.load or unsafe yaml.load on untrusted data → Anchor: call site. Fix: yaml.safe_load; avoid pickle for untrusted inputs.
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

  java: `Auto-Critical Overrides — regardless of score
Policy:
- Directly observed + prod-reachable => severity_proposed="critical", evidence_strength=4–5, confidence≥0.8.
- Dev/test-only or unreachable in prod => suggestion, evidence_strength≤2, confidence≤0.5, prefix patch with "// approximate" if anchoring uncertain.
- Always anchor ≤12-line snippet with risky sink and tainted input when possible. Use post-patch line numbers; if only diff hunk known, lower evidence/confidence.

Auto-critical items:
- SQL injection via string concatenation in Statement/native queries. Fix: PreparedStatement/ORM parameters.
- Command injection via Runtime.exec/ProcessBuilder with untrusted strings. Fix: arg lists, allowlists, no shell.
- Unsafe deserialization of untrusted data (ObjectInputStream, unsafe Jackson settings). Fix: avoid Java serialization; strict schema; ObjectInputFilter.
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

  php: `Auto-Critical Overrides — regardless of score
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

  qa_web: QA_CRITICAL_OVERRIDES.qa,
  qa_android: QA_CRITICAL_OVERRIDES.qa,
  qa_backend: QA_CRITICAL_OVERRIDES.qa
};

module.exports = LANGUAGE_CRITICAL_OVERRIDES;
