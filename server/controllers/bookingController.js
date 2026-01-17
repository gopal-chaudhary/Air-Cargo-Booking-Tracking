import Booking from "../models/Booking.js"
import { v4 as uuidv4 } from "uuid"
import { withLock } from "../utils/lock.js"
import logger from "../utils/logger.js"
import { getCache, setCache, deleteCache, getBookingCacheKey } from "../utils/cache.js"

export async function createBooking(req, res) {
  try {
    const { origin, destination, pieces, weight_kg, flightIds } = req.body
    logger.info("Create booking request", { origin, destination, pieces, weight_kg })

    if (!origin || !destination || !pieces || !weight_kg) {
      logger.warn("Create booking validation failed: missing required fields")
      return res.status(400).json({
        error: "origin, destination, pieces, and weight_kg are required"
      })
    }

    // Validate pieces and weight_kg are integers
    if (!Number.isInteger(Number(pieces)) || pieces <= 0) {
      logger.warn("Create booking validation failed: invalid pieces", { pieces })
      return res.status(400).json({
        error: "pieces must be a positive integer"
      })
    }

    if (!Number.isInteger(Number(weight_kg)) || weight_kg <= 0) {
      logger.warn("Create booking validation failed: invalid weight_kg", { weight_kg })
      return res.status(400).json({
        error: "weight_kg must be a positive integer"
      })
    }

    const ref_id = "BK-" + uuidv4().slice(0, 8)
    logger.debug("Generated booking ref_id", { ref_id })

    const booking = await Booking.create({
      ref_id,
      origin,
      destination,
      pieces: Number(pieces),
      weight_kg: Number(weight_kg),
      status: "BOOKED",
      flightIds: flightIds || [],
      events: [
        {
          type: "BOOKED",
          location: origin
        }
      ]
    })

    // Verify booking was saved by fetching it
    const savedBooking = await Booking.findOne({ ref_id })
    if (!savedBooking) {
      logger.error("Booking created but not found in database", { ref_id })
      throw new Error("Failed to save booking to database")
    }

    logger.info("Booking created and verified in database", { 
      ref_id, 
      origin, 
      destination,
      _id: savedBooking._id 
    })
    return res.status(201).json(savedBooking)
  } catch (err) {
    logger.error("Create booking error", { error: err.message, stack: err.stack })
    return res.status(500).json({ error: "Internal server error" })
  }
}

export async function departBooking(req, res) {
  try {
    const { ref_id } = req.params
    const { location, flightInfo } = req.body
    logger.info("Depart booking request", { ref_id, location, flightInfo })

    const booking = await withLock(ref_id, async () => {
      const booking = await Booking.findOne({ ref_id })
      if (!booking) {
        logger.warn("Depart booking: booking not found", { ref_id })
        throw new Error("NOT_FOUND")
      }

      if (booking.status === "CANCELLED") {
        logger.warn("Depart booking: attempt to depart cancelled booking", { ref_id, status: booking.status })
        throw new Error("CANCELLED")
      }

      booking.status = "DEPARTED"
      booking.events.push({
        type: "DEPARTED",
        location,
        flightInfo
      })

      await booking.save()
      
      // Invalidate cache
      await deleteCache(getBookingCacheKey(ref_id))
      
      logger.info("Booking departed successfully", { ref_id, location })
      return booking
    })

    return res.json(booking)
  } catch (err) {
    logger.error("Depart booking error", { ref_id: req.params.ref_id, error: err.message, stack: err.stack })
    if (err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Booking not found" })
    }
    if (err.message === "CANCELLED") {
      return res.status(400).json({
        error: "Cancelled booking cannot be departed"
      })
    }
    if (err.message.includes("Could not acquire lock")) {
      return res.status(409).json({ error: err.message })
    }
    return res.status(500).json({ error: "Internal server error" })
  }
}

export async function arriveBooking(req, res) {
  try {
    const { ref_id } = req.params
    const { location } = req.body
    logger.info("Arrive booking request", { ref_id, location })

    const booking = await withLock(ref_id, async () => {
      const booking = await Booking.findOne({ ref_id })
      if (!booking) {
        logger.warn("Arrive booking: booking not found", { ref_id })
        throw new Error("NOT_FOUND")
      }

      if (booking.status === "CANCELLED") {
        logger.warn("Arrive booking: attempt to arrive cancelled booking", { ref_id, status: booking.status })
        throw new Error("CANCELLED")
      }

      booking.status = "ARRIVED"
      booking.events.push({
        type: "ARRIVED",
        location
      })

      await booking.save()
      
      // Invalidate cache
      await deleteCache(getBookingCacheKey(ref_id))
      
      logger.info("Booking arrived successfully", { ref_id, location })
      return booking
    })

    return res.json(booking)
  } catch (err) {
    logger.error("Arrive booking error", { ref_id: req.params.ref_id, error: err.message, stack: err.stack })
    if (err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Booking not found" })
    }
    if (err.message === "CANCELLED") {
      return res.status(400).json({
        error: "Cancelled booking cannot arrive"
      })
    }
    if (err.message.includes("Could not acquire lock")) {
      return res.status(409).json({ error: err.message })
    }
    return res.status(500).json({ error: "Internal server error" })
  }
}

