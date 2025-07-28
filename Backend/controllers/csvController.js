import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});


export const getCsvFromCloudinary = async (req, res) => {
  const { publicId } = req.params;

  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: "raw"
    });

    const csvUrl = result.secure_url;

    const response = await fetch(csvUrl);
    const csvText = await response.text();

    res.setHeader("Content-Type", "text/csv");
    res.send(csvText);
  } catch (error) {
    console.error("Error fetching CSV:", error);
    res.status(500).json({ error: "Failed to fetch CSV from Cloudinary" });
  }
};
