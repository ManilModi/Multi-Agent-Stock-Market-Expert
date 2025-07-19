import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb
import plotly.graph_objs as go
import plotly.io as pio
pio.renderers.default = 'browser'

# Load data
df = pd.read_csv('final_dataset_with_sentiment_and_features.csv')
df['timestamp'] = pd.to_datetime(df['timestamp'])
df = df.sort_values('timestamp')

# Create lag features
for col in ['close', 'open', 'high', 'low', 'volume', 'RSI', 'MACD', 'sentiment', 
            'MACD_signal', 'MACD_hist', 'Doji']:
    df[f'{col}_lag1'] = df[col].shift(1)
    df[f'{col}_lag2'] = df[col].shift(2)

# Rolling features
df['close_roll_mean3'] = df['close'].rolling(3).mean()
df['close_roll_mean10'] = df['close'].rolling(10).mean()
df['close_roll_std3'] = df['close'].rolling(3).std()

df['volume_roll_mean3'] = df['volume'].rolling(3).mean()
df['volume_roll_mean10'] = df['volume'].rolling(10).mean()
df['volume_roll_std3'] = df['volume'].rolling(3).std()

# Price change %
df['close_change_pct'] = (df['close'] - df['close_lag1']) / df['close_lag1']

# Time features
df['hour'] = df['timestamp'].dt.hour
df['weekday'] = df['timestamp'].dt.weekday
df['month'] = df['timestamp'].dt.month

# Interaction feature
df['rsi_sentiment'] = df['RSI'] * df['sentiment']

# Drop NaNs
df.dropna(inplace=True)

# Target: next candle's OHLC
df['open_next'] = df['open'].shift(-1)
df['high_next'] = df['high'].shift(-1)
df['low_next'] = df['low'].shift(-1)
df['close_next'] = df['close'].shift(-1)

df.dropna(inplace=True)

# Features
features = [col for col in df.columns if col not in [
    'timestamp', 'date', 'open_next', 'high_next', 'low_next', 'close_next',
    'open', 'high', 'low', 'close'
]]

X = df[features]
y = df[['open_next', 'high_next', 'low_next', 'close_next']]

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.1, shuffle=False)

# Train XGBoost models
models = {}
y_pred = pd.DataFrame(index=y_test.index)

for col in y.columns:
    print(f"\n🚀 Training model for {col}...")
    model = xgb.XGBRegressor(
        n_estimators=200, learning_rate=0.05, max_depth=5,
        subsample=0.9, colsample_bytree=0.9, random_state=42
    )
    model.fit(X_train, y_train[col])
    y_pred[col] = model.predict(X_test)
    models[col] = model

# Evaluation
print("\n✅ Model Evaluation Metrics:")
for col in y.columns:
    mae = mean_absolute_error(y_test[col], y_pred[col])
    rmse = np.sqrt(mean_squared_error(y_test[col], y_pred[col]))
    r2 = r2_score(y_test[col], y_pred[col])
    print(f"{col}: MAE={mae:.4f}, RMSE={rmse:.4f}, R²={r2:.4f}")

# Save predictions
predictions = y_test.copy()
predictions['pred_open'] = y_pred['open_next']
predictions['pred_high'] = y_pred['high_next']
predictions['pred_low'] = y_pred['low_next']
predictions['pred_close'] = y_pred['close_next']
predictions.to_csv('ohlc_predictions.csv', index=False)
print("\n✅ Predictions saved to ohlc_predictions.csv")

# Plot: actual vs predicted close
fig = go.Figure()
fig.add_trace(go.Scatter(y=y_test['close_next'], mode='lines', name='Actual Close'))
fig.add_trace(go.Scatter(y=y_pred['close_next'], mode='lines', name='Predicted Close'))
fig.update_layout(title='Actual vs Predicted Close Price', xaxis_title='Index', yaxis_title='Price', template='plotly_dark')
fig.show()

