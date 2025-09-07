#!/usr/bin/env python3
"""
02_csv_ingest_embed.py

- Loads manifest.json produced by 01_cloudinary_fetcher.py
- For each file listed in manifest:
    - Parse filename to extract company name + doc type
    - Load CSV rows into text chunks
    - Add metadata (company, doc_type, filename, row_index)
- Embeds chunks using a local sentence-transformer
- Stores them into a ChromaDB collection

Usage:
    python ingestion/02_csv_ingest_embed.py --persist
    python ingestion/02_csv_ingest_embed.py --reset --persist

Dependencies:
    pip install chromadb sentence-transformers pandas
"""

import os
import json
import argparse
from pathlib import Path
from typing import Dict, Any, List

import pandas as pd
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings

# -------- CONFIG --------
DATA_DIR = Path("data")
RAW_DIR = DATA_DIR / "raw"   # where actual csv files live
MANIFEST_PATH = DATA_DIR / "manifest.json"
CHROMA_DIR = DATA_DIR / "chroma"

COLLECTION_NAME = "stock_data"
EMBED_MODEL_NAME = "all-MiniLM-L6-v2"

# Initialize Chroma client
chroma_client = chromadb.PersistentClient(
    path="vector_store"  # this is where embeddings will be saved
)

# Initialize SentenceTransformer model
model = SentenceTransformer(EMBED_MODEL_NAME)


# -------- Helpers --------
def load_manifest() -> Dict[str, Any]:
    if not MANIFEST_PATH.exists():
        raise FileNotFoundError(f"manifest.json not found: {MANIFEST_PATH}")
    with MANIFEST_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def parse_filename(filename: str) -> Dict[str, str]:
    """
    Example: 'reliance_candlesticks.csv' -> company='reliance', doc_type='candlesticks'
    """
    name = Path(filename).stem
    parts = name.split("_", 1)
    if len(parts) == 2:
        company, doc_type = parts
    else:
        company, doc_type = parts[0], "unknown"
    return {"company": company.lower(), "doc_type": doc_type.lower()}


def normalize_path(file_path: str) -> str:
    """
    Fix manifest paths so they match actual nested structure under data/raw/.
    """
    # remove accidental double .csv
    if file_path.endswith(".csv.csv"):
        file_path = file_path[:-4]

    # already exists → return
    if os.path.exists(file_path):
        return file_path

    # search inside data/raw/*/*
    for root, _, files in os.walk(RAW_DIR):
        if os.path.basename(file_path) in files:
            return os.path.join(root, os.path.basename(file_path))

    return file_path  # last fallback


def csv_to_chunks(file_path: str, company: str, doc_type: str, chunk_size: int = 500) -> List[Dict[str, Any]]:
    try:
        if os.path.getsize(file_path) == 0:  # quick check for empty file
            print(f"[skip] {file_path} is empty, skipping...")
            return []

        df = pd.read_csv(file_path)

        if df.empty:
            print(f"[skip] {file_path} has no rows, skipping...")
            return []

        # Convert dataframe to string chunks
        text = df.to_csv(index=False)
        chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]

        docs = [
            {
                "id": f"{company}_{doc_type}_{i}",
                "text": chunk,
                "metadata": {
                    "company": company,
                    "doc_type": doc_type,
                    "source": os.path.basename(file_path),
                    "row_index": i
                }
            }
            for i, chunk in enumerate(chunks)
        ]
        return docs

    except pd.errors.EmptyDataError:
        print(f"[error] {file_path} has no columns to parse, skipping...")
        return []
    except Exception as e:
        print(f"[error] Failed to read {file_path}: {e}")
        return []


def run(reset=False, persist=False):
    if reset:
        print("[db] resetting collection...")
        try:
            chroma_client.delete_collection(name=COLLECTION_NAME)
        except Exception:
            pass  # if it doesn’t exist yet

    collection = chroma_client.get_or_create_collection(COLLECTION_NAME)

    manifest = load_manifest()
    files = manifest.get("files", [])

    if not files:
        print("[warn] No files listed in manifest.json.")
        return

    all_chunks = []
    for file_path in files:
        file_path = normalize_path(file_path)

        if not os.path.exists(file_path):
            print(f"[skip] file not found: {file_path}")
            continue

        filename = os.path.basename(file_path)
        meta = parse_filename(filename)

        company = meta["company"]
        doc_type = meta["doc_type"]

        print(f"[ingest] {file_path} (company={company}, doc_type={doc_type})")
        chunks = csv_to_chunks(file_path, company, doc_type)
        all_chunks.extend(chunks)

    if not all_chunks:
        print("[warn] No chunks to insert.")
        return

    # Split into batches (<= 5000 to avoid chroma error)
    BATCH_SIZE = 5000
    for i in range(0, len(all_chunks), BATCH_SIZE):
        batch = all_chunks[i:i+BATCH_SIZE]

        ids = [c["id"] for c in batch]
        texts = [c["text"] for c in batch]
        metadatas = [c["metadata"] for c in batch]

        embeddings = model.encode(texts).tolist()

        print(f"[db] upserting batch {i//BATCH_SIZE + 1} with {len(batch)} chunks...")
        collection.upsert(
            ids=ids,
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas,
        )


# -------- CLI --------
def parse_args():
    ap = argparse.ArgumentParser()
    ap.add_argument("--reset", action="store_true", help="Delete existing Chroma collection first")
    ap.add_argument("--persist", action="store_true", help="Use persistent Chroma at ./data/chroma/")
    return ap.parse_args()


def main():
    args = parse_args()
    run(reset=args.reset, persist=args.persist)


if __name__ == "__main__":
    main()
