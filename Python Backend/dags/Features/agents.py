import os
import sys
import time
import random
import traceback
from dotenv import load_dotenv

load_dotenv()

# Disable telemetry
os.environ["CREWAI_TELEMETRY_DISABLED"] = "true"
os.environ["CREWAI_DEBUG"] = "true"

import requests
# Monkey patch requests to never timeout
_old_request = requests.Session.request
def _new_request(self, *args, **kwargs):
    kwargs['timeout'] = None
    return _old_request(self, *args, **kwargs)
requests.Session.request = _new_request

from crewai import Agent, LLM
from .tools.stock_analysis import IndianStockTool
from .tools.candlestick_chart_tool import IndianCandlestickChartSearchTool
from .tools.stock_news_tool import IndianStockNewsTool
from .tools.candlestick_tool import AngelOneCandlestickTool
from .tools.yfinance_tool import YFinanceFundamentalsTool
from crewai_tools.tools import ScrapeWebsiteTool
from crewai.tools.base_tool import Tool
import chromadb
from litellm.exceptions import RateLimitError
from sentence_transformers import SentenceTransformer
from pydantic import PrivateAttr

# ─── SAFE LLM CALL ─────────────────────────────────────────────────
def safe_call(llm, prompt, retries=5):
    for attempt in range(retries):
        try:
            return llm.call(prompt)
        except RateLimitError as e:
            wait_time = 2 ** attempt + random.uniform(0, 1)
            try:
                msg = str(e)
                if "Please try again in" in msg:
                    wait_time = float(msg.split("Please try again in ")[1].split("s")[0]) + random.uniform(0, 1)
            except Exception:
                pass
            print(f"⏳ Rate limit hit for {llm.model}. Retrying in {wait_time:.2f}s...")
            time.sleep(wait_time)
    raise RuntimeError(f"Exceeded max retries for {llm.model}")

# ─── SAFE LLM WRAPPER ──────────────────────────────────────────────
class SafeLLMWrapper:
    def __init__(self, llm, retries=5):
        self.llm = llm
        self.retries = retries

    def call(self, prompt):
        return safe_call(self.llm, prompt, self.retries)

api_key = os.getenv("GEMINI_API_KEY1")

llm = LLM(model="gemini/gemini-2.0-flash", temperature=0.7, api_key=api_key)

# ─── VECTOR DB ─────────────────────────────────────────────────────
chroma_client = chromadb.PersistentClient(path="vector_store")
collection = chroma_client.get_collection("stock_data")

class VectorDBTool(Tool):
    def __init__(self):
        super().__init__(
            name="VectorDB Retrieval Tool",
            description="Retrieve company CSV data (fundamentals, ratios, news, candlesticks) from vector database.",
            func=self.run
        )

    def run(self, query: str):
        results = collection.query(query_texts=[query], n_results=5)
        docs = results.get("documents", [[]])[0]
        metas = results.get("metadatas", [[]])[0]
        if not docs:
            return "No relevant data found."
        return "\n".join(
            [f"[{m['company']} - {m['doc_type']}] {d}" for d, m in zip(docs, metas)]
        )

# ─── SAFE SCRAPER ──────────────────────────────────────────────────
class SafeScrapeWebsiteTool(ScrapeWebsiteTool):
    def run(self, *args, **kwargs):
        try:
            print(f"🔍 [DEBUG] Scraper called with URL={self.website_url}")
            result = super().run(*args, **kwargs)
            print(f"✅ [DEBUG] Scraper result (truncated): {str(result)[:300]}...")
            return result
        except Exception as e:
            print("❌ [Scraper Error]", str(e))
            traceback.print_exc()
            return f"ERROR: {e}"

