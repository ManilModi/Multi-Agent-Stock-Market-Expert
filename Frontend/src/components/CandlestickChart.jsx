"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./UI/card"

export default function CandlestickChart({ data = [] }) {
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL")
  const [timeframe, setTimeframe] = useState("1D")

  // Mock candlestick data
  const mockData = [
    { time: "09:30", open: 150, high: 155, low: 148, close: 153, volume: 1000000 },
    { time: "10:00", open: 153, high: 157, low: 151, close: 156, volume: 1200000 },
    { time: "10:30", open: 156, high: 159, low: 154, close: 158, volume: 980000 },
    { time: "11:00", open: 158, high: 162, low: 157, close: 160, volume: 1100000 },
    { time: "11:30", open: 160, high: 163, low: 158, close: 161, volume: 950000 },
  ]

  const symbols = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN"]
  const timeframes = ["1M", "5M", "15M", "1H", "1D"]

  useEffect(() => {
    const ws = new WebSocket("ws://127.0.0.1:8000/ws/candlesticks");
  
    ws.onopen = () => {
      ws.send(JSON.stringify({
        company_name: "MRF",
        stock_name: "MRF",
        exchange: "NSE",
        from_date: "",
        to_date: "",
        interval: "ONE_MINUTE"
      }));
    };
  
    ws.onmessage = async (event) => {
      const { csv_url } = JSON.parse(event.data);
      const response = await fetch(csv_url);
      const text = await response.text();
      const parsedData = parseCSV(text); // You'll implement this
      setChartData(parsedData); // Your state update
    };
  
    return () => ws.close();
  }, []);
  

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Live Candlestick Chart</CardTitle>
            <CardDescription>Real-time OHLCV data visualization</CardDescription>
          </div>
          <div className="flex space-x-2">
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              {symbols.map((symbol) => (
                <option key={symbol} value={symbol}>
                  {symbol}
                </option>
              ))}
            </select>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              {timeframes.map((tf) => (
                <option key={tf} value={tf}>
                  {tf}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center relative overflow-hidden">
          {/* Chart Container */}
          <div className="w-full h-full p-4">
            <div className="grid grid-cols-5 gap-2 h-full">
              {mockData.map((candle, index) => {
                const isGreen = candle.close > candle.open
                const bodyHeight = Math.abs(candle.close - candle.open) * 2
                const wickTop = (candle.high - Math.max(candle.open, candle.close)) * 2
                const wickBottom = (Math.min(candle.open, candle.close) - candle.low) * 2

                return (
                  <div key={index} className="flex flex-col items-center justify-end h-full">
                    <div className="text-xs text-gray-600 mb-2">{candle.time}</div>
                    <div className="flex flex-col items-center">
                      {/* Upper wick */}
                      <div className="w-0.5 bg-gray-600" style={{ height: `${wickTop}px` }}></div>
                      {/* Body */}
                      <div
                        className={`w-8 ${isGreen ? "bg-green-500" : "bg-red-500"}`}
                        style={{ height: `${Math.max(bodyHeight, 2)}px` }}
                      ></div>
                      {/* Lower wick */}
                      <div className="w-0.5 bg-gray-600" style={{ height: `${wickBottom}px` }}></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">${candle.close}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Live indicator */}
          <div className="absolute top-4 right-4 flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-sm text-gray-600">LIVE</span>
          </div>
        </div>

        {/* Chart controls and info */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-gray-600">Current Price</div>
            <div className="font-semibold text-lg">$161.00</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-gray-600">Change</div>
            <div className="font-semibold text-lg text-green-600">+$3.50 (2.2%)</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-gray-600">Volume</div>
            <div className="font-semibold text-lg">1.1M</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-gray-600">Market Cap</div>
            <div className="font-semibold text-lg">$2.5T</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
