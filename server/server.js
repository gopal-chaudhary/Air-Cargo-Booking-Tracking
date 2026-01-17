import app from "./app.js"
import connectDB from "./config/db.js"
import logger from "./utils/logger.js"

// Connect to database before starting server
async function startServer() {
  try {
    // Wait for database connection
    await connectDB()
    
    // Start server
    const PORT = process.env.PORT || 3000
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`)
      console.log(`Server running on port ${PORT}`)
    })
  } catch (err) {
    logger.error("Failed to start server", { error: err.message, stack: err.stack })
    console.error("Failed to start server:", err)
    process.exit(1)
  }
}

startServer()