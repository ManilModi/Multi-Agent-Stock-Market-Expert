from crewai.tools import BaseTool
import yfinance as yf
import pandas as pd
import os

class YFinanceFundamentalsTool(BaseTool):
    name: str = "Yahoo Finance Fundamentals Tool"
    description: str = "Fetches financial ratios and latest balance sheet for Indian stocks using yfinance and saves them to CSV in Tool_Data folder."

    def _run(self, symbol: str) -> str:
        try:
            # Ensure Tool_Data folder exists
            output_folder = "Tools_Data/Ratios_Balance_Sheet"
            os.makedirs(output_folder, exist_ok=True)

            ticker = yf.Ticker(symbol)

            # === Financial Ratios ===
            info = ticker.info
            ratios_list = []

            for key, value in info.items():
                if key.lower() in ["longbusinesssummary", "companyofficers"]:
                    continue
                if isinstance(value, (int, float)):
                    if "percent" in key.lower() or "margin" in key.lower():
                        formatted = f"{round(value * 100, 2)}%"
                    else:
                        formatted = f"{round(value, 2):,}"
                    label = key.replace('_', ' ').title()
                    ratios_list.append({"Metric": label, "Value": formatted})

            # Convert to DataFrame & save
            ratios_df = pd.DataFrame(ratios_list)
            ratios_csv = os.path.join(output_folder, f"{symbol.lower()}_ratios.csv")
            ratios_df.to_csv(ratios_csv, index=False, encoding='utf-8-sig')

            # === Balance Sheet ===
            bs = ticker.balance_sheet
            if bs.empty:
                bs_msg = "❌ No balance sheet data available."
            else:
                latest = bs.columns[0]
                bs_list = []

                for key, value in bs[latest].items():
                    try:
                        formatted_value = f"{int(value):,}" if pd.notnull(value) else "N/A"
                    except Exception:
                        formatted_value = str(value)
                    bs_list.append({"Item": key, "Value": formatted_value})

                bs_df = pd.DataFrame(bs_list)
                bs_csv = os.path.join(output_folder, f"{symbol.lower()}_balance_sheet.csv")
                bs_df.to_csv(bs_csv, index=False, encoding='utf-8-sig')
                bs_msg = f"✅ Balance sheet saved to {bs_csv}"

            return (
                f"✅ Financial ratios saved to {ratios_csv}\n"
                f"{bs_msg}"
            )

        except Exception as e:
            return f"❌ Error fetching data for {symbol}: {str(e)}"

    async def _arun(self, symbol: str) -> str:
        return self._run(symbol)


if __name__ == "__main__":
    tool = YFinanceFundamentalsTool()
    result = tool._run("TATAMOTORS.NS")
    print("\n========== TOOL OUTPUT ==========\n")
    print(result)
    print("\n=================================\n")
