// models/News.js
import mongoose from "mongoose";

const newsSchema = new mongoose.Schema({
  title: String,
  link: String,
  summary: String,
  publishedAt: Date,
  relatedSymbols: [String]
});

export default mongoose.model("News", newsSchema);
