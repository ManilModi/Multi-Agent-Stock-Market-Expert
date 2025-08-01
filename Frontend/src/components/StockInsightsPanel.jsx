import { useState } from "react"
import axios from "axios"
import Papa from "papaparse"
import Header from "./Header"
import Footer from "./Footer"
import { Card, CardHeader, CardTitle, CardContent } from "./UI/card"
import { Building2, BarChart3, Newspaper } from "lucide-react"

export default function FinancialDetails() {
  const [companyName, setCompanyName] = useState("")
  const [balanceSheet, setBalanceSheet] = useState([])
  const [ratios, setRatios] = useState([])
  const [news, setNews] = useState([])  // ✅ NEW STATE
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setBalanceSheet([])
    setRatios([])
    setNews([])

    try {
      // Fetch balance sheet and ratios
      const financialsRes = await axios.post(`http://localhost:8000/balance-sheet-and-ratios/?symbol=${companyName}.NS`)
      const urls = financialsRes.data.details

      Papa.parse(urls[0], {
        download: true,
        header: true,
        complete: (results) => setBalanceSheet(results.data),
        error: (err) => {
          console.error("CSV Parse Error - Balance Sheet", err)
          setError("Failed to parse balance sheet CSV")
        },
      })

      Papa.parse(urls[1], {
        download: true,
        header: true,
        complete: (results) => setRatios(results.data),
        error: (err) => {
          console.error("CSV Parse Error - Ratios", err)
          setError("Failed to parse ratios CSV")
        },
      })

      // ✅ Fetch News CSV
      const newsRes = await axios.get(`http://localhost:8000/news/${companyName}`)
      const newsUrl = newsRes.data.result

      Papa.parse(newsUrl, {
        download: true,
        header: true,
        complete: (results) => setNews(results.data),
        error: (err) => {
          console.error("CSV Parse Error - News", err)
          setError("Failed to parse news CSV")
        },
      })
    } catch (err) {
      console.error("Request Error", err)
      setError("Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const renderTable = (data) => (
    <div className="max-h-[400px] overflow-auto rounded border border-gray-200 dark:border-slate-700">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 dark:bg-slate-700 sticky top-0">
          <tr>
            {Object.keys(data[0] || {}).map((key) => (
              <th key={key} className="px-4 py-2 text-left border-b">{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? "bg-white dark:bg-slate-800" : "bg-gray-50 dark:bg-slate-700"}>
              {Object.values(row).map((val, i) => (
                <td key={i} className="px-4 py-2 border-t dark:border-slate-700">{val}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 dark:from-slate-900 dark:to-slate-800 text-gray-900 dark:text-white">
      <Header />

      <main className="container mx-auto px-4 py-10">
        <Card className="max-w-2xl mx-auto mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">📊 Financial Details Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4">
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name e.g. TCS"
                className="flex-1 px-4 py-2 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-black dark:text-white"
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
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {balanceSheet.length > 0 && (
            <Card className="shadow-md">
              <CardHeader className="flex flex-row items-center gap-2">
                <Building2 className="w-5 h-5" />
                <CardTitle className="text-lg">Balance Sheet</CardTitle>
              </CardHeader>
              <CardContent>
                {renderTable(balanceSheet)}
              </CardContent>
            </Card>
          )}

          {ratios.length > 0 && (
            <Card className="shadow-md">
              <CardHeader className="flex flex-row items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                <CardTitle className="text-lg">Financial Ratios</CardTitle>
              </CardHeader>
              <CardContent>
                {renderTable(ratios)}
              </CardContent>
            </Card>
          )}

          {news.length > 0 && (
            <Card className="shadow-md col-span-1 md:col-span-2">
              <CardHeader className="flex flex-row items-center gap-2">
                <Newspaper className="w-5 h-5" />
                <CardTitle className="text-lg">📢 Latest News</CardTitle>
              </CardHeader>
              <CardContent>
                {renderTable(news)}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
