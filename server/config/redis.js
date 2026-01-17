import Redis from "ioredis"

let redis = null
let redisConnected = false

try {
  redis = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    retryStrategy: (times) => {
      // Stop retrying after 3 attempts
      if (times > 3) {
        return null
      }
      const delay = Math.min(times * 50, 2000)
      return delay
    },
    lazyConnect: true,
    enableOfflineQueue: false
  })

  redis.on("error", (err) => {
    console.warn("Redis connection error (continuing without locks):", err.message)
    redisConnected = false
  })

  redis.on("connect", () => {
    console.log("Redis connected")
    redisConnected = true
  })

  redis.on("ready", () => {
    redisConnected = true
  })

  redis.on("close", () => {
    redisConnected = false
  })

  // Attempt to connect, but don't block if it fails
  redis.connect().catch(() => {
    console.warn("Redis not available - running without distributed locks")
    redisConnected = false
  })
} catch (err) {
  console.warn("Redis initialization failed - running without distributed locks:", err.message)
  redisConnected = false
}

// Export a wrapper that checks connection status
export default {
  get client() {
    return redis
  },
  get isConnected() {
    return redisConnected && redis && redis.status === "ready"
  },
  async set(...args) {
    if (!this.isConnected) throw new Error("Redis not connected")
    return redis.set(...args)
  },
  async eval(...args) {
    if (!this.isConnected) throw new Error("Redis not connected")
    return redis.eval(...args)
  }
}
