// middleware/requireAuth.js
import { ClerkExpressWithAuth } from "@clerk/clerk-sdk-node";
import dotenv from "dotenv";
dotenv.config();

export const requireAuth = ClerkExpressWithAuth({
  audience: process.env.CLERK_JWT_AUDIENCE,
  secretKey: process.env.CLERK_SECRET_KEY,
});
