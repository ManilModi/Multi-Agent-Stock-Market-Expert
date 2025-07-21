// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  role: {
    type: String,
    enum: ["Investor", "Broker", "Company"],
    required: true,
  },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("User", userSchema);
