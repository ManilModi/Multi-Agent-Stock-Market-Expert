#!/usr/bin/env python3
"""
03_agentic_rag.py

Agentic RAG pipeline (modular version):
- Groq LLaMA acts as an agent
- Uses VectorDBTool for retrieval (Chroma)
- Combines reasoning + retrieved context

Dependencies:
    pip install chromadb groq python-dotenv
"""

import os
import chromadb
from groq import Groq
from dotenv import load_dotenv
load_dotenv()

# -------- CONFIG --------
COLLECTION_NAME = "stock_data"
CHROMA_DIR = "vector_store"
TOP_K = 5

# -------- Initialize Groq client --------
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise RuntimeError("Missing GROQ_API_KEY in environment variables.")
groq_client = Groq(api_key=api_key)

# -------- Initialize Chroma client + collection --------
chroma_client = chromadb.PersistentClient(path=CHROMA_DIR)
collection = chroma_client.get_collection(COLLECTION_NAME)

# -------- VectorDBTool --------
class VectorDBTool:
    """Tool for retrieving company CSV data from vector database"""
    def __init__(self, collection, top_k=TOP_K):
        self.collection = collection
        self.top_k = top_k
        self.name = "VectorDB Retrieval Tool"
        self.description = "Retrieve company CSV data (fundamentals, ratios, news, candlesticks) from vector database."

    def run(self, query: str) -> str:
        results = self.collection.query(query_texts=[query], n_results=self.top_k)
        docs = results.get("documents", [[]])[0]
        metas = results.get("metadatas", [[]])[0]
        if not docs:
            return "No relevant data found."
        return "\n".join([f"[{m['company']} - {m['doc_type']}] {d}" for d, m in zip(docs, metas)])


# Initialize VectorDBTool
vector_tool = VectorDBTool(collection=collection)

# -------- Agent --------
def agentic_rag(query: str) -> str:
    """
    Groq LLaMA acts as an agent:
    - Decides whether to use retrieval via VectorDBTool
    - Generates a final answer
    """
    # Step 1: Decide if retrieval is needed
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
        messages=[
            {"role": "system", "content": "You are a decision-making agent."},
            {"role": "user", "content": decision_prompt}
        ],
        temperature=0
    )
    decision = decision_resp.choices[0].message.content.strip().upper()

    # Step 2: Retrieve context if required via VectorDBTool
    context = vector_tool.run(query) if "RETRIEVE" in decision else ""

    # Step 3: Generate final answer
    final_prompt = f"""
You are a financial assistant.
User query: {query}

Context (if available):
{context if context else "No external context, answer from knowledge."}

Now give the best possible answer.
"""
    final_resp = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": "You are a helpful AI assistant with RAG capabilities."},
            {"role": "user", "content": final_prompt}
        ],
        temperature=0.3
    )

    return final_resp.choices[0].message.content.strip()

# -------- Interactive Loop --------
def main():
    print("🤖 Agentic RAG Stock Assistant (Groq + VectorDBTool)")
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
