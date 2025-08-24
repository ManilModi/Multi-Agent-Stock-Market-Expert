import cloudinary
import cloudinary.api
import os
import tempfile
import requests
import fitz  # PyMuPDF for PDFs
import pandas as pd
from crewai_tools import RagTool
from dotenv import load_dotenv
from rag_config import config  # ✅ shared config
from chromadb import PersistentClient

# ----------------------------
# Load environment variables
# ----------------------------
load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

# ----------------------------
# CrewAI RAG Tool
# ----------------------------
rag_tool = RagTool(config=config, summarize=True)

# ----------------------------
# Helper: extract company name
# ----------------------------
def get_company_name(filename: str) -> str:
    base = os.path.basename(filename)
    name = os.path.splitext(base)[0]
    return name.replace("_", " ").replace("-", " ").title()

# ----------------------------
# Helper: extract text from file
# ----------------------------
def extract_text_from_file(file_path: str) -> str:
    if file_path.endswith(".pdf"):
        text = ""
        doc = fitz.open(file_path)
        for page in doc:
            text += page.get_text()
        return text

    elif file_path.endswith(".csv"):
        try:
            if os.path.getsize(file_path) == 0:
                print(f"⚠️ Skipping empty CSV: {file_path}")
                return ""
            df = pd.read_csv(file_path)
            return df.to_string()
        except Exception as e:
            print(f"⚠️ Failed to parse CSV {file_path}: {e}")
            return ""

    else:
        return ""


# ----------------------------
# Process one Cloudinary folder
# ----------------------------
def process_cloudinary_folder(folder_name: str):
    resources = cloudinary.api.resources(
        type="upload",
        prefix=f"{folder_name}/",   # ensure folder path
        resource_type="raw",
        max_results=500
    )

    for res in resources.get("resources", []):
        url = res["secure_url"]
        filename = res["public_id"].split("/")[-1]

        # Add extension only if format exists
        file_format = res.get("format")
        if file_format:
            filename += f".{file_format}"


        print(f"📂 Downloading {filename} from Cloudinary...")

        # Download file
        tmp_path = os.path.join(tempfile.gettempdir(), filename)
        r = requests.get(url)
        with open(tmp_path, "wb") as f:
            f.write(r.content)

        # Extract text
        company_name = get_company_name(filename)
        extracted_text = extract_text_from_file(tmp_path)

        if extracted_text.strip():
            final_text = f"Company: {company_name}\n\n{extracted_text}"

            # Push into CrewAI RAG
            rag_tool.add(final_text)
            print(f"✅ Inserted {filename} into RAG DB.")
        else:
            print(f"⚠️ No extractable text in {filename}")

# ----------------------------
# Verify RAG DB content
# ----------------------------
def check_rag_db():
    client = PersistentClient(path="company_db")
    collection = client.get_or_create_collection("my-collection")
    print("\n📊 RAG DB Document Count:", collection.count())
    if collection.count() > 0:
        docs = collection.get()
        print("🔎 Example Stored IDs:", docs["ids"][:5])
    else:
        print("⚠️ No documents stored!")

# ----------------------------
# Main pipeline
# ----------------------------
if __name__ == "__main__":
    folders = ["indian_stock_news", "ratios", "balance_sheets", "candlestick_patterns", "reports"]

    for folder in folders:
        print(f"\n🚀 Processing folder: {folder}")
        process_cloudinary_folder(folder)

    # ✅ Check if documents are in DB
    check_rag_db()
    print("\n✅ Finished feeding all data into RAG DB.")
