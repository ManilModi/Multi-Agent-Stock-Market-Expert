"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./UI/card"

import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Bar,
  Line,
} from "recharts"



export default function CandlestickChart() {
  const [chartData, setChartData] = useState([])
  const [wsConnected, setWsConnected] = useState(false)
  const socketRef = useRef(null)

  // Form state
  const [formData, setFormData] = useState({
    company_name: "TATAMOTORS",
    stock_name: "TATAMOTORS",
    exchange: "NSE",
    from_date: "2024-07-01",
    to_date: "2024-07-27",
    interval: "ONE_MINUTE",
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(formData))
    } else {
      console.error("WebSocket is not connected")
    }
  }

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:5000")
    socketRef.current = socket

    socket.onopen = () => {
      setWsConnected(true)
      console.log("✅ WebSocket connected")
    }

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.data) {
        setChartData(message.data)
      } else if (message.error) {
        console.error("❌ WebSocket Error:", message.error)
      }
    }

    socket.onclose = () => {
      setWsConnected(false)
      console.log("🔌 WebSocket disconnected")
    }

    return () => {
      socket.close()
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>📊 Live Candlestick Chart</CardTitle>
        <CardDescription>Streaming OHLCV data via WebSocket from FastAPI → Cloudinary → Express</CardDescription>
      </CardHeader>

      <CardContent>
        {/* Form to trigger FastAPI POST */}
        <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-4 mb-6">
          <input
            type="text"
            name="company_name"
            value={formData.company_name}
            onChange={handleChange}
            placeholder="Company Name"
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="stock_name"
            value={formData.stock_name}
            onChange={handleChange}
            placeholder="Stock Symbol"
            className="border p-2 rounded"
          />
          <select name="interval" value={formData.interval} onChange={handleChange} className="border p-2 rounded">
            <option value="ONE_MINUTE">1M</option>
            <option value="FIVE_MINUTE">5M</option>
            <option value="FIFTEEN_MINUTE">15M</option>
            <option value="ONE_HOUR">1H</option>
            <option value="ONE_DAY">1D</option>
          </select>
          <input
            type="date"
            name="from_date"
            value={formData.from_date}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="date"
            name="to_date"
            value={formData.to_date}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700">
            🚀 Start Stream
          </button>
        </form>

        {/* Live chart display */}
        <div className="h-96 bg-gray-100 rounded-lg overflow-x-auto p-4 relative">
          
        <ResponsiveContainer width="100%" height={400}>
  <ComposedChart data={chartData}>
    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
    <XAxis dataKey="timestamp" />
    <YAxis domain={['dataMin - 10', 'dataMax + 10']} />
    <Tooltip />

    {/* Candle body */}
    <Bar
      dataKey="close"
      fill="#8884d8"
      shape={({ x, y, width, height, payload }) => {
        const open = +payload.open
        const close = +payload.close
        const high = +payload.high
        const low = +payload.low

        const candleColor = close > open ? "#4ade80" : "#f87171"
        const bodyY = Math.min(y, y + height)
        const bodyHeight = Math.abs(height)

        return (
          <g>
            {/* Wick */}
            <line
              x1={x + width / 2}
              x2={x + width / 2}
              y1={y + (open < close ? 0 : bodyHeight)}
              y2={y + (open > close ? 0 : bodyHeight)}
              stroke="#555"
            />
            {/* Candle Body */}
            <rect
              x={x}
              y={bodyY}
              width={width}
              height={Math.max(bodyHeight, 1)}
              fill={candleColor}
            />
          </g>
        )
      }}
    />
  </ComposedChart>
</ResponsiveContainer>


          {/* LIVE indicator */}
          <div className="absolute top-2 right-4 flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${wsConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}></div>
            <span className="text-sm text-gray-600">LIVE</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
