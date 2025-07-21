// routes/token.js
import express from "express";
import { createToken } from "@clerk/backend";

const router = express.Router();

router.get("/generate-token", async (req, res) => {
  const jwt = await createToken({
    payload: {
      sub: "test_user_id",
    },
    secretKey: process.env.CLERK_SECRET_KEY,
    audience: "http://localhost:5000",
  });

  res.json({ token: jwt });
});

export default router;