export async function getHistory(req, res) {
  try {
    const { ref_id } = req.params
    logger.info("Get booking history request", { ref_id })

    // Try to get from cache first
    const cacheKey = getBookingCacheKey(ref_id)
    const cached = await getCache(cacheKey)
    if (cached) {
      logger.debug("Returning cached booking", { ref_id })
      return res.json(cached)
    }

    // Query database directly - use lean() for better performance
    const booking = await Booking.findOne({ ref_id })
    if (!booking) {
      logger.warn("Get history: booking not found in database", { ref_id })
      return res.status(404).json({ error: "Booking not found" })
    }

    logger.debug("Booking found in database", { ref_id, status: booking.status, _id: booking._id })

    // Sort events chronologically by timestamp
    const sortedEvents = booking.events.sort((a, b) => {
      return new Date(a.timestamp) - new Date(b.timestamp)
    })

    const response = {
      ref_id: booking.ref_id,
      origin: booking.origin,
      destination: booking.destination,
      pieces: booking.pieces,
      weight_kg: booking.weight_kg,
      status: booking.status,
      flightIds: booking.flightIds,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      events: sortedEvents
    }

    // Cache the response
    await setCache(cacheKey, response)
    logger.debug("Cached booking response", { ref_id })

    return res.json(response)
  } catch (err) {
    logger.error("Get history error", { ref_id: req.params.ref_id, error: err.message, stack: err.stack })
    return res.status(500).json({ error: "Internal server error" })
  }
}

export async function deliverBooking(req, res) {
  try {
    const { ref_id } = req.params
    const { location } = req.body
    logger.info("Deliver booking request", { ref_id, location })

    const booking = await withLock(ref_id, async () => {
      const booking = await Booking.findOne({ ref_id })
      if (!booking) {
        logger.warn("Deliver booking: booking not found", { ref_id })
        throw new Error("NOT_FOUND")
      }

      if (booking.status === "CANCELLED") {
        logger.warn("Deliver booking: attempt to deliver cancelled booking", { ref_id, status: booking.status })
        throw new Error("CANCELLED")
      }

      booking.status = "DELIVERED"
      booking.events.push({
        type: "DELIVERED",
        location: location || booking.destination
      })

      await booking.save()
      
      // Invalidate cache
      await deleteCache(getBookingCacheKey(ref_id))
      
      logger.info("Booking delivered successfully", { ref_id, location: location || booking.destination })
      return booking
    })

    return res.json(booking)
  } catch (err) {
    logger.error("Deliver booking error", { ref_id: req.params.ref_id, error: err.message, stack: err.stack })
    if (err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Booking not found" })
    }
    if (err.message === "CANCELLED") {
      return res.status(400).json({
        error: "Cancelled booking cannot be delivered"
      })
    }
    if (err.message.includes("Could not acquire lock")) {
      return res.status(409).json({ error: err.message })
    }
    return res.status(500).json({ error: "Internal server error" })
  }
}

export async function cancelBooking(req, res) {
  try {
    const { ref_id } = req.params
    logger.info("Cancel booking request", { ref_id })

    const booking = await withLock(ref_id, async () => {
      const booking = await Booking.findOne({ ref_id })
      if (!booking) {
        logger.warn("Cancel booking: booking not found", { ref_id })
        throw new Error("NOT_FOUND")
      }

      if (booking.status === "ARRIVED" || booking.status === "DELIVERED") {
        logger.warn("Cancel booking: attempt to cancel arrived/delivered booking", { ref_id, status: booking.status })
        throw new Error("ALREADY_ARRIVED")
      }

      booking.status = "CANCELLED"
      booking.events.push({
        type: "CANCELLED",
        location: "SYSTEM"
      })

      await booking.save()
      
      // Invalidate cache
      await deleteCache(getBookingCacheKey(ref_id))
      
      logger.info("Booking cancelled successfully", { ref_id })
      return booking
    })

    return res.json(booking)
  } catch (err) {
    logger.error("Cancel booking error", { ref_id: req.params.ref_id, error: err.message, stack: err.stack })
    if (err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Booking not found" })
    }
    if (err.message === "ALREADY_ARRIVED") {
      return res.status(400).json({
        error: "Cannot cancel a booking that has already arrived or been delivered"
      })
    }
    if (err.message.includes("Could not acquire lock")) {
      return res.status(409).json({ error: err.message })
    }
    return res.status(500).json({ error: "Internal server error" })
  }
}

// Helper endpoint to list all bookings (for debugging)
export async function listBookings(req, res) {
  try {
    const { limit = 50, skip = 0 } = req.query
    logger.info("List bookings request", { limit, skip })

    const bookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select('ref_id origin destination status pieces weight_kg createdAt')

    const total = await Booking.countDocuments()

    return res.json({
      total,
      count: bookings.length,
      bookings
    })
  } catch (err) {
    logger.error("List bookings error", { error: err.message, stack: err.stack })
    return res.status(500).json({ error: "Internal server error" })
  }
}
