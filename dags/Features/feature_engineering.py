import pandas as pd
import pandas_ta as ta

def add_features(df, index_df):
    df['ema_50'] = ta.ema(df['close'], length=50)
    df['ema_200'] = ta.ema(df['close'], length=200)

    df['rsi'] = ta.rsi(df['close'], length=14)
    macd = ta.macd(df['close'])
    df = pd.concat([df, macd], axis=1)

    df['doji'] = ta.cdl_doji(df['open'], df['high'], df['low'], df['close'])
    df['bullish_engulfing'] = ta.cdl_engulfing(df['open'], df['high'], df['low'], df['close'])

    df = df.merge(index_df[['timestamp', 'close']], on='timestamp', suffixes=('', '_index'))
    df['rs_line'] = df['close'] / df['close_index']
    df['rs_rating'] = df['rs_line'].rolling(window=20).apply(lambda x: x[-1]/x.mean()*100, raw=True)

    df['avg_volume_10d'] = df['volume'].rolling(window=10).mean()
    df['avg_volume_50d'] = df['volume'].rolling(window=50).mean()
    df['volume_ratio'] = df['volume'] / df['avg_volume_50d']

    df['master_score'] = (df['rsi'].fillna(0)/100 + df['rs_rating'].fillna(0)/100 + df['volume_ratio'].fillna(0)) / 3

    df['52_week_high'] = df['close'].rolling(window=252).max()
    df['distance_from_high'] = (df['close'] - df['52_week_high']) / df['52_week_high']

    return df
