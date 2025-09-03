// Mock environment variables for testing
process.env.GITHUB_TOKEN = 'test-token';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.CLAUDE_API_KEY = 'test-claude-key';

// Mock the services
class MockInputService {
  constructor() {
    this.inputs = {
      department: 'test-dept',
      team: 'test-team',
      language: 'js',
      provider: 'openai',
      maxTokens: 4000,
      temperature: 0,
      pathToFiles: 'src/',
      ignorePatterns: ['node_modules/', 'dist/'],
      chunkSize: 8000,
      maxConcurrentRequests: 3,
      batchDelayMs: 1000
    };
  }

  getInputs() {
    return this.inputs;
  }

  setApiKeyEnvironment(inputs) {
    // Mock setting API key environment
    return true;
  }
}

class MockFileService {
  constructor() {
    this.changedFiles = [
      { path: 'src/index.js', additions: 10, deletions: 5 },
      { path: 'src/constants.js', additions: 3, deletions: 1 }
    ];
  }

  getChangedFiles() {
    return this.changedFiles;
  }

  getFullDiff() {
    return 'diff --git a/src/index.js b/src/index.js\n+ new line\n- old line';
  }

  matchesLanguage(filePath) {
    return filePath.endsWith('.js') || filePath.endsWith('.ts');
  }
}

class MockLLMService {
  constructor() {
    this.provider = 'openai';
    this.maxTokens = 4000;
    this.temperature = 0;
  }

  async callLLM(prompt, diff) {
    return {
      provider: this.provider,
      response: 'Mock LLM response with security issues found',
      issues: [
        {
          id: 'SEC-001',
          severity: 'CRITICAL',
          category: 'Security',
          description: 'API key found in code',
          line: 15,
          file: 'src/config.js'
        }
      ]
    };
  }

  estimateTokenCount(text) {
    return Math.ceil(text.length / 4); // Rough estimation
  }
}

class MockReviewService {
  checkMergeDecision(llmResponse) {
    // Mock decision logic
    if (llmResponse.issues && llmResponse.issues.some(issue => issue.severity === 'CRITICAL')) {
      return true; // Block merge
    }
    return false; // Allow merge
  }

  generatePRComment(shouldBlockMerge, changedFiles, llmResponse, department, team, provider, baseBranch, pathToFiles, ignorePatterns) {
    return {
      shouldBlockMerge,
      changedFiles: changedFiles.length,
      issuesFound: llmResponse.issues ? llmResponse.issues.length : 0,
      department,
      team,
      provider,
      baseBranch,
      pathToFiles,
      ignorePatterns
    };
  }

  prepareReviewLogData(shouldBlockMerge, changedFiles, llmResponse, department, team, language, provider) {
    return {
      timestamp: new Date().toISOString(),
      shouldBlockMerge,
      changedFiles: changedFiles.length,
      issuesFound: llmResponse.issues ? llmResponse.issues.length : 0,
      department,
      team,
      language,
      provider
    };
  }
}

class MockGitHubService {
  constructor() {
    this.octokit = { mock: true };
    this.context = { repo: { owner: 'test', repo: 'test-repo' } };
  }

  getBaseBranch(inputBaseBranch, defaultBranch) {
    return inputBaseBranch || defaultBranch;
  }

  async addPRComment(comment) {
    return { success: true, comment };
  }

  async addPostCodeReviewLabel() {
    return { success: true, label: 'post-code-review' };
  }
}

class MockLoggingService {
  logReviewDetails(department, team, baseBranch, provider, language, pathToFiles, ignorePatterns, chunkSize, maxConcurrentRequests, batchDelayMs) {
    return true;
  }

  logChangedFiles(changedFiles) {
    return changedFiles && changedFiles.length > 0;
  }

  logLLMResponse(llmResponse) {
    return !!(llmResponse && llmResponse.response);
  }

  logReviewData(reviewData) {
    return reviewData && reviewData.timestamp;
  }

  logFinalDecision(shouldBlockMerge, llmResponse) {
    return { shouldBlockMerge, issuesFound: llmResponse.issues ? llmResponse.issues.length : 0 };
  }
}

