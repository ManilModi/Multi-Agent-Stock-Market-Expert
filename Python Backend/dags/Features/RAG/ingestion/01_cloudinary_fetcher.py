#!/usr/bin/env python3
"""
01_cloudinary_fetcher.py

- Lists CSV files in configured Cloudinary folders (supports pagination).
- Optionally downloads each CSV into ./data/raw/<folder>/
- Produces ./data/manifest.json containing metadata for each file:
    {
      "files": {
        "<filename.csv>": {
           "public_id": "...",
           "secure_url": "...",
           "folder": "...",
           "local_path": "...",   # only if downloaded
           "etag": "<sha1-of-url>", 
           "downloaded_at": 1680000000
        }, ...
      },
      "generated_at": 1680000000
    }

Usage:
    # list files and print summary
    python ingestion/01_cloudinary_fetcher.py --list

    # download files found in the folders (default)
    python ingestion/01_cloudinary_fetcher.py --download

    # override folders on the CLI
    python ingestion/01_cloudinary_fetcher.py --download --folders stocks/candlesticks stocks/ratios

Requires:
    pip install cloudinary requests

ENV (set in shell or .env loader):
    CLOUDINARY_CLOUD_NAME
    CLOUDINARY_API_KEY
    CLOUDINARY_API_SECRET
"""

import os
import sys
import json
import time
import hashlib
import argparse
from pathlib import Path
from typing import List, Dict, Any
from dotenv import load_dotenv
load_dotenv()


import requests
import cloudinary
import cloudinary.api

# -------- CONFIG --------
DATA_DIR = Path("data")
RAW_DIR = DATA_DIR / "raw"
MANIFEST_PATH = DATA_DIR / "manifest.json"

# Default Cloudinary folders to scan (edit as necessary)
DEFAULT_FOLDERS =["indian_stock_news", "ratios", "balance_sheets", "candlestick_patterns", "reports"]

# Max results per Cloudinary page (max allowed is 500)
PAGE_SIZE = 500

# -------- Helpers --------
def init_cloudinary():
    cloud_name = os.getenv("CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")

    if not (cloud_name and api_key and api_secret):
        raise RuntimeError(
            "Missing Cloudinary credentials. "
            "Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET."
        )

    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True
    )

def sha1(s: str) -> str:
    return hashlib.sha1(s.encode("utf-8")).hexdigest()

def ensure_dirs():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    RAW_DIR.mkdir(parents=True, exist_ok=True)

def load_manifest() -> Dict[str, Any]:
    if not MANIFEST_PATH.exists():
        return {"files": {}, "generated_at": None}
    try:
        with MANIFEST_PATH.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"files": {}, "generated_at": None}

def save_manifest(manifest: Dict[str, Any]):
    manifest["generated_at"] = int(time.time())
    with MANIFEST_PATH.open("w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

# -------- Cloudinary listing & download --------
def list_cloudinary_csvs(folders: List[str]) -> List[Dict[str, Any]]:
    """
    Returns list of dicts:
      { public_id, secure_url, folder, filename }
    Only returns items whose URL ends with .csv (case-insensitive).
    """
    resources = []
    for folder in folders:
        next_cursor = None
        print(f"[cloudinary] scanning folder: {folder}")
        while True:
            resp = cloudinary.api.resources(
                type="upload",
                resource_type="raw",
                prefix=folder,
                max_results=PAGE_SIZE,
                next_cursor=next_cursor or None
            )
            for item in resp.get("resources", []):
                url = item.get("secure_url") or item.get("url")
                public_id = item.get("public_id")
                # If secure_url is missing attempt to build from public_id (not guaranteed)
                if not url and public_id:
                    url = f"https://res.cloudinary.com/{cloudinary.config().cloud_name}/raw/upload/{public_id}"
                if not url:
                    continue
                if url.lower().endswith(".csv"):
                    filename = Path(public_id).name + ".csv"
                    resources.append({
                        "public_id": public_id,
                        "secure_url": url,
                        "folder": folder,
                        "filename": filename,
                    })
            next_cursor = resp.get("next_cursor")
            if not next_cursor:
                break
    return resources

def download_to_local(url: str, folder: Path, filename: str) -> Path:
    """
    Downloads CSV url to folder/filename. Returns Path.
    Uses streaming to avoid loading whole file in memory.
    """
    folder.mkdir(parents=True, exist_ok=True)
    local_path = folder / filename
    tmp_path = folder / (filename + ".tmp")
    with requests.get(url, stream=True, timeout=60) as r:
        r.raise_for_status()
        with tmp_path.open("wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
    tmp_path.replace(local_path)
    return local_path

# -------- Main ingestion-runner --------
def run(folders: List[str], download: bool = True, force_download: bool = False):
    init_cloudinary()
    ensure_dirs()
    manifest = load_manifest()
    found = list_cloudinary_csvs(folders)

    print(f"[info] discovered {len(found)} CSV resources across folders")

    for item in found:
        filename = item["filename"]
        url = item["secure_url"]
        folder = item["folder"]
        key = filename  # unique key in manifest, you can adjust if needed

        etag = sha1(url)
        existing = manifest["files"].get(key)

        # Skip if unchanged
        if existing and existing.get("etag") == etag and not force_download:
            print(f"  ↩ skip (unchanged): {filename}")
            continue

        print(f"  ↗ processing: {filename} (folder={folder})")
        entry = {
            "public_id": item["public_id"],
            "secure_url": url,
            "folder": folder,
            "filename": filename,
            "etag": etag,
            "downloaded_at": None,
            "local_path": None
        }

        if download:
            # create folder per remote folder under data/raw, replace slashes with _
            safe_folder = folder.replace("/", "_")
            out_folder = RAW_DIR / safe_folder
            try:
                local_path = download_to_local(url, out_folder, filename)
                entry["downloaded_at"] = int(time.time())
                entry["local_path"] = str(local_path)
                print(f"    ✓ downloaded -> {local_path}")
            except Exception as e:
                print(f"    ! download failed for {filename}: {e}", file=sys.stderr)
        else:
            print(f"    • metadata-only, no download")

        manifest["files"][key] = entry
        save_manifest(manifest)

    # show summary
    print("\nSummary:")
    print(f"  manifest path: {MANIFEST_PATH.resolve()}")
    print(f"  local raw dir: {RAW_DIR.resolve()}")
    print(f"  total files in manifest: {len(manifest['files'])}")

# -------- CLI --------
def parse_args():
    ap = argparse.ArgumentParser()
    ap.add_argument("--list", action="store_true", help="Only list found CSVs (no download)")
    ap.add_argument("--download", action="store_true", help="Download CSVs (default behavior)")
    ap.add_argument("--folders", nargs="*", help="Override folders to scan")
    ap.add_argument("--force", action="store_true", help="Force re-download even if etag matches")
    return ap.parse_args()

def main():
    args = parse_args()
    folders = args.folders if args.folders else DEFAULT_FOLDERS
    if args.list:
        init_cloudinary()
        found = list_cloudinary_csvs(folders)
        print(json.dumps(found, indent=2))
        return
    # default to download behavior if --download passed or neither flag passed
    download = True if (args.download or not args.list) else False
    run(folders, download=download, force_download=args.force)

if __name__ == "__main__":
    main()
