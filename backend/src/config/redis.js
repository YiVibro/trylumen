const { Queue } = require('bullmq');
const Redis = require('ioredis');

// Build connection options explicitly tailored for serverless Redis environments
const redisConnection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null, // Critical requirement: BullMQ manages its own request lifecycle
});

const documentQueue = new Queue('document-processing', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Automatically retry a failed file ingestion up to 3 times
    backoff: {
      type: 'exponential',
      delay: 5000, // Wait 5s, then 10s, then 20s between retries (mitigates network/LLM API rate errors)
    }
  }
});

module.exports = { documentQueue, redisConnection };