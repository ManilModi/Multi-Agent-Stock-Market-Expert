import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import plotly.graph_objects as go
import plotly.io as pio
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, LSTM, Dense, RepeatVector, TimeDistributed, Dropout
import joblib
from tensorflow.keras.losses import MeanSquaredError

# --------------------
# Load dataset
# --------------------
df = pd.read_csv("./datasets/sbi_candles_angel.csv", parse_dates=["timestamp"])
df = df[["timestamp", "open", "high", "low", "close", "volume", "RSI", "MACD", "MACD_signal", "MACD_hist"]]

# Scale features (using only price + volume here, but can add indicators)
scaler = MinMaxScaler()
scaled = scaler.fit_transform(df[["open", "high", "low", "close", "volume"]])

# --------------------
# Prepare sequences
# --------------------
window = 60   # use last 60 minutes (1 hour) history
horizon = 10  # predict next 10 minutes at once (multi-step Seq2Seq)

X, y = [], []
for i in range(window, len(scaled) - horizon):
    X.append(scaled[i - window:i])
    y.append(scaled[i:i + horizon, 0:4])  # predict OHLC only

X, y = np.array(X), np.array(y)

# --------------------
# Train/Test Split (80% train, 20% test)
# --------------------
split = int(len(X) * 0.8)
X_train, X_test = X[:split], X[split:]
y_train, y_test = y[:split], y[split:]

# --------------------
# Seq2Seq LSTM Model
# --------------------
latent_dim = 64

encoder_inputs = Input(shape=(window, X.shape[2]))
encoder_lstm = LSTM(latent_dim, return_state=True)
encoder_outputs, state_h, state_c = encoder_lstm(encoder_inputs)
encoder_states = [state_h, state_c]

# Decoder
decoder_inputs = RepeatVector(horizon)(encoder_outputs)
decoder_lstm = LSTM(latent_dim, return_sequences=True)(decoder_inputs, initial_state=encoder_states)
decoder_outputs = TimeDistributed(Dense(4))(decoder_lstm)  # OHLC

model = Model(encoder_inputs, decoder_outputs)
model.compile(optimizer="adam", loss=MeanSquaredError())

model.summary()

# --------------------
# Train
# --------------------
history = model.fit(
    X_train, y_train,
    epochs=20,
    batch_size=32,
    validation_data=(X_test, y_test),
    verbose=1
)

# --------------------
# Model Evaluation
# --------------------
y_pred = model.predict(X_test, verbose=0)

# Inverse scaling (add dummy volume for inverse_transform)
y_pred_rescaled = []
y_true_rescaled = []

for i in range(y_pred.shape[0]):
    pred = scaler.inverse_transform(
        np.hstack([y_pred[i], np.zeros((horizon, 1))])
    )[:, :4]
    true = scaler.inverse_transform(
        np.hstack([y_test[i], np.zeros((horizon, 1))])
    )[:, :4]
    y_pred_rescaled.append(pred)
    y_true_rescaled.append(true)

y_pred_rescaled = np.array(y_pred_rescaled).reshape(-1, 4)
y_true_rescaled = np.array(y_true_rescaled).reshape(-1, 4)

mse = mean_squared_error(y_true_rescaled, y_pred_rescaled)
rmse = np.sqrt(mse)
mae = mean_absolute_error(y_true_rescaled, y_pred_rescaled)
r2 = r2_score(y_true_rescaled, y_pred_rescaled)

print("📊 Model Performance on Test Data:")
print(f"➡️ MSE:  {mse:.4f}")
print(f"➡️ RMSE: {rmse:.4f}")
print(f"➡️ MAE:  {mae:.4f}")
print(f"➡️ R²:   {r2:.4f}")

# --------------------
# Predict next 5 days (recursive multi-step)
# --------------------
minutes_per_day = 390
n_future = 5 * minutes_per_day  # 5 trading days
last_seq = scaled[-window:]
future_preds = []

for _ in range(n_future // horizon):
    pred = model.predict(last_seq.reshape(1, window, X.shape[2]), verbose=0)[0]
    future_preds.append(pred)
    # slide the window forward
    last_seq = np.vstack([last_seq[horizon:], np.hstack([pred, np.tile(last_seq[-1, 4:], (horizon, 1))])])

future_preds = np.vstack(future_preds)

# inverse scaling
future_preds = scaler.inverse_transform(
    np.hstack([future_preds, np.zeros((future_preds.shape[0], 1))])
)[:, :4]

# --------------------
# Build forecast DataFrame
# --------------------
future_dates = pd.date_range(df["timestamp"].iloc[-1], periods=n_future + 1, freq="T")[1:]
forecast_df = pd.DataFrame({
    "timestamp": future_dates,
    "open": future_preds[:, 0],
    "high": future_preds[:, 1],
    "low": future_preds[:, 2],
    "close": future_preds[:, 3]
})

# --------------------
# Plot candlestick
# --------------------
fig = go.Figure()

# Historical last 200 minutes for context
fig.add_trace(go.Candlestick(
    x=df["timestamp"].iloc[-200:],
    open=df["open"].iloc[-200:],
    high=df["high"].iloc[-200:],
    low=df["low"].iloc[-200:],
    close=df["close"].iloc[-200:],
    name="Historical"
))

# Future predictions
fig.add_trace(go.Candlestick(
    x=forecast_df["timestamp"],
    open=forecast_df["open"],
    high=forecast_df["high"],
    low=forecast_df["low"],
    close=forecast_df["close"],
    name="Predicted"
))

fig.update_layout(
    title="Stock Price Prediction (Next 5 Trading Days) with Seq2Seq LSTM",
    xaxis_rangeslider_visible=False
)

pio.renderers.default = "browser"
fig.show()

# --------------------
# Save forecast to CSV
# --------------------
forecast_df.to_csv("sbi_forecast_5days_seq2seq.csv", index=False)
print("✅ Forecast saved to sbi_forecast_5days_seq2seq.csv")

# --------------------
# Save Model
# --------------------
model.save("sbi_seq2seq_model.h5")
print("✅ Seq2Seq Model saved as sbi_seq2seq_model.h5")

joblib.dump(scaler, "sbi_scaler.pkl")
print("✅ Scaler saved as sbi_scaler.pkl")
