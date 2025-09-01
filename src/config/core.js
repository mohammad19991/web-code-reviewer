/**
 * Core configuration constants for the GitHub Actions Code Reviewer
 */

const CORE_CONFIG = {
  // Default values
  DEFAULT_BASE_BRANCH: 'develop',
  DEFAULT_PROVIDER: 'claude',
  DEFAULT_PATH_TO_FILES: 'packages/',
  DEFAULT_LANGUAGE: 'js',
  
  // LLM settings
  MAX_TOKENS: 3000,
  TEMPERATURE: 0, // Optimal for consistent analytical responses
  
  // File filtering
  IGNORE_PATTERNS: ['.json', '.md', '.lock', '.test.js', '.spec.js']
};

module.exports = CORE_CONFIG;
