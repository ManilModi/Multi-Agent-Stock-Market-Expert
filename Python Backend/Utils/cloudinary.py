import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

def upload_csv_to_cloudinary(file_path: str, folder: str = "stock_tools_data") -> str:
    try:
        response = cloudinary.uploader.upload_large(
            file_path,
            resource_type="raw",
            folder=folder,
            public_id=os.path.basename(file_path).replace(".csv", ""),
            overwrite=True
        )
        return response.get("secure_url", "❌ Upload failed")
    except Exception as e:
        return f"❌ Error uploading to Cloudinary: {str(e)}"
