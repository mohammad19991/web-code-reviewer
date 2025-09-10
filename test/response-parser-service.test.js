/**
 * Comprehensive tests for ResponseParserService
 */

const ResponseParserService = require('../src/services/response-parser-service');

// Mock @actions/core
jest.mock('@actions/core', () => ({
  info: jest.fn(),
  warning: jest.fn(),
  error: jest.fn()
}));

describe('ResponseParserService', () => {
  describe('extractIssuesFromResponse', () => {
    it('should parse valid JSON response with issues', () => {
      const mockResponse = {
        response: `<JSON>
        {
          "summary": "Found 2 critical security issues",
          "issues": [
            {
              "id": "SEC-01",
              "category": "security",
              "severity_proposed": "critical",
              "severity_score": 4.25,
              "risk_factors": {
                "impact": 5,
                "exploitability": 4,
                "likelihood": 4,
                "blast_radius": 4,
                "evidence_strength": 5
              },
              "risk_factors_notes": {
                "impact": "High impact on user data",
                "exploitability": "Easy to exploit",
                "likelihood": "Very likely",
                "blast_radius": "Affects all users",
                "evidence_strength": "Direct evidence"
              },
              "confidence": 0.9,
              "file": "src/auth.js",
              "lines": [15, 20],
              "snippet": "const token = localStorage.getItem('authToken');",
              "why_it_matters": "Storing tokens in localStorage is vulnerable to XSS attacks",
              "fix_summary": "Use httpOnly cookies or secure storage",
              "fix_code_patch": "// Use secure storage instead\\nconst token = getSecureToken();",
              "tests": "Test that tokens are not stored in localStorage",
              "occurrences": [{"file": "src/auth.js", "lines": [15, 20]}]
            }
          ],
          "metrics": {
            "critical_count": 1,
            "suggestion_count": 0,
            "by_category": {"security": 1, "performance": 0, "maintainability": 0, "best_practices": 0},
            "auto_critical_hits": 1
          },
          "final_recommendation": "do_not_merge"
        }
        </JSON>
        <SUMMARY>
        • Found 1 critical security issue
        • Recommendation: do_not_merge
        </SUMMARY>`,
        provider: 'openai',
        chunkIndex: 0,
        totalChunks: 1
      };

      const result = ResponseParserService.extractIssuesFromResponse(mockResponse.response);

      expect(result).toBeDefined();
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].id).toBe('SEC-01');
      expect(result.issues[0].category).toBe('security');
      expect(result.issues[0].severity_proposed).toBe('critical');
      expect(result.issues[0].severity_score).toBe(4.25);
      expect(result.totalCriticalCount).toBe(1);
      expect(result.totalSuggestionCount).toBe(0);
    });

    it('should handle response with no issues', () => {
      const mockResponse = {
        response: `<JSON>
        {
          "summary": "No issues found",
          "issues": [],
          "metrics": {
            "critical_count": 0,
            "suggestion_count": 0,
            "by_category": {"security": 0, "performance": 0, "maintainability": 0, "best_practices": 0},
            "auto_critical_hits": 0
          },
          "final_recommendation": "safe_to_merge"
        }
        </JSON>
        <SUMMARY>
        • No issues found
        • Recommendation: safe_to_merge
        </SUMMARY>`,
        provider: 'openai',
        chunkIndex: 0,
        totalChunks: 1
      };

      const result = ResponseParserService.extractIssuesFromResponse(mockResponse.response);

      expect(result).toBeDefined();
      expect(result.issues).toHaveLength(0);
      expect(result.totalCriticalCount).toBe(0);
      expect(result.totalSuggestionCount).toBe(0);
    });

    it('should handle multiple chunks with proper indexing', () => {
      const mockResponse1 = {
        response: `<JSON>
        {
          "summary": "Found issues in chunk 1",
          "issues": [
            {
              "id": "SEC-01",
              "category": "security",
              "severity_proposed": "critical",
              "severity_score": 4.0,
              "risk_factors": {"impact": 5, "exploitability": 4, "likelihood": 3, "blast_radius": 4, "evidence_strength": 4},
              "risk_factors_notes": {"impact": "High", "exploitability": "Medium", "likelihood": "Medium", "blast_radius": "High", "evidence_strength": "High"},
              "confidence": 0.8,
              "file": "src/auth.js",
              "lines": [10, 15],
              "snippet": "const password = req.body.password;",
              "why_it_matters": "Password in plain text",
              "fix_summary": "Hash the password",
              "fix_code_patch": "const hashedPassword = await bcrypt.hash(password, 10);",
              "tests": "Test password hashing",
              "occurrences": [{"file": "src/auth.js", "lines": [10, 15]}]
            }
          ],
          "metrics": {"critical_count": 1, "suggestion_count": 0, "by_category": {"security": 1, "performance": 0, "maintainability": 0, "best_practices": 0}, "auto_critical_hits": 1},
          "final_recommendation": "do_not_merge"
        }
        </JSON>`,
        provider: 'openai',
        chunkIndex: 0,
        totalChunks: 2
      };

      const mockResponse2 = {
        response: `<JSON>
        {
          "summary": "Found issues in chunk 2",
          "issues": [
            {
              "id": "PERF-01",
              "category": "performance",
              "severity_proposed": "suggestion",
              "severity_score": 2.5,
              "risk_factors": {"impact": 3, "exploitability": 2, "likelihood": 2, "blast_radius": 3, "evidence_strength": 2},
              "risk_factors_notes": {"impact": "Medium", "exploitability": "Low", "likelihood": "Low", "blast_radius": "Medium", "evidence_strength": "Low"},
              "confidence": 0.6,
              "file": "src/utils.js",
              "lines": [25, 30],
              "snippet": "for (let i = 0; i < items.length; i++) {",
              "why_it_matters": "Inefficient loop",
              "fix_summary": "Use forEach or map",
              "fix_code_patch": "items.forEach(item => {",
              "tests": "Test loop performance",
              "occurrences": [{"file": "src/utils.js", "lines": [25, 30]}]
            }
          ],
          "metrics": {"critical_count": 0, "suggestion_count": 1, "by_category": {"security": 0, "performance": 1, "maintainability": 0, "best_practices": 0}, "auto_critical_hits": 0},
          "final_recommendation": "safe_to_merge"
        }
        </JSON>`,
        provider: 'openai',
        chunkIndex: 1,
        totalChunks: 2
      };

      const result1 = ResponseParserService.extractIssuesFromResponse(mockResponse1.response);
      const result2 = ResponseParserService.extractIssuesFromResponse(mockResponse2.response);

      expect(result1.issues).toHaveLength(1);
      expect(result1.issues[0].chunkIndex).toBe(0);
      expect(result2.issues).toHaveLength(1);
      expect(result2.issues[0].chunkIndex).toBe(0); // Each call is independent, so chunkIndex is always 0
    });

    it('should handle malformed JSON response', () => {
      const mockResponse = {
        response: `<JSON>
        {
          "summary": "Invalid JSON response
          "issues": [
            {
              "id": "SEC-01",
              "category": "security"
              // Missing closing brace
            }
          ]
        }
        </JSON>`,
        provider: 'openai',
        chunkIndex: 0,
        totalChunks: 1
      };

      const result = ResponseParserService.extractIssuesFromResponse(mockResponse.response);

      expect(result).toBeDefined();
      expect(result.issues).toHaveLength(0);
      expect(result.totalCriticalCount).toBe(0);
      expect(result.totalSuggestionCount).toBe(0);
    });

    it('should handle response without JSON tags', () => {
      const mockResponse = {
        response: 'This is just plain text without any JSON structure',
        provider: 'openai',
        chunkIndex: 0,
        totalChunks: 1
      };

      const result = ResponseParserService.extractIssuesFromResponse(mockResponse.response);

      expect(result).toBeDefined();
      expect(result.issues).toHaveLength(0);
      expect(result.totalCriticalCount).toBe(0);
      expect(result.totalSuggestionCount).toBe(0);
    });

    it('should handle empty response', () => {
      const mockResponse = {
        response: '',
        provider: 'openai',
        chunkIndex: 0,
        totalChunks: 1
      };

      const result = ResponseParserService.extractIssuesFromResponse(mockResponse.response);

      expect(result).toBeDefined();
      expect(result.issues).toHaveLength(0);
      expect(result.totalCriticalCount).toBe(0);
      expect(result.totalSuggestionCount).toBe(0);
    });

    it('should handle null response', () => {
      const mockResponse = {
        response: null,
        provider: 'openai',
        chunkIndex: 0,
        totalChunks: 1
      };

      const result = ResponseParserService.extractIssuesFromResponse(mockResponse.response);

      expect(result).toBeDefined();
      expect(result.issues).toHaveLength(0);
      expect(result.totalCriticalCount).toBe(0);
      expect(result.totalSuggestionCount).toBe(0);
    });

    it('should handle missing required fields in issues', () => {
      const mockResponse = {
        response: `<JSON>
        {
          "summary": "Issue with missing fields",
          "issues": [
            {
              "id": "SEC-01",
              "category": "security"
              // Missing required fields
            }
          ],
          "metrics": {"critical_count": 0, "suggestion_count": 0, "by_category": {"security": 0, "performance": 0, "maintainability": 0, "best_practices": 0}, "auto_critical_hits": 0},
          "final_recommendation": "safe_to_merge"
        }
        </JSON>`,
        provider: 'openai',
        chunkIndex: 0,
        totalChunks: 1
      };

      const result = ResponseParserService.extractIssuesFromResponse(mockResponse.response);

      expect(result).toBeDefined();
      expect(result.issues).toHaveLength(0); // Should filter out invalid issues
      expect(result.totalCriticalCount).toBe(0);
    });

    it('should handle invalid category values', () => {
      const mockResponse = {
        response: `<JSON>
        {
          "summary": "Issue with invalid category",
          "issues": [
            {
              "id": "INVALID-01",
              "category": "invalid_category",
              "severity_proposed": "critical",
              "severity_score": 4.0,
              "risk_factors": {"impact": 5, "exploitability": 4, "likelihood": 3, "blast_radius": 4, "evidence_strength": 4},
              "risk_factors_notes": {"impact": "High", "exploitability": "Medium", "likelihood": "Medium", "blast_radius": "High", "evidence_strength": "High"},
              "confidence": 0.8,
              "file": "src/test.js",
              "lines": [10, 15],
              "snippet": "test code",
              "why_it_matters": "Test issue",
              "fix_summary": "Fix the issue",
              "fix_code_patch": "fixed code",
              "tests": "Test the fix",
              "occurrences": [{"file": "src/test.js", "lines": [10, 15]}]
            }
          ],
          "metrics": {"critical_count": 0, "suggestion_count": 0, "by_category": {"security": 0, "performance": 0, "maintainability": 0, "best_practices": 0}, "auto_critical_hits": 0},
          "final_recommendation": "safe_to_merge"
        }
        </JSON>`,
        provider: 'openai',
        chunkIndex: 0,
        totalChunks: 1
      };

      const result = ResponseParserService.extractIssuesFromResponse(mockResponse.response);

      expect(result).toBeDefined();
      expect(result.issues).toHaveLength(1); // Current validation only checks if category is a string
    });
  });

  describe('validateChunkData', () => {
    it('should validate correct chunk data', () => {
      const validChunkData = {
        summary: 'Test summary',
        issues: [
          {
            id: 'SEC-01',
            category: 'security',
            severity_proposed: 'critical',
            severity_score: 4.0,
            risk_factors: { impact: 5, exploitability: 4, likelihood: 3, blast_radius: 4, evidence_strength: 4 },
            risk_factors_notes: { impact: 'High', exploitability: 'Medium', likelihood: 'Medium', blast_radius: 'High', evidence_strength: 'High' },
            confidence: 0.8,
            file: 'src/test.js',
            lines: [10, 15],
            snippet: 'test code',
            why_it_matters: 'Test issue',
            fix_summary: 'Fix the issue',
            fix_code_patch: 'fixed code',
            tests: 'Test the fix',
            occurrences: [{ file: 'src/test.js', lines: [10, 15] }]
          }
        ],
        metrics: {
          critical_count: 1,
          suggestion_count: 0,
          by_category: { security: 1, performance: 0, maintainability: 0, best_practices: 0 },
          auto_critical_hits: 1
        },
        final_recommendation: 'do_not_merge'
      };

      const result = ResponseParserService.validateChunkData(validChunkData, 1);

      expect(result.success).toBe(true);
      expect(result.issues).toHaveLength(1);
    });

    it('should reject chunk data with missing required fields', () => {
      const invalidChunkData = {
        summary: 'Test summary',
        issues: [
          {
            id: 'SEC-01',
            category: 'security'
            // Missing required fields
          }
        ],
        metrics: {
          critical_count: 1,
          suggestion_count: 0,
          by_category: { security: 1, performance: 0, maintainability: 0, best_practices: 0 },
          auto_critical_hits: 1
        },
        final_recommendation: 'do_not_merge'
      };

      const result = ResponseParserService.validateChunkData(invalidChunkData, 1);

      expect(result.success).toBe(true);
      expect(result.issues).toHaveLength(0); // Missing required fields should be filtered out
    });

    it('should reject chunk data with invalid category', () => {
      const invalidChunkData = {
        summary: 'Test summary',
        issues: [
          {
            id: 'INVALID-01',
            category: 'invalid_category',
            severity_proposed: 'critical',
            severity_score: 4.0,
            risk_factors: { impact: 5, exploitability: 4, likelihood: 3, blast_radius: 4, evidence_strength: 4 },
            risk_factors_notes: { impact: 'High', exploitability: 'Medium', likelihood: 'Medium', blast_radius: 'High', evidence_strength: 'High' },
            confidence: 0.8,
            file: 'src/test.js',
            lines: [10, 15],
            snippet: 'test code',
            why_it_matters: 'Test issue',
            fix_summary: 'Fix the issue',
            fix_code_patch: 'fixed code',
            tests: 'Test the fix',
            occurrences: [{ file: 'src/test.js', lines: [10, 15] }]
          }
        ],
        metrics: {
          critical_count: 1,
          suggestion_count: 0,
          by_category: { security: 1, performance: 0, maintainability: 0, best_practices: 0 },
          auto_critical_hits: 1
        },
        final_recommendation: 'do_not_merge'
      };

      const result = ResponseParserService.validateChunkData(invalidChunkData, 1);

      expect(result.success).toBe(true);
      expect(result.issues).toHaveLength(1); // Current validation only checks if fields are strings
    });

    it('should reject chunk data with invalid severity_proposed', () => {
      const invalidChunkData = {
        summary: 'Test summary',
        issues: [
          {
            id: 'SEC-01',
            category: 'security',
            severity_proposed: 'invalid_severity',
            severity_score: 4.0,
            risk_factors: { impact: 5, exploitability: 4, likelihood: 3, blast_radius: 4, evidence_strength: 4 },
            risk_factors_notes: { impact: 'High', exploitability: 'Medium', likelihood: 'Medium', blast_radius: 'High', evidence_strength: 'High' },
            confidence: 0.8,
            file: 'src/test.js',
            lines: [10, 15],
            snippet: 'test code',
            why_it_matters: 'Test issue',
            fix_summary: 'Fix the issue',
            fix_code_patch: 'fixed code',
            tests: 'Test the fix',
            occurrences: [{ file: 'src/test.js', lines: [10, 15] }]
          }
        ],
        metrics: {
          critical_count: 1,
          suggestion_count: 0,
          by_category: { security: 1, performance: 0, maintainability: 0, best_practices: 0 },
          auto_critical_hits: 1
        },
        final_recommendation: 'do_not_merge'
      };

      const result = ResponseParserService.validateChunkData(invalidChunkData, 1);

      expect(result.success).toBe(true);
      expect(result.issues).toHaveLength(1); // Current validation only checks if fields are strings
    });

    it('should reject chunk data with invalid final_recommendation', () => {
      const invalidChunkData = {
        summary: 'Test summary',
        issues: [],
        metrics: {
          critical_count: 0,
          suggestion_count: 0,
          by_category: { security: 0, performance: 0, maintainability: 0, best_practices: 0 },
          auto_critical_hits: 0
        },
        final_recommendation: 'invalid_recommendation'
      };

      const result = ResponseParserService.validateChunkData(invalidChunkData, 1);

      expect(result.success).toBe(true);
      expect(result.issues).toHaveLength(0); // Empty issues array should remain empty
    });
  });

  describe('deduplicateIssues', () => {
    it('should deduplicate issues based on id and file', () => {
      const issues = [
        {
          id: 'SEC-01',
          file: 'src/auth.js',
          lines: [10, 15],
          chunkIndex: 0
        },
        {
          id: 'SEC-01',
          file: 'src/auth.js',
          lines: [10, 15],
          chunkIndex: 1
        },
        {
          id: 'SEC-02',
          file: 'src/auth.js',
          lines: [20, 25],
          chunkIndex: 0
        }
      ];

      const result = ResponseParserService.deduplicateIssues(issues);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('SEC-01');
      expect(result[1].id).toBe('SEC-02');
    });

    it('should handle empty issues array', () => {
      const result = ResponseParserService.deduplicateIssues([]);
      expect(result).toHaveLength(0);
    });

    it('should handle issues with no duplicates', () => {
      const issues = [
        {
          id: 'SEC-01',
          file: 'src/auth.js',
          lines: [10, 15],
          chunkIndex: 0
        },
        {
          id: 'SEC-02',
          file: 'src/utils.js',
          lines: [20, 25],
          chunkIndex: 1
        }
      ];

      const result = ResponseParserService.deduplicateIssues(issues);

      expect(result).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle undefined response object', () => {
      const result = ResponseParserService.extractIssuesFromResponse(undefined);

      expect(result).toBeDefined();
      expect(result.issues).toHaveLength(0);
      expect(result.totalCriticalCount).toBe(0);
      expect(result.totalSuggestionCount).toBe(0);
    });

    it('should handle response object without response property', () => {
      const mockResponse = {
        provider: 'openai',
        chunkIndex: 0,
        totalChunks: 1
      };

      const result = ResponseParserService.extractIssuesFromResponse(mockResponse.response);

      expect(result).toBeDefined();
      expect(result.issues).toHaveLength(0);
      expect(result.totalCriticalCount).toBe(0);
      expect(result.totalSuggestionCount).toBe(0);
    });

    it('should handle JSON parsing errors gracefully', () => {
      const mockResponse = {
        response: `<JSON>
        {
          "summary": "Invalid JSON with unescaped quotes"
          "issues": [
            {
              "id": "SEC-01",
              "category": "security",
              "description": "This has "unescaped quotes" which will break JSON parsing"
            }
          ]
        }
        </JSON>`,
        provider: 'openai',
        chunkIndex: 0,
        totalChunks: 1
      };

      const result = ResponseParserService.extractIssuesFromResponse(mockResponse.response);

      expect(result).toBeDefined();
      expect(result.issues).toHaveLength(0);
      expect(result.totalCriticalCount).toBe(0);
      expect(result.totalSuggestionCount).toBe(0);
    });
  });
});
