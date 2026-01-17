import { connect } from "mongoose"
import logger from "../utils/logger.js"

export default async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/aircargo"
    await connect(mongoUri)
    logger.info("MongoDB connected successfully", { uri: mongoUri.replace(/\/\/.*@/, '//***@') })
    console.log("MongoDB connected")
  } catch (err) {
    logger.error("MongoDB connection failed", { error: err.message, stack: err.stack })
    console.error("MongoDB connection error:", err)
    throw err
  }
}