// cache.js
const redis = require('redis');

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

async function connectRedis() {
    await redisClient.connect();
    console.log('✅ Connected to Redis');
}

module.exports = { redisClient, connectRedis };
