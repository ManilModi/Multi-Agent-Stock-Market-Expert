import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
import matplotlib.pyplot as plt

# === Step 1: Load and preprocess data ===
df = pd.read_csv('final_dataset_with_sentiment_and_features.csv')
df['timestamp'] = pd.to_datetime(df['timestamp'])
df = df.sort_values('timestamp')

# Feature engineering (same as before)
for col in ['close', 'open', 'high', 'low', 'volume', 'RSI', 'MACD', 'sentiment', 'MACD_signal', 'MACD_hist', 'Doji']:
    df[f'{col}_lag1'] = df[col].shift(1)
    df[f'{col}_lag2'] = df[col].shift(2)

df['close_roll_mean3'] = df['close'].rolling(3).mean()
df['close_roll_mean10'] = df['close'].rolling(10).mean()
df['close_roll_std3'] = df['close'].rolling(3).std()
df['volume_roll_mean3'] = df['volume'].rolling(3).mean()
df['volume_roll_mean10'] = df['volume'].rolling(10).mean()
df['volume_roll_std3'] = df['volume'].rolling(3).std()
df['close_change_pct'] = (df['close'] - df['close_lag1']) / df['close_lag1']
df['rsi_sentiment'] = df['RSI'] * df['sentiment']
df['hour'] = df['timestamp'].dt.hour
df['weekday'] = df['timestamp'].dt.weekday
df['month'] = df['timestamp'].dt.month

df.dropna(inplace=True)

# === Step 2: Features & target ===
target = 'close'
features = [col for col in df.columns if col not in ['timestamp', 'date', 'close']]
X = df[features].values
y = df[target].values

# === Step 3: Scale features ===
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# === Step 4: Create sequences ===
lookback = 10
X_seq, y_seq = [], []
for i in range(lookback, len(X_scaled)):
    X_seq.append(X_scaled[i - lookback:i])
    y_seq.append(y[i])

X_seq = np.array(X_seq)
y_seq = np.array(y_seq)

# === Step 5: Train/test split ===
split = int(len(X_seq) * 0.9)
X_train, X_test = X_seq[:split], X_seq[split:]
y_train, y_test = y_seq[:split], y_seq[split:]

# === Step 6: Convert to PyTorch tensors ===
X_train_tensor = torch.tensor(X_train, dtype=torch.float32)
y_train_tensor = torch.tensor(y_train, dtype=torch.float32).view(-1, 1)
X_test_tensor = torch.tensor(X_test, dtype=torch.float32)
y_test_tensor = torch.tensor(y_test, dtype=torch.float32).view(-1, 1)

# === Step 7: Dataloaders ===
batch_size = 32
train_dataset = TensorDataset(X_train_tensor, y_train_tensor)
train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=False)

# === Step 8: Define LSTM model ===
class LSTMModel(nn.Module):
    def __init__(self, input_dim, hidden_dim, num_layers=1):
        super(LSTMModel, self).__init__()
        self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_dim, 1)

    def forward(self, x):
        out, _ = self.lstm(x)
        out = out[:, -1, :]  # use last timestep
        out = self.fc(out)
        return out

input_dim = X_train.shape[2]
hidden_dim = 64

model = LSTMModel(input_dim, hidden_dim)
loss_fn = nn.MSELoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

# === Step 9: Train model ===
epochs = 30
for epoch in range(epochs):
    model.train()
    epoch_losses = []
    for xb, yb in train_loader:
        pred = model(xb)
        loss = loss_fn(pred, yb)
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        epoch_losses.append(loss.item())
    print(f"Epoch {epoch+1}/{epochs} - Loss: {np.mean(epoch_losses):.4f}")

# === Step 10: Predict ===
model.eval()
with torch.no_grad():
    y_pred_tensor = model(X_test_tensor)
y_pred = y_pred_tensor.numpy().flatten()

# === Step 11: Evaluate ===
mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)
mape = np.mean(np.abs((y_test - y_pred) / y_test)) * 100

print("\n✅ PyTorch LSTM Model Evaluation Metrics:")
print(f"MAE  : {mae:.2f}")
print(f"RMSE : {rmse:.2f}")
print(f"R²   : {r2:.4f}")
print(f"MAPE : {mape:.2f}%")

# === (Optional) Plot actual vs predicted ===
plt.figure(figsize=(10,5))
plt.plot(y_test, label='Actual')
plt.plot(y_pred, label='Predicted')
plt.legend()
plt.title("Actual vs Predicted Close Price")
plt.show()
