from crewai.tools import BaseTool
import os
import requests
from dotenv import load_dotenv

load_dotenv()

class IndianStockNewsTool(BaseTool):
    name: str = "Indian Stock News Tool"
    description: str = "Fetches recent news articles about Indian companies using NewsAPI.org."

    def _run(self, query: str) -> str:
        api_key = os.getenv("NEWS_API_KEY")
        if not api_key:
            return "❌ NEWS_API_KEY is missing. Please set it in your .env file."

        url = "https://newsapi.org/v2/everything"
        params = {
            "q": f'"{query}" AND India',
            "apiKey": api_key,
            "language": "en",
            "pageSize": 5,
            "sortBy": "publishedAt",
            "domains": "moneycontrol.com,business-standard.com,livemint.com,economictimes.indiatimes.com"
        }

        try:
            response = requests.get(url, params=params)
            articles = response.json().get("articles", [])

            if not articles:
                return f"ℹ️ No recent news found for {query}."

            result = f"📰 Top News for {query}:\n"
            for article in articles:
                result += (
                    f"\n🗞️ {article['title']}\n"
                    f"📅 {article['publishedAt'][:10]}\n"
                    f"🔗 {article['url']}\n"
                )

            return result

        except Exception as e:
            return f"❌ Error fetching news: {str(e)}"

    async def _arun(self, query: str) -> str:
        return self._run(query)


# if __name__ == "__main__":
#     tool = IndianStockNewsTool()
#     company_name = "Torrent"  # You can change this to test other companies
#     result = tool._run(company_name)

#     print("\n========== NEWS RESULTS ==========\n")
#     print(result)
#     print("\n==================================\n")