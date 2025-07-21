// models/BalanceSheet.js
import mongoose from "mongoose";

const balanceSheetSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  year: Number,
  totalAssets: Number,
  totalLiabilities: Number,
  equity: Number,
  revenue: Number,
  profit: Number,
});

export default mongoose.model("BalanceSheet", balanceSheetSchema);
