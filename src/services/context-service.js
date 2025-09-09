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

        // Get key files with their purposes - focus on main entry points and config files
        const keyFilesCommand = `find . -type f \\( ${extensions} \\) ${excludePatterns} | grep -E "(index|main|app|config|package|setup|init)" | head -${CONTEXT_CONFIG.MAX_PROJECT_FILES} | while read file; do 
          echo "=== $file ==="
          # Get file purpose from first few lines - look for exports, classes, functions
          head -15 "$file" 2>/dev/null | grep -E "(export|class|function|interface|type|const.*=|module.exports)" | head -2
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
  getFileRelationshipsContext(changedFiles) {
    if (!CONTEXT_CONFIG.ENABLE_FILE_RELATIONSHIPS) {
      return '';
    }

    return this.executeWithTiming('file_relationships', () => {
      try {
        let context = '--- File Relationships Context ---\n';

        if (!changedFiles || changedFiles.length === 0) {
          // Even without changed files, we can still analyze the project structure
          context += 'No specific changed files to analyze relationships.\n';
          context += 'Analyzing project structure for context...\n';

          // Get a few key files from the project for context
          try {
            const keyFiles = ShellExecutor.execute(
              `find . -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.jsx" | grep -E "(index|main|app|config)" | head -5`
            );
            if (keyFiles.trim()) {
              context += `Key project files found:\n${keyFiles}\n`;
            }
          } catch {
            // Ignore if we can't find key files
          }

          context += '--- End File Relationships ---\n';
          return context;
        }

        // Analyze each changed file for comprehensive relationships
        for (const file of changedFiles) {
          try {
            context += `\n🔗 ${file}:\n`;

            // Get file content to analyze
            const fileContent = ShellExecutor.executeWithFallback(
              `git show HEAD:${file} 2>/dev/null`,
              `cat ${file} 2>/dev/null`
            );

            if (!fileContent.trim()) {
              context += '  (File not found or empty)\n';
              continue;
            }

            // 1. INCOMING RELATIONSHIPS (what this file imports/requires)
            const incomingRelationships = this.analyzeIncomingRelationships(fileContent);
            if (incomingRelationships.length > 0) {
              context += '  📥 Dependencies (what this file imports):\n';
              incomingRelationships.forEach(rel => {
                context += `    ${rel}\n`;
              });
            }

            // 2. OUTGOING RELATIONSHIPS (what this file exports/provides)
            const outgoingRelationships = this.analyzeOutgoingRelationships(fileContent);
            if (outgoingRelationships.length > 0) {
              context += '  📤 Exports (what this file provides):\n';
              outgoingRelationships.forEach(rel => {
                context += `    ${rel}\n`;
              });
            }

            // 3. DEPENDENT FILES (files that import from this file)
            const dependentFiles = this.findDependentFiles(file);
            if (dependentFiles.length > 0) {
              context += '  🔗 Files that depend on this file:\n';
              dependentFiles.forEach(dep => {
                context += `    ${dep}\n`;
              });
            }

            // 4. API CONTRACTS (interfaces, types, function signatures)
            const apiContracts = this.extractAPIContracts(fileContent);
            if (apiContracts.length > 0) {
              context += '  📋 API Contracts (interfaces/types):\n';
              apiContracts.forEach(contract => {
                context += `    ${contract}\n`;
              });
            }

            // 5. DATA FLOW (how data flows in/out of this file)
            const dataFlow = this.analyzeDataFlow(fileContent);
            if (dataFlow.length > 0) {
              context += '  🌊 Data Flow:\n';
              dataFlow.forEach(flow => {
                context += `    ${flow}\n`;
              });
            }
          } catch (error) {
            context += `  ⚠️ Could not analyze ${file}: ${error.message}\n`;
          }
        }

        // 6. CROSS-FILE RELATIONSHIPS (how changed files relate to each other)
        if (changedFiles.length > 1) {
          const crossFileRelationships = this.analyzeCrossFileRelationships(changedFiles);
          if (crossFileRelationships.length > 0) {
            context += '\n🔄 Cross-File Relationships:\n';
            crossFileRelationships.forEach(rel => {
              context += `  ${rel}\n`;
            });
          }
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
   * Get semantic code context - analyze what functions/classes are being used and their relationships
   */
  getSemanticCodeContext(changedFiles) {
    return this.executeWithTiming('semantic_code', () => {
      try {
        let context = '--- Semantic Code Context ---\n';

        if (!changedFiles || changedFiles.length === 0) {
          context += 'No changed files to analyze semantically.\n';
          context += '--- End Semantic Code ---\n';
          return context;
        }

        // Analyze each changed file for semantic understanding
        for (const file of changedFiles) {
          try {
            context += `\n🔍 ${file}:\n`;

            // Get file content
            const fileContent = ShellExecutor.executeWithFallback(
              `git show HEAD:${file} 2>/dev/null`,
              `cat ${file} 2>/dev/null`
            );

            if (!fileContent.trim()) {
              context += '  (File not found or empty)\n';
              continue;
            }

            // Extract function/class definitions
            const definitions = this.extractCodeDefinitions(fileContent);
            if (definitions.length > 0) {
              context += '  📝 Key Definitions:\n';
              definitions.forEach(def => {
                context += `    ${def}\n`;
              });
            }

            // Extract function calls and their purposes
            const functionCalls = this.extractFunctionCalls(fileContent);
            if (functionCalls.length > 0) {
              context += '  🔗 Function Calls:\n';
              functionCalls.forEach(call => {
                context += `    ${call}\n`;
              });
            }

            // Extract error handling patterns
            const errorHandling = this.extractErrorHandling(fileContent);
            if (errorHandling.length > 0) {
              context += '  ⚠️ Error Handling:\n';
              errorHandling.forEach(error => {
                context += `    ${error}\n`;
              });
            }
          } catch (error) {
            context += `  ⚠️ Could not analyze ${file}: ${error.message}\n`;
          }
        }

        context += '\n--- End Semantic Code ---\n';
        return context;
      } catch (error) {
        core.warning(`⚠️  Could not get semantic code context: ${error.message}`);
        return '';
      }
    });
  }

  /**
   * Get architectural context - how the code fits into the overall system
   */
  getArchitecturalContext(changedFiles) {
    return this.executeWithTiming('architectural', () => {
      try {
        let context = '--- Architectural Context ---\n';

        // Get project structure and identify architectural patterns
        const projectStructure = this.getProjectArchitecture();
        if (projectStructure) {
          context += `🏗️ Project Architecture:\n${projectStructure}\n`;
        }

        // Analyze how changed files fit into the architecture
        if (changedFiles && changedFiles.length > 0) {
          context += '📁 Changed Files in Architecture:\n';
          changedFiles.forEach(file => {
            const layer = this.identifyArchitecturalLayer(file);
            context += `  ${file} → ${layer}\n`;
          });
        }

        context += '\n--- End Architectural ---\n';
        return context;
      } catch (error) {
        core.warning(`⚠️  Could not get architectural context: ${error.message}`);
        return '';
      }
    });
  }

  /**
   * Get test context - what tests exist for related functionality
   */
  getTestContext(changedFiles) {
    return this.executeWithTiming('test_context', () => {
      try {
        let context = '--- Test Context ---\n';

        if (!changedFiles || changedFiles.length === 0) {
          context += 'No changed files to find related tests.\n';
          context += '--- End Test Context ---\n';
          return context;
        }

        // Find related test files
        const relatedTests = this.findRelatedTests(changedFiles);
        if (relatedTests.length > 0) {
          context += '🧪 Related Test Files:\n';
          relatedTests.forEach(test => {
            context += `  ${test}\n`;
          });
        }

        // Get test coverage information if available
        const testCoverage = this.getTestCoverageInfo(changedFiles);
        if (testCoverage) {
          context += `\n📊 Test Coverage:\n${testCoverage}\n`;
        }

        context += '\n--- End Test Context ---\n';
        return context;
      } catch (error) {
        core.warning(`⚠️  Could not get test context: ${error.message}`);
        return '';
      }
    });
  }

  /**
   * Get code patterns context - how similar functionality is implemented elsewhere
   */
  getCodePatternsContext(changedFiles) {
    return this.executeWithTiming('code_patterns', () => {
      try {
        let context = '--- Code Patterns Context ---\n';

        if (!changedFiles || changedFiles.length === 0) {
          context += 'No changed files to analyze patterns.\n';
          context += '--- End Code Patterns ---\n';
          return context;
        }

        // Find similar patterns in the codebase
        const similarPatterns = this.findSimilarPatterns(changedFiles);
        if (similarPatterns.length > 0) {
          context += '🔄 Similar Patterns Found:\n';
          similarPatterns.forEach(pattern => {
            context += `  ${pattern}\n`;
          });
        }

        // Get common coding patterns used in this codebase
        const commonPatterns = this.getCommonPatterns();
        if (commonPatterns) {
          context += `\n📋 Common Patterns in Codebase:\n${commonPatterns}\n`;
        }

        context += '\n--- End Code Patterns ---\n';
        return context;
      } catch (error) {
        core.warning(`⚠️  Could not get code patterns context: ${error.message}`);
        return '';
      }
    });
  }

  /**
   * Get comprehensive context for LLM with size limits and parallel processing
   */
  async getComprehensiveContext(changedFiles, estimatedTokens = 0) {
    const startTime = Date.now();

    // Generate LLM-focused context in parallel
    const contextPromises = [
      this.getSemanticCodeContext(changedFiles),
      this.getFileRelationshipsContext(changedFiles),
      this.getArchitecturalContext(changedFiles),
      this.getTestContext(changedFiles),
      this.getCodePatternsContext(changedFiles),
      this.getSecurityContext(changedFiles),
      this.getPerformanceContext(changedFiles),
      this.getConfigurationContext(changedFiles),
      this.getDocumentationContext(changedFiles),
      this.getDependencyContext(),
      this.getRecentCommitContext()
    ];

    // Wait for all contexts to be generated in parallel
    const contexts = await Promise.all(contextPromises);
    const filteredContexts = contexts.filter(context => context.trim());

    // Organize context with LLM-focused structure
    const organizedContext = this.organizeLLMContext(filteredContexts, changedFiles);

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

  /**
   * Organize context sections for LLM consumption with better structure
   */
  organizeLLMContext(contexts, changedFiles) {
    if (!contexts || contexts.length === 0) {
      return '';
    }

    let organizedContext = '🧠 LLM-FOCUSED CODE REVIEW CONTEXT\n';
    organizedContext += '='.repeat(60) + '\n\n';

    // Add changed files summary
    if (changedFiles && changedFiles.length > 0) {
      organizedContext += '📝 FILES BEING REVIEWED:\n';
      changedFiles.forEach((file, index) => {
        organizedContext += `  ${index + 1}. ${file}\n`;
      });
      organizedContext += '\n';
    }

    // Process each context section with LLM-focused formatting
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

      // Format section based on type with LLM-friendly structure
      if (sectionType && content.trim()) {
        const emoji = this.getContextEmoji(sectionType);
        organizedContext += `${emoji} ${sectionType.toUpperCase()}:\n`;
        organizedContext += '-'.repeat(40) + '\n';
        organizedContext += content.trim() + '\n\n';
      }
    });

    organizedContext += '='.repeat(60) + '\n';
    organizedContext += 'END LLM CONTEXT\n\n';

    return organizedContext;
  }

  /**
   * Get emoji for context section type
   */
  getContextEmoji(sectionType) {
    const emojiMap = {
      'semantic code': '🔍',
      'file relationships': '🔗',
      architectural: '🏗️',
      'test context': '🧪',
      'code patterns': '🔄',
      security: '🔒',
      performance: '⚡',
      configuration: '⚙️',
      documentation: '📚',
      dependencies: '📦',
      'commit history': '📜',
      'project structure': '📁'
    };
    return emojiMap[sectionType.toLowerCase()] || '📋';
  }

  /**
   * Extract code definitions (functions, classes, interfaces)
   */
  extractCodeDefinitions(fileContent) {
    const definitions = [];
    const lines = fileContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Function definitions
      if (trimmed.match(/^(export\s+)?(async\s+)?function\s+\w+/)) {
        definitions.push(`Function: ${trimmed}`);
      }
      // Class definitions
      else if (trimmed.match(/^(export\s+)?class\s+\w+/)) {
        definitions.push(`Class: ${trimmed}`);
      }
      // Interface/Type definitions
      else if (trimmed.match(/^(export\s+)?(interface|type)\s+\w+/)) {
        definitions.push(`Type: ${trimmed}`);
      }
      // Const/Let/Var with function assignment
      else if (trimmed.match(/^(export\s+)?(const|let|var)\s+\w+\s*=\s*(async\s+)?\(/)) {
        definitions.push(`Function Expression: ${trimmed}`);
      }
    }

    return definitions.slice(0, 10); // Limit to 10 most important
  }

  /**
   * Extract function calls and their purposes
   */
  extractFunctionCalls(fileContent) {
    const calls = [];
    const lines = fileContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // API calls, utility functions, etc.
      if (
        trimmed.match(/\.(get|post|put|delete|patch)\(/) ||
        trimmed.match(/\.(map|filter|reduce|forEach)\(/) ||
        trimmed.match(/\.(log|info|warn|error)\(/) ||
        trimmed.match(/require\(|import\s+.*\s+from/)
      ) {
        calls.push(`Call: ${trimmed}`);
      }
    }

    return calls.slice(0, 8); // Limit to 8 most important
  }

  /**
   * Extract error handling patterns
   */
  extractErrorHandling(fileContent) {
    const errorHandling = [];
    const lines = fileContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.match(/try\s*{|catch\s*\(|throw\s+|\.catch\(/)) {
        errorHandling.push(`Error Handling: ${trimmed}`);
      }
    }

    return errorHandling.slice(0, 5); // Limit to 5 most important
  }

  /**
   * Get project architecture overview
   */
  getProjectArchitecture() {
    try {
      // Look for common architectural patterns
      const architecture = [];

      // Check for common directories
      const dirs = ShellExecutor.execute(
        'find . -maxdepth 2 -type d | grep -E "(src|lib|components|services|utils|config|api)" | head -10'
      );
      if (dirs.trim()) {
        architecture.push(`Directory Structure: ${dirs.replace(/\n/g, ', ')}`);
      }

      // Check for framework indicators
      const packageJson = ShellExecutor.execute('cat package.json 2>/dev/null || echo "{}"');
      try {
        const pkg = JSON.parse(packageJson);
        if (pkg.dependencies) {
          const frameworks = Object.keys(pkg.dependencies).filter(dep =>
            ['react', 'vue', 'angular', 'express', 'koa', 'next', 'nuxt'].includes(dep)
          );
          if (frameworks.length > 0) {
            architecture.push(`Framework: ${frameworks.join(', ')}`);
          }
        }
      } catch {
        // Ignore JSON parsing errors
      }

      return architecture.join('\n');
    } catch {
      return 'Could not determine architecture';
    }
  }

  /**
   * Identify architectural layer for a file
   */
  identifyArchitecturalLayer(filePath) {
    if (filePath.includes('/components/') || filePath.includes('/ui/')) {
      return 'UI Layer';
    } else if (filePath.includes('/services/') || filePath.includes('/api/')) {
      return 'Service Layer';
    } else if (filePath.includes('/utils/') || filePath.includes('/helpers/')) {
      return 'Utility Layer';
    } else if (filePath.includes('/config/') || filePath.includes('/constants/')) {
      return 'Configuration Layer';
    } else if (filePath.includes('/test/') || filePath.includes('/spec/')) {
      return 'Test Layer';
    } else if (filePath.includes('/src/')) {
      return 'Source Layer';
    } else {
      return 'Unknown Layer';
    }
  }

  /**
   * Find related test files
   */
  findRelatedTests(changedFiles) {
    const relatedTests = [];

    for (const file of changedFiles) {
      try {
        // Look for test files with similar names
        const baseName = file.replace(/\.[^/.]+$/, '').replace(/^\.\//, '');
        const testPatterns = [
          `${baseName}.test.js`,
          `${baseName}.test.ts`,
          `${baseName}.spec.js`,
          `${baseName}.spec.ts`,
          `${baseName}Test.js`,
          `${baseName}Test.ts`
        ];

        for (const pattern of testPatterns) {
          const testFile = ShellExecutor.execute(`find . -name "${pattern}" 2>/dev/null | head -1`);
          if (testFile.trim()) {
            relatedTests.push(testFile.trim());
          }
        }
      } catch {
        // Ignore errors for individual files
      }
    }

    return [...new Set(relatedTests)]; // Remove duplicates
  }

  /**
   * Get test coverage information
   */
  getTestCoverageInfo() {
    try {
      // Check if coverage reports exist
      const coverageFiles = ShellExecutor.execute(
        'find . -name "coverage" -type d 2>/dev/null | head -1'
      );
      if (coverageFiles.trim()) {
        return `Coverage directory found: ${coverageFiles.trim()}`;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Find similar patterns in the codebase
   */
  findSimilarPatterns(changedFiles) {
    const patterns = [];

    for (const file of changedFiles) {
      try {
        // Look for files with similar names or in similar directories
        const baseName = file.replace(/\.[^/.]+$/, '').replace(/^\.\//, '');
        const similarFiles = ShellExecutor.execute(
          `find . -name "*${baseName.split('/').pop()}*" -type f | grep -v "${file}" | head -3`
        );

        if (similarFiles.trim()) {
          patterns.push(`Similar to ${file}: ${similarFiles.trim()}`);
        }
      } catch {
        // Ignore errors for individual files
      }
    }

    return patterns;
  }

  /**
   * Get common patterns used in the codebase
   */
  getCommonPatterns() {
    try {
      const patterns = [];

      // Check for common patterns
      const asyncPatterns = ShellExecutor.execute(
        'grep -r "async" . --include="*.js" --include="*.ts" | wc -l'
      );
      const errorHandling = ShellExecutor.execute(
        'grep -r "try\\|catch" . --include="*.js" --include="*.ts" | wc -l'
      );
      const imports = ShellExecutor.execute(
        'grep -r "import\\|require" . --include="*.js" --include="*.ts" | wc -l'
      );

      patterns.push(`Async functions: ${asyncPatterns.trim()} occurrences`);
      patterns.push(`Error handling: ${errorHandling.trim()} occurrences`);
      patterns.push(`Import statements: ${imports.trim()} occurrences`);

      return patterns.join('\n');
    } catch {
      return 'Could not analyze common patterns';
    }
  }

  /**
   * Get security context - security patterns, vulnerabilities, auth patterns
   */
  getSecurityContext(changedFiles) {
    return this.executeWithTiming('security', () => {
      try {
        let context = '--- Security Context ---\n';

        if (!changedFiles || changedFiles.length === 0) {
          context += 'No changed files to analyze for security patterns.\n';
          context += '--- End Security ---\n';
          return context;
        }

        // Analyze security patterns in changed files
        for (const file of changedFiles) {
          try {
            const fileContent = ShellExecutor.executeWithFallback(
              `git show HEAD:${file} 2>/dev/null`,
              `cat ${file} 2>/dev/null`
            );

            if (!fileContent.trim()) continue;

            const securityPatterns = this.extractSecurityPatterns(fileContent);
            if (securityPatterns.length > 0) {
              context += `\n🔒 ${file}:\n`;
              securityPatterns.forEach(pattern => {
                context += `  ${pattern}\n`;
              });
            }
          } catch {
            // Ignore individual file errors
          }
        }

        // Get global security patterns from codebase
        const globalSecurityPatterns = this.getGlobalSecurityPatterns();
        if (globalSecurityPatterns) {
          context += `\n🛡️ Global Security Patterns:\n${globalSecurityPatterns}\n`;
        }

        context += '\n--- End Security ---\n';
        return context;
      } catch (error) {
        core.warning(`⚠️  Could not get security context: ${error.message}`);
        return '';
      }
    });
  }

  /**
   * Get performance context - performance-critical sections, bottlenecks
   */
  getPerformanceContext(changedFiles) {
    return this.executeWithTiming('performance', () => {
      try {
        let context = '--- Performance Context ---\n';

        if (!changedFiles || changedFiles.length === 0) {
          context += 'No changed files to analyze for performance patterns.\n';
          context += '--- End Performance ---\n';
          return context;
        }

        // Analyze performance patterns in changed files
        for (const file of changedFiles) {
          try {
            const fileContent = ShellExecutor.executeWithFallback(
              `git show HEAD:${file} 2>/dev/null`,
              `cat ${file} 2>/dev/null`
            );

            if (!fileContent.trim()) continue;

            const performancePatterns = this.extractPerformancePatterns(fileContent);
            if (performancePatterns.length > 0) {
              context += `\n⚡ ${file}:\n`;
              performancePatterns.forEach(pattern => {
                context += `  ${pattern}\n`;
              });
            }
          } catch {
            // Ignore individual file errors
          }
        }

        context += '\n--- End Performance ---\n';
        return context;
      } catch (error) {
        core.warning(`⚠️  Could not get performance context: ${error.message}`);
        return '';
      }
    });
  }

  /**
   * Get configuration context - env configs, feature flags, settings
   */
  getConfigurationContext(changedFiles) {
    return this.executeWithTiming('configuration', () => {
      try {
        let context = '--- Configuration Context ---\n';

        // Get configuration files
        const configFiles = this.findConfigurationFiles();
        if (configFiles.length > 0) {
          context += '📋 Configuration Files:\n';
          configFiles.forEach(config => {
            context += `  ${config}\n`;
          });
        }

        // Analyze configuration patterns in changed files
        if (changedFiles && changedFiles.length > 0) {
          for (const file of changedFiles) {
            try {
              const fileContent = ShellExecutor.executeWithFallback(
                `git show HEAD:${file} 2>/dev/null`,
                `cat ${file} 2>/dev/null`
              );

              if (!fileContent.trim()) continue;

              const configPatterns = this.extractConfigurationPatterns(fileContent);
              if (configPatterns.length > 0) {
                context += `\n⚙️ ${file}:\n`;
                configPatterns.forEach(pattern => {
                  context += `  ${pattern}\n`;
                });
              }
            } catch {
              // Ignore individual file errors
            }
          }
        }

        context += '\n--- End Configuration ---\n';
        return context;
      } catch (error) {
        core.warning(`⚠️  Could not get configuration context: ${error.message}`);
        return '';
      }
    });
  }

  /**
   * Get documentation context - README, comments, JSDoc
   */
  getDocumentationContext(changedFiles) {
    return this.executeWithTiming('documentation', () => {
      try {
        let context = '--- Documentation Context ---\n';

        // Get documentation files
        const docFiles = this.findDocumentationFiles();
        if (docFiles.length > 0) {
          context += '📚 Documentation Files:\n';
          docFiles.forEach(doc => {
            context += `  ${doc}\n`;
          });
        }

        // Analyze documentation patterns in changed files
        if (changedFiles && changedFiles.length > 0) {
          for (const file of changedFiles) {
            try {
              const fileContent = ShellExecutor.executeWithFallback(
                `git show HEAD:${file} 2>/dev/null`,
                `cat ${file} 2>/dev/null`
              );

              if (!fileContent.trim()) continue;

              const docPatterns = this.extractDocumentationPatterns(fileContent);
              if (docPatterns.length > 0) {
                context += `\n📝 ${file}:\n`;
                docPatterns.forEach(pattern => {
                  context += `  ${pattern}\n`;
                });
              }
            } catch {
              // Ignore individual file errors
            }
          }
        }

        context += '\n--- End Documentation ---\n';
        return context;
      } catch (error) {
        core.warning(`⚠️  Could not get documentation context: ${error.message}`);
        return '';
      }
    });
  }

  /**
   * Analyze incoming relationships (imports/requires)
   */
  analyzeIncomingRelationships(fileContent) {
    const relationships = [];
    const lines = fileContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // ES6 imports
      if (trimmed.match(/^import\s+.*\s+from\s+['"]([^'"]+)['"]/)) {
        const match = trimmed.match(/^import\s+.*\s+from\s+['"]([^'"]+)['"]/);
        if (match) {
          relationships.push(`Import: ${match[1]} (${trimmed})`);
        }
      }
      // CommonJS requires
      else if (trimmed.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/)) {
        const match = trimmed.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
        if (match) {
          relationships.push(`Require: ${match[1]} (${trimmed})`);
        }
      }
      // Dynamic imports
      else if (trimmed.match(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/)) {
        const match = trimmed.match(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/);
        if (match) {
          relationships.push(`Dynamic Import: ${match[1]} (${trimmed})`);
        }
      }
    }

    return relationships.slice(0, 8); // Limit to 8 most important
  }

  /**
   * Analyze outgoing relationships (exports)
   */
  analyzeOutgoingRelationships(fileContent) {
    const relationships = [];
    const lines = fileContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // ES6 exports
      if (trimmed.match(/^export\s+(default\s+)?(function|class|const|let|var|interface|type)/)) {
        relationships.push(`Export: ${trimmed}`);
      }
      // CommonJS exports
      else if (trimmed.match(/module\.exports\s*=/)) {
        relationships.push(`Module Export: ${trimmed}`);
      }
      // Named exports
      else if (trimmed.match(/^export\s*{/)) {
        relationships.push(`Named Export: ${trimmed}`);
      }
    }

    return relationships.slice(0, 6); // Limit to 6 most important
  }

  /**
   * Find files that depend on the given file
   */
  findDependentFiles(filePath) {
    const dependents = [];

    try {
      // Get the base name without extension
      const baseName = filePath.replace(/^\.\//, '').replace(/\.[^/.]+$/, '');
      const fileName = filePath
        .split('/')
        .pop()
        .replace(/\.[^/.]+$/, '');

      // Search for files that import from this file
      const searchPatterns = [
        `from\\s+['"]\\.?/?${baseName}['"]`,
        `from\\s+['"]\\.?/?${fileName}['"]`,
        `require\\s*\\(\\s*['"]\\.?/?${baseName}['"]`,
        `require\\s*\\(\\s*['"]\\.?/?${fileName}['"]`
      ];

      for (const pattern of searchPatterns) {
        try {
          const results = ShellExecutor.execute(
            `grep -r "${pattern}" . --include="*.js" --include="*.ts" --include="*.tsx" --include="*.jsx" 2>/dev/null | head -5`
          );

          if (results.trim()) {
            results.split('\n').forEach(result => {
              if (result.trim() && !result.includes(filePath)) {
                dependents.push(result.trim());
              }
            });
          }
        } catch {
          // Ignore individual pattern errors
        }
      }
    } catch {
      // Ignore errors
    }

    return [...new Set(dependents)].slice(0, 5); // Remove duplicates and limit
  }

  /**
   * Extract API contracts (interfaces, types, function signatures)
   */
  extractAPIContracts(fileContent) {
    const contracts = [];
    const lines = fileContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // TypeScript interfaces
      if (trimmed.match(/^(export\s+)?interface\s+\w+/)) {
        contracts.push(`Interface: ${trimmed}`);
      }
      // TypeScript types
      else if (trimmed.match(/^(export\s+)?type\s+\w+/)) {
        contracts.push(`Type: ${trimmed}`);
      }
      // Function signatures with parameters
      else if (trimmed.match(/^(export\s+)?(async\s+)?function\s+\w+\s*\(/)) {
        contracts.push(`Function Signature: ${trimmed}`);
      }
      // Class definitions
      else if (trimmed.match(/^(export\s+)?class\s+\w+/)) {
        contracts.push(`Class: ${trimmed}`);
      }
    }

    return contracts.slice(0, 6); // Limit to 6 most important
  }

  /**
   * Analyze data flow in the file
   */
  analyzeDataFlow(fileContent) {
    const dataFlow = [];
    const lines = fileContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // API calls (data going out)
      if (trimmed.match(/\.(get|post|put|delete|patch)\s*\(/)) {
        dataFlow.push(`API Call (out): ${trimmed}`);
      }
      // Event emissions (data going out)
      else if (trimmed.match(/\.emit\s*\(/)) {
        dataFlow.push(`Event Emission (out): ${trimmed}`);
      }
      // Event listeners (data coming in)
      else if (trimmed.match(/\.on\s*\(/)) {
        dataFlow.push(`Event Listener (in): ${trimmed}`);
      }
      // Callbacks (data flow)
      else if (trimmed.match(/callback\s*\(|\.then\s*\(|\.catch\s*\(/)) {
        dataFlow.push(`Callback/Async (flow): ${trimmed}`);
      }
    }

    return dataFlow.slice(0, 5); // Limit to 5 most important
  }

  /**
   * Analyze cross-file relationships between changed files
   */
  analyzeCrossFileRelationships(changedFiles) {
    const relationships = [];

    for (let i = 0; i < changedFiles.length; i++) {
      for (let j = i + 1; j < changedFiles.length; j++) {
        const file1 = changedFiles[i];
        const file2 = changedFiles[j];

        try {
          // Check if file1 imports from file2
          const content1 = ShellExecutor.executeWithFallback(
            `git show HEAD:${file1} 2>/dev/null`,
            `cat ${file1} 2>/dev/null`
          );

          const baseName2 = file2.replace(/^\.\//, '').replace(/\.[^/.]+$/, '');
          if (content1.includes(baseName2) || content1.includes(file2)) {
            relationships.push(`${file1} → imports from → ${file2}`);
          }

          // Check if file2 imports from file1
          const content2 = ShellExecutor.executeWithFallback(
            `git show HEAD:${file2} 2>/dev/null`,
            `cat ${file2} 2>/dev/null`
          );

          const baseName1 = file1.replace(/^\.\//, '').replace(/\.[^/.]+$/, '');
          if (content2.includes(baseName1) || content2.includes(file1)) {
            relationships.push(`${file2} → imports from → ${file1}`);
          }
        } catch {
          // Ignore errors for individual file pairs
        }
      }
    }

    return relationships.slice(0, 5); // Limit to 5 most important
  }

  /**
   * Extract security patterns from file content
   */
  extractSecurityPatterns(fileContent) {
    const patterns = [];
    const lines = fileContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Authentication patterns
      if (trimmed.match(/auth|login|password|token|jwt|session|oauth/i)) {
        patterns.push(`Auth: ${trimmed}`);
      }
      // Authorization patterns
      else if (trimmed.match(/permission|role|access|authorize|forbidden/i)) {
        patterns.push(`Authorization: ${trimmed}`);
      }
      // Security headers/validation
      else if (trimmed.match(/cors|csrf|xss|sanitize|validate|escape/i)) {
        patterns.push(`Security: ${trimmed}`);
      }
      // Encryption/hashing
      else if (trimmed.match(/encrypt|hash|bcrypt|crypto|ssl|tls/i)) {
        patterns.push(`Crypto: ${trimmed}`);
      }
    }

    return patterns.slice(0, 6); // Limit to 6 most important
  }

  /**
   * Get global security patterns from codebase
   */
  getGlobalSecurityPatterns() {
    try {
      const patterns = [];

      // Check for security-related dependencies
      const securityDeps = ShellExecutor.execute(
        'grep -r "bcrypt\\|jwt\\|passport\\|helmet\\|cors" package.json 2>/dev/null || echo ""'
      );
      if (securityDeps.trim()) {
        patterns.push(`Security Dependencies: ${securityDeps.trim()}`);
      }

      // Check for security middleware
      const securityMiddleware = ShellExecutor.execute(
        'grep -r "helmet\\|cors\\|rateLimit" . --include="*.js" --include="*.ts" | wc -l'
      );
      if (securityMiddleware.trim() !== '0') {
        patterns.push(`Security Middleware: ${securityMiddleware.trim()} occurrences`);
      }

      return patterns.join('\n');
    } catch {
      return 'Could not analyze global security patterns';
    }
  }

  /**
   * Extract performance patterns from file content
   */
  extractPerformancePatterns(fileContent) {
    const patterns = [];
    const lines = fileContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Database queries
      if (trimmed.match(/query|select|insert|update|delete|find|aggregate/i)) {
        patterns.push(`Database: ${trimmed}`);
      }
      // Caching patterns
      else if (trimmed.match(/cache|redis|memcache|ttl|expire/i)) {
        patterns.push(`Cache: ${trimmed}`);
      }
      // Performance monitoring
      else if (trimmed.match(/performance|benchmark|profile|timing|metrics/i)) {
        patterns.push(`Monitoring: ${trimmed}`);
      }
      // Async/await patterns
      else if (trimmed.match(/async|await|promise|setTimeout|setInterval/i)) {
        patterns.push(`Async: ${trimmed}`);
      }
      // Large data processing
      else if (trimmed.match(/forEach|map|filter|reduce|loop|iteration/i)) {
        patterns.push(`Data Processing: ${trimmed}`);
      }
    }

    return patterns.slice(0, 6); // Limit to 6 most important
  }

  /**
   * Find configuration files
   */
  findConfigurationFiles() {
    try {
      const configFiles = ShellExecutor.execute(
        'find . -name "*.config.*" -o -name "*.env*" -o -name "config.*" -o -name ".env*" | head -10'
      );
      return configFiles.trim() ? configFiles.trim().split('\n') : [];
    } catch {
      return [];
    }
  }

  /**
   * Extract configuration patterns from file content
   */
  extractConfigurationPatterns(fileContent) {
    const patterns = [];
    const lines = fileContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Environment variables
      if (trimmed.match(/process\.env|process\.env\./)) {
        patterns.push(`Env Var: ${trimmed}`);
      }
      // Configuration objects
      else if (trimmed.match(/config|settings|options|defaults/i)) {
        patterns.push(`Config: ${trimmed}`);
      }
      // Feature flags
      else if (trimmed.match(/feature|flag|toggle|enable|disable/i)) {
        patterns.push(`Feature Flag: ${trimmed}`);
      }
    }

    return patterns.slice(0, 5); // Limit to 5 most important
  }

  /**
   * Find documentation files
   */
  findDocumentationFiles() {
    try {
      const docFiles = ShellExecutor.execute(
        'find . -name "README*" -o -name "*.md" -o -name "docs" -type d | head -10'
      );
      return docFiles.trim() ? docFiles.trim().split('\n') : [];
    } catch {
      return [];
    }
  }

  /**
   * Extract documentation patterns from file content
   */
  extractDocumentationPatterns(fileContent) {
    const patterns = [];
    const lines = fileContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // JSDoc comments
      if (trimmed.match(/\/\*\*|\*\/|\* @/)) {
        patterns.push(`JSDoc: ${trimmed}`);
      }
      // TODO/FIXME comments
      else if (trimmed.match(/\/\/\s*(TODO|FIXME|NOTE|HACK|BUG)/i)) {
        patterns.push(`Comment: ${trimmed}`);
      }
      // Function documentation
      else if (trimmed.match(/\/\/\s*(function|class|method|param|return)/i)) {
        patterns.push(`Doc: ${trimmed}`);
      }
    }

    return patterns.slice(0, 5); // Limit to 5 most important
  }
}

module.exports = ContextService;
