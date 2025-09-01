/**
 * Language-specific code review checks
 */

const LANGUAGE_SPECIFIC_CHECKS = {
  js: `JavaScript/TypeScript checks (only if visible in diff)
- React: unstable hook deps; heavy work in render; missing cleanup in useEffect; dangerouslySetInnerHTML; index-as-key on dynamic lists; un-memoized context values; consider lazy()/Suspense for large modules.
- TypeScript: any/unknown leakage across module boundaries; unsafe narrowing; non-null assertions (!); ambient type mutations.
- Fetch/IO: missing AbortController/timeout; no retry/backoff for critical calls; leaking subscriptions/websockets; unbounded intervals.
- Performance: N+1 renders; O(n²) loops over props/state; large lists without virtualization; expensive JSON.stringify in deps.
- Security: user-controlled URLs passed to location.assign/href/open; URL.createObjectURL on untrusted blobs; storage of tokens in localStorage/sessionStorage (flag high risk).
- Accessibility: only flag as "critical" if it blocks core flows.`,

  python: `Python-specific checks (only if visible in diff)
- Performance: loading large datasets wholly into memory instead of streaming; blocking I/O in async functions; unbounded recursion; excessive global caches without eviction.
- Maintainability: circular imports; giant monolithic scripts; bare except clauses; mutable default arguments; tight coupling between modules.
- Best practices: missing context managers (with open); requests without timeouts; weak logging/redaction of secrets; misuse of globals in concurrency.
- Web specifics (Django/Flask/FastAPI): CSRF disabled; debug=True in production; open CORS; Jinja2 autoescape disabled; unsanitized input passed to render_template.`,

  java: `Java-specific checks (only if visible in diff)
- Performance: opening/closing DB connections inside loops; unbounded thread creation; missing close on I/O streams/sockets; synchronized hot paths causing contention.
- Maintainability: god-classes (>1k LOC); methods >200 LOC; excessive static state/singletons; cyclic dependencies.
- Best practices: missing try-with-resources; swallowed exceptions; misuse of Optional; unchecked futures; blocking calls on reactive threads.
- Web/Spring specifics: disabled CSRF without compensating controls; permissive CORS ("*"); @Controller returning unescaped user content; missing @Valid on request DTOs.`,

  php: `PHP-specific checks (only if visible in diff)
- Performance: N+1 queries in loops; lack of query caching; output buffering absent for large responses.
- Maintainability: global state; mixing presentation and business logic; lack of namespaces/autoloading; sprawling includes.
- Best practices: missing input validation/sanitization (filter_input/htmlspecialchars); deprecated APIs (mysql_* / ereg); weak session settings (no HttpOnly/SameSite).
- Framework specifics (Laravel/Symfony): mass-assignment without guarded/fillable; CSRF middleware disabled; debug mode enabled in prod.`
};

module.exports = LANGUAGE_SPECIFIC_CHECKS;
