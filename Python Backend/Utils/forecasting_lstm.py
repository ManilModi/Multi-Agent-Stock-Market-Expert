import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
import plotly.graph_objs as go
import plotly.io as pio
pio.renderers.default = 'browser'

# --- Load and preprocess data ---
df = pd.read_csv('final_dataset_with_sentiment_and_features.csv')
df['timestamp'] = pd.to_datetime(df['timestamp'])
df = df.sort_values('timestamp')

# Lag features
for col in ['close', 'open', 'high', 'low', 'volume', 'RSI', 'MACD', 'sentiment', 'MACD_signal', 'MACD_hist', 'Doji']:
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

# Interaction
df['rsi_sentiment'] = df['RSI'] * df['sentiment']

df.dropna(inplace=True)

# Targets
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
X = df[features].values
y = df[['open_next', 'high_next', 'low_next', 'close_next']].values

# --- Scale features and targets ---
scaler_X = StandardScaler()
scaler_y = StandardScaler()
X_scaled = scaler_X.fit_transform(X)
y_scaled = scaler_y.fit_transform(y)

# --- Create sequences ---
SEQ_LEN = 10
def create_sequences(X, y, seq_len):
    xs, ys = [], []
    for i in range(len(X)-seq_len):
        xs.append(X[i:i+seq_len])
        ys.append(y[i+seq_len])
    return np.array(xs), np.array(ys)

X_seq, y_seq = create_sequences(X_scaled, y_scaled, SEQ_LEN)

# Split (no shuffle)
split_idx = int(len(X_seq)*0.9)
X_train, X_test = X_seq[:split_idx], X_seq[split_idx:]
y_train, y_test = y_seq[:split_idx], y_seq[split_idx:]

# --- Dataset ---
class OHLC_Dataset(Dataset):
    def __init__(self, X, y):
        self.X = torch.tensor(X, dtype=torch.float32)
        self.y = torch.tensor(y, dtype=torch.float32)
    def __len__(self): return len(self.X)
    def __getitem__(self, idx): return self.X[idx], self.y[idx]

train_dl = DataLoader(OHLC_Dataset(X_train, y_train), batch_size=32, shuffle=False)
test_dl = DataLoader(OHLC_Dataset(X_test, y_test), batch_size=32, shuffle=False)

# --- Model with dropout ---
class LSTMModel(nn.Module):
    def __init__(self, input_size, hidden_size=32, num_layers=2, dropout=0.3):
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True, dropout=dropout)
        self.fc = nn.Linear(hidden_size, 4)
    def forward(self, x):
        out, _ = self.lstm(x)
        return self.fc(out[:, -1, :])

model = LSTMModel(input_size=X.shape[1])
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
loss_fn = nn.MSELoss()

# --- Train ---
for epoch in range(20):
    model.train()
    losses = []
    for xb, yb in train_dl:
        optimizer.zero_grad()
        pred = model(xb)
        loss = loss_fn(pred, yb)
        loss.backward()
        optimizer.step()
        losses.append(loss.item())
    print(f"Epoch {epoch+1}, Loss: {np.mean(losses):.4f}")

# --- Predict ---
model.eval()
with torch.no_grad():
    preds = []
    for xb, _ in test_dl:
        pred = model(xb)
        preds.append(pred.numpy())
    y_pred_scaled = np.vstack(preds)

# --- Inverse scale predictions and targets ---
y_pred = scaler_y.inverse_transform(y_pred_scaled)
y_test_inv = scaler_y.inverse_transform(y_test)

# --- Evaluate ---
print("\n✅ Model Evaluation Metrics:")
for i, col in enumerate(['open_next', 'high_next', 'low_next', 'close_next']):
    mae = mean_absolute_error(y_test_inv[:, i], y_pred[:, i])
    rmse = np.sqrt(mean_squared_error(y_test_inv[:, i], y_pred[:, i]))
    r2 = r2_score(y_test_inv[:, i], y_pred[:, i])
    print(f"{col}: MAE={mae:.4f}, RMSE={rmse:.4f}, R²={r2:.4f}")

# --- Plot actual vs predicted close ---
pred_df = pd.DataFrame({
    'actual_close': y_test_inv[:,3],
    'pred_close': y_pred[:,3]
})
fig = go.Figure()
fig.add_trace(go.Scatter(y=pred_df['actual_close'], mode='lines', name='Actual Close'))
fig.add_trace(go.Scatter(y=pred_df['pred_close'], mode='lines', name='Predicted Close'))
fig.update_layout(title='Actual vs Predicted Close (LSTM)', template='plotly_dark')
fig.show()

# --- Candlestick chart ---
candlestick = pd.DataFrame(y_test_inv, columns=['open_next', 'high_next', 'low_next', 'close_next'])
candlestick['pred_close'] = y_pred[:,3]
fig2 = go.Figure()
fig2.add_trace(go.Candlestick(
    x=candlestick.index,
    open=candlestick['open_next'], high=candlestick['high_next'],
    low=candlestick['low_next'], close=candlestick['close_next'],
    name='Actual'
))
fig2.add_trace(go.Scatter(
    x=candlestick.index, y=candlestick['pred_close'],
    mode='lines', name='Predicted Close', line=dict(color='cyan')
))
fig2.update_layout(title='Actual Candlestick with Predicted Close (LSTM)', template='plotly_dark')
fig2.show()
