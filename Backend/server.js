import express from "express";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.route.js";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import { config } from "dotenv";

config();
const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on ${PORT}`));
  })
  .catch(err => console.error("MongoDB connection error:", err));
