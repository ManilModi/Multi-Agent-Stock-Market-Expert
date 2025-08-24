# rag_config.py
import os
from dotenv import load_dotenv

load_dotenv()

config = {
    "llm": {
        "provider": "groq",
        "config": {
             "model":"openai/gpt-oss-120b",   # OSS LLM served via Groq
            "api_key": os.getenv("GROQ_API_KEY"),
        }
    },
    "embedding_model": {
        "provider": "huggingface",
        "config": {
            "model": "sentence-transformers/all-MiniLM-L6-v2"  # local & free
        }
    },
    "vectordb": {
    "provider": "chroma",
    "config": {
        "collection_name": "company_docs",
        "dir": "company_db"
    }
},

    
    "chunker": {
        "chunk_size": 400,
        "chunk_overlap": 100,
        "length_function": "len",
        "min_chunk_size": 0,
    }
}
