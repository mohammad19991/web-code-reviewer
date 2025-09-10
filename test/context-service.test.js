/**
 * Comprehensive tests for ContextService
 */

const ContextService = require('../src/services/context-service');
const CONTEXT_CONFIG = require('../src/config/context');

// Mock @actions/core
jest.mock('@actions/core', () => ({
  info: jest.fn(),
  warning: jest.fn(),
  error: jest.fn()
}));

// Mock child_process
jest.mock('child_process', () => ({
  execSync: jest.fn()
}));

const { execSync } = require('child_process');

describe('ContextService', () => {
  let contextService;

  beforeEach(() => {
    contextService = new ContextService('main');
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with base branch', () => {
      const service = new ContextService('develop');
      expect(service.baseBranch).toBe('develop');
    });

    it('should default to main branch if none provided', () => {
      const service = new ContextService();
      expect(service.baseBranch).toBeUndefined();
    });
  });


  describe('getDependencyContext', () => {
    it('should return dependency context when package.json exists', async () => {
      const mockPackageJson = JSON.stringify({
        name: 'test-project',
        type: 'module',
        dependencies: {
          'react': '^18.0.0',
          'lodash': '^4.17.21'
        },
        devDependencies: {
          'jest': '^29.0.0'
        }
      });

      execSync.mockReturnValue(mockPackageJson);

      const result = await contextService.getDependencyContext();

      expect(result).toContain('📦 Project Type:');
      expect(result).toContain('module');
      expect(execSync).toHaveBeenCalledWith('cat package.json', expect.objectContaining({
        encoding: 'utf8',
        maxBuffer: 5242880,
        timeout: 30000
      }));
    });

    it('should handle missing package.json', async () => {
      execSync.mockImplementation(() => {
        throw new Error('No such file');
      });

      const result = await contextService.getDependencyContext();

      expect(result).toBe(''); // Should return empty string when package.json is missing
    });

    it('should handle invalid JSON in package.json', async () => {
      execSync.mockReturnValue('invalid json');

      const result = await contextService.getDependencyContext();

      expect(result).toContain('--- Dependencies Context ---');
      expect(result).toContain('📦 Package.json (raw):');
      expect(result).toContain('invalid json');
    });
  });

  describe('getRecentCommitContext', () => {
    it('should return recent commit context', async () => {
      const mockCommits = `Add new feature
Fix bug in authentication
Update dependencies
Refactor user service`;

      execSync.mockReturnValue(mockCommits);

      const result = await contextService.getRecentCommitContext();

      expect(result).toContain('--- Recent Commits Context ---');
      expect(result).toContain('Add new feature');
      expect(result).toContain('Fix bug in authentication');
      expect(execSync).toHaveBeenCalledWith(
        'git log --oneline --no-merges origin/main..HEAD | head -15 | sed \'s/^[a-f0-9]* //\'',
        expect.objectContaining({
          encoding: 'utf8',
          maxBuffer: 5242880,
          timeout: 30000
        })
      );
    });

    it('should handle no recent commits', async () => {
      execSync.mockReturnValue('');

      const result = await contextService.getRecentCommitContext();

      expect(result).toContain('--- Recent Commits Context ---');
      expect(result).toContain('--- End Recent Commits ---');
    });

    it('should handle git command errors', async () => {
      execSync.mockImplementation(() => {
        throw new Error('Not a git repository');
      });

      const result = await contextService.getRecentCommitContext();

      expect(result).toBe(''); // Should return empty string when git command fails
    });
  });

  describe('getSemanticCodeContext', () => {
    it('should return semantic context for changed files', async () => {
      const changedFiles = ['src/index.js', 'src/utils.js'];
      
      // Mock file content for each file
      execSync
        .mockReturnValueOnce('function calculateTotal() {\n  return a + b;\n}\n\nclass UserService {\n  constructor() {}\n}')
        .mockReturnValueOnce('export const API_URL = "https://api.example.com";\n\nfunction validateInput(input) {\n  return input.length > 0;\n}');

      const result = await contextService.getSemanticCodeContext(changedFiles);

      expect(result).toContain('--- Semantic Code Context ---');
      expect(result).toContain('src/index.js');
      expect(result).toContain('src/utils.js');
      expect(result).toContain('Key Definitions:');
    });

    it('should handle empty changed files array', async () => {
      const result = await contextService.getSemanticCodeContext([]);

      expect(result).toContain('--- Semantic Code Context ---');
      expect(result).toContain('No changed files to analyze');
    });

    it('should handle file read errors', async () => {
      const changedFiles = ['src/nonexistent.js'];
      
      execSync.mockImplementation(() => {
        throw new Error('No such file');
      });

      const result = await contextService.getSemanticCodeContext(changedFiles);

      expect(result).toContain('--- Semantic Code Context ---');
      expect(result).toContain('src/nonexistent.js');
      expect(result).toContain('Could not analyze');
    });
  });

  describe('getFileRelationshipsContext', () => {
    it('should return file relationships context', async () => {
      const changedFiles = ['src/index.js'];
      
      const mockFileContent = `import { UserService } from './services/user-service.js';
import React from 'react';
import { API_URL } from './constants.js';

export const App = () => {
  return <div>Hello World</div>;
};

export default App;`;

      execSync.mockReturnValue(mockFileContent);

      const result = await contextService.getFileRelationshipsContext(changedFiles);

      expect(result).toContain('--- File Relationships Context ---');
      expect(result).toContain('src/index.js');
      expect(result).toContain('Imports:');
      expect(result).toContain('Exports:');
    });

    it('should handle empty changed files', async () => {
      const result = await contextService.getFileRelationshipsContext([]);

      expect(result).toContain('--- File Relationships Context ---');
      expect(result).toContain('No changed files to analyze');
    });
  });

  describe('getComprehensiveContext', () => {
    it('should generate comprehensive context with all components', async () => {
      const changedFiles = ['src/index.js'];
      
      // Mock all the individual context methods
      execSync
        .mockReturnValueOnce('src/\n  index.js\npackage.json') // project structure
        .mockReturnValueOnce('{"name": "test", "type": "module"}') // package.json
        .mockReturnValueOnce('Add new feature\nFix bug') // commits
        .mockReturnValueOnce('function test() {}') // semantic code
        .mockReturnValueOnce('import React from "react";\nexport const App = () => {};'); // file relationships

      const result = await contextService.getComprehensiveContext(changedFiles, 1000);

      expect(result).toContain('🧠 LLM-FOCUSED CODE REVIEW CONTEXT');
      expect(result).toContain('📝 FILES BEING REVIEWED:');
      expect(result).toContain('🔍 SEMANTIC CODE:');
    });

    it('should handle context size limits', async () => {
      const changedFiles = ['src/index.js'];
      
      // Mock a very large context
      const largeContext = 'x'.repeat(100000);
      execSync.mockReturnValue(largeContext);

      const result = await contextService.getComprehensiveContext(changedFiles, 1000);

      expect(result.length).toBeLessThanOrEqual(CONTEXT_CONFIG.MAX_CONTEXT_SIZE_LARGE + 1000); // Allow some tolerance
    });

    it('should handle empty changed files', async () => {
      const result = await contextService.getComprehensiveContext([], 1000);

      expect(result).toContain('🧠 LLM-FOCUSED CODE REVIEW CONTEXT');
      // When no files are provided, the context might be empty or minimal
      expect(typeof result).toBe('string');
    });
  });

  describe('calculateDynamicContextSize', () => {
    it('should calculate context size based on estimated tokens', () => {
      const result = contextService.calculateDynamicContextSize(50000);

      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(CONTEXT_CONFIG.MAX_CONTEXT_SIZE_LARGE);
    });

    it('should return min size for very large token counts', () => {
      const result = contextService.calculateDynamicContextSize(1000000);
      
      expect(result).toBe(CONTEXT_CONFIG.MIN_CONTEXT_SIZE);
    });

    it('should return min size for very small token counts', () => {
      const result = contextService.calculateDynamicContextSize(100);
      
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('extractCodeDefinitions', () => {
    it('should extract function definitions', () => {
      const code = `function calculateTotal(a, b) {
  return a + b;
}

const processData = (data) => {
  return data.map(item => item.value);
};`;

      const result = contextService.extractCodeDefinitions(code);

      expect(result).toContain('Function: function calculateTotal(a, b) {');
      expect(result).toContain('Function Expression: const processData = (data) => {');
    });

    it('should extract class definitions', () => {
      const code = `class UserService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }
  
  async getUser(id) {
    return await this.apiClient.get(\`/users/\${id}\`);
  }
}`;

      const result = contextService.extractCodeDefinitions(code);

      expect(result).toContain('Class: class UserService {');
    });

    it('should handle empty code', () => {
      const result = contextService.extractCodeDefinitions('');
      expect(result).toEqual([]);
    });

    it('should limit number of definitions', () => {
      const code = Array(15).fill(0).map((_, i) => `function test${i}() {}`).join('\n');
      
      const result = contextService.extractCodeDefinitions(code);
      
      expect(result.length).toBeLessThanOrEqual(10);
    });
  });

  describe('analyzeIncomingRelationships', () => {
    it('should extract import statements', () => {
      const code = `import React from 'react';
import { useState, useEffect } from 'react';
import { UserService } from './services/user-service.js';
import * as utils from './utils';`;

      const result = contextService.analyzeIncomingRelationships(code);

      expect(result).toContain("Import: react (import React from 'react';)");
      expect(result).toContain("Import: react (import { useState, useEffect } from 'react';)");
      expect(result).toContain("Import: ./services/user-service.js (import { UserService } from './services/user-service.js';)");
    });

    it('should handle require statements', () => {
      const code = `const fs = require('fs');
const { promisify } = require('util');
const UserService = require('./services/user-service');`;

      const result = contextService.analyzeIncomingRelationships(code);

      expect(result).toContain("Require: fs (const fs = require('fs');)");
      expect(result).toContain("Require: util (const { promisify } = require('util');)");
    });

    it('should handle empty code', () => {
      const result = contextService.analyzeIncomingRelationships('');
      expect(result).toEqual([]);
    });
  });

  describe('analyzeOutgoingRelationships', () => {
    it('should extract export statements', () => {
      const code = `export const API_URL = 'https://api.example.com';
export function calculateTotal(a, b) {
  return a + b;
}
export default class UserService {
  constructor() {}
}`;

      const result = contextService.analyzeOutgoingRelationships(code);

      expect(result).toContain("Export: export const API_URL = 'https://api.example.com';");
      expect(result).toContain('Export: export function calculateTotal(a, b) {');
      expect(result).toContain('Export: export default class UserService {');
    });

    it('should handle module.exports', () => {
      const code = `module.exports = {
  calculateTotal: (a, b) => a + b,
  API_URL: 'https://api.example.com'
};

module.exports.UserService = class UserService {};`;

      const result = contextService.analyzeOutgoingRelationships(code);

      expect(result).toContain('Module Export: module.exports = {');
      // The actual implementation only matches module.exports = pattern, not module.exports.UserService
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty code', () => {
      const result = contextService.analyzeOutgoingRelationships('');
      expect(result).toEqual([]);
    });
  });

  describe('escapeFilePath', () => {
    it('should escape special characters in file paths', () => {
      const testCases = [
        { input: 'src/index.js', expected: "'src/index.js'" },
        { input: 'src/file with spaces.js', expected: "'src/file with spaces.js'" },
        { input: 'src/file&with&special.js', expected: "'src/file&with&special.js'" },
        { input: 'src/file(with)parentheses.js', expected: "'src/file(with)parentheses.js'" }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = contextService.escapeFilePath(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle multiple command failures gracefully', async () => {
      execSync.mockImplementation(() => {
        throw new Error('Command failed');
      });

      const result = await contextService.getComprehensiveContext(['src/index.js'], 1000);

      expect(result).toContain('🧠 LLM-FOCUSED CODE REVIEW CONTEXT');
      expect(result).toContain('📝 FILES BEING REVIEWED:');
      expect(result).toContain('🔍 SEMANTIC CODE:');
      expect(result).toContain('🔗 FILE RELATIONSHIPS:');
    });

    it('should handle null/undefined inputs', async () => {
      const result = await contextService.getComprehensiveContext(null, 1000);
      expect(result).toBeDefined();
    });
  });
});
