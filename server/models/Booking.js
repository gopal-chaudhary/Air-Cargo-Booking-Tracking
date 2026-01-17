import { Schema, model } from "mongoose"


const eventSchema = new Schema({
    type: String,
    location: String,
    flightInfo: Object,
    timestamp: { type: Date, default: Date.now }
})


const bookingSchema = new Schema({
    ref_id: { type: String, unique: true, index: true },
    origin: String,
    destination: String,
    pieces: { type: Number, required: true },
    weight_kg: { type: Number, required: true },
    status: {
        type: String,
        enum: ["BOOKED", "DEPARTED", "ARRIVED", "DELIVERED", "CANCELLED"],
        default: "BOOKED",
        index: true
    },
    flightIds: [{ type: String }],
    events: [eventSchema]
}, { timestamps: true })


export default model("Booking", bookingSchema)