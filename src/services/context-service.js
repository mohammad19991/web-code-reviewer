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
   * Safely escape file path for shell commands
   */
  escapeFilePath(filePath) {
    // Escape single quotes and wrap in single quotes to handle special characters
    return `'${filePath.replace(/'/g, "'\"'\"'")}'`;
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

          context += '📦 Project Type:\n';
          context += `  ${packageJson.type || 'CommonJS'}\n`;
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
        const commitCommand = `git log --oneline --no-merges origin/${this.baseBranch}..HEAD | head -${CONTEXT_CONFIG.MAX_COMMIT_HISTORY} | sed 's/^[a-f0-9]* //'`;
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
          context += 'No changed files to analyze relationships.\n';
          context += '--- End File Relationships ---\n';
          return context;
        }

        // Analyze each changed file for comprehensive relationships
        for (const file of changedFiles) {
          try {
            context += `\n🔗 ${file}:\n`;

            // Get file content to analyze
            const escapedFile = this.escapeFilePath(file);
            const fileContent = ShellExecutor.executeWithFallback(
              `git show HEAD:${escapedFile} 2>/dev/null`,
              `cat ${escapedFile} 2>/dev/null`
            );

            if (!fileContent.trim()) {
              context += '  (File not found or empty)\n';
              continue;
            }

            // Focus only on direct imports and exports (most relevant for review)
            const incomingRelationships = this.analyzeIncomingRelationships(fileContent);
            if (incomingRelationships.length > 0) {
              context += '  📥 Imports:\n';
              incomingRelationships.slice(0, 5).forEach(rel => {
                // Limit to 5 most important
                context += `    ${rel}\n`;
              });
            }

            const outgoingRelationships = this.analyzeOutgoingRelationships(fileContent);
            if (outgoingRelationships.length > 0) {
              context += '  📤 Exports:\n';
              outgoingRelationships.slice(0, 5).forEach(rel => {
                // Limit to 5 most important
                context += `    ${rel}\n`;
              });
            }
          } catch (error) {
            context += `  ⚠️ Could not analyze ${file}: ${error.message}\n`;
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
          context += 'No changed files to analyze.\n';
          context += '--- End Semantic Code ---\n';
          return context;
        }

        // Analyze each changed file for semantic understanding
        for (const file of changedFiles) {
          try {
            context += `\n🔍 ${file}:\n`;

            // Get file content
            const escapedFile = this.escapeFilePath(file);
            const fileContent = ShellExecutor.executeWithFallback(
              `git show HEAD:${escapedFile} 2>/dev/null`,
              `cat ${escapedFile} 2>/dev/null`
            );

            if (!fileContent.trim()) {
              context += '  (File not found or empty)\n';
              continue;
            }

            // Extract only key function/class definitions (most relevant for review)
            const definitions = this.extractCodeDefinitions(fileContent);
            if (definitions.length > 0) {
              context += '  📝 Key Definitions:\n';
              definitions.slice(0, 5).forEach(def => {
                // Limit to 5 most important
                context += `    ${def}\n`;
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
   * Get comprehensive context for LLM with size limits and parallel processing
   */
  async getComprehensiveContext(changedFiles, estimatedTokens = 0) {
    const startTime = Date.now();

    core.info(
      `🔍 Context Service: Received ${changedFiles ? changedFiles.length : 0} changed files`
    );
    if (changedFiles && changedFiles.length > 0) {
      core.info(`🔍 Changed files: ${changedFiles.join(', ')}`);
    }

    // Generate focused context for code review - only what's truly relevant
    const contextPromises = [
      this.getSemanticCodeContext(changedFiles),
      this.getFileRelationshipsContext(changedFiles),
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
      core.info(`📋 Final context (truncated): ${truncatedContext}`);

      return truncatedContext;
    }

    core.info(`📋 Final context: ${filteredSize}KB`);
    core.info(`📋 Final context: ${filteredContext}`);

    return filteredContext;
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
    let currentFunction = null;
    let braceCount = 0;
    let functionLines = [];
    let inFunction = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Function definitions
      if (trimmed.match(/^(export\s+)?(async\s+)?function\s+\w+/)) {
        if (currentFunction) {
          // Save previous function
          definitions.push(this.formatCodeDefinition('Function', currentFunction, functionLines));
        }
        currentFunction = trimmed;
        functionLines = [trimmed];
        inFunction = true;
        braceCount = 0;
      }
      // Class definitions
      else if (trimmed.match(/^(export\s+)?class\s+\w+/)) {
        if (currentFunction) {
          definitions.push(this.formatCodeDefinition('Function', currentFunction, functionLines));
          currentFunction = null;
          inFunction = false;
        }
        const classSample = this.extractClassSample(lines, i);
        definitions.push(`Class: ${trimmed}\n${classSample}`);
      }
      // Interface/Type definitions
      else if (trimmed.match(/^(export\s+)?(interface|type)\s+\w+/)) {
        if (currentFunction) {
          definitions.push(this.formatCodeDefinition('Function', currentFunction, functionLines));
          currentFunction = null;
          inFunction = false;
        }
        const typeSample = this.extractTypeSample(lines, i);
        definitions.push(`Type: ${trimmed}\n${typeSample}`);
      }
      // Const/Let/Var with function assignment
      else if (trimmed.match(/^(export\s+)?(const|let|var)\s+\w+\s*=\s*(async\s+)?\(/)) {
        if (currentFunction) {
          definitions.push(this.formatCodeDefinition('Function', currentFunction, functionLines));
          currentFunction = null;
          inFunction = false;
        }
        const arrowFunctionSample = this.extractArrowFunctionSample(lines, i);
        definitions.push(`Function Expression: ${trimmed}\n${arrowFunctionSample}`);
      }
      // Track function body
      else if (inFunction && currentFunction) {
        functionLines.push(line);

        // Count braces to detect function end
        for (const char of line) {
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
        }

        // Limit function body size to prevent token explosion (check before function end)
        if (functionLines.length > 20) {
          functionLines.push('  // ... (truncated for context)');
          definitions.push(this.formatCodeDefinition('Function', currentFunction, functionLines));
          currentFunction = null;
          inFunction = false;
          functionLines = [];
        }
        // Function ended (check after truncation)
        else if (braceCount === 0 && functionLines.length > 1) {
          definitions.push(this.formatCodeDefinition('Function', currentFunction, functionLines));
          currentFunction = null;
          inFunction = false;
          functionLines = [];
        }
      }
    }

    // Handle last function if exists
    if (currentFunction && functionLines.length > 0) {
      definitions.push(this.formatCodeDefinition('Function', currentFunction, functionLines));
    }

    return definitions.slice(0, 8); // Limit to 8 most important to control token usage
  }

  /**
   * Format code definition with signature and sample body
   */
  formatCodeDefinition(type, signature, lines) {
    const body = lines.slice(1, 6).join('\n'); // First 5 lines of body
    const truncated = lines.length > 6 ? '\n  // ... (truncated)' : '';
    return `${type}: ${signature}\n${body}${truncated}`;
  }

  /**
   * Extract class sample (constructor and first few methods)
   */
  extractClassSample(lines, startIndex) {
    const sample = [];
    let braceCount = 0;
    let methodCount = 0;

    for (let i = startIndex; i < lines.length && methodCount < 3; i++) {
      const line = lines[i];
      sample.push(line);

      for (const char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
      }

      // Count methods
      if (line.trim().match(/^\w+\s*\([^)]*\)\s*{/) && braceCount > 1) {
        methodCount++;
      }

      // Class ended
      if (braceCount === 0 && i > startIndex) break;
    }

    return sample.join('\n');
  }

  /**
   * Extract type/interface sample
   */
  extractTypeSample(lines, startIndex) {
    const sample = [];
    let braceCount = 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      sample.push(line);

      for (const char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
      }

      // Type ended
      if (braceCount === 0 && i > startIndex) break;

      // Limit size
      if (sample.length > 10) {
        sample.push('  // ... (truncated)');
        break;
      }
    }

    return sample.join('\n');
  }

  /**
   * Extract arrow function sample
   */
  extractArrowFunctionSample(lines, startIndex) {
    const sample = [];
    let braceCount = 0;
    let parenCount = 0;
    let inParams = false;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      sample.push(line);

      for (const char of line) {
        if (char === '(') {
          parenCount++;
          inParams = true;
        }
        if (char === ')') {
          parenCount--;
          if (parenCount === 0) inParams = false;
        }
        if (!inParams) {
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
        }
      }

      // Function ended (single line or multi-line)
      if (braceCount === 0 && !inParams && i > startIndex) break;

      // Limit size
      if (sample.length > 8) {
        sample.push('  // ... (truncated)');
        break;
      }
    }

    return sample.join('\n');
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
}

module.exports = ContextService;
