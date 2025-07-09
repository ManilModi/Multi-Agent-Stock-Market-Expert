from crewai.tools import BaseTool
import pandas as pd
import datetime as dt
from SmartApi import SmartConnect
import pyotp
import pandas_ta as ta
from dotenv import load_dotenv
import os


class AngelOneCandlestickTool(BaseTool):
    name: str = "AngelOneCandlestickTool"
    description: str = "Fetches historical candlestick data for Indian stocks using Angel One SmartAPI and saves to CSV."

    def _run(self,company_name: str, stock_name: str, exchange: str = "NSE",
             from_date: str = None, to_date: str = None, interval: str = "FIFTEEN_MINUTE") -> str:
        try:
            # Step 1: Prepare dates with correct format including time
            today = dt.datetime.now()

            interval = interval.upper()
            valid_intervals = {"ONE_MINUTE", "FIVE_MINUTE", "FIFTEEN_MINUTE", "ONE_HOUR", "ONE_DAY"}
            if interval not in valid_intervals:
                return f"❌ Invalid interval '{interval}'. Choose from {valid_intervals}."

            if interval == "ONE_DAY":
                from_date = (today - dt.timedelta(days=5)).strftime("%Y-%m-%d 09:15")
                to_date = today.strftime("%Y-%m-%d 15:30")
            else:
                from_date = (today - dt.timedelta(days=3)).strftime("%Y-%m-%d 09:15")
                to_date = today.strftime("%Y-%m-%d 15:30")

            # Step 2: Setup credentials & login
            
            load_dotenv()
            API_KEY = os.getenv("ANGELONE_API_KEY")
            CLIENT_ID = os.getenv("CLIENT_ID")
            PASSWORD = os.getenv("PASSWORD")
            TOTP_SECRET = os.getenv("TOTP_SECRET")

            totp = pyotp.TOTP(TOTP_SECRET).now()
            obj = SmartConnect(api_key=API_KEY)
            data = obj.generateSession(CLIENT_ID, PASSWORD, totp)

            if not data.get("data") or "jwtToken" not in data["data"]:
                return "❌ Login failed. Check credentials or TOTP."

            obj.getfeedToken()

            # Step 3: Find token
            search_result = obj.searchScrip(exchange, stock_name.upper())
            if not search_result or 'data' not in search_result or not search_result['data']:
                return f"❌ Could not find token for stock: {stock_name}"

            target_symbol = f"{stock_name.upper()}-EQ"
            stock_eq = next(
                (item for item in search_result['data'] if item['tradingsymbol'].upper() == target_symbol),
                None
            )

            if not stock_eq:
                return f"❌ Exact trading symbol '{target_symbol}' not found in search results."

            print(f"DEBUG: Found exact symbol: {stock_eq['tradingsymbol']}, token: {stock_eq['symboltoken']}")
            print(f"REQUEST DATES => From: {from_date}, To: {to_date}, Interval: {interval}")

            # Step 4: Request candle data
            historical_params = {
                "exchange": exchange,
                "symboltoken": stock_eq['symboltoken'],
                "interval": interval,
                "fromdate": from_date,
                "todate": to_date
            }

            response = obj.getCandleData(historical_params)
            candles = response.get('data', [])

            if not candles:
                return "❌ No candle data received."

            df = pd.DataFrame(candles, columns=["timestamp", "open", "high", "low", "close", "volume"])
            df['timestamp'] = pd.to_datetime(df['timestamp'])

            df['RSI'] = ta.momentum.rsi(df['close'], length=14)

            # Calculate MACD
            macd = ta.momentum.macd(df['close'])
            df['MACD'] = macd['MACD_12_26_9']
            df['MACD_signal'] = macd['MACDs_12_26_9']
            df['MACD_hist'] = macd['MACDh_12_26_9']


            # Candlestick patterns (example: doji)
            df['Doji'] = ta.candles.cdl_doji(df['open'], df['high'], df['low'], df['close'])

            
            # === 💾 Save with indicators to new CSV ===
            filename = f"{company_name.lower().replace(' ', '_')}_candles_angel.csv"
            df.to_csv(filename, index=False)

            return f"✅ Saved candlestick + indicator data to {filename}"

        except Exception as e:
            return f"❌ Error fetching candlestick data: {str(e)}"


# if __name__ == "__main__":
#     # Initialize the tool
#     tool = AngelOneCandlestickTool()

#     # Define test parameters
#     company_name = "Tata Consultancy Services"
#     stock_name = "TCS"  # NSE symbol without .NS
#     exchange = "NSE"
#     interval = "FIFTEEN_MINUTE"  # Can also be ONE_DAY, ONE_HOUR, etc.

#     # Run the tool and print output
#     result = tool._run(
#         company_name=company_name,
#         stock_name=stock_name,
#         exchange=exchange,
#         interval=interval
#     )

#     print(result)