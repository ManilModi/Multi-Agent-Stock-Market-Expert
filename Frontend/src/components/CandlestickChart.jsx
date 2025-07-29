"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  PriceScaleMode,
} from "lightweight-charts";
import Header from "./Header";
import Footer from "./Footer"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./UI/card";
import { useTheme } from "../Hooks/useTheme"

export default function CandlestickChart() {
  const chartContainerRef = useRef();
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const socketRef = useRef(null);

  const [chartData, setChartData] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const { theme, toggleTheme } = useTheme()

  const [formData, setFormData] = useState({
    company_name: "TATAMOTORS",
    stock_name: "TATAMOTORS",
    exchange: "NSE",
    from_date: "",
    to_date: "",
    interval: "ONE_MINUTE",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(formData));
    } else {
      console.error("❌ WebSocket not connected");
    }
  };

  const handleGetStarted = () => {
    // Handle login modal opening
    console.log("Get started clicked")
  }

  const handleNavigateToDashboardTab = (tab) => {
    // Handle navigation to dashboard tab
    console.log("Navigate to dashboard tab:", tab)
  }

  // WebSocket setup
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:5000");
    socketRef.current = socket;

    socket.onopen = () => {
      setWsConnected(true);
      console.log("✅ WebSocket connected");
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.data) {
          setChartData(message.data);
        } else if (message.error) {
          console.error("❌ WebSocket Error:", message.error);
        }
      } catch (err) {
        console.error("❌ Invalid WebSocket message:", err.message);
      }
    };

    socket.onclose = () => {
      setWsConnected(false);
      console.log("🔌 WebSocket disconnected");
    };

    return () => {
      socket.close();
    };
  }, []);

  // Chart setup
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { type: ColorType.Solid, color: "#ffffff" },
        textColor: "#333",
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      grid: {
        vertLines: { color: "#eee" },
        horzLines: { color: "#eee" },
      },
      rightPriceScale: {
        scaleMargins: {
          top: 0.2,
          bottom: 0.2,
        },
        mode: PriceScaleMode.Normal,
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    console.log('Chart instance:', chart);
    console.log('Available methods:', Object.keys(chart));


    chartRef.current = chart;

    candleSeriesRef.current = chart.addCandlestickSeries({
      upColor: "#4ade80",
      downColor: "#f87171",
      borderVisible: false,
      wickUpColor: "#4ade80",
      wickDownColor: "#f87171",
    });

    volumeSeriesRef.current = chart.addHistogramSeries({
      color: "#8884d8",
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "",
      scaleMargins: {
        top: 0.9,
        bottom: 0,
      },
    });

    return () => {
      chart.remove();
    };
  }, []);

  // Update chart data
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || !chartData.length) return;

    const candles = chartData.map((d) => ({
      time: Math.floor(new Date(d.timestamp).getTime() / 1000),
      open: +d.open,
      high: +d.high,
      low: +d.low,
      close: +d.close,
    }));

    const volumes = chartData.map((d) => ({
      time: Math.floor(new Date(d.timestamp).getTime() / 1000),
      value: +d.volume,
      color: +d.close > +d.open ? "#4ade80" : "#f87171",
    }));

    candleSeriesRef.current.setData(candles);
    volumeSeriesRef.current.setData(volumes);
  }, [chartData]);

  return (
    
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      {/* Header */}
      <Header onLoginOpen={handleGetStarted} onNavigateToDashboardTab={handleNavigateToDashboardTab} />

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
    
    <Card>
      <CardHeader>
        <CardTitle>📈 AngelOne-style Candlestick Chart</CardTitle>
        <CardDescription>
          Real-time stock data using WebSockets + Lightweight Charts v5
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="grid md:grid-cols-3 gap-4 mb-6"
        >
          <input
            type="text"
            name="company_name"
            value={formData.company_name}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="stock_name"
            value={formData.stock_name}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <select
            name="interval"
            value={formData.interval}
            onChange={handleChange}
            className="border p-2 rounded"
          >
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
          <button
            type="submit"
            className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
          >
            🚀 Start Stream
          </button>
        </form>

        <div
          ref={chartContainerRef}
          className="w-full rounded shadow border"
        />
      </CardContent>
    </Card>
    </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
