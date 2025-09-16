# Sample LLM Prompt (Updated with Recent Changes)

This document shows a realistic example of the complete prompt being sent to the LLM for code review based on the current codebase implementation.

## Prompt Structure

```
You are a senior software engineer performing a comprehensive code review. Analyze the provided code changes for bugs, security issues, performance problems, and maintainability concerns.

## Review Guidelines

### Output Format
Provide your analysis in the following JSON structure:

```json
{
  "summary": {
    "total_issues": 0,
    "critical_issues": 0,
    "high_issues": 0,
    "medium_issues": 0,
    "low_issues": 0,
    "suggestions": 0,
    "merge_decision": "approve|request_changes|needs_discussion",
    "confidence": 0.0,
    "key_critical_issues": [],
    "key_suggestions": [],
    "final_recommendation": "Brief summary of findings and recommendation"
  },
  "issues": [
    {
      "id": "unique_issue_id",
      "type": "security|performance|bug|maintainability|best_practice",
      "severity": "critical|high|medium|low|suggestion",
      "title": "Brief descriptive title",
      "description": "Detailed explanation of the issue",
      "file": "path/to/file.js",
      "lines": [120, 134],
      "snippet": "<12-line minimal excerpt including the risky sink/call>",
      "why_it_matters": "Concrete impact in 1 sentence.",
      "fix_summary": "Brief description of the fix approach (1–2 sentences).",
      "fix_code_patch": "// concrete or approximate minimal patch anchored to the snippet/lines",
      "tests": "Brief test to prevent regression: expect(() => userProfile.render(userInput)).not.toThrow()",
      "occurrences": [
        {"file": "src/components/UserProfile.js", "lines": [88, 95]}
      ]
    }
  ]
}
```

### Severity Scoring
- Round severity_score to 2 decimals using fixed-point rounding.
- Deterministic: identical inputs must always produce identical outputs.

### Scope & Exclusions
- Focus ONLY on critical risks: exploitable security flaws, meaningful performance regressions, memory/resource leaks, unsafe patterns, architectural violations.
- Ignore style/formatting/naming/import order/linters/auto-formatters.
- Do NOT assume unseen code. If context is missing, lower evidence_strength and confidence, and mark severity_proposed as "suggestion".

### Severity Scoring
- "critical" if severity_score ≥ 3.60 AND evidence_strength ≥ 3
- Otherwise "suggestion"

### Auto-Critical Overrides — regardless of score
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

### JavaScript/TypeScript Checks (only if visible in diff; do not assume unseen code)
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

### Evidence & Remediation Requirements
- Each issue must include a concrete code snippet (≤12 lines) showing the problematic code
- Provide specific, actionable fix suggestions with code examples
- Include test cases to prevent regression
- Rate confidence and evidence strength honestly

### Merge Decision Logic
- **approve**: No critical or high-severity issues found
- **request_changes**: Critical or high-severity issues that must be addressed
- **needs_discussion**: Issues that require team discussion or clarification

</SUMMARY>

🧠 LLM-FOCUSED CODE REVIEW CONTEXT
============================================================

📝 FILES BEING REVIEWED:
  1. src/config/context.js
  2. src/services/context-service.js
  3. src/services/llm-service.js
  4. sample-llm-prompt.md

🔍 SEMANTIC CODE:
----------------------------------------
📄 src/config/context.js:
  const CONTEXT_CONFIG = {
    // Context size limits (dynamic based on available tokens)
    MAX_CONTEXT_SIZE: 120 * 1024, // 120KB max context size (fallback) - increased for better context
    MAX_PROJECT_FILES: 30, // Max files to include in project structure
    MAX_COMMIT_HISTORY: 15, // Max commits to include in recent history
    MAX_IMPORT_LINES: 15, // Max import lines per file

    // Dynamic context sizing based on available tokens
    CONTEXT_TOKEN_RATIO: 0.35, // Use 35% of available tokens for context (increased from 30%)
    MIN_CONTEXT_SIZE: 20 * 1024, // 20KB minimum context size (increased from 15KB)
    MAX_CONTEXT_SIZE_LARGE: 200 * 1024, // 200KB maximum context size (increased from 150KB)
    
    // Cost optimization settings
    ENABLE_COST_OPTIMIZATION: false, // Set to true to enable smart context scaling
    SMALL_CHANGE_THRESHOLD: 10 * 1024, // 10KB - use reduced context for small changes
    LARGE_CHANGE_THRESHOLD: 50 * 1024, // 50KB - use full context for large changes

    // Context features (can be toggled)
    ENABLE_PROJECT_STRUCTURE: true,
    ENABLE_DEPENDENCIES: true,
    ENABLE_COMMIT_HISTORY: true,
    ENABLE_FILE_RELATIONSHIPS: true,

    // File patterns to exclude from context
    EXCLUDE_PATTERNS: [
      'node_modules',
      'dist',
      '.git',
      'coverage',
      '.nyc_output',
      'build',
      'out',
      '.next',
      '.nuxt'
    ],

    // File extensions to include in project structure
    INCLUDE_EXTENSIONS: ['.js', '.ts', '.tsx', '.jsx', '.vue', '.svelte', '.json', '.md'],

    // Context priority (order matters)
    CONTEXT_PRIORITY: ['dependencies', 'project_structure', 'file_relationships', 'commit_history']
  };

📄 src/services/context-service.js:
  /**
   * Calculate dynamic context size based on available tokens
   */
  calculateDynamicContextSize(estimatedTokens, maxTokens = 200000) {
    const availableTokens = maxTokens - estimatedTokens;
    const contextTokens = Math.floor(availableTokens * CONTEXT_CONFIG.CONTEXT_TOKEN_RATIO);

    // Convert tokens to bytes (rough approximation: 4 chars per token)
    const contextSize = contextTokens * 4;

    // Apply min/max limits
    const finalSize = Math.max(
      CONTEXT_CONFIG.MIN_CONTEXT_SIZE,
      Math.min(contextSize, CONTEXT_CONFIG.MAX_CONTEXT_SIZE_LARGE)
    );

    core.info(
      `🎯 Dynamic context size: ${Math.round(finalSize / 1024)}KB (${contextTokens} tokens available)`
    );
    return finalSize;
  }

📄 src/services/llm-service.js:
  if (totalChunks === 1) {
    // For single chunk, include full context
    return `${prompt}\n\n${context}\n\n============================================================\n📋 ACTUAL CODE CHANGES TO REVIEW (REVIEW THESE ONLY):\n============================================================\n\n**The following diffs/files are what you should review:**`;
  }

🔗 FILE RELATIONSHIPS:
----------------------------------------
🔗 src/config/context.js:
  📥 Imports:
    (No imports found)
  📤 Exports:
    Export: module.exports = CONTEXT_CONFIG;

🔗 src/services/context-service.js:
  📥 Imports:
    Import: const { execSync } = require('child_process');
    Import: const core = require('@actions/core');
    Import: const CONTEXT_CONFIG = require('../config/context');
  📤 Exports:
    Export: class ContextService {
    Export: class ShellExecutor {

🔗 src/services/llm-service.js:
  📥 Imports:
    Import: const core = require('@actions/core');
    Import: const { LLM_PROVIDERS, CONFIG } = require('../constants');
    Import: const ContextService = require('./context-service');
  📤 Exports:
    Export: class LLMService {

📦 DEPENDENCIES:
----------------------------------------
📦 Project Type:
  Node.js GitHub Action

🔒 Lock file: -rw-r--r-- 1 user user 1234567 Dec 19 14:30 package-lock.json

📜 COMMIT HISTORY:
----------------------------------------
Recent commits:
- feat: increase context size limits for better LLM analysis (abc123)
- fix: add clear code diff markers for LLM focus (def456)
- refactor: remove first-level dependency context feature (ghi789)
- docs: update README with semantic code context information (jkl012)

============================================================
END LLM CONTEXT

============================================================
📋 ACTUAL CODE CHANGES TO REVIEW (REVIEW THESE ONLY):
============================================================

**The following diffs/files are what you should review:**

```diff
diff --git a/src/config/context.js b/src/config/context.js
index 1234567..abcdefg 100644
--- a/src/config/context.js
+++ b/src/config/context.js
@@ -5,10 +5,16 @@
 const CONTEXT_CONFIG = {
   // Context size limits (dynamic based on available tokens)
-  MAX_CONTEXT_SIZE: 75 * 1024, // 75KB max context size (fallback)
+  MAX_CONTEXT_SIZE: 120 * 1024, // 120KB max context size (fallback) - increased for better context
   MAX_PROJECT_FILES: 30, // Max files to include in project structure
   MAX_COMMIT_HISTORY: 15, // Max commits to include in recent history
   MAX_IMPORT_LINES: 15, // Max import lines per file

   // Dynamic context sizing based on available tokens
-  CONTEXT_TOKEN_RATIO: 0.3, // Use 30% of available tokens for context
-  MIN_CONTEXT_SIZE: 15 * 1024, // 15KB minimum context size
-  MAX_CONTEXT_SIZE_LARGE: 150 * 1024, // 150KB maximum context size
+  CONTEXT_TOKEN_RATIO: 0.35, // Use 35% of available tokens for context (increased from 30%)
+  MIN_CONTEXT_SIZE: 20 * 1024, // 20KB minimum context size (increased from 15KB)
+  MAX_CONTEXT_SIZE_LARGE: 200 * 1024, // 200KB maximum context size (increased from 150KB)
+  
+  // Cost optimization settings
+  ENABLE_COST_OPTIMIZATION: false, // Set to true to enable smart context scaling
+  SMALL_CHANGE_THRESHOLD: 10 * 1024, // 10KB - use reduced context for small changes
+  LARGE_CHANGE_THRESHOLD: 50 * 1024, // 50KB - use full context for large changes

   // Context features (can be toggled)
   ENABLE_PROJECT_STRUCTURE: true,
```

```diff
diff --git a/src/services/llm-service.js b/src/services/llm-service.js
index 2345678..bcdefgh 100644
--- a/src/services/llm-service.js
+++ b/src/services/llm-service.js
@@ -43,7 +43,7 @@ class LLMService {
 
     if (totalChunks === 1) {
-      // For single chunk, include full context with clear code section marker
+      // For single chunk, include full context
       return `${prompt}\n\n${context}\n\n============================================================\n📋 ACTUAL CODE CHANGES TO REVIEW (REVIEW THESE ONLY):\n============================================================\n\n**The following diffs/files are what you should review:**`;
     }
```

```diff
diff --git a/README.md b/README.md
index 3456789..cdefghi 100644
--- a/README.md
+++ b/README.md
@@ -20,7 +20,7 @@ DeepReview provides comprehensive context to the LLM:
 
 - **📝 Changed Files**: Full diff content with syntax highlighting
+- **🔍 Semantic Code**: Key code patterns, function signatures, and critical logic from changed files
 - **📦 Dependencies**: Package.json, lock files, and project type
 - **🏗️ File Relationships**: Import/export patterns and project structure
 - **📊 Recent Commits**: Commit history for context understanding
```

---

## Key Features of This Updated Prompt

### 🧠 **Enhanced Context Structure**
- **Clear Code Section Marker**: Explicit "ACTUAL CODE CHANGES TO REVIEW" section
- **Comprehensive Context**: Semantic code, file relationships, dependencies, and commit history
- **Smart Context Management**: Dynamic sizing based on available tokens (now 35% instead of 30%)

### 🎯 **Improved Context Limits**
- **Increased Fallback**: 75KB → 120KB (+60% increase)
- **Higher Token Ratio**: 30% → 35% of available tokens
- **Expanded Maximum**: 150KB → 200KB maximum context
- **Cost Optimization**: Added settings for smart context scaling (currently disabled)

### 📊 **Better LLM Focus**
- **Explicit Boundaries**: Clear separation between context and code to review
- **Focused Instructions**: "REVIEW THESE ONLY" makes it crystal clear what to analyze
- **Consistent Structure**: Same format for both single and multi-chunk scenarios

### 🔍 **Enhanced Analysis Capabilities**
- **More Context**: Better understanding of code relationships and patterns
- **Improved Accuracy**: More comprehensive context leads to better issue detection
- **Future-Proof**: Handles larger codebases and more complex changes

This updated prompt structure ensures the LLM has comprehensive context while maintaining clear focus on the actual code changes that need to be reviewed. The increased context limits should eliminate the truncation warnings while providing significantly better analysis quality.

