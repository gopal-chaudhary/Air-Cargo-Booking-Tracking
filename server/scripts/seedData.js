import connectDB from "../config/db.js"
import Flight from "../models/Flight.js"
import Booking from "../models/Booking.js"
import dayjs from "dayjs"

async function seedData() {
  try {
    await connectDB()
    console.log("Connected to database")

    // Clear existing data
    await Flight.deleteMany({})
    await Booking.deleteMany({})
    console.log("Cleared existing data")

    // Get today's date and create flights for the next 7 days
    const today = dayjs()
    const flights = []

    // Direct flights: DEL -> BLR
    for (let day = 0; day < 7; day++) {
      const date = today.add(day, "day")
      
      // DEL -> BLR direct flights (multiple per day)
      flights.push({
        flightId: `FL-DEL-BLR-${day}-1`,
        flightNumber: "AI-201",
        airlineName: "Air India",
        departureTime: date.hour(8).minute(0).toDate(),
        arrivalTime: date.hour(10).minute(30).toDate(),
        origin: "DEL",
        destination: "BLR"
      })

      flights.push({
        flightId: `FL-DEL-BLR-${day}-2`,
        flightNumber: "6E-301",
        airlineName: "IndiGo",
        departureTime: date.hour(14).minute(0).toDate(),
        arrivalTime: date.hour(16).minute(30).toDate(),
        origin: "DEL",
        destination: "BLR"
      })

      flights.push({
        flightId: `FL-DEL-BLR-${day}-3`,
        flightNumber: "SG-401",
        airlineName: "SpiceJet",
        departureTime: date.hour(20).minute(0).toDate(),
        arrivalTime: date.hour(22).minute(30).toDate(),
        origin: "DEL",
        destination: "BLR"
      })

      // DEL -> HYD direct flights
      flights.push({
        flightId: `FL-DEL-HYD-${day}-1`,
        flightNumber: "AI-501",
        airlineName: "Air India",
        departureTime: date.hour(9).minute(0).toDate(),
        arrivalTime: date.hour(11).minute(15).toDate(),
        origin: "DEL",
        destination: "HYD"
      })

      flights.push({
        flightId: `FL-DEL-HYD-${day}-2`,
        flightNumber: "6E-601",
        airlineName: "IndiGo",
        departureTime: date.hour(15).minute(30).toDate(),
        arrivalTime: date.hour(17).minute(45).toDate(),
        origin: "DEL",
        destination: "HYD"
      })

      // HYD -> BLR direct flights (for transit routes)
      flights.push({
        flightId: `FL-HYD-BLR-${day}-1`,
        flightNumber: "AI-701",
        airlineName: "Air India",
        departureTime: date.hour(12).minute(0).toDate(),
        arrivalTime: date.hour(13).minute(15).toDate(),
        origin: "HYD",
        destination: "BLR"
      })

      flights.push({
        flightId: `FL-HYD-BLR-${day}-2`,
        flightNumber: "6E-801",
        airlineName: "IndiGo",
        departureTime: date.hour(18).minute(30).toDate(),
        arrivalTime: date.hour(19).minute(45).toDate(),
        origin: "HYD",
        destination: "BLR"
      })

      // HYD -> BLR next day flights (for transit routes)
      flights.push({
        flightId: `FL-HYD-BLR-${day}-3`,
        flightNumber: "SG-901",
        airlineName: "SpiceJet",
        departureTime: date.add(1, "day").hour(8).minute(0).toDate(),
        arrivalTime: date.add(1, "day").hour(9).minute(15).toDate(),
        origin: "HYD",
        destination: "BLR"
      })

      // MUM -> BLR direct flights
      flights.push({
        flightId: `FL-MUM-BLR-${day}-1`,
        flightNumber: "AI-1001",
        airlineName: "Air India",
        departureTime: date.hour(10).minute(0).toDate(),
        arrivalTime: date.hour(11).minute(30).toDate(),
        origin: "MUM",
        destination: "BLR"
      })

      // DEL -> MUM direct flights
      flights.push({
        flightId: `FL-DEL-MUM-${day}-1`,
        flightNumber: "6E-1101",
        airlineName: "IndiGo",
        departureTime: date.hour(7).minute(0).toDate(),
        arrivalTime: date.hour(9).minute(15).toDate(),
        origin: "DEL",
        destination: "MUM"
      })
    }

    // Insert flights
    await Flight.insertMany(flights)
    console.log(`Inserted ${flights.length} flights`)

    // Create sample bookings
    const bookings = [
      {
        ref_id: "BK-00000001",
        origin: "DEL",
        destination: "BLR",
        pieces: 2,
        weight_kg: 15,
        status: "BOOKED",
        flightIds: ["FL-DEL-BLR-0-1"],
        events: [
          {
            type: "BOOKED",
            location: "DEL",
            timestamp: today.subtract(2, "hours").toDate()
          }
        ]
      },
      {
        ref_id: "BK-00000002",
        origin: "DEL",
        destination: "BLR",
        pieces: 5,
        weight_kg: 45,
        status: "DEPARTED",
        flightIds: ["FL-DEL-BLR-0-2"],
        events: [
          {
            type: "BOOKED",
            location: "DEL",
            timestamp: today.subtract(5, "hours").toDate()
          },
          {
            type: "DEPARTED",
            location: "DEL",
            flightInfo: {
              flightNumber: "6E-301",
              flightId: "FL-DEL-BLR-0-2"
            },
            timestamp: today.subtract(1, "hour").toDate()
          }
        ]
      },
      {
        ref_id: "BK-00000003",
        origin: "DEL",
        destination: "BLR",
        pieces: 1,
        weight_kg: 8,
        status: "ARRIVED",
        flightIds: ["FL-DEL-BLR-0-3"],
        events: [
          {
            type: "BOOKED",
            location: "DEL",
            timestamp: today.subtract(1, "day").toDate()
          },
          {
            type: "DEPARTED",
            location: "DEL",
            flightInfo: {
              flightNumber: "SG-401",
              flightId: "FL-DEL-BLR-0-3"
            },
            timestamp: today.subtract(1, "day").hour(20).toDate()
          },
          {
            type: "ARRIVED",
            location: "BLR",
            timestamp: today.subtract(1, "day").hour(22).minute(30).toDate()
          }
        ]
      },
      {
        ref_id: "BK-00000004",
        origin: "DEL",
        destination: "BLR",
        pieces: 3,
        weight_kg: 25,
        status: "DELIVERED",
        flightIds: ["FL-DEL-BLR-0-1"],
        events: [
          {
            type: "BOOKED",
            location: "DEL",
            timestamp: today.subtract(2, "days").toDate()
          },
          {
            type: "DEPARTED",
            location: "DEL",
            flightInfo: {
              flightNumber: "AI-201",
              flightId: "FL-DEL-BLR-0-1"
            },
            timestamp: today.subtract(2, "days").hour(8).toDate()
          },
          {
            type: "ARRIVED",
            location: "BLR",
            timestamp: today.subtract(2, "days").hour(10).minute(30).toDate()
          },
          {
            type: "DELIVERED",
            location: "BLR",
            timestamp: today.subtract(2, "days").hour(12).toDate()
          }
        ]
      },
      {
        ref_id: "BK-00000005",
        origin: "DEL",
        destination: "BLR",
        pieces: 4,
        weight_kg: 30,
        status: "CANCELLED",
        flightIds: [],
        events: [
          {
            type: "BOOKED",
            location: "DEL",
            timestamp: today.subtract(3, "hours").toDate()
          },
          {
            type: "CANCELLED",
            location: "SYSTEM",
            timestamp: today.subtract(1, "hour").toDate()
          }
        ]
      },
      {
        ref_id: "BK-00000006",
        origin: "DEL",
        destination: "HYD",
        pieces: 2,
        weight_kg: 12,
        status: "BOOKED",
        flightIds: ["FL-DEL-HYD-0-1"],
        events: [
          {
            type: "BOOKED",
            location: "DEL",
            timestamp: today.subtract(30, "minutes").toDate()
          }
        ]
      }
    ]

    await Booking.insertMany(bookings)
    console.log(`Inserted ${bookings.length} sample bookings`)

    console.log("\n✅ Seed data created successfully!")
    console.log("\nSample bookings:")
    bookings.forEach(b => {
      console.log(`  - ${b.ref_id}: ${b.origin} -> ${b.destination} (${b.status})`)
    })
    
    console.log("\nFlights available for:")
    console.log("  - DEL -> BLR (direct)")
    console.log("  - DEL -> HYD (direct)")
    console.log("  - HYD -> BLR (direct, for transit routes)")
    console.log("  - DEL -> MUM (direct)")
    console.log("  - MUM -> BLR (direct)")
    console.log("\nTry: GET /api/flights/route?origin=DEL&destination=BLR&departure_date=" + today.format("YYYY-MM-DD"))

    process.exit(0)
  } catch (err) {
    console.error("Error seeding data:", err)
    process.exit(1)
  }
}

seedData()
