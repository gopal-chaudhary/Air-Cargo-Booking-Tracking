import { Schema, model } from "mongoose"


const flightSchema = new Schema({
    flightId: { type: String, unique: true, index: true },
    flightNumber: { type: String, index: true },
    airlineName: String,
    departureTime: { type: Date, index: true },
    arrivalTime: Date,
    origin: { type: String, index: true },
    destination: { type: String, index: true }
})

// Compound index for route queries
flightSchema.index({ origin: 1, destination: 1, departureTime: 1 })


export default model("Flight", flightSchema)