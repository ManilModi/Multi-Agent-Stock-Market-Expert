// routes/csv.route.js
import express from "express";
import cloudinary from "../Utils/cloudinary.js";
import axios from "axios";

const router = express.Router();

router.get("/csv/:public_id", async (req, res) => {
  const { public_id } = req.params;
  try {
    // Fetch metadata to get the file URL
    const resource = await cloudinary.api.resource(public_id, {
      resource_type: "raw",
    });

    const fileUrl = resource.secure_url;

    // Fetch CSV content from the file URL
    const response = await axios.get(fileUrl);

    res.status(200).send(response.data); // send raw CSV text to frontend
  } catch (err) {
    console.error("Error fetching CSV from Cloudinary:", err.message);
    res.status(500).json({ error: "Failed to fetch CSV from Cloudinary" });
  }
});

export default router; // ✅ this is the correct export
