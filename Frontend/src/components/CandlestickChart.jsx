"use client"

import { useEffect, useRef, useState } from "react"
import { createChart, ColorType, CrosshairMode, PriceScaleMode } from "lightweight-charts"
import Header from "./Header"
import Footer from "./Footer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./UI/card"
import { useTheme } from "../Hooks/useTheme"

export default function CandlestickChart() {
  const chartContainerRef = useRef()
  const chartRef = useRef(null)
  const candleSeriesRef = useRef(null)
  const volumeSeriesRef = useRef(null)
  const socketRef = useRef(null)
  const [chartData, setChartData] = useState([])
  const [wsConnected, setWsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState("")
  const { theme, toggleTheme } = useTheme()
  const [formData, setFormData] = useState({
    company_name: "",
    stock_name: "",
    exchange: "NSE",
    interval: "ONE_MINUTE",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setConnectionError("");
    if (!formData.company_name || !formData.stock_name) {
      setConnectionError("Please fill all required fields.");
      return;
    }
  
    // Setting state will trigger useEffect
    setFormData({ ...formData });
  };
  

  const handleGetStarted = () => {
    // Handle login modal opening
    console.log("Get started clicked")
  }

  const handleNavigateToDashboardTab = (tab) => {
    // Handle navigation to dashboard tab
    console.log("Navigate to dashboard tab:", tab)
  }

  // WebSocket logic to fetch candlestick chart data
useEffect(() => {
  if (!formData.company_name || !formData.stock_name) {
    return;
  }
  

  const socket = new WebSocket("ws://localhost:8000/ws/candlestick");
  socketRef.current = socket;

  socket.onopen = () => {
    console.log(formData);
    console.log(wsConnected);
    console.log("✅ Connected");

    setWsConnected(true);
    socket.send(JSON.stringify(formData));
  };

  socket.onmessage = (event) => {
    console.log("📦 Message received:", event.data);
    try {
      const message = JSON.parse(event.data);
      if (message.data) {
        console.log("📊 Parsed chart data:", message.data); // log raw chart data
        setChartData(message.data);
      } else if (message.error) {
        console.error("❌ Server error:", message.error);
        setConnectionError("Server error: " + message.error);
      }
    } catch (err) {
      console.error("❌ Failed to parse WebSocket message:", err);
      setConnectionError("Failed to parse server response.");
    }
  };
  

  socket.onerror = (err) => {
    console.error("❌ WebSocket error:", err);
    setConnectionError("WebSocket encountered an error.");
  };

  socket.onclose = () => {
    setWsConnected(false);
    console.log("🔌 WebSocket disconnected");
  };

  return () => {
    socket.close();
  };
}, [formData]); // Rerun when formData changes


useEffect(() => {
  // Clear chart data when stock name changes
  candleSeriesRef.current?.setData([]);
  volumeSeriesRef.current?.setData([]);
}, [formData.stock_name]);

useEffect(() => {
  // Handle chart resize
  const handleResize = () => {
    if (chartRef.current && chartContainerRef.current) {
      chartRef.current.resize(chartContainerRef.current.clientWidth, 500);
    }
  };
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);

useEffect(() => {
  // Initialize chart with theming
  if (!chartContainerRef.current) return;

  const isDark = theme === "dark";

  const chart = createChart(chartContainerRef.current, {
    width: chartContainerRef.current.clientWidth,
    height: 500,
    layout: {
      background: { type: ColorType.Solid, color: isDark ? "#1e293b" : "#ffffff" },
      textColor: isDark ? "#e2e8f0" : "#333333",
    },
    crosshair: { mode: CrosshairMode.Normal },
    grid: {
      vertLines: { color: isDark ? "#334155" : "#eeeeee" },
      horzLines: { color: isDark ? "#334155" : "#eeeeee" },
    },
    rightPriceScale: {
      scaleMargins: { top: 0.1, bottom: 0.4 },
      mode: PriceScaleMode.Normal,
      borderColor: isDark ? "#475569" : "#d1d5db",
    },
    timeScale: {
      timeVisible: true,
      secondsVisible: false,
      borderColor: isDark ? "#475569" : "#d1d5db",
    },
  });

  chartRef.current = chart;

  candleSeriesRef.current = chart.addCandlestickSeries({
    upColor: "#22c55e",
    downColor: "#ef4444",
    borderVisible: false,
    wickUpColor: "#22c55e",
    wickDownColor: "#ef4444",
    priceScaleId: "right",
  });

  volumeSeriesRef.current = chart.addHistogramSeries({
    color: "#8884d8", // fallback (but overridden per bar below)
    priceFormat: { type: "volume" },
    priceScaleId: "volume",
    scaleMargins: { top: 0.7, bottom: 0.05 },
  });

  chart.priceScale("volume").applyOptions({
    scaleMargins: { top: 0.7, bottom: 0.05 },
    borderColor: isDark ? "#475569" : "#d1d5db",
  });

  // candleSeriesRef.current = null;
  // volumeSeriesRef.current = null;
  // chartRef.current = null;

  return () => {
    chart.remove();
    candleSeriesRef.current = null;
    volumeSeriesRef.current = null;
    chartRef.current = null;
  };
  
}, [theme]);

useEffect(() => {
  if (!chartData || chartData.length === 0) return;

  const candles = chartData.map(d => ({
    time: Math.floor(new Date(d.timestamp).getTime() / 1000),
    open: +d.open,
    high: +d.high,
    low: +d.low,
    close: +d.close,
  }));

  const volumes = chartData.map(d => ({
    time: Math.floor(new Date(d.timestamp).getTime() / 1000),
    value: Math.max(0, +d.volume),
    color: +d.close > +d.open ? "#22c55e" : "#ef4444"
  }));

  candleSeriesRef.current?.setData(candles);
  volumeSeriesRef.current?.setData(volumes);
}, [chartData]);



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      {/* Header */}
      <Header
        onLoginOpen={handleGetStarted}
        onNavigateToDashboardTab={handleNavigateToDashboardTab}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-lg dark:shadow-slate-900/20 transition-colors duration-300">
          <CardHeader className="border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                  📈 AngelOne-style Candlestick Chart
                  <div className={`w-3 h-3 rounded-full ${wsConnected ? "bg-green-500" : "bg-red-500"}`} />
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Real-time stock data using WebSockets + Lightweight Charts v5
                  {wsConnected ? " (Connected)" : " (Using Mock Data)"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Connection Status */}
            {connectionError && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">{connectionError}</p>
                  </div>
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="grid md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg transition-colors duration-300"
            >
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Company Name</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  className="border border-gray-300 dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors duration-300"
                  placeholder="e.g., TATAMOTORS"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Stock Name</label>
                <input
                  type="text"
                  name="stock_name"
                  value={formData.stock_name}
                  onChange={handleChange}
                  className="border border-gray-300 dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors duration-300"
                  placeholder="e.g., TATAMOTORS"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Interval</label>
                <select
                  name="interval"
                  value={formData.interval}
                  onChange={handleChange}
                  className="border border-gray-300 dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors duration-300"
                >
                  <option value="ONE_MINUTE">1 Minute</option>
                  <option value="FIVE_MINUTE">5 Minutes</option>
                  <option value="FIFTEEN_MINUTE">15 Minutes</option>
                  <option value="ONE_HOUR">1 Hour</option>
                  <option value="ONE_DAY">1 Day</option>
                </select>
              </div>

              

              <div className="flex flex-col justify-end">
                <button
                  type="submit"
                  disabled={!wsConnected}
                  className={`px-4 py-2 rounded font-medium transition-colors duration-300 ${
                    wsConnected
                      ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      : "bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 cursor-not-allowed"
                  }`}
                >
                  🚀 {wsConnected ? "Start Stream" : "WebSocket Offline"}
                </button>
              </div>
            </form>

            <div className="border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden bg-white dark:bg-slate-800 transition-colors duration-300">
              <div ref={chartContainerRef} className="w-full" style={{ minHeight: "500px" }} />
            </div>

            {chartData.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg transition-colors duration-300">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Chart Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Data Points:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{chartData.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Latest Price:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      ₹{chartData[chartData.length - 1]?.close || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Latest Volume:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {chartData[chartData.length - 1]?.volume || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Last Updated:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {chartData[chartData.length - 1]?.timestamp
                        ? new Date(chartData[chartData.length - 1].timestamp).toLocaleTimeString()
                        : "N/A"}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {wsConnected ? "Live data from WebSocket" : "Demo data - WebSocket server not available"}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <Footer theme={theme} />
    </div>
  )
}
