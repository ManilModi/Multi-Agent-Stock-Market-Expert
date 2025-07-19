import pandas as pd
import pandas_ta as ta
from datetime import date
# import talib

def add_features(df):
    df['ema_50'] = ta.ema(df['close'], length=50)
    df['ema_200'] = ta.ema(df['close'], length=200)

    df['rsi'] = ta.rsi(df['close'], length=14)

    macd = ta.macd(df['close'])
    df = pd.concat([df, macd], axis=1)

    

    df['avg_volume_10d'] = df['volume'].rolling(window=10).mean()
    df['avg_volume_50d'] = df['volume'].rolling(window=50).mean()
    df['volume_ratio'] = df['volume'] / df['avg_volume_50d']

    # Optional: master score based on your features (without RS)
    df['master_score'] = (df['rsi'].fillna(0)/100 + df['volume_ratio'].fillna(0)) / 2

    df['52_week_high'] = df['close'].rolling(window=252).max()
    df['distance_from_high'] = (df['close'] - df['52_week_high']) / df['52_week_high']

    return df


# === Step 1: Load all CSV files ===
candles_df = pd.read_csv("tata_motors_candles_angel.csv")
news_df = pd.read_csv("tata_motors_news.csv")

# === Step 2: Convert timestamp columns to datetime ===
candles_df['timestamp'] = pd.to_datetime(candles_df['timestamp'])


# === Step 3: Prepare news sentiment data ===
news_df['date'] = pd.to_datetime(news_df['date']).dt.date
daily_sentiment = news_df.groupby('date')['sentiment'].mean().reset_index()

# === Step 4: Prepare candles dataframe ===
candles_df['date'] = candles_df['timestamp'].dt.date

# === Step 5: Merge candles with daily sentiment ===
merged_df = pd.merge(
    candles_df, 
    daily_sentiment, 
    on='date', 
    how='left'
)

# Fill missing sentiment with 0 if no news that day
merged_df['sentiment'] = merged_df['sentiment'].fillna(0)

# === Step 6: Add feature engineering ===
final_df = add_features(merged_df)

# === Step 7: (Optional) Add static fundamental features if you have them ===
# ratios_df = pd.read_csv("tatamotors.ns_ratios.csv")
# bs_df = pd.read_csv("tatamotors.ns_balance_sheet.csv")
#
# if 'ratios_df' in locals():
#     for col in ratios_df.columns:
#         final_df[f'ratio_{col}'] = ratios_df[col].iloc[0]
#
# if 'bs_df' in locals():
#     for col in bs_df.columns:
#         final_df[f'bs_{col}'] = bs_df[col].iloc[0]

# === Step 8: Save final enriched dataset ===
final_df.to_csv('final_dataset_with_sentiment_and_features.csv', index=False)
print("✅ Final dataset with features & sentiment saved as 'final_dataset_with_sentiment_and_features.csv'")
