/**
 * Context Service - Provides additional context to improve LLM reliability
 */

const { execSync } = require('child_process');
const core = require('@actions/core');
const CONTEXT_CONFIG = require('../config/context');

/**
 * Optimized shell command execution with better error handling
 */
class ShellExecutor {
  static execute(command, options = {}) {
    const defaultOptions = {
      encoding: 'utf8',
      maxBuffer: 5 * 1024 * 1024,
      timeout: 30000, // 30 second timeout
      ...options
    };

    try {
      return execSync(command, defaultOptions);
    } catch (error) {
      if (error.signal === 'SIGTERM') {
        throw new Error(`Command timed out: ${command}`);
      }
      throw error;
    }
  }

  static executeWithFallback(primaryCommand, fallbackCommand, options = {}) {
    try {
      return this.execute(primaryCommand, options);
    } catch (error) {
      core.warning(`⚠️  Primary command failed, trying fallback: ${error.message}`);
      try {
        return this.execute(fallbackCommand, options);
      } catch (fallbackError) {
        throw new Error(
          `Both primary and fallback commands failed. Primary: ${error.message}, Fallback: ${fallbackError.message}`
        );
      }
    }
  }
}

class ContextService {
  constructor(baseBranch) {
    this.baseBranch = baseBranch;
  }

  /**
   * Execute context generation with performance monitoring
   */
  executeWithTiming(contextType, generator) {
    const startTime = Date.now();
    const data = generator();
    const duration = Date.now() - startTime;

    core.info(`⏱️  Generated ${contextType} context in ${duration}ms`);
    return data;
  }

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

  /**
   * Get project structure context
   */
  getProjectStructure() {
    if (!CONTEXT_CONFIG.ENABLE_PROJECT_STRUCTURE) {
      return '';
    }

    return this.executeWithTiming('project_structure', () => {
      try {
        // Build exclude patterns
        const excludePatterns = CONTEXT_CONFIG.EXCLUDE_PATTERNS.map(
          pattern => `-not -path "./${pattern}/*"`
        ).join(' ');

        // Build file extensions
        const extensions = CONTEXT_CONFIG.INCLUDE_EXTENSIONS.map(ext => `-name "*${ext}"`).join(
          ' -o '
        );

        // Get directory structure first
        const dirStructureCommand = `find . -type d ${excludePatterns} | head -20 | sort`;
        const dirStructure = ShellExecutor.execute(dirStructureCommand);

        // Get key files with their purposes
        const keyFilesCommand = `find . -type f \\( ${extensions} \\) ${excludePatterns} | head -${CONTEXT_CONFIG.MAX_PROJECT_FILES} | while read file; do 
          echo "=== $file ==="
          # Get file purpose from first few lines
          head -20 "$file" 2>/dev/null | grep -E "(export|class|function|interface|type|const.*=)" | head -3
          echo ""
        done`;
        const keyFiles = ShellExecutor.execute(keyFilesCommand);

        const structure = `Directory Structure:\n${dirStructure}\n\nKey Files:\n${keyFiles}`;
        return `--- Project Structure Context ---\n${structure}\n--- End Project Structure ---\n`;
      } catch (error) {
        core.warning(`⚠️  Could not get project structure: ${error.message}`);
        return '';
      }
    });
  }