# Plot: actual candlestick + predicted close
fig2 = go.Figure()
fig2.add_trace(go.Candlestick(
    x=predictions.index,
    open=predictions['open_next'], high=predictions['high_next'],
    low=predictions['low_next'], close=predictions['close_next'],
    name='Actual Candlestick'
))
fig2.add_trace(go.Scatter(
    x=predictions.index, y=predictions['pred_close'],
    mode='lines', name='Predicted Close', line=dict(color='cyan')
))
fig2.update_layout(title='Actual Candlestick with Predicted Close Price', xaxis_title='Index', yaxis_title='Price', template='plotly_dark')
fig2.show()

# -------------------------
# 📅 Forecast tomorrow (every minute 9:15–15:30)
minutes_in_day = 375  # 9:15 AM to 3:30 PM
forecast_steps = minutes_in_day
start_time = pd.Timestamp(df['timestamp'].max().date() + pd.Timedelta(days=1)).replace(hour=9, minute=15)

last_known = df.iloc[-1:].copy()
forecast_rows = []

print(f"\n⏳ Forecasting tomorrow's market ({forecast_steps} minutes)...")

for step in range(forecast_steps):
    curr_time = start_time + pd.Timedelta(minutes=step)
    new_features = {}

    # Build each feature from training 'features' list
    for feature in features:
        if feature in ['hour', 'weekday', 'month']:
            new_features['hour'] = curr_time.hour
            new_features['weekday'] = curr_time.weekday()
            new_features['month'] = curr_time.month
        elif feature == 'close_change_pct':
            prev_close = last_known.iloc[-1]['close']
            prev_close_lag1 = last_known.iloc[-1]['close_lag1']
            new_features['close_change_pct'] = (prev_close - prev_close_lag1) / prev_close_lag1 if prev_close_lag1 != 0 else 0
        elif feature == 'rsi_sentiment':
            new_features['rsi_sentiment'] = last_known.iloc[-1]['RSI'] * last_known.iloc[-1]['sentiment']
        else:
            new_features[feature] = last_known.iloc[-1][feature]

    # Predict next OHLC
    X_forecast = pd.DataFrame([new_features])
    pred_open = models['open_next'].predict(X_forecast)[0]
    pred_high = models['high_next'].predict(X_forecast)[0]
    pred_low = models['low_next'].predict(X_forecast)[0]
    pred_close = models['close_next'].predict(X_forecast)[0]

    forecast_rows.append({
        'timestamp': curr_time,
        'open': pred_open,
        'high': pred_high,
        'low': pred_low,
        'close': pred_close
    })

    # Prepare next row
    new_row = last_known.iloc[-1:].copy()
    new_row['open'] = pred_open
    new_row['high'] = pred_high
    new_row['low'] = pred_low
    new_row['close'] = pred_close

    # Update lags
    for col in ['close', 'open', 'high', 'low', 'volume', 'RSI', 'MACD', 'sentiment', 
                'MACD_signal', 'MACD_hist', 'Doji']:
        new_row[f'{col}_lag2'] = last_known.iloc[-1][f'{col}_lag1']
        new_row[f'{col}_lag1'] = pred_close if col == 'close' else last_known.iloc[-1][col]

    last_known = pd.concat([last_known, new_row], ignore_index=True)

# 📦 Save & plot
forecast_df = pd.DataFrame(forecast_rows)
forecast_df.to_csv('tomorrow_forecast.csv', index=False)
print("\n✅ Tomorrow's forecast saved to tomorrow_forecast.csv")

fig3 = go.Figure()
fig3.add_trace(go.Candlestick(
    x=forecast_df['timestamp'],
    open=forecast_df['open'], high=forecast_df['high'],
    low=forecast_df['low'], close=forecast_df['close'],
    name="Forecasted Candles"
))
fig3.update_layout(title="Tomorrow's Forecast (9:15 AM to 3:30 PM)", xaxis_title='Time', yaxis_title='Price', template='plotly_dark')
fig3.show()
