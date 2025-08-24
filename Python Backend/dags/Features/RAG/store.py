import cloudinary
import cloudinary.api
from dotenv import load_dotenv
import os

load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

def list_files_from_folder(folder_name: str):
    response = cloudinary.api.resources(
        type="upload",
        prefix=f"{folder_name}/",   # ensure trailing slash
        resource_type="raw",        # PDFs/CSVs/docs should stay "raw"
        max_results=500
    )
    
    files = []
    for r in response.get("resources", []):
        # Construct direct URL for each file
        file_url = f"https://res.cloudinary.com/{cloudinary.config().cloud_name}/raw/upload/{r['public_id']}"
        files.append(file_url)
    
    return files


# Folders to fetch
folders = ["indian_stock_news", "ratios", "balance_sheets", "candlestick_patterns", "reports"]

for folder in folders:
    files = list_files_from_folder(folder)
    print(f"\n📂 {folder} - {len(files)} files")
    for f in files:
        print(f)
