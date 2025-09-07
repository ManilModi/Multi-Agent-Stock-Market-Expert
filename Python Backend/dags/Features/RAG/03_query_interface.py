#!/usr/bin/env python3
"""
03_agentic_rag.py

Agentic RAG pipeline:
- LLaMA (Groq) acts as an agent
- It decides whether to use retrieval or not
- Retrieval is powered by Chroma
- Combines reasoning + retrieved context

Dependencies:
    pip install groq chromadb sentence-transformers
"""

import os
import chromadb
from chromadb.config import Settings
from groq import Groq
from dotenv import load_dotenv
load_dotenv()

# -------- CONFIG --------
COLLECTION_NAME = "stock_data"
CHROMA_DIR = "vector_store"  # must match ingestion step
TOP_K = 5

# Initialize Groq client
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Initialize Chroma client + collection
chroma_client = chromadb.PersistentClient(path=CHROMA_DIR)
collection = chroma_client.get_collection(COLLECTION_NAME)

# -------- Retrieval Tool --------
def retrieve_context(query: str, topk: int = TOP_K):
    results = collection.query(query_texts=[query], n_results=topk)
    docs = results["documents"][0]
    metas = results["metadatas"][0]
    if not docs:
        return ""
    context = "\n".join(
        [f"[{m['company']} - {m['doc_type']}] {d}" for d, m in zip(docs, metas)]
    )
    return context

# -------- Agent --------
def agentic_rag(query: str) -> str:
    """
    LLaMA acts as an agent:
    - Decides whether to use retrieval
    - Generates a final answer
    """
    # Ask the model if retrieval is needed
    decision_prompt = f"""
You are an intelligent stock research assistant.
The user asked: "{query}"

Decide if external data (retrieval) is needed:
- If the query asks about specific companies, stock prices, financial ratios, candlestick patterns, or news → say "RETRIEVE".
- If it's a general reasoning/explaining question (like 'what is a candlestick pattern?') → say "NO RETRIEVE".
Answer only with "RETRIEVE" or "NO RETRIEVE".
"""
    decision_resp = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "system", "content": "You are a decision-making agent."},
                  {"role": "user", "content": decision_prompt}],
        temperature=0,
    )
    decision = decision_resp.choices[0].message.content.strip().upper()

    # If retrieval required
    context = ""
    if "RETRIEVE" in decision:
        context = retrieve_context(query)

    # Final Answer
    final_prompt = f"""
You are a financial assistant.
User query: {query}

Context (if available):
{context if context else "No external context, answer from knowledge."}

Now give the best possible answer.
"""
    resp = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": "You are a helpful AI assistant with RAG capabilities."},
            {"role": "user", "content": final_prompt}
        ],
        temperature=0.3,
    )
    return resp.choices[0].message.content.strip()

# -------- Interactive Loop --------
def main():
    print("🤖 Agentic RAG Stock Assistant (Groq + Chroma)")
    print("Type 'exit' to quit.\n")

    while True:
        query = input("Ask: ").strip()
        if not query or query.lower() in {"exit", "quit"}:
            break

        answer = agentic_rag(query)

        print("\n📌 Answer:")
        print(answer)
        print("-" * 50)

if __name__ == "__main__":
    main()
