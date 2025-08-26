"use client";

import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "./UI/card";
import { Button } from "./UI/button";
import Input from "./UI/input";
import { motion } from "framer-motion";
import Header from "./Header";
import Footer from "./Footer";
import axios from "axios";
import { useTheme } from "../Hooks/useTheme";
import { useAuthWithBackend } from "../Hooks/useAuthWithBackend";
import { useNavigate } from "react-router-dom";
import {
  createChart,
  ColorType,
  CrosshairMode,
  PriceScaleMode,
} from "lightweight-charts";

export default function ForecastDashboard() {
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  // Form states
  const [company, setCompany] = useState("MRF");
  const [stock, setStock] = useState("MRF");
  const [exchange, setExchange] = useState("NSE");
  const [interval, setInterval] = useState("ONE_MINUTE");
  const [horizon, setHorizon] = useState(30);

  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  const { theme, toggleTheme } = useTheme();
  const { isSignedIn } = useAuthWithBackend();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSignedIn) {
      navigate("/");
    }
  }, [isSignedIn, navigate]);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:8000/forecast", {
        company_name: company,
        stock_name: stock,
        exchange: exchange,
        interval: interval,
        horizon: horizon,
      });
      setForecastData(response.data.forecast || []);
      setStats(response.data.stats || null);
    } catch (error) {
      console.error("Error fetching forecast:", error);
    }
    setLoading(false);
  };

  // Initialize candlestick chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Destroy old chart
    if (chartRef.current) {
      chartRef.current.remove();
    }

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
        scaleMargins: { top: 0.1, bottom: 0.3 },
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
    });

    volumeSeriesRef.current = chart.addHistogramSeries({
      color: "#8884d8",
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
      scaleMargins: { top: 0.7, bottom: 0.05 },
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.7, bottom: 0.05 },
      borderColor: isDark ? "#475569" : "#d1d5db",
    });

    return () => chart.remove();
  }, [theme]);

  // Update chart data
  useEffect(() => {
    if (!forecastData || forecastData.length === 0) return;
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return;

    const candles = forecastData
      .map((d) => ({
        time: Math.floor(new Date(d.timestamp).getTime() / 1000),
        open: +d.open,
        high: +d.high,
        low: +d.low,
        close: +d.close,
      }))
      .filter((d) => !isNaN(d.time))
      .sort((a, b) => a.time - b.time);

    const volumes = forecastData
      .map((d) => ({
        time: Math.floor(new Date(d.timestamp).getTime() / 1000),
        value: d.volume ? +d.volume : 0,
        color: +d.close > +d.open ? "#22c55e" : "#ef4444",
      }))
      .filter((d) => !isNaN(d.time));

    candleSeriesRef.current.setData(candles);
    volumeSeriesRef.current.setData(volumes);

    chartRef.current.timeScale().fitContent();
  }, [forecastData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      {/* Header */}
      <Header
        onLoginOpen={() => console.log("Get started clicked")}
        onNavigateToDashboardTab={(tab) => console.log("Navigate:", tab)}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <main className="flex-1 container mx-auto p-6">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"
        >
          AI-Powered Stock Forecast
        </motion.h1>

        {/* Input Form */}
        <Card className="bg-gray-900 border border-gray-700 mb-8">
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-gray-400 text-sm">Company</label>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="mt-1"
                placeholder="Company Name"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Stock Symbol</label>
              <Input
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="mt-1"
                placeholder="e.g. SBIN"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Exchange</label>
              <select
                value={exchange}
                onChange={(e) => setExchange(e.target.value)}
                className="w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg p-2"
              >
                <option value="NSE">NSE</option>
                <option value="BSE">BSE</option>
                <option value="NYSE">NYSE</option>
                <option value="NASDAQ">NASDAQ</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Interval</label>
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg p-2"
              >
                <option value="ONE_MINUTE">1 Minute</option>
                <option value="FIVE_MINUTE">5 Minutes</option>
                <option value="ONE_HOUR">1 Hour</option>
                <option value="ONE_DAY">1 Day</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Horizon (minutes)</label>
              <Input
                type="number"
                value={horizon}
                onChange={(e) => setHorizon(Number(e.target.value))}
                className="mt-1"
                min="1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center mb-8">
          <Button
            onClick={fetchForecast}
            disabled={loading}
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {loading ? "Fetching..." : "Get Forecast"}
          </Button>
        </div>

        {/* Forecast Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gray-900 border-cyan-500">
              <CardContent className="p-4 text-center">
                <p className="text-gray-400">Predicted Price</p>
                <h2 className="text-2xl font-bold text-cyan-400">
                  ${stats.predicted_price}
                </h2>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-green-500">
              <CardContent className="p-4 text-center">
                <p className="text-gray-400">Confidence</p>
                <h2 className="text-2xl font-bold text-green-400">
                  {stats.confidence}%
                </h2>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-purple-500">
              <CardContent className="p-4 text-center">
                <p className="text-gray-400">Trend Direction</p>
                <h2 className="text-2xl font-bold text-purple-400">
                  {stats.trend}
                </h2>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Forecast Candlestick Graph */}
        <Card className="bg-gray-900 border border-gray-700">
          <CardContent className="p-6">
            <div ref={chartContainerRef} className="w-full h-[500px]" />
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
