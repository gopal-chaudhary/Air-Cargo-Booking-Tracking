import Flight from "../models/Flight.js"
import dayjs from "dayjs"
import logger from "../utils/logger.js"

export async function getRoute(req, res) {
  try {
    const { origin, destination, departure_date } = req.query
    logger.info("Get route request", { origin, destination, departure_date })

    if (!origin || !destination || !departure_date) {
      logger.warn("Get route validation failed: missing required parameters")
      return res.status(400).json({
        error: "origin, destination, and departure_date are required"
      })
    }

    const start = dayjs(departure_date).startOf("day").toDate()
    const end = dayjs(departure_date).add(1, "day").endOf("day").toDate()

    logger.debug("Querying direct flights", { origin, destination, start, end })
    const directFlights = await Flight.find({
      origin,
      destination,
      departureTime: { $gte: start, $lte: end }
    }).sort({ departureTime: 1 })

    logger.debug("Querying first hop flights", { origin, start, end })
    const firstHop = await Flight.find({
      origin,
      departureTime: { $gte: start, $lte: end }
    }).sort({ departureTime: 1 })

    let transitRoute = null

    for (const f1 of firstHop) {
      // Second hop should depart on same day or next day after first hop arrival
      const secondHopStart = f1.arrivalTime
      const secondHopEnd = dayjs(f1.arrivalTime)
        .add(1, "day")
        .endOf("day")
        .toDate()

      const secondHop = await Flight.findOne({
        origin: f1.destination,
        destination,
        departureTime: {
          $gte: secondHopStart,
          $lte: secondHopEnd
        }
      }).sort({ departureTime: 1 })

      if (secondHop) {
        transitRoute = {
          first: f1,
          second: secondHop
        }
        logger.debug("Found transit route", { 
          firstHop: f1.flightId, 
          secondHop: secondHop.flightId 
        })
        break
      }
    }

    logger.info("Route query completed", { 
      directFlightsCount: directFlights.length,
      hasTransitRoute: transitRoute !== null
    })

    return res.json({
      directFlights,
      transitRoute
    })
  } catch (err) {
    logger.error("Get route error", { 
      origin: req.query.origin,
      destination: req.query.destination,
      error: err.message,
      stack: err.stack
    })
    return res.status(500).json({ error: "Internal server error" })
  }
}
