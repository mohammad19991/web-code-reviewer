/**
 * GitHub service for handling PR operations, comments, and labels
 */

const core = require('@actions/core');
const { CONFIG } = require('../constants');

class GitHubService {
  constructor(octokit, context) {
    this.octokit = octokit;
    this.context = context;
  }

  /**
   * Add "post code review" label to the PR if it doesn't exist
   */
  async addPostCodeReviewLabel() {
    try {
      const labelName = CONFIG.POST_REVIEW_LABEL;

      // Check if the label already exists on the PR
      const { data: labels } = await this.octokit.rest.issues.listLabelsOnIssue({
        owner: this.context.repo.owner,
        repo: this.context.repo.repo,
        issue_number: this.context.issue.number
      });

      const labelExists = labels.some(
        label => label.name.toLowerCase() === labelName.toLowerCase()
      );

      if (labelExists) {
        core.info(`🏷️  Label "${labelName}" already exists on PR`);
        return;
      }

      // Try to add the label to the PR
      await this.octokit.rest.issues.addLabels({
        owner: this.context.repo.owner,
        repo: this.context.repo.repo,
        issue_number: this.context.issue.number,
        labels: [labelName]
      });

      core.info(`🏷️  Successfully added "${labelName}" label to PR`);
    } catch (error) {
      // If the label doesn't exist in the repository, try to create it first
      if (error.status === 422) {
        try {
          await this.createPostCodeReviewLabel();
        } catch (createError) {
          core.warning(
            `⚠️  Could not create "${CONFIG.POST_REVIEW_LABEL}" label: ${createError.message}`
          );
        }
      } else {
        core.warning(`⚠️  Error adding "${CONFIG.POST_REVIEW_LABEL}" label: ${error.message}`);
      }
    }
  }

  /**
   * Create the "post code review" label in the repository
   */
  async createPostCodeReviewLabel() {
    try {
      const labelName = CONFIG.POST_REVIEW_LABEL;

      await this.octokit.rest.issues.createLabel({
        owner: this.context.repo.owner,
        repo: this.context.repo.repo,
        name: labelName,
        color: CONFIG.POST_REVIEW_LABEL_COLOR,
        description: CONFIG.POST_REVIEW_LABEL_DESCRIPTION
      });

      core.info(`🏷️  Created "${labelName}" label in repository`);

      // Now try to add it to the PR
      await this.octokit.rest.issues.addLabels({
        owner: this.context.repo.owner,
        repo: this.context.repo.repo,
        issue_number: this.context.issue.number,
        labels: [labelName]
      });

      core.info(`🏷️  Successfully added "${CONFIG.POST_REVIEW_LABEL}" label to PR`);
    } catch (error) {
      core.warning(`⚠️  Error creating "${CONFIG.POST_REVIEW_LABEL}" label: ${error.message}`);
    }
  }

  /**
   * Delete previous DeepReview comments on the PR (keep the most recent one)
   */
  async deletePreviousComments() {
    try {
      // Get all comments on the PR
      const { data: comments } = await this.octokit.rest.issues.listComments({
        owner: this.context.repo.owner,
        repo: this.context.repo.repo,
        issue_number: this.context.issue.number,
        per_page: 100 // Limit to last 100 comments
      });

      // Find comments made by our bot
      const botComments = comments.filter(
        comment => comment.body.includes('## 🤖 DeepReview') // Match our bot's header
      );

      // Sort by creation date (newest first) to keep the most recent comment
      botComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Delete all but the most recent comment (if there are multiple)
      const commentsToDelete = botComments.slice(1); // Skip the first (most recent) comment

      for (const comment of commentsToDelete) {
        core.info(
          `🗑️ Deleting old DeepReview comment: ${comment.id} (created: ${comment.created_at})`
        );
        await this.octokit.rest.issues.deleteComment({
          owner: this.context.repo.owner,
          repo: this.context.repo.repo,
          comment_id: comment.id
        });
      }

      if (commentsToDelete.length > 0) {
        core.info(
          `✅ Deleted ${commentsToDelete.length} old DeepReview comment(s), kept the most recent one`
        );
      } else if (botComments.length > 0) {
        core.info(
          `ℹ️  Found ${botComments.length} existing DeepReview comment(s), will update the most recent one`
        );
      }
    } catch (error) {
      core.warning(`⚠️  Error deleting previous comments: ${error.message}`);
      // Don't throw error - continue with adding new comment
    }
  }

  /**
   * Add PR comment to GitHub
   */
  async addPRComment(comment) {
    if (this.context.eventName !== 'pull_request') {
      core.info('⚠️  Not a pull request event, skipping PR comment');
      return;
    }

    try {
      // First clean up old comments (keep the most recent one)
      await this.deletePreviousComments();

      // Check if there's an existing DeepReview comment to update
      const { data: comments } = await this.octokit.rest.issues.listComments({
        owner: this.context.repo.owner,
        repo: this.context.repo.repo,
        issue_number: this.context.issue.number,
        per_page: 100
      });

      const existingBotComment = comments
        .filter(comment => comment.body.includes('## 🤖 DeepReview'))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]; // Get the most recent

      if (existingBotComment) {
        // Update the existing comment
        core.info(`🔄 Updating existing DeepReview comment: ${existingBotComment.id}`);
        await this.octokit.rest.issues.updateComment({
          owner: this.context.repo.owner,
          repo: this.context.repo.repo,
          comment_id: existingBotComment.id,
          body: comment
        });
        core.info('✅ Updated existing PR comment successfully');
      } else {
        // Create a new comment
        await this.octokit.rest.issues.createComment({
          owner: this.context.repo.owner,
          repo: this.context.repo.repo,
          issue_number: this.context.issue.number,
          body: comment
        });
        core.info('✅ Added new PR comment successfully');
      }

      // Add "post code review" label to the PR
      core.info('🏷️  Adding "post code review" label to PR...');
      await this.addPostCodeReviewLabel();
    } catch (error) {
      core.error(`❌ Error adding PR comment: ${error.message}`);
    }
  }

  /**
   * Get base branch dynamically from PR or use input/default
   */
  getBaseBranch(inputBaseBranch, defaultBaseBranch) {
    // If we're in a pull request context, get the base branch from the PR
    if (this.context.eventName === 'pull_request' && this.context.payload.pull_request) {
      const prBaseBranch = this.context.payload.pull_request.base.ref;
      core.info(`📋 Using PR base branch: ${prBaseBranch}`);
      return prBaseBranch;
    }

    // Fallback to input or default
    if (inputBaseBranch) {
      core.info(`📋 Using input base branch: ${inputBaseBranch}`);
      return inputBaseBranch;
    }

    core.info(`📋 Using default base branch: ${defaultBaseBranch}`);
    return defaultBaseBranch;
  }
}

module.exports = GitHubService;
