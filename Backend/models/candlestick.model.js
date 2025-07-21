// models/CandlestickData.js
import mongoose from "mongoose";

const candleSchema = new mongoose.Schema({
  symbol: String,
  interval: String,
  timestamp: Date,
  open: Number,
  high: Number,
  low: Number,
  close: Number,
  volume: Number,
});

export default mongoose.model("CandlestickData", candleSchema);
