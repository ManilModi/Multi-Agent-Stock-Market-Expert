import os
import sys
import types
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Disable telemetry via env var
os.environ["CREWAI_TELEMETRY_DISABLED"] = "true"

import requests

# Monkey patch requests to never timeout
_old_request = requests.Session.request
def _new_request(self, *args, **kwargs):
    kwargs['timeout'] = None  # no timeout
    return _old_request(self, *args, **kwargs)

requests.Session.request = _new_request

from crewai import Task
from .tools.candlestick_chart_tool import IndianCandlestickChartSearchTool


def get_tasks(company_name: str, stock_ticker: str, agents: dict):
    csv_path = f"{company_name.lower().replace(' ', '_')}_candles_angel.csv"
    chart_search_tool = IndianCandlestickChartSearchTool()
    
    task_search_chart = Task(
        description=f"Search for the most recent candlestick chart for {company_name}.",
        expected_output="A valid link to a candlestick chart (e.g., TradingView or Moneycontrol).",
        tools=[chart_search_tool],
        agent=agents["chart_analysis_agent"]
    )

    task_interpret_chart = Task(
        description=f"Interpret the candlestick chart of {company_name} from the link in the previous step.",
        expected_output="Pattern recognition, trend detection, and short-term trading insights.",
        context=[task_search_chart],
        agent=agents["chart_analysis_agent"]
    )

    return [
        Task(
            description=f"Scrape the Yahoo Finance page for {company_name} and extract price, volume, P/E ratio, and company summary.",
    expected_output=f"Raw scraped stock data for {company_name}.",
            agent=agents["scraper_agent"]
        ),
        Task(
            description=(
        f"1. Use the Yahoo Finance Fundamentals Tool to fetch full financial ratios and balance sheet for {company_name} ({stock_ticker}).\n"
        f"2. Use the VectorDB Retrieval Tool to query embedded CSV data for {company_name}. "
        f"This includes fundamentals, ratios, candlesticks, and news stored in the local ChromaDB.\n"
        f"3. Carefully analyze the combined output:\n"
        f"   - Highlight important financial ratios (e.g. ROE, Debt/Equity, Margins, P/E)\n"
        f"   - Highlight any anomalies or strong balance sheet indicators\n"
        f"   - Explain what these values mean in context\n"
        f"4. Based on your analysis, write a comprehensive investment note:\n"
        f"   - Begin with a summary of the company’s financial strengths/weaknesses\n"
        f"   - Include 2–3 paragraphs of detailed analysis using ratios and fundamentals\n"
        f"   - End with a BUY, HOLD, or SELL recommendation with reasoning."
    ),
    expected_output=(
         f"A 3–4 paragraph investment note that includes:\n"
        f"- Key ratio analysis (e.g., ROE, P/E, Debt/Equity)\n"
        f"- Commentary on the company’s financial health and stability\n"
        f"- Insights retrieved from RAG database (CSV embeddings)\n"
        f"- Final investment recommendation with strong justification"
    ),
            agent=agents["analysis_agent"]
        ),
         task_search_chart,
        task_interpret_chart,
        Task(
            description=(
        # f"Fetch 15-minute interval candlestick data for {company_name} using Angel One API.\n"
        f"Also calculate RSI, MACD, Doji, and common patterns. Save it to a CSV file named accordingly."
    ),
    expected_output=f"A csv containing ONE_MINUTE interval candlestick data for {company_name} using Angel One API",
    agent=agents["chart_analysis_agent"],
    async_execution=False,
    output_file=f"{company_name.lower().replace(' ', '_')}_candles_angel.csv"
),
        Task(
            description=(
        f"Read the candlestick data from '{csv_path}'.\n"
        f"Calculate and interpret the following technical indicators: RSI, MACD, Doji\n"
        f"Detect common candlestick patterns such as doji, hammer, engulfing, etc.\n"
        f"- Trend direction (uptrend, downtrend, sideways)\n"
        f"- Indicator readings and what they imply about momentum and strength\n"
        f"- Key candlestick patterns and their significance\n"
        f"- Short-term outlook based on these technical factors\n"
        f"Produce a 3-4 paragraph technical summary fit for traders and analysts."
    ),
    context=[],
    expected_output="Technical analysis summary including RSI, MACD, EMA, candlestick patterns, and trend analysis.",
            agent=agents["chart_analysis_agent"]
        ),
        Task(
             description=f"Get the latest 5 news headlines for {company_name} (symbol: {stock_ticker}) with summary and URLs.",
    expected_output=f"A news digest with article links, titles, and dates for {company_name}.",
            agent=agents["news_agent"]
        ),
Task(
    description=(
        f"Write a full investment report for {company_name} ({stock_ticker}) using context from other agents of the current date queried. I want a good formatted markdown file with bullet points wherever required.\n"
        "Use the following block tags to extract structured values:\n"
        "- FUNDAMENTALS → for ratios (P/E, ROE, D/E, etc.)\n"
        "- BALANCE SHEET → Analysis all the key items of balance sheet ratios and then give liability analysis of the company\n"
        "- TECHNICALS → RSI, MACD, trend, patterns, support/resistance\n\n"
        "🧠 Write the report in these sections:\n"
        "1. Company Overview and Key Financial Ratios (use exact values)\n"
        "2. Balance Sheet Summary (with numbers)\n"
        "3. Technical Analysis (with indicators and interpretation)\n"
        "4. News Summary\n"
        "5. Final Recommendation: BUY / HOLD / SELL with justification"
    ),
    expected_output="A complete investment-grade report with all metrics and technical values shown explicitly which can help investors make informed decisions.",
    context=[],
    agent=agents["summary_agent"],
    output_file=os.path.join("Reports", f"{company_name.lower().replace(' ', '_')}.md")
)

    ]