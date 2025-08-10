from fastapi import FastAPI, WebSocket, HTTPException, WebSocketDisconnect, APIRouter, Query
from pydantic import BaseModel
from typing import List, Optional
from dags.Features.tools.candlestick_tool import AngelOneCandlestickTool
from dags.Features.tools.yfinance_tool import YFinanceFundamentalsTool
from dags.Features.tools.stock_news_tool import IndianStockNewsTool
from fastapi.middleware.cors import CORSMiddleware
from websocket_manager import ConnectionManager
import json
import httpx
import csv
import io
import asyncio
import requests
import pandas as pd
from io import StringIO
from starlette.websockets import WebSocketState
import datetime
from main import run
from fastapi.responses import FileResponse
from main import run

app = FastAPI()

# from fastapi.middleware.cors import CORSMiddleware
# from ws_routes import router as ws_router

# app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




manager = ConnectionManager()
@app.websocket("/ws/candlestick")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)

    try:
        data = await websocket.receive_text()
        print("WebSocket received:", data)
        params = json.loads(data)

        required_fields = ["company_name", "stock_name", "exchange", "interval"]
        for field in required_fields:
            if field not in params or not params[field]:
                await websocket.send_json({"error": f"Missing required field: {field}"})
                return

        tool = AngelOneCandlestickTool()

        while websocket.application_state == WebSocketState.CONNECTED:
            try:
                result = tool._run(
                    company_name=params["company_name"],
                    stock_name=params["stock_name"],
                    exchange=params["exchange"],
                    interval=params["interval"]
                )

                csv_url = result if isinstance(result, str) else result.get("message")
                if not csv_url or not csv_url.startswith("http"):
                    await websocket.send_json({"error": f"Invalid CSV URL: {csv_url}"})
                    break

                async with httpx.AsyncClient() as client:
                    response = await client.get(csv_url)
                    decoded = response.content.decode("utf-8")
                    reader = csv.DictReader(io.StringIO(decoded))
                    records = []

                    for row in reader:
                        try:
                            ts = row.get("timestamp") or row.get("date")
                            if ts.endswith("Z"):
                                dt = datetime.datetime.strptime(ts, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=datetime.timezone.utc)
                            else:
                                dt = datetime.datetime.fromisoformat(ts).astimezone(datetime.timezone.utc)

                            row["timestamp"] = dt.strftime("%Y-%m-%dT%H:%M:%SZ")
                            records.append(row)
                        except Exception as e:
                            print(f"Error normalizing row: {e}")

                if websocket.application_state == WebSocketState.CONNECTED:
                    await websocket.send_json({"data": records})
                else:
                    print("WebSocket is disconnected before sending data.")
                    break

                await asyncio.sleep(60)

            except Exception as e:
                print("Loop error:", e)
                if websocket.application_state == WebSocketState.CONNECTED:
                    await websocket.send_json({"error": str(e)})
                else:
                    print("WebSocket is disconnected. Exiting loop.")
                    break

    except WebSocketDisconnect:
        print("WebSocket client disconnected.")
    except Exception as e:
        print("WebSocket error:", e)
    finally:
        manager.disconnect(websocket)
        print("WebSocket disconnected.")



class StockRequest(BaseModel):
    company_name: str
    stock_name: str
    exchange: str = "NSE"
    interval: str = "ONE_MINUTE"




class RatioItem(BaseModel):
    Metric: str
    Value: str

class BalanceSheetItem(BaseModel):
    Item: str
    Value: str

class FinancialRatiosSchema(BaseModel):
    symbol: str
    ratios: List[RatioItem]

class BalanceSheetSchema(BaseModel):
    symbol: str
    sheet: List[BalanceSheetItem]


@app.get("/generate_report")
def generate_report(
    company_name: str = Query(..., description="Company name"),
    stock_ticker: str = Query(..., description="Stock ticker symbol, e.g., RELIANCE.NSE")
):
    try:
        cloud_url = run(company_name, stock_ticker)
        return {
            "status": "success",
            "company": company_name,
            "stock_ticker": stock_ticker,
            "report_url": cloud_url
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/candlesticks/")
async def add_candlestick(request: StockRequest):
    print("Received:", request)
    try:
        tool = AngelOneCandlestickTool()
        result = tool._run(
            company_name=request.company_name,
            stock_name=request.stock_name,
            exchange=request.exchange,
            interval=request.interval
        )
        print("Result:", result)
        return {"message": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/balance-sheet-and-ratios/")
async def add_balance_sheet(symbol: str):
    try:
        tool = YFinanceFundamentalsTool()
        result = await tool._arun(symbol)
        urls = result.strip().split("\n")

        return {
            "message": "✅ Balance sheet and ratios added successfully",
            "details": urls
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"❌ {str(e)}")



@app.get("/news/{company_name}")
def get_news(company_name: str):
    try:
        tool = IndianStockNewsTool()
        result = tool._run(company_name)
        return {"result": result}
    except Exception as e:
        return {"error": str(e)}
