import pandas as pd
import pandas_ta as ta
from datetime import date

def add_features(df):
    df['ema_50'] = ta.ema(df['close'], length=50)
    df['ema_200'] = ta.ema(df['close'], length=200)
    df['rsi'] = ta.rsi(df['close'], length=14)

    macd = ta.macd(df['close'])
    df = pd.concat([df, macd], axis=1)

    df['avg_volume_10d'] = df['volume'].rolling(window=10).mean()
    df['avg_volume_50d'] = df['volume'].rolling(window=50).mean()
    df['volume_ratio'] = df['volume'] / df['avg_volume_50d']

    df['master_score'] = (df['rsi'].fillna(0)/100 + df['volume_ratio'].fillna(0)) / 2

    df['52_week_high'] = df['close'].rolling(window=252).max()
    df['distance_from_high'] = (df['close'] - df['52_week_high']) / df['52_week_high']

    return df


def generate_final_dataset(company_name: str):
    """
    Generates the final dataset with technical indicators and sentiment scores for a given company.
    Saves the final CSV to ../Final_Datasets/final_dataset_{company_name}.csv
    """
    candle_path = f"../dags/Features/tools/Tools_Data/candlestick_data/{company_name.lower()}_candles_angel.csv"
    news_path = f"../dags/Features/tools/Tools_Data/indian_stock_news/{company_name.lower()}_news.csv"
    
    # Load data
    candles_df = pd.read_csv(candle_path)
    news_df = pd.read_csv(news_path)

    # Convert dates
    candles_df['timestamp'] = pd.to_datetime(candles_df['timestamp'])
    news_df['date'] = pd.to_datetime(news_df['date']).dt.date

    # Aggregate sentiment
    daily_sentiment = news_df.groupby('date')['sentiment'].mean().reset_index()

    # Extract date from timestamp in candles
    candles_df['date'] = candles_df['timestamp'].dt.date

    # Merge
    merged_df = pd.merge(candles_df, daily_sentiment, on='date', how='left')
    merged_df['sentiment'] = merged_df['sentiment'].fillna(0)

    # Add technical features
    final_df = add_features(merged_df)

    # Save
    output_path = f"../Final_Datasets/final_dataset_{company_name.lower()}.csv"
    final_df.to_csv(output_path, index=False)

    print(f"✅ Final dataset for {company_name} saved to '{output_path}'")

# Example usage
# generate_final_dataset("tata_motors")
