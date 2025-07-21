from crewai.tools import BaseTool
import yfinance as yf
import pandas as pd
import os
from Utils.cloudinary import upload_csv_to_cloudinary

class YFinanceFundamentalsTool(BaseTool):
    name: str = "Yahoo Finance Fundamentals Tool"
    description: str = "Fetches financial ratios and latest balance sheet for Indian stocks using yfinance and saves them to CSV in Tool_Data folder."

    def _run(self, symbol: str) -> str:
        try:
            # Ensure output folder exists
            output_folder = "dags/Features/tools/Tools_Data/Ratios_Balance_Sheet"
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

            # Save ratios
            ratios_df = pd.DataFrame(ratios_list)
            ratios_csv = os.path.join(output_folder, f"{symbol.lower()}_ratios.csv")
            ratios_df.to_csv(ratios_csv, index=False, encoding='utf-8-sig')
            cloud_url_ratios = upload_csv_to_cloudinary(ratios_csv, folder="ratios")

            # === Balance Sheet ===
            bs = ticker.balance_sheet
            cloud_url_balanceSheet = None  # Initialize to avoid reference error

            if not bs.empty:
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
                cloud_url_balanceSheet = upload_csv_to_cloudinary(bs_csv, folder="balance_sheets")

            # Final response
            response = f"✅ Ratios uploaded: {cloud_url_ratios}"
            if cloud_url_balanceSheet:
                response += f"\n✅ Balance sheet uploaded: {cloud_url_balanceSheet}"
            else:
                response += f"\n⚠️ No balance sheet data available."

            return response

        except Exception as e:
            return f"❌ Error fetching data for {symbol}: {str(e)}"

    async def _arun(self, symbol: str) -> str:
        return self._run(symbol)


# Debug/testing
if __name__ == "__main__":
    tool = YFinanceFundamentalsTool()
    result = tool._run("TATAMOTORS.NS")
    print("\n========== TOOL OUTPUT ==========\n")
    print(result)
    print("\n=================================\n")
