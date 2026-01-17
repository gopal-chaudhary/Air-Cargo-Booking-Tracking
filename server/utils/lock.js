import redis from "../config/redis.js"

/**
 * Acquire a distributed lock for a booking operation
 * @param {string} ref_id - Booking reference ID
 * @param {number} ttl - Time to live in milliseconds (default: 5000ms)
 * @returns {Promise<{lock: boolean, release: function}>} Lock object with release function
 */
export async function acquireLock(ref_id, ttl = 5000) {
  // If Redis is not connected, return false (fail-open)
  if (!redis.isConnected) {
    return { acquired: false, release: async () => {} }
  }

  const lockKey = `lock:booking:${ref_id}`
  const lockValue = `${Date.now()}-${Math.random()}`
  
  try {
    // Try to acquire lock using SET with NX (only if not exists) and EX (expiration)
    const result = await redis.set(lockKey, lockValue, "PX", ttl, "NX")
    
    if (result === "OK") {
      return {
        acquired: true,
        release: async () => {
          try {
            // Only release if we still own the lock (check value)
            const script = `
              if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
              else
                return 0
              end
            `
            if (redis.isConnected) {
              await redis.eval(script, 1, lockKey, lockValue)
            }
          } catch (err) {
            // Ignore release errors
            console.warn("Lock release error (ignored):", err.message)
          }
        }
      }
    }
    
    return { acquired: false, release: async () => {} }
  } catch (err) {
    console.warn("Lock acquisition error (proceeding without lock):", err.message)
    // On Redis error, allow operation to proceed (fail open)
    return { acquired: false, release: async () => {} }
  }
}

/**
 * Execute a function with a distributed lock
 * @param {string} ref_id - Booking reference ID
 * @param {Function} fn - Function to execute
 * @param {number} ttl - Lock TTL in milliseconds
 * @returns {Promise<any>} Result of the function
 */
export async function withLock(ref_id, fn, ttl = 5000) {
  // If Redis is not available, proceed without locking (fail-open)
  if (!redis.isConnected) {
    console.warn(`Redis not available - proceeding without lock for booking ${ref_id}`)
    return await fn()
  }

  const lock = await acquireLock(ref_id, ttl)
  
  // If lock acquisition failed but Redis is connected, it means another process has the lock
  if (!lock.acquired && redis.isConnected) {
    throw new Error("Could not acquire lock for booking. Please try again.")
  }
  
  // If Redis is not connected, proceed without lock
  if (!lock.acquired) {
    return await fn()
  }
  
  try {
    const result = await fn()
    return result
  } finally {
    await lock.release()
  }
}
