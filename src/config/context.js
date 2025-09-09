/**
 * Context configuration for enhanced LLM prompts
 */

const CONTEXT_CONFIG = {
  // Context size limits (dynamic based on available tokens)
  MAX_CONTEXT_SIZE: 75 * 1024, // 75KB max context size (fallback)
  MAX_PROJECT_FILES: 30, // Max files to include in project structure
  MAX_COMMIT_HISTORY: 15, // Max commits to include in recent history
  MAX_IMPORT_LINES: 15, // Max import lines per file

  // Dynamic context sizing based on available tokens
  CONTEXT_TOKEN_RATIO: 0.3, // Use 30% of available tokens for context
  MIN_CONTEXT_SIZE: 15 * 1024, // 15KB minimum context size
  MAX_CONTEXT_SIZE_LARGE: 150 * 1024, // 150KB maximum context size

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
