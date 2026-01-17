import mongoose from "mongoose"
import redis from "../config/redis.js"
import logger from "../utils/logger.js"

export async function healthCheck(req, res) {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      mongodb: "unknown",
      redis: "unknown"
    }
  }

  // Check MongoDB
  try {
    const mongoState = mongoose.connection.readyState
    health.services.mongodb = mongoState === 1 ? "connected" : "disconnected"
  } catch (err) {
    health.services.mongodb = "error"
    logger.error("MongoDB health check failed", { error: err.message })
  }

  // Check Redis
  try {
    health.services.redis = redis.isConnected ? "connected" : "disconnected"
  } catch (err) {
    health.services.redis = "error"
    logger.error("Redis health check failed", { error: err.message })
  }

  // Determine overall status
  const allHealthy = 
    health.services.mongodb === "connected" &&
    (health.services.redis === "connected" || health.services.redis === "disconnected") // Redis is optional

  health.status = allHealthy ? "healthy" : "degraded"

  const statusCode = allHealthy ? 200 : 503
  return res.status(statusCode).json(health)
}

export async function metrics(req, res) {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      process: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      services: {
        mongodb: {
          state: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
          host: mongoose.connection.host,
          name: mongoose.connection.name
        },
        redis: {
          connected: redis.isConnected,
          status: redis.isConnected ? "ready" : "disconnected"
        }
      }
    }

    return res.json(metrics)
  } catch (err) {
    logger.error("Metrics error", { error: err.message })
    return res.status(500).json({ error: "Internal server error" })
  }
}
