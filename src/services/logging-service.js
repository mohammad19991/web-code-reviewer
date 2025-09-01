/**
 * Logging service for handling external logging and review data management
 */

const core = require('@actions/core');
const { CONFIG } = require('../constants');

class LoggingService {
  constructor() {
    // No constructor needed for this service
  }

  /**
   * Log review data to external endpoint (non-blocking)
   */
  async logReviewData(reviewData) {
    // Only log if enabled in configuration
    if (!CONFIG.ENABLE_REVIEW_LOGGING) {
      core.info('📊 Review logging disabled in configuration');
      return;
    }
    
    // Fire and forget - don't await this to avoid blocking
    this.sendReviewLog(reviewData).catch(error => {
      core.warning(`⚠️  Failed to log review data: ${error.message}`);
    });
  }

  /**
   * Send review log to external endpoint
   */
  async sendReviewLog(reviewData) {
    try {
      const { default: fetch } = await import('node-fetch');
      
      const response = await fetch(CONFIG.LOGGING_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'DeepReview-GitHub-Action/1.14.0'
        },
        body: JSON.stringify(reviewData),
        timeout: CONFIG.LOGGING_TIMEOUT
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      core.info('📊 Review data logged successfully');
    } catch (error) {
      throw new Error(`Failed to send review log: ${error.message}`);
    }
  }

  /**
   * Log review details
   */
  logReviewDetails(department, team, baseBranch, provider, language, pathToFiles, ignorePatterns, chunkSize, maxConcurrentRequests, batchDelayMs) {
    core.info(`🚀 Starting LLM Code Review (GitHub Actions)...\n`);
    core.info(`🤖 Using ${provider.toUpperCase()} LLM`);
    
    core.info(`📋 Review Details:`);
    core.info(`  - Department: ${department}`);
    core.info(`  - Team: ${team}`);
    core.info(`  - Base Branch: ${baseBranch}`);
    core.info(`  - Head Ref: ${process.env.GITHUB_SHA || 'HEAD'}`);
    core.info(`  - Review Date: ${new Date().toLocaleString()}`);
    core.info(`  - Reviewer: ${provider.toUpperCase()} LLM`);
    core.info(`  - Language: ${language}`);
    core.info(`  - Path to Files: ${pathToFiles.join(', ')}`);
    core.info(`  - Ignore Patterns: ${ignorePatterns.join(', ')}`);
    core.info(`  - PR Number: ${process.env.GITHUB_EVENT_NAME === 'pull_request' ? process.env.GITHUB_EVENT_NUMBER : 'Not available'}`);
    core.info(`  - Chunk Size: ${Math.round(chunkSize / 1024)}KB (${chunkSize} bytes)`);
    core.info(`  - Max Concurrent Requests: ${maxConcurrentRequests}`);
    core.info(`  - Batch Delay: ${batchDelayMs}ms`);
    
    // Debug chunk size configuration
    if (chunkSize <= 0) {
      core.warning(`⚠️  WARNING: Chunk size is ${chunkSize} - this will cause excessive chunking!`);
      core.warning(`   Check your chunk_size input parameter or CONFIG.DEFAULT_CHUNK_SIZE`);
    }
    
    core.info('');
  }

  /**
   * Log changed files
   */
  logChangedFiles(changedFiles) {
    if (changedFiles.length === 0) {
      core.info('✅ No changes detected - nothing to review');
      return false;
    }

    core.info(`📁 Found ${changedFiles.length} changed files in repository:\n`);
    changedFiles.forEach(filePath => {
      core.info(`  📄 ${filePath}`);
    });
    core.info('');
    return true;
  }

  /**
   * Log LLM response
   */
  logLLMResponse(llmResponse) {
    if (llmResponse) {
      core.info('🤖 LLM Review Results:');
      core.info('================================================================================');
      core.info(llmResponse);
      core.info('================================================================================\n');
      return true;
    }
    return false;
  }

