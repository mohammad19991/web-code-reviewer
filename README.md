# 🤖 DeepReview - AI-Powered Multi-Language Code Reviewer

A GitHub Action that performs automated code reviews using Large Language Models (Claude or OpenAI) for pull requests. This action analyzes code changes across multiple programming languages and provides detailed feedback on performance, security, maintainability, and best practices with structured JSON output.

## ✨ Features

- **🌍 Multi-Language Support**: Specialized review prompts for JavaScript/TypeScript, Python, Java, and PHP
- **📊 Structured JSON Output**: Detailed analysis with severity scoring, risk factors, and confidence levels
- **🔍 Smart File Filtering**: Language-specific file detection and filtering
- **🤖 LLM Integration**: Supports both Claude Sonnet 4 and OpenAI GPT-4o-mini
- **🎯 Intelligent Merge Decisions**: Automatic merge blocking based on critical issues with confidence scoring
- **📝 Enhanced PR Comments**: Rich, categorized review results with severity indicators
- **⚡ Optimized Processing**: Intelligent chunking and rate limiting for large codebases
- **🔧 Configurable**: Customizable paths, tokens, temperature, and language settings
- **📈 External Logging**: Non-blocking analytics logging to external endpoints for monitoring and insights
- **🏗️ Modular Architecture**: Centralized JSON parsing and reusable components for maintainability

## 🚀 Quick Start

### Required Environment Variables

⚠️ **Important**: The following environment variables are **mandatory** for the action to work:

- **`GITHUB_TOKEN`**: Automatically provided by GitHub Actions (no setup required)
- **`CLAUDE_API_KEY`** or **`OPENAI_API_KEY`**: Your LLM provider API key

### Basic Usage

```yaml
name: DeepReview

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: DeepReview
        uses: tajawal/web-code-reviewer@latest
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # Required: GitHub token for API access
        with:
          claude_api_key: ${{ secrets.CLAUDE_API_KEY }}
          language: 'js'  # JavaScript/TypeScript
          path_to_files: 'src/'
          team: 'frontend-team'  # Required: Your team name
          department: 'web'      # Optional: Department name (defaults to 'web')
```

### Multi-Language Examples

```yaml
# JavaScript/TypeScript Review
- name: Review JavaScript Code
  uses: tajawal/web-code-reviewer@latest
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # Required: GitHub token for API access
  with:
    language: 'js'
    claude_api_key: ${{ secrets.CLAUDE_API_KEY }}
    path_to_files: 'src/,components/'
    team: 'frontend-team'
    department: 'web'

# Python Review
- name: Review Python Code
  uses: tajawal/web-code-reviewer@latest
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # Required: GitHub token for API access
  with:
    language: 'python'
    claude_api_key: ${{ secrets.CLAUDE_API_KEY }}
    path_to_files: 'backend/,api/'
    team: 'backend-team'
    department: 'engineering'

# Java Review
- name: Review Java Code
  uses: tajawal/web-code-reviewer@latest
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # Required: GitHub token for API access
  with:
    language: 'java'
    claude_api_key: ${{ secrets.CLAUDE_API_KEY }}
    path_to_files: 'src/main/java/'
    team: 'mobile-team'
    department: 'mobile'

# PHP Review
- name: Review PHP Code
  uses: tajawal/web-code-reviewer@latest
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # Required: GitHub token for API access
  with:
    language: 'php'
    claude_api_key: ${{ secrets.CLAUDE_API_KEY }}
    path_to_files: 'app/,resources/'
    team: 'fullstack-team'
    department: 'web'
```

### Advanced Configuration

```yaml
name: DeepReview

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: DeepReview
        uses: tajawal/web-code-reviewer@latest
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # Required: GitHub token for API access
        with:
          llm_provider: 'claude'  # or 'openai'
          language: 'js'          # js, python, java, php
          claude_api_key: ${{ secrets.CLAUDE_API_KEY }}
          # openai_api_key: ${{ secrets.OPENAI_API_KEY }}  # if using OpenAI
          path_to_files: 'packages/,src/'
          base_branch: 'develop'
          max_tokens: '3000'      # Recommended: 3000-5000 for comprehensive reviews
          temperature: '0'        # Optimal for consistent analytical responses
          team: 'development-team'  # Required: Your team name
          department: 'engineering' # Optional: Department name
          ignore_patterns: '.json,.md,.lock,.test.js,.spec.js,.min.js'  # Optional: Custom ignore patterns
```

