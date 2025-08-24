from crewai_tools import RagTool
from dotenv import load_dotenv
from rag_config import config  # ✅ shared config

load_dotenv()

# ----------------------------
# CrewAI RAG Tool
# ----------------------------
rag_tool = RagTool(config=config, summarize=True)

def ask_company_bot(query: str):
    return rag_tool.run(query)

if __name__ == "__main__":
    while True:
        q = input("\n💬 Ask about a company (or type 'exit'): ")
        if q.lower() == "exit":
            break
        print("\n🤖 Answer:\n", ask_company_bot(q))
