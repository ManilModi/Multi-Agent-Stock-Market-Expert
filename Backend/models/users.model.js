// models/users.model.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  role: {
    type: String,
    enum: ["investor", "broker", "company"],
    required: true,
    immutable: true
  },
  name: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastLogin: {
    type: Date,
    default: null,
  }
});

export default mongoose.model("User", userSchema);
