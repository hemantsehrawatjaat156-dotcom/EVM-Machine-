const { createClient } = require('redis');
require('dotenv').config();

let redisClient = null;
let useRedis = false;

// In-memory fallback store
const memStore = {};

const memClient = {
  get: async (key) => memStore[key] ?? null,
  set: async (key, value, options) => {
    memStore[key] = value;
    if (options?.EX) {
      setTimeout(() => delete memStore[key], options.EX * 1000);
    }
  },
  del: async (key) => { delete memStore[key]; },
};

const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 1000,
        reconnectStrategy: false,
      },
    });
    redisClient.on('error', () => {});
    await redisClient.connect();
    useRedis = true;
    console.log('✅ Redis connected');
    return redisClient;
  } catch (err) {
    console.log('⚠️  Redis not available, using in-memory store');
    return memClient;
  }
};

const getRedis = () => {
  if (useRedis && redisClient) return redisClient;
  return memClient;
};

module.exports = { connectRedis, getRedis };