  /**
   * Get dependency context (package.json, imports)
   */
  getDependencyContext() {
    if (!CONTEXT_CONFIG.ENABLE_DEPENDENCIES) {
      return '';
    }

    return this.executeWithTiming('dependencies', () => {
      try {
        let context = '--- Dependencies Context ---\n';

        // Get package.json with better formatting
        try {
          const packageJsonRaw = ShellExecutor.execute('cat package.json');
          const packageJson = JSON.parse(packageJsonRaw);

          context += '📦 Package.json Summary:\n';
          context += `  Name: ${packageJson.name || 'N/A'}\n`;
          context += `  Version: ${packageJson.version || 'N/A'}\n`;
          context += `  Description: ${packageJson.description || 'N/A'}\n`;

          if (packageJson.dependencies) {
            const depCount = Object.keys(packageJson.dependencies).length;
            context += `  Dependencies: ${depCount} packages\n`;
            if (depCount <= 20) {
              context += '  Key Dependencies:\n';
              Object.entries(packageJson.dependencies)
                .slice(0, 10)
                .forEach(([name, version]) => {
                  context += `    ${name}: ${version}\n`;
                });
            }
          }

          if (packageJson.devDependencies) {
            const devDepCount = Object.keys(packageJson.devDependencies).length;
            context += `  Dev Dependencies: ${devDepCount} packages\n`;
          }

          if (packageJson.scripts) {
            context += '  Available Scripts:\n';
            Object.keys(packageJson.scripts)
              .slice(0, 5)
              .forEach(script => {
                context += `    ${script}\n`;
              });
          }
        } catch {
          // Fallback to raw package.json
          const packageJson = ShellExecutor.execute('cat package.json');
          context += `📦 Package.json (raw):\n${packageJson}\n`;
        }

        // Get lock file info if available
        try {
          const lockFile = ShellExecutor.execute(
            'ls -la package-lock.json yarn.lock 2>/dev/null | head -1'
          );
          if (lockFile.trim()) {
            context += `\n🔒 Lock file: ${lockFile.trim()}\n`;
          }
        } catch {
          // No lock file found
        }

        context += '\n--- End Dependencies ---\n';
        return context;
      } catch (error) {
        core.warning(`⚠️  Could not get dependency context: ${error.message}`);
        return '';
      }
    });
  }

  /**
   * Get recent commit context for pattern analysis
   */
  getRecentCommitContext() {
    if (!CONTEXT_CONFIG.ENABLE_COMMIT_HISTORY) {
      return '';
    }

    return this.executeWithTiming('commit_history', () => {
      try {
        const commitCommand = `git log --oneline --no-merges origin/${this.baseBranch}..HEAD | head -${CONTEXT_CONFIG.MAX_COMMIT_HISTORY}`;
        const commits = ShellExecutor.execute(commitCommand);
        return `--- Recent Commits Context ---\n${commits}\n--- End Recent Commits ---\n`;
      } catch (error) {
        core.warning(`⚠️  Could not get recent commit context: ${error.message}`);
        return '';
      }
    });
  }