// Test the services
describe('Services Module Tests', () => {

  describe('Input Service', () => {
    let inputService;

    beforeEach(() => {
      inputService = new MockInputService();
    });

    it('should return valid inputs', () => {
      const inputs = inputService.getInputs();

      expect(inputs.department).toBeDefined();
      expect(inputs.team).toBeDefined();
      expect(inputs.language).toBeDefined();
      expect(inputs.provider).toBeDefined();
      expect(inputs.maxTokens).toBeGreaterThan(0);
      expect(inputs.temperature).toBeGreaterThanOrEqual(0);
    });

    it('should set API key environment', () => {
      const result = inputService.setApiKeyEnvironment(inputService.inputs);
      expect(result).toBe(true);
    });

    it('should have valid ignore patterns', () => {
      const inputs = inputService.getInputs();
      expect(Array.isArray(inputs.ignorePatterns)).toBe(true);
      expect(inputs.ignorePatterns.length).toBeGreaterThan(0);
    });
  });

  describe('File Service', () => {
    let fileService;

    beforeEach(() => {
      fileService = new MockFileService();
    });

    it('should return changed files', () => {
      const changedFiles = fileService.getChangedFiles();

      expect(Array.isArray(changedFiles)).toBe(true);
      expect(changedFiles.length).toBeGreaterThan(0);
      expect(changedFiles[0].path).toBeDefined();
      expect(typeof changedFiles[0].additions).toBe('number');
      expect(typeof changedFiles[0].deletions).toBe('number');
    });

    it('should return full diff', () => {
      const diff = fileService.getFullDiff();

      expect(typeof diff).toBe('string');
      expect(diff).toContain('diff');
      expect(diff).toContain('+');
      expect(diff).toContain('-');
    });

    it('should match language correctly', () => {
      expect(fileService.matchesLanguage('src/index.js')).toBe(true);
      expect(fileService.matchesLanguage('src/index.ts')).toBe(true);
      expect(fileService.matchesLanguage('src/index.py')).toBe(false);
    });
  });

  describe('LLM Service', () => {
    let llmService;

    beforeEach(() => {
      llmService = new MockLLMService();
    });

    it('should have valid configuration', () => {
      expect(llmService.provider).toBeDefined();
      expect(llmService.maxTokens).toBeGreaterThan(0);
      expect(llmService.temperature).toBeGreaterThanOrEqual(0);
    });

    it('should call LLM and return response', async() => {
      const prompt = 'Review this code';
      const diff = 'test diff';

      const response = await llmService.callLLM(prompt, diff);

      expect(response.provider).toBeDefined();
      expect(response.response).toBeDefined();
      expect(Array.isArray(response.issues)).toBe(true);
    });

    it('should estimate token count', () => {
      const text = 'This is a test text for token estimation';
      const estimatedTokens = llmService.estimateTokenCount(text);

      expect(typeof estimatedTokens).toBe('number');
      expect(estimatedTokens).toBeGreaterThan(0);
    });

    it('should return security issues', async() => {
      const response = await llmService.callLLM('test', 'test');

      expect(response.issues.length).toBeGreaterThan(0);
      expect(response.issues[0].severity).toBeDefined();
      expect(response.issues[0].category).toBeDefined();
      expect(response.issues[0].description).toBeDefined();
    });
  });

  describe('Review Service', () => {
    let reviewService;

    beforeEach(() => {
      reviewService = new MockReviewService();
    });

    it('should check merge decision correctly', () => {
      const criticalResponse = {
        issues: [{ severity: 'CRITICAL', description: 'API key found' }]
      };

      const safeResponse = {
        issues: [{ severity: 'LOW', description: 'Minor issue' }]
      };

      expect(reviewService.checkMergeDecision(criticalResponse)).toBe(true);
      expect(reviewService.checkMergeDecision(safeResponse)).toBe(false);
    });

    it('should generate PR comment', () => {
      const comment = reviewService.generatePRComment(
        true, // shouldBlockMerge
        [{ path: 'test.js' }], // changedFiles
        { issues: [] }, // llmResponse
        'test-dept', // department
        'test-team', // team
        'openai', // provider
        'main', // baseBranch
        'src/', // pathToFiles
        ['node_modules/'] // ignorePatterns
      );

      expect(comment.shouldBlockMerge).toBe(true);
      expect(comment.changedFiles).toBe(1);
      expect(comment.department).toBe('test-dept');
    });

    it('should prepare review log data', () => {
      const logData = reviewService.prepareReviewLogData(
        true, // shouldBlockMerge
        [{ path: 'test.js' }], // changedFiles
        { issues: [] }, // llmResponse
        'test-dept', // department
        'test-team', // team
        'js', // language
        'openai' // provider
      );

      expect(logData.timestamp).toBeDefined();
      expect(logData.shouldBlockMerge).toBe(true);
      expect(logData.changedFiles).toBe(1);
      expect(logData.language).toBe('js');
    });
  });

  describe('GitHub Service', () => {
    let githubService;

    beforeEach(() => {
      githubService = new MockGitHubService();
    });

    it('should get base branch correctly', () => {
      const customBranch = githubService.getBaseBranch('develop', 'main');
      const defaultBranch = githubService.getBaseBranch(null, 'main');

      expect(customBranch).toBe('develop');
      expect(defaultBranch).toBe('main');
    });

    it('should add PR comment', async() => {
      const comment = { text: 'Test comment' };
      const result = await githubService.addPRComment(comment);

      expect(result.success).toBe(true);
      expect(result.comment).toBe(comment);
    });

    it('should add post code review label', async() => {
      const result = await githubService.addPostCodeReviewLabel();

      expect(result.success).toBe(true);
      expect(result.label).toBe('post-code-review');
    });
  });

  describe('Logging Service', () => {
    let loggingService;

    beforeEach(() => {
      loggingService = new MockLoggingService();
    });

    it('should log review details', () => {
      const result = loggingService.logReviewDetails(
        'test-dept', 'test-team', 'main', 'openai', 'js', 'src/', ['node_modules/'], 8000, 3, 1000
      );

      expect(result).toBe(true);
    });

    it('should log changed files', () => {
      const emptyFiles = [];
      const withFiles = [{ path: 'test.js' }];

      expect(loggingService.logChangedFiles(emptyFiles)).toBe(false);
      expect(loggingService.logChangedFiles(withFiles)).toBe(true);
    });

    it('should log LLM response', () => {
      const emptyResponse = {};
      const validResponse = { response: 'test response' };

      expect(loggingService.logLLMResponse(emptyResponse)).toBe(false);
      expect(loggingService.logLLMResponse(validResponse)).toBe(true);
    });

    it('should log final decision', () => {
      const decision = loggingService.logFinalDecision(true, { issues: [{ severity: 'CRITICAL' }] });

      expect(decision.shouldBlockMerge).toBe(true);
      expect(decision.issuesFound).toBe(1);
    });
  });
});
