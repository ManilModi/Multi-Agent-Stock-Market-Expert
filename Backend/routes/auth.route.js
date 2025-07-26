// routes/auth.route.js
import express from "express";
import { requireAuth } from "../middlewares/requireAuth.middleware.js";
import { registerUser, getProfile } from "../controllers/authController.js";
import { checkUserRegistered } from "../middlewares/checkUserRegistered.js";

console.log("entered route");

const router = express.Router();


router.use("/protected", checkUserRegistered, (req, res) => {
  res.json({ message: "You are authorized and registered!", user: req.user });
});

router.post("/register", requireAuth, registerUser);
router.get("/profile", requireAuth, getProfile);

export default router;
