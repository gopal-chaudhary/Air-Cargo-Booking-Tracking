import express from "express"
import cors from "cors"
import connectDB from "./config/db.js"
import logger from "./utils/logger.js"

import flightRoutes from "./routes/flightRoutes.js"
import bookingRoutes from "./routes/bookingRoutes.js"
import { healthCheck, metrics } from "./controllers/healthController.js"

const app = express()

// Database connection will be handled in server.js
// connectDB() is called there to ensure connection before server starts

// CORS configuration - allow all origins in development
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.CLIENT_URL || "http://localhost:5173")
    : true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip
  })
  next()
})

// Health check endpoints
app.get("/health", healthCheck)
app.get("/metrics", metrics)


app.use("/api/flights", flightRoutes)
app.use("/api/bookings", bookingRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error("Unhandled error", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  })
  res.status(500).json({ error: "Internal server error" })
})

export default app
