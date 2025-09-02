/**
 * Language-specific auto-critical overrides for security issues
 */

const LANGUAGE_CRITICAL_OVERRIDES = {
  js: `Auto-critical overrides (regardless of score)
- Unsanitized HTML sinks: innerHTML/dangerouslySetInnerHTML with untrusted input.
- User-influenced navigation/DOM injection without validation/escaping (location.href/assign/open, element.innerHTML, insertAdjacentHTML).
- window.postMessage with "*" targetOrigin or without strict origin checks.
- <a target="_blank"> to user-influenced URL without rel="noopener noreferrer".
- Dynamic code execution with untrusted input (eval, new Function, VM).
- Secrets/credentials/API tokens embedded in client code or shipped to browser.
- Token/session persistence in localStorage/sessionStorage when any XSS sink exists.
- Unbounded listeners/intervals/timeouts or render-time loops causing growth/leak.
- URL.createObjectURL used with untrusted blobs without revocation/validation.
- Missing CSRF protection on same-origin state-changing fetch/XHR.
- XSS via unescaped user input rendered into the DOM/HTML.
- API keys, secrets, or credentials embedded in client code (patterns: api_key, apiKey, access_token, secret, password, private_key, client_secret, bearer_token, authorization, x-api-key, api-token, jwt_token, session_token, auth_token, oauth_token, refresh_token, stripe_key, firebase_key, aws_key, google_key, azure_key, github_token, gitlab_token, bitbucket_token, slack_token, discord_token, telegram_token, twilio_key, sendgrid_key, mailgun_key, pusher_key, algolia_key, mapbox_key, weather_api_key, news_api_key, youtube_api_key, twitter_api_key, facebook_token, instagram_token, linkedin_token, paypal_key, square_key, braintree_key, stripe_secret, firebase_secret, aws_secret, google_secret, azure_secret, github_secret, gitlab_secret, bitbucket_secret, slack_secret, discord_secret, telegram_secret, twilio_secret, sendgrid_secret, mailgun_secret, pusher_secret, algolia_secret, mapbox_key, weather_api_secret, news_api_secret, youtube_api_secret, twitter_api_secret, facebook_secret, instagram_secret, linkedin_secret, paypal_secret, square_secret, braintree_secret).
`,

  python: `Auto-critical overrides (regardless of score)
- eval/exec on user input.
- pickle.load or yaml.load (unsafe Loader) on untrusted data.
- subprocess/os.system with shell=True and untrusted input (command injection).
- SQL composed with f-strings/%/.format (no parameterization).
- requests/urllib with SSL verification disabled (verify=False).
- DEBUG=True or template autoescape disabled in production.
- Jinja2/Django template injection via unescaped user input.
- CSRF disabled/missing for state-changing endpoints (web apps).
- Path traversal in file I/O without canonicalization/validation.
- Weak crypto (MD5/SHA1 for passwords; DES/ECB; hardcoded keys/seeds).
- API keys, secrets, or credentials embedded in client code (patterns: api_key, apiKey, access_token, secret, password, private_key, client_secret, bearer_token, authorization, x-api-key, api-token, jwt_token, session_token, auth_token, oauth_token, refresh_token, stripe_key, firebase_key, aws_key, google_key, azure_key, github_token, gitlab_token, bitbucket_token, slack_token, discord_token, telegram_token, twilio_key, sendgrid_key, mailgun_key, pusher_key, algolia_key, mapbox_key, weather_api_key, news_api_key, youtube_api_key, twitter_api_key, facebook_token, instagram_token, linkedin_token, paypal_key, square_key, braintree_key, stripe_secret, firebase_secret, aws_secret, google_secret, azure_secret, github_secret, gitlab_secret, bitbucket_secret, slack_secret, discord_secret, telegram_secret, twilio_secret, sendgrid_secret, mailgun_secret, pusher_secret, algolia_secret, mapbox_secret, weather_api_secret, news_api_secret, youtube_api_secret, twitter_api_secret, facebook_secret, instagram_secret, linkedin_secret, paypal_secret, square_secret, braintree_secret).
- Unbounded threads/async tasks/loops causing memory/CPU leak or DoS.`,

  java: `Auto-critical overrides (regardless of score)
- Runtime.getRuntime().exec / ProcessBuilder with unvalidated input.
- Raw SQL via java.sql.Statement or string concatenation (use PreparedStatement).
- Insecure deserialization: ObjectInputStream on untrusted data; unsafe Java serialization.
- TLS/cert validation disabled (TrustAllCerts / always-true HostnameVerifier / InsecureSkipVerify equivalents).
- Logging sensitive data (passwords/tokens/PII) in plaintext or at INFO/DEBUG.
- Path traversal in file I/O without canonicalization/checks.
- Command injection via shell calls / native processes from user input.
- XSS/HTML injection in server-side rendered responses due to missing escaping.
- CSRF disabled for state-changing endpoints without compensating controls.
- Weak crypto (MD5/SHA1 for passwords, DES/ECB, hardcoded keys/seeds).
- Unbounded threads/executors/schedulers causing memory/CPU leak or DoS.
- API keys, secrets, or credentials embedded in client code (patterns: api_key, apiKey, access_token, secret, password, private_key, client_secret, bearer_token, authorization, x-api-key, api-token, jwt_token, session_token, auth_token, oauth_token, refresh_token, stripe_key, firebase_key, aws_key, google_key, azure_key, github_token, gitlab_token, bitbucket_token, slack_token, discord_token, telegram_token, twilio_key, sendgrid_key, mailgun_key, pusher_key, algolia_key, mapbox_key, weather_api_key, news_api_key, youtube_api_key, twitter_api_key, facebook_token, instagram_token, linkedin_token, paypal_key, square_key, braintree_key, stripe_secret, firebase_secret, aws_secret, google_secret, azure_secret, github_secret, gitlab_secret, bitbucket_secret, slack_secret, discord_secret, telegram_secret, twilio_secret, sendgrid_secret, mailgun_secret, pusher_secret, algolia_secret, mapbox_secret, weather_api_secret, news_api_secret, youtube_api_secret, twitter_api_secret, facebook_secret, instagram_secret, linkedin_secret, paypal_secret, square_secret, braintree_secret).
`,

  php: `Auto-critical overrides (regardless of score)
- eval/assert/create_function on user input.
- File inclusion from user-controlled input (include/require with tainted path).
- unserialize on untrusted data; unsafe __wakeup/__destruct gadget chains.
- SQL injection via interpolated strings; missing PDO prepared statements/bindings.
- Passwords hashed with md5/sha1 (use password_hash/password_verify).
- Exposing phpinfo or debug toolbars in production.
- Command injection via shell_exec/system/passthru with untrusted input.
- XSS via unescaped user input in templates (echo/print) or legacy engines.
- CSRF middleware disabled or missing on state-changing routes.
- Weak session config (missing HttpOnly/Secure/SameSite; session fixation).
- Path traversal in file operations without sanitization.
- API keys, secrets, or credentials embedded in client code (patterns: api_key, apiKey, access_token, secret, password, private_key, client_secret, bearer_token, authorization, x-api-key, api-token, jwt_token, session_token, auth_token, oauth_token, refresh_token, stripe_key, firebase_key, aws_key, google_key, azure_key, github_token, gitlab_token, bitbucket_token, slack_token, discord_token, telegram_token, twilio_key, sendgrid_key, mailgun_key, pusher_key, algolia_key, mapbox_key, weather_api_key, news_api_key, youtube_api_key, twitter_api_key, facebook_token, instagram_token, linkedin_token, paypal_key, square_key, braintree_key, stripe_secret, firebase_secret, aws_secret, google_secret, azure_secret, github_secret, gitlab_secret, bitbucket_secret, slack_secret, discord_secret, telegram_secret, twilio_secret, sendgrid_secret, mailgun_secret, pusher_secret, algolia_secret, mapbox_secret, weather_api_secret, news_api_secret, youtube_api_secret, twitter_api_secret, facebook_secret, instagram_secret, linkedin_secret, paypal_secret, square_secret, braintree_secret).
`,

qa_web: `Auto-critical overrides (regardless of score)
- Non-deterministic selectors that can cause flakiness in web tests (avoid brittle CSS/XPath; prefer data-test-id or accessibility queries).
- Unbounded retries or long sleeps (cy.wait) that can significantly increase execution time or make tests flaky.
- Tests that disable core security controls in the browser (e.g., SSL/TLS validation, insecure flags).
- Sensitive artifacts (logs, screenshots, videos) exposing PII or secrets published outside QA infra.
- Skipped or force-passed tests (it.skip, it.only) committed into main branches.
`
};

module.exports = LANGUAGE_CRITICAL_OVERRIDES;
