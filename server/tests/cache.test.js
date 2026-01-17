import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import * as cache from '../utils/cache.js'
import redis from '../config/redis.js'

jest.mock('../config/redis.js')
jest.mock('../utils/logger.js', () => ({
  default: {
    debug: jest.fn(),
    warn: jest.fn()
  }
}))

describe('Cache Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getCache', () => {
    it('should return cached value when Redis is connected', async () => {
      redis.isConnected = true
      const mockValue = { ref_id: 'BK-123', status: 'BOOKED' }
      redis.client = {
        get: jest.fn().mockResolvedValue(JSON.stringify(mockValue))
      }

      const result = await cache.getCache('booking:BK-123')

      expect(result).toEqual(mockValue)
      expect(redis.client.get).toHaveBeenCalledWith('booking:BK-123')
    })

    it('should return null when cache miss', async () => {
      redis.isConnected = true
      redis.client = {
        get: jest.fn().mockResolvedValue(null)
      }

      const result = await cache.getCache('booking:BK-123')

      expect(result).toBeNull()
    })

    it('should return null when Redis is not connected', async () => {
      redis.isConnected = false

      const result = await cache.getCache('booking:BK-123')

      expect(result).toBeNull()
    })
  })

  describe('setCache', () => {
    it('should set cache value when Redis is connected', async () => {
      redis.isConnected = true
      redis.client = {
        setex: jest.fn().mockResolvedValue('OK')
      }

      const value = { ref_id: 'BK-123', status: 'BOOKED' }
      const result = await cache.setCache('booking:BK-123', value, 300)

      expect(result).toBe(true)
      expect(redis.client.setex).toHaveBeenCalledWith(
        'booking:BK-123',
        300,
        JSON.stringify(value)
      )
    })

    it('should return false when Redis is not connected', async () => {
      redis.isConnected = false

      const result = await cache.setCache('booking:BK-123', { data: 'test' })

      expect(result).toBe(false)
    })
  })

  describe('getBookingCacheKey', () => {
    it('should generate correct cache key', () => {
      const key = cache.getBookingCacheKey('BK-12345678')
      expect(key).toBe('booking:BK-12345678')
    })
  })
})
