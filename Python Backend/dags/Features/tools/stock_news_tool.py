from crewai.tools import BaseTool
import os
import requests
import pandas as pd
from dotenv import load_dotenv
from textblob import TextBlob
from Utils.cloudinary import upload_csv_to_cloudinary

load_dotenv()

class IndianStockNewsTool(BaseTool):
    name: str = "Indian Stock News Tool"
    description: str = "Fetches recent news articles about Indian companies using NewsAPI.org and saves them as CSV, including sentiment scores."

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

            # Build list of dicts with sentiment
            news_list = []
            for article in articles:
                title = article["title"]
                sentiment = TextBlob(str(title)).sentiment.polarity
                news_list.append({
                    "title": title,
                    "date": article["publishedAt"][:10],
                    "url": article["url"],
                    "source": article["source"]["name"],
                    "sentiment": sentiment
                })

            # Convert to DataFrame
            df = pd.DataFrame(news_list)

            # Create filename
            output_dir = "Tools_Data/indian_stock_news"
            os.makedirs(output_dir, exist_ok=True)
            csv_filename = os.path.join(output_dir, f"{query.lower().replace(' ', '_')}_news.csv")


            # Save as CSV
            df.to_csv(csv_filename, index=False, encoding='utf-8-sig')

            cloud_url = upload_csv_to_cloudinary(csv_filename, folder="indian_stock_news")

            return f"{cloud_url}"

        except Exception as e:
            return f"❌ Error fetching or saving news: {str(e)}"

    async def _arun(self, query: str) -> str:
        return self._run(query)


# if __name__ == "__main__":
#     tool = IndianStockNewsTool()
#     company_name = "tata motors"  # Test company
#     result = tool._run(company_name)

#     print("\n========== NEWS TOOL OUTPUT ==========\n")
#     print(result)
#     print("\n======================================\n")
