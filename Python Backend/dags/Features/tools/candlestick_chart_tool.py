from crewai_tools.tools import SerperDevTool


from crewai.tools import BaseTool

class IndianCandlestickChartSearchTool(BaseTool):
    name: str = "Indian Candlestick Chart Search Tool"
    description: str = (
        "Searches for recent candlestick chart URLs of any Indian stock or company "
        "from trusted financial sites using Serper (Google Search API)."
    )

    def _run(self, query: str = None) -> str:
        if not query:
            return "⚠️ Please provide a company name or stock symbol (e.g., 'RELIANCE', 'INFY', 'HDFC Bank')."

        try:
            tool = SerperDevTool()
            search_query = (
                f"{query} candlestick chart site:tradingview.com OR site:moneycontrol.com OR site:investing.com"
            )

            results = tool._run(query=search_query)  # ✅ Fixed: keyword argument

            if not isinstance(results, dict) or "organic" not in results or not results["organic"]:
                return f"❌ No chart found for {query}. Try a more specific stock name or symbol."

            top_result = results["organic"][0]
            return f"🔗 Found chart for {query}:\n{top_result['title']}\n{top_result['link']}"

        except Exception as e:
            return f"❌ Error during chart search for {query}: {str(e)}"

    async def _arun(self, query: str) -> str:
        return self._run(query=query)

# Optional test run
if __name__ == "__main__":
    tool = IndianCandlestickChartSearchTool()
    print(tool._run("RELIANCE"))