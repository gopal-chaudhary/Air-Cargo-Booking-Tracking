import { Router } from "express"
import * as ctrl from "../controllers/bookingController.js"

const router = Router()

router.post("/", ctrl.createBooking)
router.get("/", ctrl.listBookings) // List all bookings (for debugging)
router.post("/:ref_id/depart", ctrl.departBooking)
router.post("/:ref_id/arrive", ctrl.arriveBooking)
router.post("/:ref_id/deliver", ctrl.deliverBooking)
router.get("/:ref_id", ctrl.getHistory)
router.post("/:ref_id/cancel", ctrl.cancelBooking)

export default router