## 📋 Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `llm_provider` | LLM provider to use (`claude` or `openai`) | No | `claude` |
| `language` | Programming language for code review (`js`, `python`, `java`, `php`) | No | `js` |
| `path_to_files` | Comma-separated paths to files to review (e.g., `packages/`, `src/`, `components/`) | No | `packages/` |
| `base_branch` | Base branch to compare against (auto-detected from PR if not specified) | No | `develop` |
| `max_tokens` | Maximum tokens for LLM response (recommended: 3000-5000 for comprehensive reviews) | No | `3000` |
| `temperature` | Temperature for LLM response (0.0-1.0, recommended: 0 for analytical responses) | No | `0` |
| `department` | Department name for logging purposes | No | `web` |
| `team` | Team name for logging purposes | **Yes** | - |
| `ignore_patterns` | Comma-separated file patterns to ignore during review (e.g., `.json,.md,.test.js`) | No | `.json,.md,.lock,.test.js,.spec.js` |
| `openai_api_key` | OpenAI API key (required if provider is `openai`) | No | - |
| `claude_api_key` | Claude API key (required if provider is `claude`) | No | - |

## 🌍 Supported Languages

### JavaScript/TypeScript (`js`)
- **File Extensions**: `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`
- **Focus Areas**: 
  - React hooks and component patterns
  - TypeScript type safety
  - Frontend performance and accessibility
  - Web security (XSS, CSRF)
  - Modern JavaScript best practices

### Python (`python`)
- **File Extensions**: `.py`, `.pyw`, `.pyx`, `.pyi`
- **Focus Areas**:
  - SQL injection prevention
  - Command injection vulnerabilities
  - Deserialization security
  - Performance optimization
  - PEP 8 compliance

### Java (`java`)
- **File Extensions**: `.java`
- **Focus Areas**:
  - SOLID principles
  - Enterprise security patterns
  - Memory management
  - Exception handling
  - Resource management

### PHP (`php`)
- **File Extensions**: `.php`
- **Focus Areas**:
  - Web security vulnerabilities
  - Database security
  - Input validation
  - Performance optimization
  - Modern PHP practices

## 📊 Enhanced Review Output

The action now provides structured JSON analysis with detailed metrics:

### Severity Scoring System
Each issue is scored across 5 dimensions:
- **Impact** (0-5): How severe the issue is
- **Exploitability** (0-5): How easy it is to exploit
- **Likelihood** (0-5): How likely the issue is to occur
- **Blast Radius** (0-5): How many systems/users are affected
- **Evidence Strength** (0-5): How strong the evidence is

**Final Severity Score**: Weighted calculation using the formula:
```
severity_score = 0.35*impact + 0.30*exploitability + 0.20*likelihood + 0.10*blast_radius + 0.05*evidence_strength
```

### Issue Categories
- **🔒 Security**: Vulnerabilities, injection attacks, authentication issues
- **⚡ Performance**: Bottlenecks, memory leaks, inefficient algorithms
- **🛠️ Maintainability**: Code complexity, readability, architectural issues
- **📚 Best Practices**: Standards violations, anti-patterns, code smells

### Confidence Scoring
- **High Confidence** (≥0.8): Strong evidence, clear recommendations
- **Medium Confidence** (0.6-0.8): Good evidence, reasonable recommendations
- **Low Confidence** (<0.6): Limited evidence, suggestions for manual review

### Data Structure

The action now provides a comprehensive data structure for each review:

```javascript
{
  issues: [
    {
      id: "SEC-01",
      category: "security",
      severity_proposed: "critical",
      severity_score: 4.2,
      confidence: 0.85,
      file: "src/components/Login.jsx",
      lines: [45, 52],
      snippet: "vulnerable code...",
      why_it_matters: "SQL injection risk",
      fix_summary: "Use parameterized queries",
      fix_code_patch: "safe code...",
      tests: "Test with malicious input",
      chunk: 1,
      originalId: "SEC-01"
    }
  ],
  summaries: ["Chunk 1: Found 2 security issues"],
  totalCriticalCount: 2,
  totalSuggestionCount: 1,
  chunksProcessed: 1
}
```

This structure enables:
- **Better Analytics**: Comprehensive data for monitoring and insights
- **Improved Logging**: Detailed information for external systems
- **Enhanced Display**: Rich PR comments with categorized issues
- **Debugging Support**: Clear tracking of which chunk produced which issues

## 🎯 Merge Decision Logic

The action automatically determines merge safety based on:

### Critical Issues Detection
- **Auto-block**: Any issue with `severity_proposed: "critical"` AND `confidence ≥ 0.6`
- **Manual review**: Critical issues with lower confidence
- **Safe to merge**: No critical issues or only suggestions

