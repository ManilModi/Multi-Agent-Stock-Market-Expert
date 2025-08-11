import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Header from "./Header";
import Footer from "./Footer";
import { useTheme } from "../Hooks/useTheme";
import AIFinanceLoader from "./reportLoader";
import { useAuthWithBackend } from "../Hooks/useAuthWithBackend";

export default function AIReports() {
  const [companyName, setCompanyName] = useState("");
  const [stockTicker, setStockTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportUrl, setReportUrl] = useState("");
  const [markdown, setMarkdown] = useState("");
  const { theme, toggleTheme } = useTheme();
  const { isSignedIn, user, userRole } = useAuthWithBackend()
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSignedIn) {
      navigate("/"); // redirect to login page
    }
  }, [isSignedIn, navigate]);

  const handleGetStarted = () => {
    console.log("Get started clicked");
  };

  const handleNavigateToDashboardTab = (tab) => {
    console.log("Navigate to dashboard tab:", tab);
  };

  const fetchReport = async () => {
    if (!companyName || !stockTicker) {
      alert("Please enter both company name and stock ticker");
      return;
    }

    setLoading(true);
    setReportUrl("");
    setMarkdown("");

    try {
      const res = await axios.get("http://localhost:8000/generate_report", {
        params: {
          company_name: companyName,
          stock_ticker: stockTicker,
        },
      });

      if (res.data.status === "success" && res.data.report_url) {
        setReportUrl(res.data.report_url);

        const mdRes = await axios.get(res.data.report_url, {
          responseType: "text",
        });
        setMarkdown(mdRes.data);
      } else {
        alert("Failed to generate report");
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      <Header
        onLoginOpen={handleGetStarted}
        onNavigateToDashboardTab={handleNavigateToDashboardTab}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <div className="max-w-5xl mx-auto p-6">
        {/* Title */}
        <h2 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 mb-6">
          📊 AI Investment Report Generator
        </h2>

        {/* Input Section */}
        <div className="flex flex-wrap gap-3 mb-6 bg-white/50 dark:bg-slate-800/50 p-4 rounded-xl shadow-lg backdrop-blur">
          <input
            type="text"
            placeholder="Company Name (e.g., RELIANCE)"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="flex-1 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 dark:bg-slate-700 dark:text-white"
          />
          <input
            type="text"
            placeholder="Stock Ticker (e.g., RELIANCE.NSE)"
            value={stockTicker}
            onChange={(e) => setStockTicker(e.target.value)}
            className="flex-1 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 dark:bg-slate-700 dark:text-white"
          />
          <button
            onClick={fetchReport}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-2 rounded-lg shadow-lg hover:from-blue-600 hover:to-indigo-600 transition disabled:opacity-50"
          >
            {loading ? "⏳ Generating..." : "🚀 Generate Report"}
          </button>
        </div>

        {/* Report URL */}
        {reportUrl && (
          <div className="mb-6 bg-white/40 dark:bg-slate-800/40 p-4 rounded-lg shadow backdrop-blur">
            <p className="font-medium text-gray-700 dark:text-gray-200">
              📂 Report URL:{" "}
              <a
                href={reportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 underline hover:opacity-80"
              >
                Download the Report
              </a>
            </p>
          </div>
        )}

        {/* Loader or Markdown */}
        {loading ? (
          <AIFinanceLoader loading={true} estimatedTime="≈ 2–3 min" />
        ) : (
          markdown && (
            <div
              className="animate-fadeIn p-8 rounded-2xl shadow-lg bg-white/80 dark:bg-slate-800/80 
              backdrop-blur-xl border border-gray-200 dark:border-gray-700 
              prose prose-lg dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white 
              prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-blue-600 dark:prose-a:text-blue-400
              prose-strong:text-gray-900 dark:prose-strong:text-white prose-code:bg-gray-100 dark:prose-code:bg-slate-700
              prose-table:border prose-table:border-gray-300 dark:prose-table:border-gray-600
              prose-th:bg-gray-200 dark:prose-th:bg-slate-700"
              style={{ animation: "fadeIn 0.5s ease-in-out" }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
            </div>
          )
        )}
      </div>

      <Footer theme={theme} />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