  /**
   * Get file relationship context (imports/exports between changed files)
   */
  getFileRelationshipContext(changedFiles) {
    if (!CONTEXT_CONFIG.ENABLE_FILE_RELATIONSHIPS) {
      return '';
    }

    return this.executeWithTiming('file_relationships', () => {
      try {
        let context = '--- File Relationships Context ---\n';

        if (!changedFiles || changedFiles.length === 0) {
          context += 'No changed files to analyze relationships.\n';
          context += '--- End File Relationships ---\n';
          return context;
        }

        // Analyze each changed file
        for (const file of changedFiles) {
          try {
            context += `\n📁 ${file}:\n`;

            // Get file content to analyze
            const fileContent = ShellExecutor.executeWithFallback(
              `git show HEAD:${file} 2>/dev/null`,
              `cat ${file} 2>/dev/null`
            );

            if (!fileContent.trim()) {
              context += '  (File not found or empty)\n';
              continue;
            }

            // Extract imports
            const imports = fileContent
              .split('\n')
              .filter(line => line.trim().match(/^(import|require|from)/))
              .slice(0, CONTEXT_CONFIG.MAX_IMPORT_LINES);

            if (imports.length > 0) {
              context += '  📥 Imports:\n';
              imports.forEach(imp => {
                context += `    ${imp.trim()}\n`;
              });
            }

            // Extract exports
            const exports = fileContent
              .split('\n')
              .filter(line => line.trim().match(/^(export|module\.exports)/))
              .slice(0, 5);

            if (exports.length > 0) {
              context += '  📤 Exports:\n';
              exports.forEach(exp => {
                context += `    ${exp.trim()}\n`;
              });
            }

            // Extract key functions/classes
            const keyDefinitions = fileContent
              .split('\n')
              .filter(line => line.trim().match(/(function|class|const.*=|let.*=|var.*=).*{/))
              .slice(0, 5);

            if (keyDefinitions.length > 0) {
              context += '  🔧 Key Definitions:\n';
              keyDefinitions.forEach(def => {
                context += `    ${def.trim()}\n`;
              });
            }
          } catch (error) {
            context += `  ⚠️ Error analyzing file: ${error.message}\n`;
            continue;
          }
        }

        // Find files that import from changed files
        context += '\n🔗 Files that depend on changed files:\n';
        try {
          const allFiles = ShellExecutor.execute(
            `find . -type f \\( -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.jsx" \\) -not -path "./node_modules/*" -not -path "./dist/*" | head -50`
          );

          const filesToCheck = allFiles
            .trim()
            .split('\n')
            .filter(f => f.trim());
          let dependencyCount = 0;

          for (const checkFile of filesToCheck) {
            if (dependencyCount >= 10) break; // Limit to prevent too much output

            try {
              const content = ShellExecutor.execute(`cat "${checkFile}" 2>/dev/null`);
              const changedFileNames = changedFiles.map(f => f.split('/').pop().split('.')[0]);

              const hasDependency = changedFileNames.some(
                name =>
                  content.includes(`from '${name}'`) ||
                  content.includes(`from "./${name}"`) ||
                  content.includes(`require('${name}')`) ||
                  content.includes(`import ${name}`)
              );

              if (hasDependency && !changedFiles.includes(checkFile)) {
                context += `  📄 ${checkFile} (depends on changed files)\n`;
                dependencyCount++;
              }
            } catch {
              continue;
            }
          }
        } catch (error) {
          context += `  ⚠️ Could not analyze dependencies: ${error.message}\n`;
        }

        context += '\n--- End File Relationships ---\n';
        return context;
      } catch (error) {
        core.warning(`⚠️  Could not get file relationship context: ${error.message}`);
        return '';
      }
    });
  }

  /**
   * Get comprehensive context for LLM with size limits and parallel processing
   */
  async getComprehensiveContext(changedFiles, estimatedTokens = 0) {
    const startTime = Date.now();

    // Create context generation promises in parallel
    const contextPromises = CONTEXT_CONFIG.CONTEXT_PRIORITY.map(contextType => {
      return new Promise(resolve => {
        try {
          let context = '';
          if (contextType === 'dependencies') {
            context = this.getDependencyContext();
          } else if (contextType === 'project_structure') {
            context = this.getProjectStructure();
          } else if (contextType === 'file_relationships') {
            context = this.getFileRelationshipContext(changedFiles);
          } else if (contextType === 'commit_history') {
            context = this.getRecentCommitContext();
          }
          resolve(context);
        } catch (error) {
          core.warning(`⚠️  Error generating ${contextType} context: ${error.message}`);
          resolve('');
        }
      });
    });

    // Wait for all contexts to be generated in parallel
    const contexts = await Promise.all(contextPromises);
    const filteredContexts = contexts.filter(context => context.trim());

    // Organize context with better structure
    const organizedContext = this.organizeContextForLLM(filteredContexts, changedFiles);

    const totalTime = Date.now() - startTime;
    core.info(
      `🚀 Generated comprehensive context in ${totalTime}ms (${filteredContexts.length} contexts)`
    );

    // Apply relevance filtering
    const filteredContext = this.filterRelevantContext(organizedContext, changedFiles);
    const originalSize = Math.round(organizedContext.length / 1024);
    const filteredSize = Math.round(filteredContext.length / 1024);

    if (filteredSize < originalSize) {
      core.info(
        `🎯 Context filtered: ${originalSize}KB → ${filteredSize}KB (${Math.round((1 - filteredSize / originalSize) * 100)}% reduction)`
      );
    }

    // Calculate dynamic context size limit
    const dynamicLimit =
      estimatedTokens > 0
        ? this.calculateDynamicContextSize(estimatedTokens)
        : CONTEXT_CONFIG.MAX_CONTEXT_SIZE;

    // Limit context size to prevent token overflow
    if (filteredContext.length > dynamicLimit) {
      core.warning(
        `⚠️  Context size (${filteredSize}KB) exceeds dynamic limit (${Math.round(dynamicLimit / 1024)}KB), truncating...`
      );
      const truncatedContext =
        filteredContext.substring(0, dynamicLimit) +
        '\n\n--- [Context truncated due to size limits] ---';

      core.info(`📋 Final context (truncated): ${Math.round(truncatedContext.length / 1024)}KB`);
      core.info(`📋 Final context content:\n${truncatedContext}`);

      return truncatedContext;
    }

    core.info(`📋 Final context: ${filteredSize}KB`);
    core.info(`📋 Final context content:\n${filteredContext}`);

    return filteredContext;
  }

  /**
   * Organize context sections for better LLM consumption
   */
  organizeContextForLLM(contexts, changedFiles) {
    if (!contexts || contexts.length === 0) {
      return '';
    }

    let organizedContext = '🔍 PROJECT CONTEXT FOR CODE REVIEW\n';
    organizedContext += '='.repeat(50) + '\n\n';

    // Add changed files summary
    if (changedFiles && changedFiles.length > 0) {
      organizedContext += '📝 FILES BEING REVIEWED:\n';
      changedFiles.forEach((file, index) => {
        organizedContext += `  ${index + 1}. ${file}\n`;
      });
      organizedContext += '\n';
    }

    // Process each context section
    contexts.forEach(context => {
      if (!context.trim()) return;

      // Extract section type and content
      const lines = context.split('\n');
      let sectionType = '';
      let content = '';
      let inSection = false;

      for (const line of lines) {
        if (line.includes('---') && line.includes('Context')) {
          sectionType = line
            .replace(/---/g, '')
            .replace(/Context/g, '')
            .trim();
          inSection = true;
          continue;
        }
        if (line.includes('--- End')) {
          inSection = false;
          continue;
        }
        if (inSection) {
          content += line + '\n';
        }
      }

      // Format section based on type
      if (sectionType && content.trim()) {
        organizedContext += `📋 ${sectionType.toUpperCase()}:\n`;
        organizedContext += '-'.repeat(30) + '\n';
        organizedContext += content.trim() + '\n\n';
      }
    });

    organizedContext += '='.repeat(50) + '\n';
    organizedContext += 'END PROJECT CONTEXT\n\n';

    return organizedContext;
  }

  /**
   * Filter context based on relevance to changed files
   */
  filterRelevantContext(context, changedFiles) {
    if (!changedFiles || changedFiles.length === 0) {
      return context;
    }

    try {
      // Extract file extensions from changed files
      const changedExtensions = new Set(
        changedFiles.map(file => file.split('.').pop()).filter(Boolean)
      );

      // Filter project structure context to only include relevant files
      const lines = context.split('\n');
      const filteredLines = [];
      let inProjectStructure = false;
      let skipFile = false;

      for (const line of lines) {
        if (line.includes('--- Project Structure Context ---')) {
          inProjectStructure = true;
          filteredLines.push(line);
          continue;
        }

        if (line.includes('--- End Project Structure ---')) {
          inProjectStructure = false;
          filteredLines.push(line);
          continue;
        }

        if (inProjectStructure && line.startsWith('=== ')) {
          // Check if this file is relevant to changed files
          const filePath = line.replace('=== ', '').replace(' ===', '');
          const fileExt = filePath.split('.').pop();

          // Include if extension matches changed files or if it's a core file
          skipFile =
            !changedExtensions.has(fileExt) &&
            !filePath.includes('package.json') &&
            !filePath.includes('config') &&
            !filePath.includes('src/');
        }

        if (!skipFile) {
          filteredLines.push(line);
        }
      }

      return filteredLines.join('\n');
    } catch (error) {
      core.warning(`⚠️  Error filtering context: ${error.message}`);
      return context; // Return original context if filtering fails
    }
  }

  /**
   * Summarize large context for later chunks
   */
  summarizeContext(context, maxSize) {
    if (context.length <= maxSize) {
      return context;
    }

    // Extract key sections and summarize
    const sections = context.split('---');
    const summary = [];

    for (const section of sections) {
      if (section.includes('Dependencies Context')) {
        // Keep dependencies as-is (usually small)
        summary.push(`---${section}`);
      } else if (section.includes('Project Structure Context')) {
        // Summarize project structure
        const lines = section.split('\n').filter(line => line.trim());
        const keyFiles = lines.slice(0, 5); // Keep first 5 files
        summary.push(
          `--- Project Structure Context (Summary) ---\n${keyFiles.join('\n')}\n[Project structure truncated for brevity]\n--- End Project Structure ---`
        );
      } else if (section.includes('File Relationships Context')) {
        // Keep file relationships (usually small)
        summary.push(`---${section}`);
      } else if (section.includes('Recent Commits Context')) {
        // Keep recent commits (usually small)
        summary.push(`---${section}`);
      }
    }

    const summarized = summary.join('\n');
    if (summarized.length > maxSize) {
      return (
        summarized.substring(0, maxSize) + '\n\n--- [Context summarized due to size limits] ---'
      );
    }

    return summarized;
  }

  /**
   * Get context-aware chunk prompt
   */
  getContextAwareChunkPrompt(basePrompt, chunkIndex, totalChunks, context) {
    if (totalChunks === 1) {
      const singleChunkPrompt = `${basePrompt}\n\n${context}`;
      core.info(
        `📝 Generated single-chunk prompt: ${Math.round(singleChunkPrompt.length / 1024)}KB`
      );
      return singleChunkPrompt;
    }

    // For later chunks, summarize context to save tokens
    const processedContext =
      chunkIndex > 0
        ? this.summarizeContext(context, CONTEXT_CONFIG.MAX_CONTEXT_SIZE / 2)
        : context;

    const contextSize = Math.round(processedContext.length / 1024);
    const originalContextSize = Math.round(context.length / 1024);

    if (chunkIndex > 0 && processedContext.length < context.length) {
      core.info(
        `📝 Chunk ${chunkIndex + 1}/${totalChunks}: Context summarized ${originalContextSize}KB → ${contextSize}KB`
      );
    } else {
      core.info(`📝 Chunk ${chunkIndex + 1}/${totalChunks}: Using full context (${contextSize}KB)`);
    }

    const chunkPrompt = `${basePrompt}

**CHUNK CONTEXT:** This is chunk ${chunkIndex + 1} of ${totalChunks} total chunks.
**PROJECT CONTEXT:** ${processedContext}

**INSTRUCTIONS:** 
- Review this specific portion of the code changes
- Consider the project context and file relationships provided above
- Focus on issues that are relevant to this chunk
- If you find critical issues, mark them clearly
- Provide specific, actionable feedback for this code section
- Consider how this chunk relates to the overall changes and project structure

**CODE CHANGES TO REVIEW:**`;

    const totalPromptSize = Math.round(chunkPrompt.length / 1024);
    core.info(
      `📝 Generated context-aware prompt for chunk ${chunkIndex + 1}: ${totalPromptSize}KB total`
    );

    return chunkPrompt;
  }
}

module.exports = ContextService;
