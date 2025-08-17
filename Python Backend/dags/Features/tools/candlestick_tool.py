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
from crewai.tools import BaseTool
import pandas as pd
import datetime as dt
from SmartApi.smartConnect import SmartConnect
import pyotp
import pandas_ta as ta
from dotenv import load_dotenv
from Utils.cloudinary import upload_csv_to_cloudinary
import os


class AngelOneCandlestickTool(BaseTool):
    name: str = "AngelOneCandlestickTool"
    description: str = "Fetches historical candlestick data for Indian stocks using Angel One SmartAPI and saves to CSV."

    def _run(self, company_name: str, stock_name: str, exchange: str = "NSE",
             from_date: str = None, to_date: str = None, interval: str = "ONE_MINUTE") -> str:
        try:
            today = dt.datetime.now()

            interval = interval.upper()
            valid_intervals = {"ONE_MINUTE", "FIVE_MINUTE", "FIFTEEN_MINUTE", "ONE_HOUR", "ONE_DAY"}
            if interval not in valid_intervals:
                return f"❌ Invalid interval '{interval}'. Choose from {valid_intervals}."

            from_date = (today - dt.timedelta(days=7)).strftime("%Y-%m-%d 09:15")
            to_date = today.strftime("%Y-%m-%d %H:%M")
                

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

            for col in ['open', 'high', 'low', 'close', 'volume']:
                df[col] = pd.to_numeric(df[col], errors='coerce')
            df = df.dropna(subset=['open', 'high', 'low', 'close', 'volume'])


            # Check data length first
            if len(df) < 35:
                return f" Not enough data ({len(df)} rows) to compute indicators like MACD and RSI."

            df['RSI'] = ta.momentum.rsi(df['close'], length=14)
            macd = ta.momentum.macd(df['close'])
            df['MACD'] = macd['MACD_12_26_9']
            df['MACD_signal'] = macd['MACDs_12_26_9']
            df['MACD_hist'] = macd['MACDh_12_26_9']
            df['Doji'] = ta.candles.cdl_doji(df['open'], df['high'], df['low'], df['close'])

            # Fill any NaNs that may appear at the start
            df[['RSI', 'MACD', 'MACD_signal', 'MACD_hist', 'Doji']] = df[['RSI', 'MACD', 'MACD_signal', 'MACD_hist', 'Doji']].fillna(0)



            output_dir = "dags/Features/tools/Tools_Data/candlestick_data"
            os.makedirs(output_dir, exist_ok=True)  # ensure the folder exists
            filename = os.path.join(output_dir, f"{company_name.lower().replace(' ', '_')}_candles_angel.csv")


            # === Check if file exists and append new data ===
            if os.path.exists(filename):
                existing_df = pd.read_csv(filename, parse_dates=['timestamp'])
                combined_df = pd.concat([existing_df, df], ignore_index=True)
                combined_df.drop_duplicates(subset='timestamp', keep='last', inplace=True)
                combined_df.sort_values(by='timestamp', inplace=True)
                combined_df.to_csv(filename, index=False)
                cloud_url = upload_csv_to_cloudinary(filename, folder="candlestick_patterns")

                return f"{cloud_url}"
            else:
                df.to_csv(filename, index=False)
                return f"✅ Saved candlestick + indicator data to new file: {filename}"

        except Exception as e:
            return f"❌ Error fetching candlestick data: {str(e)}"

if __name__ == "__main__":
    tool = AngelOneCandlestickTool()
    company_name = "MRF"
    stock_name = "MRF"
    exchange = "NSE"
    # interval = "ONE_MINUTE"

    result = tool._run(
        company_name=company_name,
        stock_name=stock_name,
        exchange=exchange,
        # interval=interval
    )

    print(result)
