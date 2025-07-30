from fastapi import FastAPI, WebSocket, HTTPException, WebSocketDisconnect, APIRouter
from pydantic import BaseModel
from typing import List, Optional
from dags.Features.tools.candlestick_tool import AngelOneCandlestickTool
from dags.Features.tools.yfinance_tool import YFinanceFundamentalsTool
from dags.Features.tools.stock_news_tool import IndianStockNewsTool

import httpx
import csv
import io
import asyncio

app = FastAPI()

# from fastapi.middleware.cors import CORSMiddleware
# from ws_routes import router as ws_router

# app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CandlestickRequest(BaseModel):
    company_name: str
    stock_name: str
    exchange: str = "NSE"
    from_date: str | None = None
    to_date: str | None = None
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


# Add report
# @app.post("/reports/")
# async def add_report(report: ReportSchema):
#     result = await db.reports.insert_one(report.dict())
#     return {"id": str(result.inserted_id)}

# router = APIRouter()

# @router.websocket("/ws/candlesticks")
# async def candlestick_stream(websocket: WebSocket):
#     await websocket.accept()
#     try:
#         # Sample public CSV URL from Cloudinary
#         public_url = "https://res.cloudinary.com/dscl5nnzv/raw/upload/candlestick_pattern/tatamotors.ns_balance_sheet.csv.csv"
        
#         async with httpx.AsyncClient() as client:
#             response = await client.get(public_url)
#             csv_content = response.text
        
#         reader = csv.reader(io.StringIO(csv_content))
#         headers = next(reader)  # Skip headers

#         for row in reader:
#             if len(row) < 6:
#                 continue
#             payload = {
#                 "time": row[0],
#                 "open": float(row[1]),
#                 "high": float(row[2]),
#                 "low": float(row[3]),
#                 "close": float(row[4]),
#                 "volume": int(row[5])
#             }
#             await websocket.send_json(payload)
#             await asyncio.sleep(1)  # Delay for streaming effect

#     except WebSocketDisconnect:
#         print("WebSocket disconnected")
#     except Exception as e:
#         print("WebSocket error:", e)
#         await websocket.close(code=1003)

@app.post("/candlesticks/")
async def add_candlestick(request: CandlestickRequest):
    try:
        tool = AngelOneCandlestickTool()
        result = tool._run(
            company_name=request.company_name,
            stock_name=request.stock_name,
            exchange=request.exchange,
            from_date=request.from_date,
            to_date=request.to_date,
            interval=request.interval
        )
        return {"message": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

class SymbolRequest(BaseModel):
    stock_name: str

@app.post("/balance-sheet-and-ratios/")
async def add_balance_sheet(request: SymbolRequest):
    try:
        tool = YFinanceFundamentalsTool()
        result = await tool._arun(request.stock_name)
        return {
            "message": "✅ Balance sheet and ratios added successfully",
            "details": result
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
