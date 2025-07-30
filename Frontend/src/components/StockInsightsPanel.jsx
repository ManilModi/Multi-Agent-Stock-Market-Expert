import { useState } from "react"
import axios from "axios"
import Papa from "papaparse"
import Header from "./Header"
import Footer from "./Footer"
import { Card, CardHeader, CardTitle, CardContent } from "./UI/card"

export default function FinancialDetails() {
  const [companyName, setCompanyName] = useState("")
  const [financialData, setFinancialData] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setFinancialData([])

    try {
        const response = await axios.post("http://localhost:8000/balance-sheet-and-ratios/", {
          stock_name: "TCS"
        });
      
        const fileUrl = response.data.details;
      
        Papa.parse(fileUrl, {
          download: true,
          header: true,
          complete: (results) => {
            setFinancialData(results.data);
          },
          error: (err) => {
            console.error("CSV Parse Error", err);
            setError("Failed to parse CSV");
          },
        });
      } catch (err) {
        console.error("Request Error", err);
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
      
      
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <Header />

      <main className="container mx-auto px-4 py-10">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-xl">📊 Financial Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name e.g. TCS"
                className="w-full px-4 py-2 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-black dark:text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={!companyName || loading}
              >
                {loading ? "Loading..." : "Get Financials"}
              </button>
            </form>

            {error && <p className="text-red-600 mt-4">{error}</p>}

            {financialData.length > 0 && (
              <div className="overflow-auto mt-6">
                <table className="min-w-full text-sm border border-gray-200 dark:border-slate-600">
                  <thead className="bg-gray-100 dark:bg-slate-700">
                    <tr>
                      {Object.keys(financialData[0]).map((key) => (
                        <th key={key} className="px-4 py-2 border-b text-left">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {financialData.map((row, idx) => (
                      <tr key={idx} className="border-t dark:border-slate-700">
                        {Object.values(row).map((val, i) => (
                          <td key={i} className="px-4 py-2">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
