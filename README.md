# 📈 FinSight – Multi-Agent Stock Market Intelligence

FinSight is a **MERN Stack + Python AI project** that brings together real-time financial data, AI-driven analysis, and multi-agent intelligence to empower investors, brokers, and companies with actionable market insights.

---

## 🏗️ Project Structure

The project is organized into three major folders:

- **frontend/** → React.js (component-based UI)  
- **backend/** → Node.js + Express + Mongoose (MongoDB Atlas as database)  
- **python-backend/** → FastAPI (Python ML/AI services & endpoints)  

---

## ⚙️ Tech Stack

- **Frontend:** React.js, Lightweight Charts (TradingView style), Plotly.js  
- **Backend:** Node.js, Express.js, MongoDB Atlas, Clerk (Authentication)  
- **Python Backend:** FastAPI, CrewAI (multi-agent framework), Transformers, ChromaDB  
- **Cloud & APIs:**  
  - Angel One SmartAPI (Candlestick data)  
  - Yahoo Finance (Balance sheet & ratios)  
  - News API (Real-time financial news)  
  - Cloudinary (CSV file storage)  
- **LLM:** Gemini 2.5 Pro (for multi-agent reasoning & report generation)  

---

## 🧠 Multi-Agentic AI Pipeline

Built using **Crew AI**, the pipeline consists of **6 agents**, all connected via **MCP (Model Context Protocol)**:

1. 🔎 **Web Scraping Agent** – extracts market data  
2. 📊 **Real-Time Candlestick Agent** – fetches OHLCV candlestick data  
3. 📑 **Balance Sheet Agent** – pulls company financial statements  
4. ⚖️ **Ratios Agent** – computes financial ratios in real-time  
5. 📰 **News Agent** – scrapes and analyzes financial news  
6. ✍️ **Summarizer Agent** – consolidates all data into human-readable insights  

Each agent uses specialized **tools** and produces structured outputs (CSV), stored in Cloudinary for downstream tasks.

---

## 🔧 Tools Integrated

- 📈 **Candlestick Data Tool** – Powered by Angel One Smart Connect SmartAPI  
- 🏦 **Financials Tool** – Balance sheet & ratios from Yahoo Finance  
- 📰 **News Tool** – Real-time financial news with sentiment analysis  

---

## 🌐 Core Features (Frontend)

### 🔑 Role-Based Access
- **Investor**
- **Broker**
- **Company**  
Authentication is handled using **Clerk (JWT & sessions)**.

### 📊 Real-Time Candlestick Charts
- Interactive charts (TradingView style) with multiple timeframes: `1m`, `15m`, `1h`, `1d`, `1w`  
- WebSocket updates every minute  
- Served via FastAPI endpoints  

### 🏦 Real-Time Financial Data
- Balance sheet & ratios (FastAPI + Yahoo Finance)  
- News + Sentiment Analysis (Transformers)  
- Visualization via Plotly.js  

### 🤖 Agentic RAG Chatbot
- Knowledge base built from candlestick data, ratios, balance sheets, and summaries  
- **ChromaDB** for vector embeddings  
- Context-aware financial Q&A  

### 📑 Agentic Report Generator
- Executes **all 6 agents in sequence**  
- Generates a **Markdown report** for any company:  
  - Market summary  
  - Technical indicators (RSI, MACD, EMA, candlestick patterns)  
  - Financial ratios & balance sheet analysis  
  - News sentiment  
  - **Recommendation:** Buy / Sell / Hold  

---

## 🚀 Future Plans

- 📂 Build a custom dataset combining:  
  - OHLCV candlestick data  
  - Technical indicators (RSI, MACD, EMA, etc.)  
  - Financial ratios  
  - News sentiments  

- 🤖 Train **Deep Learning LSTM models** for:  
  - Price prediction  
  - Time series forecasting  
  - Pattern recognition  

---

## 📌 Installation & Setup

### 1️⃣ Clone the repository
```bash
git clone https://github.com/yourusername/finsight.git
cd finsight
```
### 2️⃣ Install dependencies

**Frontend**
```bash
cd Frontend
npm i
npm run dev
```


**Backend (Use your own API secrets) **
```bash
cd Backend
npm i
npm run dev
```


**Python Backend**
```bash
cd Python Backend
py -3.10 -m venv venv
venv\Scripts\activate   # Windows
source venv/bin/activate # Mac/Linux

pip install -r requirements.txt
uvicorn app:app --reload
```


### 👨‍💻 Contributor

Manil Modi (@Manil Modi
) – Project Lead & AI Developer
