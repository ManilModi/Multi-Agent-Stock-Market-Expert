// controllers/auth.controller.js
import { clerkClient } from "@clerk/clerk-sdk-node"
import User from "../models/users.model.js"



export const registerUser = async (req, res) => {
  try {
    const userId = req.auth.userId;

    // Get Clerk user
    const clerkUser = await clerkClient.users.getUser(userId);
    const email = clerkUser.emailAddresses[0]?.emailAddress;
    const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();
    const { role } = req.body;
    console.log("Registering user:", { userId, email, name, role });

    // if (!role) {
    //   return res.status(400).json({ error: "Role is required for registration." });
    // }

    // Check if user already exists in DB
    const existingUser = await User.findOne({ clerkId: userId });
    console.log("Existing user found:", existingUser);

    if (existingUser) {
      if (existingUser.role !== role) {
        console.error("User already registered with a different role:", existingUser.role);
        return res.status(403).json({
          error: `User already registered with role '${existingUser.role}'. Cannot re-register as '${role}'.`,
        });
      } else {
        // return res.status(400).json({ error: "User is already registered with this role." });
      }
    }

    // Create new user entry
    const newUser = new User({
      clerkId: userId,
      name,
      email,
      role,
      lastLogin: Date.now(),
    });

    await newUser.save();

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });

  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ error: "Internal server error during registration." });
  }
};


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
