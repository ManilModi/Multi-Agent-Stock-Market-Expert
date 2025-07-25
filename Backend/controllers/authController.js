// controllers/auth.controller.js
import { clerkClient } from "@clerk/clerk-sdk-node"
import User from "../models/users.model.js"

console.log("entered controller")

export const registerUser = async (req, res) => {
  try {
    const userId = req.auth.userId

    const clerkUser = await clerkClient.users.getUser(userId)
    const email = clerkUser.emailAddresses[0]?.emailAddress
    const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim()
    const { role } = req.body
    console.log("Received role:", role);


    if (!userId || !email || !name || !role) {
      return res.status(400).json({ error: "Missing required fields." })
    }

    const existingUser = await User.findOne({ clerkId: userId })
    if (existingUser) {
      return res.status(409).json({ error: "User already registered." })
    }

    const newUser = new User({
      clerkId: userId,
      email,
      name,
      role,
    })

    await newUser.save()

    res.status(201).json({ message: "User registered successfully", user: newUser })
  } catch (err) {
    console.error("Register Error:", err)
    res.status(500).json({ error: "Server error during registration" })
  }
}

export const getProfile = async (req, res) => {
  try {
    const userId = req.auth.userId
    const user = await User.findOne({ clerkId: userId })

    if (!user) {
      return res.status(404).json({ error: "User not found in database" })
    }

    res.status(200).json({
      id: user._id,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
  } catch (err) {
    console.error("Profile fetch error:", err)
    res.status(500).json({ error: "Internal server error" })
  }
}
