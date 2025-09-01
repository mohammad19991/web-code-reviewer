/**
 * Processing configuration for chunking and batch processing
 */

const PROCESSING_CONFIG = {
  DEFAULT_CHUNK_SIZE: 300 * 1024, // 300KB default chunk size (optimized for Claude Sonnet 4)
  MAX_CONCURRENT_REQUESTS: 1, // Reduced to 1 to avoid rate limits
  BATCH_DELAY_MS: 2000 // Increased delay between requests
};

module.exports = PROCESSING_CONFIG;
