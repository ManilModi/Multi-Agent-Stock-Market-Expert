# agents.py

from crewai import Agent, LLM
from dotenv import load_dotenv
import os
from .tools.stock_analysis import IndianStockTool
from .tools.candlestick_chart_tool import IndianCandlestickChartSearchTool
from .tools.stock_news_tool import IndianStockNewsTool
from .tools.candlestick_tool import AngelOneCandlestickTool
from .tools.yfinance_tool import YFinanceFundamentalsTool
from crewai_tools.tools import ScrapeWebsiteTool

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY2")

llm = LLM(model="gemini/gemini-2.0-flash", temperature=0.7, api_key=api_key)

def get_agents(company_name: str, stock_ticker: str):
    finance_url = f"https://finance.yahoo.com/quote/{stock_ticker}"

    scraper_tool = ScrapeWebsiteTool(
        description=f"Scrapes stock info of {company_name} from Yahoo Finance.",
        website_url=finance_url
    )
    hdfc_tool = IndianStockTool()
    yfinance_tool = YFinanceFundamentalsTool()
    candlestick_tool = AngelOneCandlestickTool()
    chart_search_tool = IndianCandlestickChartSearchTool()
    news_tool = IndianStockNewsTool()

    return {
        "scraper_agent": Agent(
    role="Scraper Agent",
    goal=f"Scrape stock price, volume, P/E ratio, and company summary for {company_name}.",
    backstory="You are a skilled web scraper specialized in extracting stock market data from finance websites.",
    tools=[scraper_tool, hdfc_tool],
    llm=llm,
    verbose=True
),
        "analysis_agent":Agent(
    role="Equity Analyst",
    goal=f"Analyze {company_name}'s stock using financial ratios and balance sheet data.",
    backstory=(
        "You are a senior equity analyst. You specialize in reading and interpreting company fundamentals "
        "like P/E ratio, ROE, debt levels, margins, and balance sheet strength to make investment decisions. "
        "You help investors make informed BUY/HOLD/SELL decisions."
    ),
    tools=[yfinance_tool],
    llm=llm,
    verbose=True
),
        "chart_analysis_agent": Agent(
    role="Technical Chart Analyst",
    goal="Analyze stock trends using Angel One candlestick data.",
    backstory="You're an expert technical analyst who fetches and studies candlestick charts to derive trading signals.",
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
)
    }