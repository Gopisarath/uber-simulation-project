const { redisClient } = require('../config/cache');

async function invalidateCache(keys = []) {
    if (!Array.isArray(keys)) {
        keys = [keys];
    }
    try {
        if (keys.length > 0) {
            const result = await redisClient.del(keys);  // ✅ modern Redis 4+
            console.log(`✅ Cache invalidated for keys: ${keys.join(', ')} (Deleted ${result} items)`);
        }
    } catch (err) {
        console.error('Cache invalidation error:', err);
    }
}

module.exports = { invalidateCache };