  /**
   * Log final decision with enhanced details
   */
  logFinalDecision(shouldBlockMerge, llmResponse) {
    try {
      // Use centralized function to extract issues and metadata
      const extractedData = this.extractIssuesFromResponse(llmResponse);
      
      if (extractedData.chunksProcessed > 0) {
        core.info(`📊 Found ${extractedData.chunksProcessed} JSON objects for detailed logging`);
        
        if (shouldBlockMerge) {
          const criticalIssues = extractedData.issues.filter(i => i.severity_proposed === 'critical');
          const highConfidenceCritical = criticalIssues.filter(i => i.confidence >= 0.6);
          
          core.setFailed(`🚨 MERGE BLOCKED: LLM review found ${criticalIssues.length} critical issues (${highConfidenceCritical.length} with high confidence ≥ 0.6) across ${extractedData.chunksProcessed} chunks`);
          
          if (highConfidenceCritical.length > 0) {
            core.info('   High-confidence critical issues:');
            highConfidenceCritical.forEach(issue => {
              core.info(`   - ${issue.originalId}: ${issue.category} (Chunk ${issue.chunk}, score: ${issue.severity_score?.toFixed(1) || 'N/A'}, ${Math.round(issue.confidence * 100)}% confidence)`);
              core.info(`     File: ${issue.file}, Lines: ${issue.lines.join('-')}`);
              if (issue.risk_factors) {
                core.info(`     Risk Factors: I:${issue.risk_factors.impact} E:${issue.risk_factors.exploitability} L:${issue.risk_factors.likelihood} B:${issue.risk_factors.blast_radius} Ev:${issue.risk_factors.evidence_strength}`);
              }
              core.info(`     Impact: ${issue.why_it_matters}`);
            });
          }
          
          core.info('   Please fix the critical issues mentioned above and run the review again.');
        } else {
          const suggestions = extractedData.issues.filter(i => i.severity_proposed === 'suggestion');
          core.info(`✅ MERGE APPROVED: No critical issues found across ${extractedData.chunksProcessed} chunks. ${suggestions.length} suggestions available for consideration.`);
          
          if (suggestions.length > 0) {
            core.info('   Suggestions for improvement:');
            suggestions.slice(0, 3).forEach(issue => { // Show first 3 suggestions
              core.info(`   - ${issue.originalId}: ${issue.category} (Chunk ${issue.chunk}, score: ${issue.severity_score?.toFixed(1) || 'N/A'}, ${Math.round(issue.confidence * 100)}% confidence)`);
            });
            if (suggestions.length > 3) {
              core.info(`   ... and ${suggestions.length - 3} more suggestions`);
            }
          }
        }
        
        // Log combined metrics
        core.info(`📊 Review Summary: ${extractedData.totalCriticalCount} critical, ${extractedData.totalSuggestionCount} suggestions across ${extractedData.chunksProcessed} chunks`);
        
        return;
      }
    } catch (error) {
      core.warning(`⚠️  Error parsing JSON for detailed logging: ${error.message}`);
    }
    
    // Fallback to simple logging
    if (shouldBlockMerge) {
      core.setFailed('🚨 MERGE BLOCKED: LLM review found critical issues that must be addressed before merging.');
      core.info('   Please fix the issues mentioned above and run the review again.');
    } else {
      core.info('✅ MERGE APPROVED: No critical issues found. Safe to merge.');
    }
  }

  /**
   * Extract issues and metadata from LLM response (helper method)
   */
  extractIssuesFromResponse(llmResponse) {
    const issues = [];
    const summaries = [];
    let totalCriticalCount = 0;
    let totalSuggestionCount = 0;
    let jsonMatches = [];
    
    try {
      // Try to extract JSON from the new XML-style format first
      jsonMatches = llmResponse.match(/<JSON>\s*([\s\S]*?)\s*<\/JSON>/g) || [];
      
      if (jsonMatches.length > 0) {
        jsonMatches.forEach((match, index) => {
          try {
            const jsonStr = match.replace(/<JSON>\s*/, '').replace(/\s*<\/JSON>/, '');;
            const reviewData = JSON.parse(jsonStr);
            
            // Collect summary
            if (reviewData.summary) {
              summaries.push(`**Chunk ${index + 1}**: ${reviewData.summary}`);
            }
            
            // Collect issues
            if (reviewData.issues && Array.isArray(reviewData.issues)) {
              reviewData.issues.forEach(issue => {
                // Add chunk context to issue
                const issueWithContext = {
                  ...issue,
                  chunk: index + 1,
                  originalId: issue.id
                };
                issues.push(issueWithContext);
              });
            }
            
            // Collect metrics
            if (reviewData.metrics) {
              totalCriticalCount += reviewData.metrics.critical_count || 0;
              totalSuggestionCount += reviewData.metrics.suggestion_count || 0;
            }
            
          } catch (parseError) {
            core.warning(`⚠️  Error parsing JSON object ${index + 1}: ${parseError.message}`);
          }
        });
      }
    } catch (error) {
      core.warning(`⚠️  Error extracting issues from response: ${error.message}`);
    }
    
    return {
      issues,
      summaries,
      totalCriticalCount,
      totalSuggestionCount,
      chunksProcessed: jsonMatches.length
    };
  }
}

module.exports = LoggingService;
