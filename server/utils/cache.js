import redis from "../config/redis.js"
import logger from "./logger.js"

const CACHE_TTL = 300 // 5 minutes in seconds

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} Cached value or null
 */
export async function getCache(key) {
  if (!redis.isConnected) {
    return null
  }

  try {
    const cached = await redis.client.get(key)
    if (cached) {
      logger.debug(`Cache hit: ${key}`)
      return JSON.parse(cached)
    }
    logger.debug(`Cache miss: ${key}`)
    return null
  } catch (err) {
    logger.warn(`Cache get error for key ${key}:`, { error: err.message })
    return null
  }
}

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds (default: CACHE_TTL)
 * @returns {Promise<boolean>} Success status
 */
export async function setCache(key, value, ttl = CACHE_TTL) {
  if (!redis.isConnected) {
    return false
  }

  try {
    await redis.client.setex(key, ttl, JSON.stringify(value))
    logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`)
    return true
  } catch (err) {
    logger.warn(`Cache set error for key ${key}:`, { error: err.message })
    return false
  }
}

/**
 * Delete value from cache
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Success status
 */
export async function deleteCache(key) {
  if (!redis.isConnected) {
    return false
  }

  try {
    await redis.client.del(key)
    logger.debug(`Cache delete: ${key}`)
    return true
  } catch (err) {
    logger.warn(`Cache delete error for key ${key}:`, { error: err.message })
    return false
  }
}

/**
 * Generate cache key for booking
 * @param {string} refId - Booking reference ID
 * @returns {string} Cache key
 */
export function getBookingCacheKey(refId) {
  return `booking:${refId}`
}
