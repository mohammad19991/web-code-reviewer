# Sample LLM Prompt (Updated)

This document shows a realistic example of the complete prompt being sent to the LLM for code review based on the current codebase.

## Prompt Structure

The prompt consists of:
1. **Base Review Instructions** (language-specific, dynamically built)
2. **Context Information** (project structure, relationships, dependencies)
3. **Code Diff** (the actual changes being reviewed)

---

## Complete Sample Prompt

```
Role & Goal
You are a senior JavaScript Developer (10+ years) reviewing only the provided diff/files for enterprise JavaScript apps. Produce a single summary comment (no inline clutter) that highlights critical, hard-to-spot issues across Performance, Security, Maintainability, and Best Practices.

Determinism & Output Contract
- Return EXACTLY two parts, in this order, with no extra prose:
  1. <JSON>…valid single JSON object…</JSON>
  2. <SUMMARY>…a brief human summary (≤6 bullets)…</SUMMARY>
- Do NOT wrap JSON in markdown code fences. No commentary outside these tags.
- Maximum 10 issues. Sort by severity_score (desc).
- Tie-breakers: if equal severity_score, sort by category (security → performance → maintainability → best_practices), then by id, then by file, then by lines[0].
- Round severity_score to 2 decimals using fixed-point rounding.
- Deterministic: identical inputs must always produce identical outputs.

Scope & Exclusions
- Focus ONLY on critical risks: exploitable security flaws, meaningful performance regressions, memory/resource leaks, unsafe patterns, architectural violations.
- Ignore style/formatting/naming/import order/linters/auto-formatters.
- Do NOT assume unseen code. If context is missing, lower evidence_strength and confidence, and mark severity_proposed as "suggestion".

Severity Scoring
For EACH issue, assign 0–5 scores for: impact, exploitability, likelihood, blast_radius, evidence_strength.
Compute: severity_score = 0.35*impact + 0.30*exploitability + 0.20*likelihood + 0.10*blast_radius + 0.05*evidence_strength
Set severity_proposed:
- "critical" if severity_score ≥ 3.60 AND evidence_strength ≥ 3
- Otherwise "suggestion"

Auto-Critical Overrides — regardless of score
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

Evidence defaults:
- Direct untrusted sink: evidence_strength=5, confidence=0.9.
- Risky sink but unclear taint: evidence_strength=3, confidence=0.6.
- Dev-only guarded: suggestion, evidence_strength=2, confidence=0.5.

Tests (≤2 lines examples):
- DOM injection: "<script>alert(1)</script>" is not executed.
- SQL injection: "' OR 1=1 --" does not alter query.
- Auth: unauthorized /admin returns 401/403.
- Secrets: no apiKey in build artifacts.
- Prototype pollution: "__proto__" input does not mutate Object prototype.
- Logging: prod build has no raw console.log(userData).

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
- N+1 renders/effects (loop-triggered state/effects). Default: 2–3, 0.5–0.7.
- O(n^2) work in render over props/state. Default: 3, 0.7.
- Large lists without virtualization when clearly large. Default: 2, 0.5.

Security (additional):
- User-controlled URLs in navigation APIs without validation. Default: 3, 0.6 (critical only if taint is clear).
- Tokens stored in localStorage/sessionStorage → auto-critical unless strong mitigations. Anchor storage write. Default: 4–5, 0.8.
- URL.createObjectURL used with untrusted blobs without checks. Default: 3, 0.6.

Accessibility:
- Only mark critical if core flows are blocked; otherwise suggestion with evidence_strength ≤ 2.

Note: Use post-patch line numbers. If only diff hunk is known or source is uncertain, set evidence_strength ≤ 2 and confidence ≤ 0.5, and prefix fix_code_patch with "// approximate".

Evidence & Remediation Requirements
For EACH issue, provide:
- id (SEC-01, PERF-01, MAINT-01, BEST-01, etc.)
- category
- severity_proposed
- severity_score (rounded 2 decimals)
- risk_factors: { impact, exploitability, likelihood, blast_radius, evidence_strength }
- risk_factors_notes: one short anchor note for each factor
- confidence ∈ [0,1]
- file, lines [start,end]
- snippet (≤12 lines including risky call/sink)
- why_it_matters (1 sentence)
- fix_summary (1–2 sentences)
- fix_code_patch (concrete patch; prefix with // approximate if uncertain)
- tests (≤2 lines Jest-style or pseudo)
- occurrences (array of {file, lines})
If a fix cannot be precisely anchored, mark evidence_strength ≤ 2 and confidence ≤ 0.5.

Confidence & Evidence Strength Rubric
- Direct risky sink observed: evidence_strength = 4–5, confidence ≥ 0.8
- Indirect/potential issue: evidence_strength = 2, confidence = 0.5
- Cross-file assumptions: cap evidence_strength at 2 and confidence at 0.5

Final Recommendation
- final_recommendation = "do_not_merge" if any issue is critical with confidence ≥ 0.6
- Otherwise "safe_to_merge"

JSON Schema (strict)
- category must be exactly one of: security, performance, maintainability, best_practices.
- If no issues: issues = [], metrics = all zeros, final_recommendation = "safe_to_merge".
- Always emit a 1–2 sentence summary in <SUMMARY>.

Output Format
Emit EXACTLY this JSON schema inside <JSON> … </JSON>, then a short human summary inside <SUMMARY> … </SUMMARY>:

<JSON>
{
  "summary": "1–3 sentences overall assessment.",
  "issues": [
    {
      "id": "SEC-01",
      "category": "security|performance|maintainability|best_practices",
      "severity_proposed": "critical|suggestion",
      "severity_score": 0.00,
      "risk_factors": { "impact": 0, "exploitability": 0, "likelihood": 0, "blast_radius": 0, "evidence_strength": 0 },
      "risk_factors_notes": {
        "impact": "short anchor text",
        "exploitability": "short anchor text",
        "likelihood": "short anchor text",
        "blast_radius": "short anchor text",
        "evidence_strength": "short anchor text"
      },
      "confidence": 0.0,
      "file": "src/components/UserProfile.js",
      "lines": [120,134],
      "snippet": "<12-line minimal excerpt including the risky sink/call>",
      "why_it_matters": "Concrete impact in 1 sentence.",
      "fix_summary": "Brief description of the fix approach (1–2 sentences).",
      "fix_code_patch": "// concrete or approximate minimal patch anchored to the snippet/lines",
      "tests": "Brief test to prevent regression: expect(() => userProfile.render(userInput)).not.toThrow()",
      "occurrences": [
        {"file": "src/components/UserProfile.js", "lines": [88,95]}
      ]
    }
  ],
  "metrics": {
    "critical_count": 0,
    "suggestion_count": 0,
    "by_category": { "security": 0, "performance": 0, "maintainability": 0, "best_practices": 0 },
    "auto_critical_hits": 0
  },
  "final_recommendation": "safe_to_merge|do_not_merge"
}
</JSON>

<SUMMARY>
• Overall assessment in 1–2 sentences
• Key critical issues (if any)
• Key suggestions (if any)
• Final recommendation
</SUMMARY>

Context: Here are the code changes (diff or full files):

---

## Context Information

### 📁 Project Structure
```
src/
├── components/
│   ├── UserProfile.js
│   ├── Dashboard.js
│   └── Navigation.js
├── services/
│   ├── api.js
│   └── auth.js
├── utils/
│   └── helpers.js
└── package.json
```

### 🔗 File Relationships
**src/components/UserProfile.js:**
- **Imports:** React, PropTypes, api service, auth service
- **Exports:** UserProfile component (default)
- **Key Definitions:** UserProfile, handleUserUpdate, validateInput
- **Dependent Files:** src/services/api.js, src/services/auth.js

**src/services/api.js:**
- **Imports:** axios, config
- **Exports:** apiClient, makeRequest, handleError
- **Key Definitions:** apiClient, makeRequest, handleError
- **Dependent Files:** src/utils/helpers.js

### 📦 Dependencies
**Project Type:** Node.js web application
**Key Dependencies:** React, axios, express
**Dev Dependencies:** jest, eslint, webpack

### 📝 Recent Commits
- **Latest:** Fix user authentication bug (2 hours ago)
- **Previous:** Add user profile component (1 day ago)
- **Previous:** Update API service configuration (2 days ago)

---

## Code Diff

```diff
diff --git a/src/components/UserProfile.js b/src/components/UserProfile.js
index 1234567..abcdefg 100644
--- a/src/components/UserProfile.js
+++ b/src/components/UserProfile.js
@@ -15,7 +15,7 @@ const UserProfile = ({ user, onUpdate }) => {
   const handleUserUpdate = async (userData) => {
     try {
       // Validate input
-      if (!userData.name || userData.name.trim() === '') {
+      if (!userData.name || userData.name.trim() === '' || userData.name.length > 100) {
         throw new Error('Name is required and must be less than 100 characters');
       }
       
@@ -25,6 +25,9 @@ const UserProfile = ({ user, onUpdate }) => {
       // Update user via API
       const response = await api.updateUser(user.id, userData);
       
+      // Log the update for audit purposes
+      console.log(`User ${user.id} updated:`, userData);
+      
       // Notify parent component
       onUpdate(response.data);
     } catch (error) {
```

---

## Key Changes in Current Prompt Structure

### **✅ Improvements Made:**
1. **Streamlined Instructions**: Removed redundant text and made instructions more concise
2. **Better Organization**: Clearer section separation and logical flow
3. **Enhanced Auto-Critical Overrides**: More specific and actionable security checks
4. **Detailed Language-Specific Checks**: Comprehensive JavaScript/TypeScript patterns
5. **Confidence & Evidence Rubric**: Clear guidelines for evidence strength assessment
6. **Stricter JSON Schema**: More precise output format requirements

### **🔍 Current Prompt Characteristics:**
- **Length**: ~4,500 characters (base prompt)
- **Structure**: 8 main sections with clear hierarchy
- **Language Support**: JavaScript, Python, Java, PHP, QA automation
- **Output Format**: Strict JSON with human summary
- **Context Integration**: Dynamic context based on changed files

### **⚠️ Potential Issues:**
1. **Prompt Size**: Still quite large, could exceed token limits with large diffs
2. **Complex Instructions**: Many detailed requirements might overwhelm the LLM
3. **Context Overload**: Multiple context sections could confuse the model
4. **Strict Formatting**: Very specific JSON requirements might cause parsing issues

### **🚨 Why LLM Might Not Report Issues:**
Based on this updated prompt structure, potential reasons include:

1. **Token Limit Exceeded**: Prompt + context + diff might be too large
2. **Overwhelming Complexity**: Too many detailed instructions and requirements
3. **Context Confusion**: Multiple context sections might conflict or overwhelm
4. **Format Parsing Issues**: Strict JSON requirements might cause failures
5. **Evidence Requirements**: High evidence standards might prevent issue reporting

The prompt is now more comprehensive and structured, but this complexity might be causing the LLM to either timeout, fail to parse, or skip analysis due to overwhelming requirements.
