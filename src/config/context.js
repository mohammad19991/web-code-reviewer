/**
 * Context configuration for enhanced LLM prompts
 */

const CONTEXT_CONFIG = {
  // Context size limits
  MAX_CONTEXT_SIZE: 50 * 1024, // 50KB max context size
  MAX_PROJECT_FILES: 20, // Max files to include in project structure
  MAX_COMMIT_HISTORY: 10, // Max commits to include in recent history
  MAX_IMPORT_LINES: 10, // Max import lines per file

  // Context features (can be toggled)
  ENABLE_PROJECT_STRUCTURE: true,
  ENABLE_DEPENDENCIES: true,
  ENABLE_COMMIT_HISTORY: true,
  ENABLE_FILE_RELATIONSHIPS: true,

  // File patterns to exclude from context
  EXCLUDE_PATTERNS: ['node_modules', 'dist', '.git', 'coverage', '.nyc_output', 'build', 'out'],

  // File extensions to include in project structure
  INCLUDE_EXTENSIONS: ['.js', '.ts', '.tsx', '.jsx', '.vue', '.svelte'],

  // Context priority (order matters)
  CONTEXT_PRIORITY: ['dependencies', 'project_structure', 'file_relationships', 'commit_history']
};

module.exports = CONTEXT_CONFIG;
