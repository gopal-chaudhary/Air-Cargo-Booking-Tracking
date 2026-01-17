import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import Booking from '../models/Booking.js'
import * as bookingController from '../controllers/bookingController.js'

// Mock dependencies
jest.mock('../models/Booking.js')
jest.mock('../utils/lock.js')
jest.mock('../utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}))
jest.mock('../utils/cache.js')

describe('Booking Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createBooking', () => {
    it('should create a booking with valid data', async () => {
      const mockBooking = {
        ref_id: 'BK-12345678',
        origin: 'DEL',
        destination: 'BLR',
        pieces: 2,
        weight_kg: 15,
        status: 'BOOKED',
        flightIds: [],
        events: [{ type: 'BOOKED', location: 'DEL' }]
      }

      Booking.create = jest.fn().mockResolvedValue(mockBooking)

      const req = {
        body: {
          origin: 'DEL',
          destination: 'BLR',
          pieces: 2,
          weight_kg: 15
        }
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      }

      await bookingController.createBooking(req, res)

      expect(Booking.create).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(mockBooking)
    })

    it('should return 400 if required fields are missing', async () => {
      const req = {
        body: {
          origin: 'DEL'
          // missing destination, pieces, weight_kg
        }
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      }

      await bookingController.createBooking(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        error: 'origin, destination, pieces, and weight_kg are required'
      })
    })

    it('should return 400 if pieces is not a positive integer', async () => {
      const req = {
        body: {
          origin: 'DEL',
          destination: 'BLR',
          pieces: -1,
          weight_kg: 15
        }
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      }

      await bookingController.createBooking(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        error: 'pieces must be a positive integer'
      })
    })
  })
})
