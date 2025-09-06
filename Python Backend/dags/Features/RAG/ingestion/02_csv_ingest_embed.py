#!/usr/bin/env python3
"""
02_csv_ingest_embed.py

- Loads manifest.json produced by 01_cloudinary_fetcher.py
- For each file:
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
import re
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
MANIFEST_PATH = DATA_DIR / "manifest.json"
CHROMA_DIR = DATA_DIR / "chroma"

COLLECTION_NAME = "stock_research"

EMBED_MODEL_NAME = "all-MiniLM-L6-v2"  

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



def csv_to_chunks(file_path, company, doc_type, chunk_size=500):
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
                "metadata": {   # ✅ added metadata
                    "company": company,
                    "doc_type": doc_type,
                    "source": os.path.basename(file_path)
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


# -------- Main pipeline --------
def run(reset: bool = False, persist: bool = True):
    manifest = load_manifest()

    # Init embedder
    print("[embed] loading sentence-transformer...")
    embedder = SentenceTransformer(EMBED_MODEL_NAME)

    # Init Chroma client
    print("[db] initializing Chroma...")
    client = chromadb.PersistentClient(path=str(CHROMA_DIR)) if persist else chromadb.Client(Settings())

    if reset:
        try:
            client.delete_collection(COLLECTION_NAME)
            print(f"[db] existing collection {COLLECTION_NAME} deleted.")
        except Exception:
            pass

    collection = client.get_or_create_collection(name=COLLECTION_NAME)

    # Gather chunks
    all_chunks = []
    for file_entry in manifest["files"].values():
        local_path = file_entry.get("local_path")
        if not local_path:
            print(f"[skip] {file_entry['filename']} (no local_path)")
            continue
        meta = parse_filename(file_entry["filename"])
        company, doc_type = meta["company"], meta["doc_type"]
        file_path = Path(local_path)
        if not file_path.exists():
            print(f"[missing] {file_path}")
            continue
        print(f"[ingest] {file_path} (company={company}, doc_type={doc_type})")
        chunks = csv_to_chunks(file_path, company, doc_type)
        all_chunks.extend(chunks)

    print(f"[ingest] total chunks to embed: {len(all_chunks)}")

    # Embed + upsert
    texts = [c["text"] for c in all_chunks]
    ids = [c["id"] for c in all_chunks]
    metadatas = [c["metadata"] for c in all_chunks]

    embeddings = embedder.encode(texts, convert_to_numpy=True).tolist()

    collection.upsert(
        documents=texts,
        ids=ids,
        embeddings=embeddings,
        metadatas=metadatas
    )

    print(f"[db] upserted {len(all_chunks)} chunks into collection '{COLLECTION_NAME}'.")

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
