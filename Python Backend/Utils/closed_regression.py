import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.model_selection import TimeSeriesSplit, RandomizedSearchCV
import xgboost as xgb
import joblib
import plotly.graph_objects as go
import plotly.io as pio

# --------------------
# Load dataset
# --------------------
df = pd.read_csv("./datasets/sbi_candles_angel.csv", parse_dates=["timestamp"])
df = df[["timestamp", "open", "high", "low", "close", "volume", "RSI", "MACD", "MACD_signal", "MACD_hist"]]

# --------------------
# Feature Engineering
# --------------------
# Create lag features for past 60 minutes
window = 60
for lag in range(1, window+1):
    df[f"lag_close_{lag}"] = df["close"].shift(lag)

df = df.dropna().reset_index(drop=True)

# Features = OHLCV + indicators + lags
feature_cols = ["open", "high", "low", "close", "volume", "RSI", "MACD", "MACD_signal", "MACD_hist"] + \
               [f"lag_close_{i}" for i in range(1, window+1)]

X = df[feature_cols]
y = df["close"]

# Scale features
scaler = MinMaxScaler()
X_scaled = scaler.fit_transform(X)

# --------------------
# Train/Test Split (80/20)
# --------------------
split = int(len(X_scaled) * 0.8)
X_train, X_test = X_scaled[:split], X_scaled[split:]
y_train, y_test = y[:split], y[split:]

# --------------------
# XGBoost Model + Hyperparameter Tuning
# --------------------
xgb_model = xgb.XGBRegressor(objective="reg:squarederror", n_jobs=-1)

param_grid = {
    "n_estimators": [100, 200, 300, 500],
    "max_depth": [3, 5, 7, 9],
    "learning_rate": [0.01, 0.05, 0.1, 0.2],
    "subsample": [0.6, 0.8, 1.0],
    "colsample_bytree": [0.6, 0.8, 1.0],
    "gamma": [0, 0.1, 0.2, 0.3]
}

tscv = TimeSeriesSplit(n_splits=5)
random_search = RandomizedSearchCV(
    estimator=xgb_model,
    param_distributions=param_grid,
    n_iter=20,
    cv=tscv,
    scoring="neg_mean_squared_error",
    verbose=1,
    n_jobs=-1,
    random_state=42
)

random_search.fit(X_train, y_train)
best_model = random_search.best_estimator_

print("✅ Best Parameters:", random_search.best_params_)

# --------------------
# Model Evaluation
# --------------------
y_pred = best_model.predict(X_test)

mse = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print("📊 XGBoost Model Performance:")
print(f"➡️ MSE:  {mse:.4f}")
print(f"➡️ RMSE: {rmse:.4f}")
print(f"➡️ MAE:  {mae:.4f}")
print(f"➡️ R²:   {r2:.4f}")

# --------------------
# Recursive Forecast for Next 5 Days
# --------------------
minutes_per_day = 390
n_future = 5 * minutes_per_day

last_features = df.iloc[-1][feature_cols].values.reshape(1, -1)
future_preds = []

for _ in range(n_future):
    # Predict next close
    next_close = best_model.predict(last_features)[0]
    future_preds.append(next_close)

    # Shift lag features
    last_row = last_features.flatten()
    new_lags = np.roll(last_row[-window:], 1)
    new_lags[0] = next_close

    # Construct new feature vector
    new_features = np.concatenate([
        last_row[:9],  # keep OHLCV+indicators same (static)
        new_lags
    ])

    last_features = new_features.reshape(1, -1)

# --------------------
# Build forecast DataFrame
# --------------------
future_dates = pd.date_range(df["timestamp"].iloc[-1], periods=n_future + 1, freq="T")[1:]
forecast_df = pd.DataFrame({
    "timestamp": future_dates,
    "close": future_preds
})

# --------------------
# Plot
# --------------------
fig = go.Figure()

# Historical
fig.add_trace(go.Scatter(
    x=df["timestamp"].iloc[-200:], 
    y=df["close"].iloc[-200:], 
    mode="lines", 
    name="Historical Close"
))

# Predictions
fig.add_trace(go.Scatter(
    x=forecast_df["timestamp"], 
    y=forecast_df["close"], 
    mode="lines", 
    name="Predicted Close"
))

fig.update_layout(
    title="Close Price Prediction (XGBoost, Next 5 Days)",
    xaxis_title="Time",
    yaxis_title="Close Price"
)

pio.renderers.default = "browser"
fig.show()

best_model.save_model("xgb_model.json")
print("✅ XGBoost Model saved as xgb_model.json")

# --------------------
# Save Model + Scaler
# --------------------
joblib.dump(best_model, "sbi_xgboost_close_model.pkl")
print("✅ XGBoost Model saved as sbi_xgboost_close_model.pkl")

joblib.dump(scaler, "sbi_xgb_scaler.pkl")
print("✅ Scaler saved as sbi_xgb_scaler.pkl")

forecast_df.to_csv("sbi_forecast_5days_xgb.csv", index=False)
print("✅ Forecast saved to sbi_forecast_5days_xgb.csv")