### Decision Factors
1. **JSON Analysis**: Primary decision based on structured LLM output
2. **Fallback Text Analysis**: Legacy support for non-JSON responses
3. **Confidence Thresholds**: Configurable confidence levels for blocking

## 📝 Enhanced PR Comments

### Rich Issue Display
```
🔴 SEC-01 - SECURITY (Chunk 1)
- **File**: `src/components/Login.jsx` (lines 45-52)
- **Severity Score**: 4.2/5.0
- **Confidence**: 85%
- **Risk Factors**: Impact: 4, Exploitability: 5, Likelihood: 3, Blast Radius: 4, Evidence: 4
- **Impact**: SQL injection vulnerability allows unauthorized database access
- **Fix**: Use parameterized queries with proper input validation
```

### Review Details Section
```
**Review Details:**
- **Department**: web
- **Team**: frontend-team
- **Provider**: CLAUDE
- **Files Reviewed**: 5 files
- **Review Date**: 12/19/2024, 2:30:45 PM
- **Base Branch**: develop
- **Head Branch**: feature/new-login
- **Path Filter**: src/,components/
- **Ignored Patterns**: .json, .md, .lock, .test.js, .spec.js
```

### Categorized Summary
- **🚨 Critical Issues**: High-priority security and performance problems
- **💡 Suggestions**: Improvements and best practice recommendations
- **📊 Review Metrics**: Total counts and processing statistics

## 🔧 Configuration

### Base Branch Detection

The action automatically detects the base branch from the pull request context:

- **In PR context**: Uses the PR's base branch automatically
- **Manual override**: You can specify `base_branch` input to override the auto-detection
- **Fallback**: Uses `develop` as default if neither PR context nor input is available

### Logging Parameters

The action includes department and team parameters for enhanced logging and tracking:

- **`team`** (Required): Your team name for identification and tracking
- **`department`** (Optional): Department name, defaults to `web`

These parameters are displayed in:
- Review logs and console output
- PR comments for transparency
- Can be used for analytics and reporting

### External Logging

The action automatically logs review data to an external endpoint for analytics and monitoring:

#### Logged Data Structure
```json
{
  "department": "web",
  "team": "frontend-team",
  "head_branch": "feature/new-login",
  "files_reviewed": 5,
  "issues": [
    {
      "id": "SEC-01",
      "category": "security",
      "severity": "critical",
      "severity_score": 4.2,
      "confidence": 0.85,
      "file": "src/components/Login.jsx",
      "lines": [45, 52],
      "chunk": 1
    }
  ],
  "review_timestamp": "2024-12-19T14:30:45.123Z",
  "repository": "owner/repo",
  "pr_number": 123,
  "merge_blocked": true,
  "language": "js",
  "provider": "claude"
}
```

#### Logging Features
- **Non-blocking**: Logging happens asynchronously and doesn't delay PR comment generation
- **Configurable**: Can be enabled/disabled via configuration
- **Error handling**: Failed logging attempts don't affect the review process
- **Comprehensive data**: Includes all review metadata, issues, and metrics

### Environment Variables

The action requires the following environment variables to function properly:

#### Required Environment Variables

1. **`GITHUB_TOKEN`** (Mandatory)
   - **Purpose**: Used for GitHub API access to read repository data and post PR comments
   - **Setup**: Automatically provided by GitHub Actions (no manual setup required)
   - **Usage**: Must be explicitly set in your workflow as shown in the examples above

2. **`CLAUDE_API_KEY`** or **`OPENAI_API_KEY`** (Mandatory)
   - **Purpose**: Authentication for your chosen LLM provider
   - **Setup**: Must be added to your repository secrets
   - **Usage**: Referenced in the workflow as `${{ secrets.CLAUDE_API_KEY }}`

### API Keys Setup

You'll need to set up API keys for your chosen LLM provider:

