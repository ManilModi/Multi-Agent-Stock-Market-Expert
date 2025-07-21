// models/ChatMessage.js
import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  role: { type: String, enum: ["user", "assistant"] },
  content: String,
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model("ChatMessage", chatMessageSchema);
