// routes/auth.route.js
import express from "express"
import { requireAuth } from "../middlewares/requireAuth.middleware.js"
import { registerUser, getProfile } from "../controllers/authController.js"

console.log("entered route")

const router = express.Router()

router.post("/register", requireAuth, registerUser)
router.get("/profile", requireAuth, getProfile)

export default router
