/**
 * Context configuration for enhanced LLM prompts
 */

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

module.exports = CONTEXT_CONFIG;
