from crewai.tools import BaseTool
import os
import requests
from dotenv import load_dotenv

load_dotenv()

class IndianStockTool(BaseTool):
    name: str = "Indian Stock Info Tool"
    description: str = (
        "Fetches and summarizes current stock info for any Indian stock using Alpha Vantage.\n"
        "Usage: Provide the stock ticker symbol like RELIANCE.BSE or INFY.NS in the query."
    )

    def _run(self, query: str) -> str:
        api_key = os.getenv("ALPHA_VANTAGE_API_KEY")
        if not api_key:
            return "❌ Missing Alpha Vantage API key. Please set ALPHA_VANTAGE_API_KEY in your .env file."

        # Expect the query to include a valid symbol like 'TCS.NS'
        symbol = query.strip().upper()

        if not symbol.endswith((".BSE", ".NS")):
            return (
                "⚠️ Please provide a valid Indian stock symbol (e.g., RELIANCE.BSE or TCS.NS) in the query."
            )

        url = "https://www.alphavantage.co/query"
        params = {
            "function": "GLOBAL_QUOTE",
            "symbol": symbol,
            "apikey": api_key
        }

        try:
            response = requests.get(url, params=params)
            data = response.json().get("Global Quote", {})

            if not data:
                return f"❌ No data found for symbol: {symbol}. Please verify the ticker."

            price = data.get("05. price", "N/A")
            volume = data.get("06. volume", "N/A")
            change_percent = data.get("10. change percent", "N/A")

            return (
                f"📈 Stock Summary for {symbol} (via Alpha Vantage):\n"
                f"Current Price: ₹{price}\n"
                f"Volume: {volume}\n"
                f"Change Percent: {change_percent}"
            )
        except Exception as e:
            return f"❌ Failed to fetch data: {str(e)}"

    async def _arun(self, query: str) -> str:
        return self._run(query)

# Optional test run:
# if __name__ == "__main__":
#     tool = IndianStockTool()
#     print(tool._run(query="RELIANCE.BSE"))