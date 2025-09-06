import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import Header from "./Header";
import Footer from "./Footer";
import { useTheme } from "../Hooks/useTheme";
import AIFinanceLoader from "./reportLoader";
import { useAuthWithBackend } from "../Hooks/useAuthWithBackend";

// 🔹 Helper to parse sections from markdown using headings
function parseReportSections(markdown) {
  const getSection = (heading) => {
    const regex = new RegExp(`##\\s+${heading}[\\s\\S]*?(?=\\n##|$)`, "i");
    const match = markdown.match(regex);
    return match
      ? match[0].replace(new RegExp(`##\\s+${heading}`, "i"), "").trim()
      : null;
  };

  return {
    fundamentals: getSection("1. Company Overview and Key Financial Ratios"),
    balanceSheet: getSection("2. Balance Sheet Summary"),
    technicals: getSection("3. Technical Analysis"),
    recommendation: getSection("5. Final Recommendation"),
  };
}

// 🔹 Styled Cards (catchy version)
function SectionCard({ title, emoji, content, gradient, delay, theme }) {
  return (
    <motion.div
      className={`relative bg-gradient-to-br ${gradient} p-6 rounded-2xl shadow-xl mb-8 border border-gray-200 dark:border-gray-700`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{emoji}</span>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
      </div>

      <hr className="border-gray-300 dark:border-gray-600 mb-4" />

      {/* Content */}
      <div
        className={`prose max-w-none ${
          theme === "dark"
            ? "prose-invert text-gray-100"
            : "text-gray-900"
        } prose-headings:text-xl prose-headings:font-semibold`}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </motion.div>
  );
}

export default function AIReports() {
  const [companyName, setCompanyName] = useState("");
  const [stockTicker, setStockTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportUrl, setReportUrl] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [sections, setSections] = useState(null);

  const { theme, toggleTheme } = useTheme();
  const { isSignedIn } = useAuthWithBackend();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSignedIn) {
      navigate("/"); // redirect to login
    }
  }, [isSignedIn, navigate]);

  const fetchReport = async () => {
    if (!companyName || !stockTicker) {
      alert("Please enter both company name and stock ticker");
      return;
    }

    setLoading(true);
    setReportUrl("");
    setMarkdown("");
    setSections(null);

    try {
      const res = await axios.get("http://localhost:8000/generate_report", {
        params: { company_name: companyName, stock_ticker: stockTicker },
      });

      if (res.data.status === "success" && res.data.report_url) {
        setReportUrl(res.data.report_url);

        const mdRes = await axios.get(res.data.report_url, {
          responseType: "text",
        });
        setMarkdown(mdRes.data);
        setSections(parseReportSections(mdRes.data));
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
        onLoginOpen={() => {}}
        onNavigateToDashboardTab={() => {}}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <div className="max-w-5xl mx-auto p-6">
        {/* Title */}
        <motion.h2
          className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 mb-8 text-center"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          📊 AI Investment Report Generator
        </motion.h2>

        {/* Input Section */}
        <motion.div
          className="flex flex-wrap gap-3 mb-10 bg-white/70 dark:bg-slate-800/70 p-6 rounded-2xl shadow-lg backdrop-blur-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <input
            type="text"
            placeholder="Company Name (e.g., RELIANCE)"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="flex-1 border border-gray-300 dark:border-gray-600 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-400 dark:bg-slate-700 dark:text-white"
          />
          <input
            type="text"
            placeholder="Stock Ticker (e.g., RELIANCE.NSE)"
            value={stockTicker}
            onChange={(e) => setStockTicker(e.target.value)}
            className="flex-1 border border-gray-300 dark:border-gray-600 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-400 dark:bg-slate-700 dark:text-white"
          />
          <button
            onClick={fetchReport}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:from-blue-600 hover:to-indigo-600 transition disabled:opacity-50"
          >
            {loading ? "⏳ Generating..." : "🚀 Generate Report"}
          </button>
        </motion.div>

        {/* Report URL */}
        {reportUrl && (
          <div className="mb-8 bg-white/40 dark:bg-slate-800/40 p-4 rounded-lg shadow backdrop-blur">
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

        {/* Loader or Report */}
        {loading ? (
          <AIFinanceLoader loading={true} estimatedTime="≈ 2–3 min" />
        ) : sections ? (
          <>
            {sections.fundamentals && (
              <SectionCard
                title="Key Fundamentals"
                emoji="📊"
                content={sections.fundamentals}
                gradient="from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800"
                delay={0.1}
                theme={theme}
              />
            )}
            {sections.balanceSheet && (
              <SectionCard
                title="Balance Sheet Summary"
                emoji="📑"
                content={sections.balanceSheet}
                gradient="from-green-100 to-green-200 dark:from-green-900 dark:to-green-800"
                delay={0.2}
                theme={theme}
              />
            )}
            {sections.technicals && (
              <SectionCard
                title="Technical Analysis"
                emoji="📈"
                content={sections.technicals}
                gradient="from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800"
                delay={0.3}
                theme={theme}
              />
            )}
            {sections.recommendation && (
              <SectionCard
                title="Final Recommendation"
                emoji="✅"
                content={sections.recommendation}
                gradient="from-yellow-100 to-yellow-200 dark:from-yellow-900 dark:to-yellow-800"
                delay={0.4}
                theme={theme}
              />
            )}
          </>
        ) : (
          markdown && (
            <motion.div
              className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                className={`${
                  theme === "dark" ? "text-gray-100" : "text-gray-900"
                }`}
              >
                {markdown}
              </ReactMarkdown>
            </motion.div>
          )
        )}
      </div>

      <Footer theme={theme} />
    </div>
  );
}
