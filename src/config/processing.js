/**
 * Processing configuration for chunking and batch processing
 */

const PROCESSING_CONFIG = {
  DEFAULT_CHUNK_SIZE: 500 * 1024, // 500KB default chunk size (optimized for Claude Sonnet 4)
  MAX_CONCURRENT_REQUESTS: 1, // Reduced to 1 to avoid rate limits
  BATCH_DELAY_MS: 2000 // Increased delay between requests
};

module.exports = PROCESSING_CONFIG;
