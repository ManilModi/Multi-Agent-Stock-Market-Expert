import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, TimeSeriesSplit, GridSearchCV
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb
import plotly.graph_objs as go
import plotly.io as pio
pio.renderers.default = 'browser'

# Load data
df = pd.read_csv('./Final_Datasets/Final_dataset_with_sentiment_and_features.csv')
df['timestamp'] = pd.to_datetime(df['timestamp'])
df = df.sort_values('timestamp')

# Lag features
for col in ['close', 'open', 'high', 'low', 'volume', 'RSI', 'MACD', 'sentiment', 'MACD_signal', 'MACD_hist', 'Doji']:
    df[f'{col}_lag1'] = df[col].shift(1)
    df[f'{col}_lag2'] = df[col].shift(2)

# Rolling window features
df['close_roll_mean3'] = df['close'].rolling(3).mean()
df['close_roll_mean10'] = df['close'].rolling(10).mean()
df['close_roll_std3'] = df['close'].rolling(3).std()

df['volume_roll_mean3'] = df['volume'].rolling(3).mean()
df['volume_roll_mean10'] = df['volume'].rolling(10).mean()
df['volume_roll_std3'] = df['volume'].rolling(3).std()

# Price change %
df['close_change_pct'] = (df['close'] - df['close_lag1']) / df['close_lag1']

# Interaction
df['rsi_sentiment'] = df['RSI'] * df['sentiment']

# Time features
df['hour'] = df['timestamp'].dt.hour
df['weekday'] = df['timestamp'].dt.weekday
df['month'] = df['timestamp'].dt.month

# Drop NaNs
df.dropna(inplace=True)

# Target & features
target = 'close'
features = [col for col in df.columns if col not in ['timestamp', 'date', 'close']]

X = df[features]
y = df[target]

# Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.1, shuffle=False)

# Hyperparameter tuning (small example)
param_grid = {
    'n_estimators': [100, 200],
    'max_depth': [3, 5],
    'learning_rate': [0.05, 0.1],
    'subsample': [0.8, 1],
    'colsample_bytree': [0.8, 1]
}

model = xgb.XGBRegressor()
grid = GridSearchCV(model, param_grid, cv=TimeSeriesSplit(n_splits=3), scoring='r2', n_jobs=-1)
grid.fit(X_train, y_train)

best_model = grid.best_estimator_

# Predict
y_pred = best_model.predict(X_test)

# Evaluate
mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)
mape = np.mean(np.abs((y_test - y_pred) / y_test)) * 100

print("✅ Tuned Model Evaluation Metrics:")
print(f"MAE  : {mae:.2f}")
print(f"RMSE : {rmse:.2f}")
print(f"R²   : {r2:.4f}")
print(f"MAPE : {mape:.2f}%")
print(f"Best Params : {grid.best_params_}")



fig = go.Figure()
fig.add_trace(go.Scatter(y=y_test.values, mode='lines', name='Actual'))
fig.add_trace(go.Scatter(y=y_pred, mode='lines', name='Predicted'))
fig.update_layout(title='Actual vs Predicted Close Price',
                  xaxis_title='Time Index',
                  yaxis_title='Close Price',
                  template='plotly_dark')
fig.show()

feature_importance = pd.Series(best_model.feature_importances_, index=features)
feature_importance = feature_importance.sort_values(ascending=True)

fig2 = go.Figure()
fig2.add_trace(go.Bar(
    x=feature_importance.values,
    y=feature_importance.index,
    orientation='h'
))
fig2.update_layout(title='Feature Importance',
                   xaxis_title='Importance',
                   yaxis_title='Feature',
                   template='plotly_dark')
fig2.show()
