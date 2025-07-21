// models/Ratio.js
import mongoose from "mongoose";

const ratioSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  year: Number,
  peRatio: Number,
  roe: Number,
  debtToEquity: Number,
  currentRatio: Number,
});

export default mongoose.model("Ratio", ratioSchema);