# ─── AGENTS ────────────────────────────────────────────────────────
def get_agents(company_name: str, stock_ticker: str):
    finance_url = f"https://finance.yahoo.com/quote/{stock_ticker}"

    scraper_tool = SafeScrapeWebsiteTool(
        description=f"Scrapes stock info of {company_name} from Yahoo Finance.",
        website_url=finance_url
    )
    hdfc_tool = IndianStockTool()
    yfinance_tool = YFinanceFundamentalsTool()
    candlestick_tool = AngelOneCandlestickTool()
    chart_search_tool = IndianCandlestickChartSearchTool()
    news_tool = IndianStockNewsTool()
    vector_tool = VectorDBTool()

    return {
        "scraper_agent": Agent(
            role="Scraper Agent",
            goal=f"Scrape stock price, volume, P/E ratio, and company summary for {company_name}.",
            backstory="You are a skilled web scraper specialized in extracting stock market data from finance websites.",
            tools=[scraper_tool, hdfc_tool],
            llm=llm,
            verbose=True
        ),
        "analysis_agent": Agent(
            role="Equity Analyst",
            goal=f"Analyze {company_name}'s stock using financial ratios and balance sheet data.",
            backstory=(
                "You are a senior equity analyst. You specialize in reading and interpreting company fundamentals "
                "like P/E ratio, ROE, debt levels, margins, and balance sheet strength to make investment decisions. "
                "You help investors make informed BUY/HOLD/SELL decisions."
            ),
            tools=[yfinance_tool, vector_tool],
            llm=llm,
            verbose=True
        ),
        "chart_analysis_agent": Agent(
            role="Technical Chart Analyst",
            goal="Analyze stock trends using Angel One candlestick data.",
            backstory="You're an expert technical analyst who fetches and studies candlestick charts to derive trading signals from only ONE_MINUTE time period candlestick chart.",
            tools=[candlestick_tool],
            llm=llm,
            verbose=True
        ),
        "chart_search_agent": Agent(
            role="Chart Searcher",
            goal=f"Find high-quality candlestick charts for {company_name}.",
            backstory="You are a researcher who finds real-time chart images from reliable financial sites.",
            tools=[chart_search_tool],
            llm=llm,
            verbose=True
        ),
        "news_agent": Agent(
            role="Financial News Analyst",
            goal=f"Fetch and summarize recent financial news for {company_name}.",
            backstory="You're a financial news expert, providing insights from latest headlines and market developments.",
            tools=[news_tool],
            llm=llm,
            verbose=True
        ),
        "summary_agent": Agent(
            role="Equity Strategy Summarizer",
            goal="Summarize all insights into a concise, investment-grade report with technical and fundamental perspectives.",
            backstory="You synthesize analysis, news, and charts into a strategic equity report for professional brokers.",
            llm=llm,
            verbose=True
        ),
        "ingestion_agent": VectorDBIngestionAgent(collection=collection, embed_model=embed_model)

    }



embed_model = SentenceTransformer("all-MiniLM-L6-v2")

class VectorDBIngestionAgent(Agent):
    _collection: any = PrivateAttr()
    _embed_model: any = PrivateAttr()

    def __init__(self, collection, embed_model, **kwargs):
        super().__init__(
            role="VectorDB Ingestion Agent",
            goal="Keep the vector DB up-to-date with outputs from other agents.",
            backstory="Specialized agent that ingests new financial data (text or files) into Chroma.",
            **kwargs
        )
        self._collection = collection
        self._embed_model = embed_model

    def run(self, input_data):
        text_blocks = []
        if isinstance(input_data, str):
            text_blocks.append(input_data)
        elif isinstance(input_data, list):
            text_blocks.extend([str(x) for x in input_data])
        elif isinstance(input_data, dict):
            text_blocks.extend([str(v) for v in input_data.values()])

        if not text_blocks:
            return "No new content to ingest."

        embeddings = self._embed_model.encode(text_blocks).tolist()
        ids = [f"doc_{hash(t)}" for t in text_blocks]
        metadatas = [{"source": "agent_output"} for _ in text_blocks]

        self._collection.upsert(
            ids=ids,
            documents=text_blocks,
            embeddings=embeddings,
            metadatas=metadatas
        )
        return f"Ingested {len(text_blocks)} items into Chroma."
