import { useState, useMemo } from "react"
import axios from "axios"
import Papa from "papaparse"
import Header from "./Header"
import Footer from "./Footer"
import { Card, CardHeader, CardTitle, CardContent } from "./UI/card"
import { Building2, BarChart3, Newspaper } from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer
} from "recharts"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const COLORS = ["#4CAF50", "#FF9800", "#F44336"] // Positive, Neutral, Negative

export default function FinancialDetails() {
  const [companyName, setCompanyName] = useState("")
  const [balanceSheet, setBalanceSheet] = useState([])
  const [ratios, setRatios] = useState([])
  const [news, setNews] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [overallSentiment, setOverallSentiment] = useState(null)

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1'];


  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setBalanceSheet([])
    setRatios([])
    setNews([])
    setOverallSentiment(null)

    try {
      const financialsRes = await axios.post(`http://localhost:8000/balance-sheet-and-ratios/?symbol=${companyName}.NS`)
      const urls = financialsRes.data.details

      Papa.parse(urls[0], {
        download: true,
        header: true,
        complete: (results) => setBalanceSheet(results.data),
        error: () => setError("Failed to parse balance sheet CSV"),
      })

      Papa.parse(urls[1], {
        download: true,
        header: true,
        complete: (results) => setRatios(results.data),
        error: () => setError("Failed to parse ratios CSV"),
      })

      const newsRes = await axios.get(`http://localhost:8000/news/${companyName}`)
      const newsUrl = newsRes.data.result

      Papa.parse(newsUrl, {
        download: true,
        header: true,
        complete: (results) => {
          const newsData = results.data.filter(row => row.title && row.sentiment !== "")
          setNews(newsData)

          const sentiments = newsData.map(n => parseFloat(n.sentiment)).filter(Number.isFinite)
          const avg = sentiments.reduce((a, b) => a + b, 0) / sentiments.length
          setOverallSentiment(
            avg > 0.1 ? "Positive" : avg < -0.1 ? "Negative" : "Neutral"
          )
        },
        error: () => setError("Failed to parse news CSV"),
      })
    } catch (err) {
      console.error("Request Error", err)
      setError("Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }



  const GenericBarChart = ({ data, color = "#4CAF50" }) => (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" fill={color} />
      </BarChart>
    </ResponsiveContainer>
  );
  

  const ratiosMap = useMemo(() => {
    const map = {};
    ratios.forEach(entry => {
      if (entry.Item && entry.Value) {
        map[entry.Item] = parseFloat(entry.Value.replace(/,/g, '')) || 0;
      }
    });
    return map;
  }, [ratios]);

  
  const balanceSheetMap = useMemo(() => {
    const map = {};
    balanceSheet.forEach(entry => {
      const item = entry?.Item?.trim();
      const value = entry?.Value?.replace(/,/g, '').trim();
      if (item && value) {
        map[item.toLowerCase()] = parseFloat(value) || 0;
      }
    });
    console.log("Parsed Map:", map); // Debug
    return map;
  }, [balanceSheet]); 
  
  

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



  const capitalStructure = balanceSheet.length > 0 ? [{
    name: "Capital Structure",
    equity: parseFloat(ratiosMap["Common Stock Equity"]) || 0,
    debt: parseFloat(ratiosMap["Total Debt"]) || 0,
    retained: parseFloat(ratiosMap["Retained Earnings"]) || 0,
  }] : []

  console.log("Capital Structure Data:", capitalStructure);

  
  const assetComposition = [{
  name: "Assets",
  cash: parseFloat(ratiosMap["Cash And Cash Equivalents"]) || 0,
  receivables: parseFloat(ratiosMap["Other Receivables"]) || 0,
  netPpe: parseFloat(ratiosMap["Net PPE"]) || 0,
  investments: parseFloat(ratiosMap["Cash Cash Equivalents And Short Term Investments"]) || 0,
}];


  console.log("Ratios Data", ratiosMap["Net Debt"])
  
  const profitability = [{
    name: "Profitability",
    // roa: parseFloat(data["Return on Assets"]) || 0,
    // roe: parseFloat(data["Return on Equity"]) || 0,
    grossMargin: parseFloat(balanceSheetMap["Grossmargins"]) || 0,
    opMargin: parseFloat(balanceSheetMap["Operatingmargins"]) || 0,
  }];

  console.log(balanceSheetMap)
  console.log("Balance Sheet:", balanceSheet);

  
  const getMetricValue = (metricName) => {
    const metricObj = balanceSheet.find(item => item.Metric?.toLowerCase() === metricName.toLowerCase());
    return parseFloat(metricObj?.Value.replace(/,/g, '')) || 0;
  };
  
  const valuation = [{
    name: "Valuation",
    peRatio: getMetricValue("Trailingpe"),
    pbRatio: getMetricValue("Pricetobook"),
    psRatio: getMetricValue("Pricetosalestrailing12Months"),
  }];
  
  

  
  const liabilityComposition = [{
    name: "Liabilities",
    totalDebt: parseFloat(ratiosMap["Total Debt"]) || 0,
    accountsPayable: parseFloat(ratiosMap["Accounts Payable"]) || 0,
    otherLiabilities: parseFloat(ratiosMap["Other Current Liabilities"]) || 0,
  }];
  

  const liquidity = [{
    name: "Liquidity",
    currentRatio: parseFloat(ratiosMap["Current Assets"]) / parseFloat(ratiosMap["Current Liabilities"]) || 0,
    quickRatio: (
      parseFloat(ratiosMap["Current Assets"]) 
      - parseFloat(balanceSheetMap["Inventory"]) 
    ) / parseFloat(ratiosMap["Current Liabilities"]) || 0,
    interestCoverage: parseFloat(balanceSheetMap["Ebitda"]) / (parseFloat(ratiosMap["Minority Interest"]) || 1) || 0, // If no interest, default to 1 to avoid NaN
  }];
  

  const renderSentimentCircle = (score) => {
    const val = parseFloat(score)
    const percent = Math.round((val + 1) * 50)
    const color = val > 0.1 ? "stroke-green-500" : val < -0.1 ? "stroke-red-500" : "stroke-yellow-500"

    return (
      <svg viewBox="0 0 36 36" className="w-12 h-12 mx-auto">
        <path className="text-gray-200" strokeWidth="3.8" fill="none" stroke="currentColor"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
        <path className={color} strokeWidth="3.8" fill="none" strokeLinecap="round" stroke="currentColor"
          strokeDasharray={`${percent}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
        <text x="18" y="20.35" className="fill-current text-white text-xs" textAnchor="middle">{val.toFixed(2)}</text>
      </svg>
    )
  }


  const sentimentChartData = [
    { name: "Positive", value: news.filter(n => parseFloat(n.sentiment) > 0.1).length },
    { name: "Neutral", value: news.filter(n => Math.abs(parseFloat(n.sentiment)) <= 0.1).length },
    { name: "Negative", value: news.filter(n => parseFloat(n.sentiment) < -0.1).length }
  ]

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
              <CardContent>{renderTable(balanceSheet)}</CardContent>
            </Card>
          )}

          {ratios.length > 0 && (
            <Card className="shadow-md">
              <CardHeader className="flex flex-row items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                <CardTitle className="text-lg">Financial Ratios</CardTitle>
              </CardHeader>
              <CardContent>{renderTable(ratios)}</CardContent>
            </Card>
          )}

          {/* Charts */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">📈 Key Financial Charts</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-6">
                

                {/* Sentiment Pie Chart */}
                <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                    <Pie data={sentimentChartData} cx="50%" cy="50%" outerRadius={60} fill="#8884d8" dataKey="value" label>
                        {sentimentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    </PieChart>
                </ResponsiveContainer>

                {/* Capital Structure Bar Chart */}
                {capitalStructure.length > 0 && (
                    <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={capitalStructure}>
                        <XAxis dataKey="name" /><YAxis />
                        <Tooltip /><Legend />
                        <Bar dataKey="equity" stackId="a" fill="#4CAF50" />
                        <Bar dataKey="debt" stackId="a" fill="#F44336" />
                        <Bar dataKey="retained" stackId="a" fill="#FF9800" />
                    </BarChart>
                    </ResponsiveContainer>
                )}

                  
                  <BarChart width={400} height={300} data={capitalStructure}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="equity" fill="#8884d8" name="Equity" />
                    <Bar dataKey="debt" fill="#82ca9d" name="Debt" />
                    <Bar dataKey="retained" fill="#ffc658" name="Retained Earnings" />
                  </BarChart>


                  <PieChart width={400} height={300}>
                  <Pie
                    data={Object.entries(assetComposition[0])
                      .filter(([key]) => key !== "name")
                      .map(([key, value]) => ({ name: key, value }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    label
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>


                <RadarChart outerRadius={90} width={400} height={300} data={Object.entries(profitability[0])
              .filter(([key]) => key !== "name")
              .map(([key, value]) => ({ subject: key, A: value }))}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar name="Profitability" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>


            <ResponsiveContainer width="100%" height={300}>
            <BarChart data={valuation}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="peRatio" fill="#8884d8" name="P/E Ratio" />
              <Bar dataKey="pbRatio" fill="#82ca9d" name="P/B Ratio" />
              <Bar dataKey="psRatio" fill="#ffc658" name="P/S Ratio" />
            </BarChart>
          </ResponsiveContainer>



          <PieChart width={400} height={300}>
          <Pie
            data={Object.entries(liabilityComposition[0])
              .filter(([key]) => key !== "name")
              .map(([key, value]) => ({ name: key, value }))}
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            label
          >
            {COLORS.map((color, index) => (
              <Cell key={`cell-${index}`} fill={color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>



        <RadarChart outerRadius={90} width={400} height={300} data={Object.entries(liquidity[0])
        .filter(([key]) => key !== "name")
        .map(([key, value]) => ({ subject: key, A: value }))}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis angle={30} />
        <Radar name="Liquidity" dataKey="A" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
        <Tooltip />
      </RadarChart>




                {/* Profitability Radar Chart */}
                {/* {profitability.length > 0 && (
                    <ResponsiveContainer width="100%" height={250}>
                    <RadarChart data={profitability} outerRadius={80}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar name="Profitability" dataKey="roa" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    </RadarChart>
                    </ResponsiveContainer>
                )} */}
                </CardContent>
          </Card>

          {news.length > 0 && (
            <Card className="shadow-md col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Newspaper className="w-5 h-5" />
                  <CardTitle className="text-lg">📢 Latest News</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {news.map((item, idx) => (
                    <div key={idx} className="border rounded p-4 bg-white dark:bg-slate-800">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-300 hover:underline font-semibold block mb-2"
                      >
                        {item.title}
                      </a>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.date} • {item.source}</p>
                      <div className="mt-2 flex justify-center">{renderSentimentCircle(item.sentiment)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
