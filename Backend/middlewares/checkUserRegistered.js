import User from "../models/users.model.js";

export const checkUserRegistered = async (req, res, next) => {
  try {
    const userId = req.auth.userId;

    // Check in your MongoDB if the Clerk user is registered
    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return res.status(403).json({
        error: "Access denied. You must complete registration before logging in.",
      });
    }

    // Optional: update last login timestamp
    user.lastLogin = Date.now();
    await user.save();

    next(); // Proceed if user exists
  } catch (err) {
    console.error("User check failed:", err);
    return res.status(500).json({ error: "Server error validating user." });
  }
};
