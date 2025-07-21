from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from dags.Features.tools.candlestick_tool import AngelOneCandlestickTool
from dags.Features.tools.yfinance_tool import YFinanceFundamentalsTool
from dags.Features.tools.stock_news_tool import IndianStockNewsTool

app = FastAPI()

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
    
@app.post("/balance-sheet-and-ratios/")
async def add_balance_sheet(symbol: str):
    try:
        tool = YFinanceFundamentalsTool()
        result = await tool._arun(symbol)
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
