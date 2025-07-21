// routes/auth.js
import express from "express";
import User from "../models/users.model.js";
import { requireAuth } from "../middlewares/requireAuth.middleware.js";

const router = express.Router();

router.post("/register", requireAuth, async (req, res) => {
  const { userId, session, user } = req.auth;

  try {
    // Check if user already exists
    let existingUser = await User.findOne({ clerkId: userId });
    if (existingUser) {
      return res.status(200).json({ message: "User already registered", user: existingUser });
    }

    // Clerk provides email & name
    const email = user?.emailAddresses?.[0]?.emailAddress;
    const name = user?.firstName + " " + user?.lastName;

    if (!email || !name) {
      return res.status(400).json({ error: "Incomplete user information from Clerk." });
    }

    // You can ask for 'role' from frontend form separately if needed
    const { role } = req.body;

    const newUser = new User({
      clerkId: userId,
      email,
      name,
      role,
    });

    await newUser.save();

    return res.status(201).json({ message: "User registered", user: newUser });

  } catch (err) {
    console.error("Registration Error:", err);
    return res.status(500).json({ error: "Server error during registration" });
  }
});

export default router;
