// models/Report.js
import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recommendations: [String],
  generatedAt: { type: Date, default: Date.now },
  content: String,
});

export default mongoose.model("Report", reportSchema);
