/**
 * Context Service - Provides additional context to improve LLM reliability
 */

const { execSync } = require('child_process');
const core = require('@actions/core');
const CONTEXT_CONFIG = require('../config/context');

class ContextService {
  constructor(baseBranch) {
    this.baseBranch = baseBranch;
  }

  /**
   * Get project structure context
   */
  getProjectStructure() {
    if (!CONTEXT_CONFIG.ENABLE_PROJECT_STRUCTURE) {
      return '';
    }

    try {
      // Build exclude patterns
      const excludePatterns = CONTEXT_CONFIG.EXCLUDE_PATTERNS.map(
        pattern => `-not -path "./${pattern}/*"`
      ).join(' ');

      // Build file extensions
      const extensions = CONTEXT_CONFIG.INCLUDE_EXTENSIONS.map(ext => `-name "*${ext}"`).join(
        ' -o '
      );

      const structureCommand = `find . -type f \\( ${extensions} \\) ${excludePatterns} | head -${CONTEXT_CONFIG.MAX_PROJECT_FILES} | while read file; do echo "=== $file ==="; head -10 "$file" 2>/dev/null | grep -E "(import|export|class|function)" | head -5; done`;
      const structure = execSync(structureCommand, {
        encoding: 'utf8',
        maxBuffer: 5 * 1024 * 1024
      });
      return `--- Project Structure Context ---\n${structure}\n--- End Project Structure ---\n`;
    } catch (error) {
      core.warning(`⚠️  Could not get project structure: ${error.message}`);
      return '';
    }
  }

  /**
   * Get dependency context (package.json, imports)
   */
  getDependencyContext() {
    if (!CONTEXT_CONFIG.ENABLE_DEPENDENCIES) {
      return '';
    }

    try {
      let context = '';

      // Get package.json dependencies
      try {
        const packageJson = execSync('cat package.json | jq -r ".dependencies, .devDependencies"', {
          encoding: 'utf8'
        });
        context += `--- Dependencies Context ---\n${packageJson}\n--- End Dependencies ---\n`;
      } catch {
        // If jq is not available, try without it
        const packageJson = execSync('cat package.json', { encoding: 'utf8' });
        context += `--- Package.json Context ---\n${packageJson}\n--- End Package.json ---\n`;
      }

      return context;
    } catch (error) {
      core.warning(`⚠️  Could not get dependency context: ${error.message}`);
      return '';
    }
  }

  /**
   * Get recent commit context for pattern analysis
   */
  getRecentCommitContext() {
    if (!CONTEXT_CONFIG.ENABLE_COMMIT_HISTORY) {
      return '';
    }

    try {
      const commitCommand = `git log --oneline --no-merges origin/${this.baseBranch}..HEAD | head -${CONTEXT_CONFIG.MAX_COMMIT_HISTORY}`;
      const commits = execSync(commitCommand, { encoding: 'utf8' });
      return `--- Recent Commits Context ---\n${commits}\n--- End Recent Commits ---\n`;
    } catch (error) {
      core.warning(`⚠️  Could not get recent commit context: ${error.message}`);
      return '';
    }
  }

  /**
   * Get file relationship context (imports/exports between changed files)
   */
  getFileRelationshipContext(changedFiles) {
    if (!CONTEXT_CONFIG.ENABLE_FILE_RELATIONSHIPS) {
      return '';
    }

    try {
      let context = '--- File Relationships Context ---\n';

      for (const file of changedFiles) {
        try {
          // Get imports from this file (try multiple approaches)
          let imports = '';
          try {
            // First try git show
            const importsCommand = `git show HEAD:${file} 2>/dev/null | grep -E '^import.*from' | head -${CONTEXT_CONFIG.MAX_IMPORT_LINES}`;
            imports = execSync(importsCommand, { encoding: 'utf8' });
          } catch {
            // If git show fails, try reading file directly
            try {
              const directCommand = `cat ${file} 2>/dev/null | grep -E '^import.*from' | head -${CONTEXT_CONFIG.MAX_IMPORT_LINES}`;
              imports = execSync(directCommand, { encoding: 'utf8' });
            } catch {
              // File might not exist, skip
              continue;
            }
          }

          if (imports.trim()) {
            context += `\n${file} imports:\n${imports}\n`;
          }
        } catch {
          // Skip this file if we can't read it
          continue;
        }
      }

      context += '\n--- End File Relationships ---\n';
      return context;
    } catch (error) {
      core.warning(`⚠️  Could not get file relationship context: ${error.message}`);
      return '';
    }
  }

  /**
   * Get comprehensive context for LLM with size limits
   */
  getComprehensiveContext(changedFiles) {
    // Get contexts in priority order
    const contexts = [];

    for (const contextType of CONTEXT_CONFIG.CONTEXT_PRIORITY) {
      if (contextType === 'dependencies') {
        contexts.push(this.getDependencyContext());
      } else if (contextType === 'project_structure') {
        contexts.push(this.getProjectStructure());
      } else if (contextType === 'file_relationships') {
        contexts.push(this.getFileRelationshipContext(changedFiles));
      } else if (contextType === 'commit_history') {
        contexts.push(this.getRecentCommitContext());
      }
    }

    const filteredContexts = contexts.filter(context => context.trim());
    const combinedContext = filteredContexts.join('\n');

    // Limit context size to prevent token overflow
    if (combinedContext.length > CONTEXT_CONFIG.MAX_CONTEXT_SIZE) {
      core.warning(
        `⚠️  Context size (${Math.round(combinedContext.length / 1024)}KB) exceeds limit, truncating...`
      );
      return (
        combinedContext.substring(0, CONTEXT_CONFIG.MAX_CONTEXT_SIZE) +
        '\n\n--- [Context truncated due to size limits] ---'
      );
    }

    return combinedContext;
  }

  /**
   * Get context-aware chunk prompt
   */
  getContextAwareChunkPrompt(basePrompt, chunkIndex, totalChunks, context) {
    if (totalChunks === 1) {
      return `${basePrompt}\n\n${context}`;
    }

    return `${basePrompt}

**CHUNK CONTEXT:** This is chunk ${chunkIndex + 1} of ${totalChunks} total chunks.
**PROJECT CONTEXT:** ${context}

**INSTRUCTIONS:** 
- Review this specific portion of the code changes
- Consider the project context and file relationships provided above
- Focus on issues that are relevant to this chunk
- If you find critical issues, mark them clearly
- Provide specific, actionable feedback for this code section
- Consider how this chunk relates to the overall changes and project structure

**CODE CHANGES TO REVIEW:**`;
  }
}

module.exports = ContextService;
