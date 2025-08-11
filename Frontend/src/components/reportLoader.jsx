// AIFinanceLoader.jsx
import React, { useEffect, useState } from "react";

/**
 * AIFinanceLoader
 * Props:
 *  - loading (bool) : show/hide loader. (default: true)
 *  - estimatedTime (string) : optional text like "≈ 2 minutes"
 */
export default function AIFinanceLoader({ loading = true, estimatedTime = "≈ 2 minutes" }) {
  const steps = [
    { key: "think", label: "Thinking", icon: BrainIcon },
    { key: "analyze", label: "Analyzing Market Trends", icon: ChartIcon },
    { key: "live", label: "Retrieving Live Data", icon: CloudDownloadIcon },
    { key: "search", label: "Searching Web", icon: SearchIcon },
    { key: "compile", label: "Compiling Report", icon: DocumentIcon },
  ];

  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0); // 0-100

  // advance active step and animate progress while loading
  useEffect(() => {
    if (!loading) return;

    setActive(0);
    setProgress(6); // small initial progress

    const stepInterval = 1600; // ms per step
    const progInterval = 150; // progress increment speed

    const stepTimer = setInterval(() => {
      setActive((s) => (s + 1) % steps.length);
    }, stepInterval);

    const progTimer = setInterval(() => {
      setProgress((p) => {
        // gently increase and loop back a bit to keep it lively:
        if (p >= 94) return p; // don't hit 100 while loading
        return p + (Math.random() * 3 + 1);
      });
    }, progInterval);

    return () => {
      clearInterval(stepTimer);
      clearInterval(progTimer);
    };
  }, [loading]);

  // small visual progress mapping by active step (for bar)
  useEffect(() => {
    // target progress roughly proportional to step
    const targ = Math.min(92, 6 + (active / (steps.length - 1)) * 90);
    let raf;
    const smooth = () => {
      setProgress((p) => {
        const next = p + (targ - p) * 0.15;
        return Math.abs(next - p) < 0.1 ? targ : next;
      });
      raf = requestAnimationFrame(smooth);
    };
    smooth();
    return () => cancelAnimationFrame(raf);
  }, [active]);

  if (!loading) return null;

  return (
    <div className="w-full flex flex-col items-center justify-center gap-6 py-8">
      <div className="w-full max-w-3xl bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200 dark:border-slate-700 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <LLMLogo className="w-12 h-12 p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-400 text-white shadow-md" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Generating AI Investment Report
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                An advanced financial LLM is synthesizing fundamentals, technicals & news — {estimatedTime}
              </p>
            </div>
          </div>

          <div className="text-sm text-slate-700 dark:text-slate-300">
            <span className="inline-flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.15" />
                <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <span>Multi-Agentic Expert Engine</span>
            </span>
          </div>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-3 mb-4 overflow-x-auto py-2">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === active;
            const isDone = i < active;
            return (
              <div
                key={s.key}
                className={`flex-shrink-0 flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200
                  ${isActive ? "bg-gradient-to-r from-indigo-600 to-emerald-400 text-white shadow-lg" : "bg-transparent"}
                  ${isDone ? "opacity-80" : "opacity-70"}
                `}
              >
                <div
                  className={`w-10 h-10 rounded-md flex items-center justify-center ${isActive ? "bg-white/20" : "bg-slate-100 dark:bg-slate-700"
                    }`}
                >
                  <Icon className={`${isActive ? "text-white" : "text-slate-700 dark:text-slate-100"} w-5 h-5`} />
                </div>
                <div className="min-w-[180px]">
                  <div className={`text-sm font-medium ${isActive ? "text-white" : "text-slate-800 dark:text-slate-100"}`}>
                    {s.label}
                  </div>
                  <div className={`text-xs ${isActive ? "text-white/80" : "text-slate-500 dark:text-slate-300"}`}>
                    {isActive ? "In progress…" : isDone ? "Done" : "Pending"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Visual area: candlesticks + progress */}
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Candlestick mini */}
          <div className="flex-1 flex items-center justify-center">
            <div className="p-4 rounded-xl bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border border-gray-100 dark:border-slate-700 shadow-inner w-full max-w-xs">
              <div className="flex items-end gap-2 h-28 justify-center">
                {/* candlestick-like bars */}
                {Array.from({ length: 7 }).map((_, idx) => {
                  // vary height pattern, use active to slightly vary
                  const base = 20 + (idx % 3) * 18 + (idx === active % 7 ? 12 : 0);
                  const height = `${base + (Math.sin((Date.now() / 600) + idx) * 6)}px`;
                  const colorClass = idx % 2 === 0 ? "from-green-500 to-emerald-300" : "from-red-400 to-pink-400";
                  return (
                    <div
                      key={idx}
                      className={`w-3 rounded-sm bg-gradient-to-t ${colorClass}`}
                      style={{
                        height,
                        transition: "height 400ms ease",
                        boxShadow: "inset 0 -6px 12px rgba(0,0,0,0.06)",
                      }}
                      aria-hidden
                    />
                  );
                })}
              </div>
              <div className="mt-4 text-center text-xs text-slate-500 dark:text-slate-300">
                live OHLCV preview (simulated)
              </div>
            </div>
          </div>

          {/* Progress / details */}
          <div className="flex-1 w-full max-w-2xl">
            <div className="mb-3 text-sm text-slate-600 dark:text-slate-300">Pipeline progress</div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden border border-slate-200 dark:border-slate-600">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-indigo-600 to-emerald-400 transition-all duration-500"
                style={{ width: `${Math.min(99, Math.round(progress))}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <div>Step {active + 1} of {steps.length}</div>
              <div>{Math.min(99, Math.round(progress))}%</div>
            </div>

            {/* action list: little animated items */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <ListItem label="Model reasoning" sub="LLM chains & context fusion" active={active === 0} />
              <ListItem label="Indicators calculated" sub="RSI, MACD, EMA" active={active === 1} />
              <ListItem label="Market data" sub="Order book & OHLCV" active={active === 2} />
              <ListItem label="Web sources" sub="News & filings" active={active === 3} />
              <ListItem label="Report" sub="Assembling markdown" active={active === 4} />
            </div>
          </div>
        </div>

        {/* footer note */}
        <div className="mt-5 text-center text-sm text-slate-600 dark:text-slate-300">
          Please do not refresh the page while the report is being generated — good analysis takes a bit of time.
        </div>
      </div>

      {/* small credit */}
      <div className="text-xs text-slate-500 dark:text-slate-400">Powered by your StockMarket AI • Secure & private</div>

      {/* Inline styles for subtle animations */}
      <style>{`
        /* keep animations smooth in light/dark */
        @keyframes floaty {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
}

/* ---------------------------
   Helper sub-components + icons
   --------------------------- */

function ListItem({ label, sub, active }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${active ? "bg-slate-100 dark:bg-slate-700" : "bg-transparent"}`}>
      <svg className={`w-6 h-6 ${active ? "text-indigo-600" : "text-slate-400 dark:text-slate-300"}`} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.12" />
        <path d="M8 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <div>
        <div className={`text-sm font-medium ${active ? "text-slate-900 dark:text-white" : "text-slate-800 dark:text-slate-100"}`}>{label}</div>
        <div className="text-xs text-slate-500 dark:text-slate-300">{sub}</div>
      </div>
    </div>
  );
}

/* Inline SVG icons (use currentColor so Tailwind controls color) */
function BrainIcon({ className = "w-6 h-6" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path d="M7 10.5C5 10.5 4 8.5 4 7c0-1.5 1-3.5 3-3.5s3 0 3 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17 13.5c2 0 3 2 3 3.5 0 1.5-1 3.5-3 3.5s-3 0-3-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 3v18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M9 6h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M9 18h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ChartIcon({ className = "w-6 h-6" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 14l4-4 4 6 4-10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CloudDownloadIcon({ className = "w-6 h-6" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path d="M20 16.58A5 5 0 0 0 16 9h-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 16.59A4 4 0 0 1 8 8.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 13v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M9 16l3 3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function SearchIcon({ className = "w-6 h-6" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function DocumentIcon({ className = "w-6 h-6" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function LLMLogo({ className = "w-12 h-12" }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
      <defs />
      <rect width="48" height="48" rx="10" fill="currentColor" opacity="0.12" />
      <path d="M14 30c2-6 8-10 14-10" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.95"/>
      <circle cx="16" cy="18" r="2" fill="white" />
      <circle cx="32" cy="22" r="2.2" fill="white" />
      <path d="M12 36c6-8 18-8 24-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
    </svg>
  );
}
