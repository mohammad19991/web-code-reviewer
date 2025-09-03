/**
 * Merge decision logic configuration
 */

const APPROVAL_PHRASES = [
  'safe to merge',
  '✅ safe to merge',
  'merge approved',
  'no critical issues',
  'safe to commit',
  'approved for merge',
  'proceed with merge',
  'merge is safe'
];

const BLOCKING_PHRASES = [
  'do not merge',
  '❌ do not merge',
  'block merge',
  'merge blocked',
  'not safe to merge',
  'critical issues found',
  'must be fixed',
  'blockers found'
];

const CRITICAL_ISSUES = [
  'security vulnerability',
  'security issue',
  'critical bug',
  'memory leak',
  'race condition',
  'xss vulnerability',
  'authentication issue',
  'authorization problem'
];

module.exports = {
  APPROVAL_PHRASES,
  BLOCKING_PHRASES,
  CRITICAL_ISSUES
};
