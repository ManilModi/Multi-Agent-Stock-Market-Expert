from crewai.tools import BaseTool
import yfinance as yf
import pandas as pd

class YFinanceFundamentalsTool(BaseTool):
    name: str = "Yahoo Finance Fundamentals Tool"
    description: str = "Fetches financial ratios and latest balance sheet for Indian stocks using yfinance."

    def _run(self, symbol: str) -> str:
        try:
            ticker = yf.Ticker(symbol)
            
            info = ticker.info

            ratios_lines = []
            # Loop through all fields and display numeric metrics
            for key, value in info.items():
                # Skip large text fields or non-ratio info
                if key.lower() in ["longbusinesssummary", "companyofficers"]:
                    continue
                if isinstance(value, (int, float)):
                    if "percent" in key.lower() or "margin" in key.lower():
                        formatted = f"{round(value * 100, 2)}%"
                    else:
                        formatted = f"{round(value, 2):,}"
                    label = key.replace('_', ' ').title()
                    ratios_lines.append(f"• {label}: {formatted}")

            ratios_summary = "\n".join(ratios_lines) or "❌ No ratios found."
            ratios_summary = f"--BEGIN FUNDAMENTALS--\n{ratios_summary}\n--END FUNDAMENTALS--"

            
            # === Balance Sheet ===
            # === Balance Sheet (most recent column) ===
            bs = ticker.balance_sheet
            if bs.empty:
                bs_summary = "❌ No balance sheet data available."
            else:
                latest = bs.columns[0]

                # Loop through all items in the most recent column
                lines = []
                for key, value in bs[latest].items():
                    try:
                        formatted_value = f"{int(value):,}" if pd.notnull(value) else "N/A"
                    except Exception:
                        formatted_value = str(value)
                    lines.append(f"• {key}: {formatted_value}")

                bs_summary = "\n".join(lines)
                bs_summary = f"--BEGIN BALANCE SHEET--\n{bs_summary}\n--END BALANCE SHEET--"
                
                return (
                    f"📊 Financial Ratios for {symbol}:\n{ratios_summary}\n\n"
                    f"📘 Balance Sheet (Most Recent):\n{bs_summary}"
                )


        except Exception as e:
            return f"❌ Error fetching data for {symbol}: {str(e)}"

    async def _arun(self, symbol: str) -> str:
        return self._run(symbol)


# if __name__ == "__main__":
#     tool = YFinanceFundamentalsTool()
#     print(tool._run("TATAMOTORS.NS"))