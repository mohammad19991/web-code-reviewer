/**
 * Input service for handling input parsing and validation
 */

const core = require('@actions/core');
const { CONFIG } = require('../constants');

class InputService {
  constructor() {
    // No constructor needed for this service
  }

  /**
   * Parse ignore patterns input to support multiple comma-separated patterns
   */
  parseIgnorePatterns(input) {
    if (!input) {
      return CONFIG.IGNORE_PATTERNS;
    }
    
    // Split by comma and clean up whitespace
    const patterns = input.split(',').map(pattern => pattern.trim()).filter(pattern => pattern.length > 0);
    
    if (patterns.length === 0) {
      return CONFIG.IGNORE_PATTERNS;
    }
    
    core.info(`🚫 Parsed ignore patterns: ${patterns.join(', ')}`);
    return patterns;
  }

  /**
   * Parse path_to_files input to support multiple comma-separated paths
   */
  parsePathToFiles(input) {
    if (!input) {
      return [CONFIG.DEFAULT_PATH_TO_FILES];
    }
    
    // Split by comma and clean up whitespace
    const paths = input.split(',').map(path => path.trim()).filter(path => path.length > 0);
    
    if (paths.length === 0) {
      return [CONFIG.DEFAULT_PATH_TO_FILES];
    }
    
    core.info(`📁 Parsed paths to review: ${paths.join(', ')}`);
    return paths;
  }

  /**
   * Get all inputs from GitHub Actions
   */
  getInputs() {
    const provider = core.getInput('llm_provider') || CONFIG.DEFAULT_PROVIDER;
    const pathToFiles = this.parsePathToFiles(core.getInput('path_to_files'));
    const language = core.getInput('language') || CONFIG.DEFAULT_LANGUAGE;
    const maxTokens = parseInt(core.getInput('max_tokens')) || CONFIG.MAX_TOKENS;
    const temperature = parseFloat(core.getInput('temperature')) || CONFIG.TEMPERATURE;
    
    // Logging parameters
    const department = core.getInput('department') || 'web';
    const team = core.getInput('team');
    
    // Validate required team parameter
    if (!team) {
      throw new Error('Team parameter is required. Please provide a team name.');
    }
    
    // Parse ignore patterns from input or use default from CONFIG
    const ignorePatterns = this.parseIgnorePatterns(core.getInput('ignore_patterns'));
    
    // Chunking configuration - Always use CONFIG defaults
    const chunkSize = CONFIG.DEFAULT_CHUNK_SIZE;
    const maxConcurrentRequests = CONFIG.MAX_CONCURRENT_REQUESTS;
    const batchDelayMs = CONFIG.BATCH_DELAY_MS;

    // Get base branch input
    const inputBaseBranch = core.getInput('base_branch');

    // Get API keys
    const openaiKey = core.getInput('openai_api_key');
    const claudeKey = core.getInput('claude_api_key');

    return {
      provider,
      pathToFiles,
      language,
      maxTokens,
      temperature,
      department,
      team,
      ignorePatterns,
      chunkSize,
      maxConcurrentRequests,
      batchDelayMs,
      inputBaseBranch,
      openaiKey,
      claudeKey
    };
  }

  /**
   * Set environment variables for API keys
   */
  setApiKeyEnvironment(inputs) {
    if (inputs.provider === 'openai' && inputs.openaiKey) {
      process.env.OPENAI_API_KEY = inputs.openaiKey;
    } else if (inputs.provider === 'claude' && inputs.claudeKey) {
      process.env.CLAUDE_API_KEY = inputs.claudeKey;
    }
  }
}

module.exports = InputService;
