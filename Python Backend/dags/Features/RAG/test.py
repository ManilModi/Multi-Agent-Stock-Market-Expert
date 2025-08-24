from chromadb import PersistentClient

# Connect to your persistent DB
client = PersistentClient(path="company_db")

# Create or get the collection
collection = client.get_or_create_collection("company_docs")

# Example documents
documents = [
    "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories.",
    "Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide."
]

# Insert documents with IDs
collection.add(
    documents=documents,
    ids=["doc1", "doc2"]
)

print("✅ Documents added!")

# --- Verification step ---
print("📊 Number of stored documents:", collection.count())

# Fetch back the documents to confirm
stored_docs = collection.get()
print("\n🔎 Stored IDs:", stored_docs["ids"])
print("🔎 Stored Documents:", stored_docs["documents"])
