import { Router } from "express"
import { getRoute } from "../controllers/flightController.js"

const router = Router()

router.get("/route", getRoute)

export default router