#### For Claude (Anthropic):
1. Get your API key from [Anthropic Console](https://console.anthropic.com/)
2. Add it to your repository secrets as `CLAUDE_API_KEY`

#### For OpenAI:
1. Get your API key from [OpenAI Platform](https://platform.openai.com/)
2. Add it to your repository secrets as `OPENAI_API_KEY`

### Repository Secrets Setup

1. Go to your repository settings
2. Navigate to "Secrets and variables" → "Actions"
3. Add your API key:
   - **Name**: `CLAUDE_API_KEY` (for Claude) or `OPENAI_API_KEY` (for OpenAI)
   - **Value**: Your API key

### Environment Variables in Workflow

Make sure to include the required environment variables in your workflow:

```yaml
- name: DeepReview
  uses: tajawal/web-code-reviewer@latest
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # Required: GitHub token for API access
  with:
    claude_api_key: ${{ secrets.CLAUDE_API_KEY }}  # Required: Your LLM API key
    team: 'your-team-name'  # Required: Your team name
    # ... other optional parameters
```

## 🔍 Smart File Filtering

The action automatically filters files based on language and path:

### Language-Specific Filtering
- **JavaScript/TypeScript**: Only processes `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs` files
- **Python**: Only processes `.py`, `.pyw`, `.pyx`, `.pyi` files
- **Java**: Only processes `.java` files
- **PHP**: Only processes `.php` files

### Path Filtering
- **Included**: Files in any of the specified paths (default: `packages/`)
- **Multiple Paths**: You can specify multiple comma-separated paths

### Ignore Patterns
- **Default**: The action automatically ignores `.json`, `.md`, `.lock`, `.test.js`, `.spec.js` files
- **Customizable**: You can override default patterns using the `ignore_patterns` parameter
- **Format**: Comma-separated list of file extensions or patterns
- **Examples**:
  ```yaml
  # Use default ignore patterns
  ignore_patterns: '.json,.md,.lock,.test.js,.spec.js'
  
  # Custom ignore patterns
  ignore_patterns: '.json,.md,.lock,.test.js,.spec.js,.min.js,.bundle.js'
  
  # Ignore additional file types
  ignore_patterns: '.json,.md,.lock,.test.js,.spec.js,.log,.tmp,.cache'
  ```

### Path Examples:
```yaml
# Single path
path_to_files: 'src/'

# Multiple paths
path_to_files: 'packages/,src/,components/'

# Language-specific paths
path_to_files: 'src/,main/,java/'  # for Java
path_to_files: 'backend/,api/'   # for Python
path_to_files: 'app/,resources/' # for PHP

### Ignore Patterns Examples:
```yaml
# Ignore build artifacts and generated files
ignore_patterns: '.json,.md,.lock,.test.js,.spec.js,.min.js,.bundle.js,.map'

# Ignore configuration and documentation files
ignore_patterns: '.json,.md,.lock,.test.js,.spec.js,.yml,.yaml,.toml,.ini'

# Ignore temporary and cache files
ignore_patterns: '.json,.md,.lock,.test.js,.spec.js,.log,.tmp,.cache,.swp'

# Minimal ignore (only essential patterns)
ignore_patterns: '.json,.md,.lock'
```
```

## 🏷️ Version Management

### Automated Latest Tag Updates

This repository includes automated workflows to keep the `latest` tag up-to-date:

#### Automatic Updates
- **Trigger**: Whenever a new version tag is pushed (e.g., `v1.13.0`)
- **Workflow**: `.github/workflows/update-latest-tag.yml`
- **Action**: Automatically updates the `latest` tag to point to the newest version

#### Manual Updates
- **Trigger**: Manual workflow dispatch from GitHub Actions tab
- **Workflow**: `.github/workflows/manual-update-latest.yml`
- **Options**: 
  - Auto-detect latest version: Use `auto` as input
  - Specify version: Provide specific version tag (e.g., `v1.12.0`)

### Usage Options

```yaml
# Use latest version (automatically updated)
- uses: tajawal/web-code-reviewer@latest

# Use specific version (for stability)
- uses: tajawal/web-code-reviewer@v1.12.0
```

## 🛠️ Development

### Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the action: `npm run build`

### Local Testing

The action includes a comprehensive local testing setup:

```bash
# Setup environment variables (first time only)
npm run test:setup

# Run all tests
npm test

# Run specific test scenarios
npm run test:single    # Single path test
npm run test:multi     # Multiple paths test
npm run test:openai    # OpenAI provider test
npm run test:custom    # Custom configuration test

# Test with custom parameters
TEST_PATH_TO_FILES="src/,lib/" npm run test:custom
```

See [test/README.md](test/README.md) for detailed testing documentation.

### Manual Testing

```bash
# Install dependencies
npm install

# Build the action
npm run build

# Test locally (requires API keys)
node dist/index.js
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
- Create an issue in this repository
- Check the [GitHub Actions documentation](https://docs.github.com/en/actions)

---

**Note**: This action requires appropriate API keys and may incur costs based on your LLM provider's pricing. The enhanced JSON output and multi-language support provide more detailed and accurate code reviews.
