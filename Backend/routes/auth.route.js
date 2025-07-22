import express from "express";
import { requireAuth } from "../middlewares/requireAuth.middleware.js";
import User from "../models/users.model.js";
import { clerkClient } from '@clerk/clerk-sdk-node';

const router = express.Router();


router.post("/register", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;

    const user = await clerkClient.users.getUser(userId);
    const email = user.emailAddresses[0]?.emailAddress;
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();

    if (!userId || !email || !fullName) {
      console.log("Missing Clerk Fields (After SDK):", { userId, email, fullName });
      return res.status(400).json({ error: "Incomplete user information from Clerk." });
    }

    const existingUser = await User.findOne({ clerkId: userId });
    if (existingUser) {
      return res.status(409).json({ error: "User already registered." });
    }

    const { role } = req.body;

    const newUser = new User({
      clerkId: userId,
      email,
      name: fullName,
      role,
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully", user: newUser });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
  

export default router;
