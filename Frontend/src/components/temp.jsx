"use client"

import { useState, useEffect } from "react"
import { Button } from "./components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card"
import { Badge } from "./components/ui/badge"
import {
  Users,
  Building2,
  BarChart3,
  MessageSquare,
  FileText,
  Bot,
  Brain,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  CheckCircle,
  Star,
  ArrowLeft,
} from "lucide-react"
import Header from "./components/Header"
import Footer from "./components/Footer"
import RoleSelection from "./components/RoleSelection"
import Dashboard from "./components/Dashboard"
import { useAuthFlow } from "./hooks/useAuthFlow"
import Login from "./components/Login"
import CandlestickChart from "./components/CandlestickChart" // Import CandlestickChart

export default function App() {
  const [showRoleSelection, setShowRoleSelection] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [selectedRole, setSelectedRole] = useState("")
  const [activeDashboardTab, setActiveDashboardTab] = useState("overview")
  const [showStandaloneChart, setShowStandaloneChart] = useState(false) // New state for standalone chart
  const [stockData, setStockData] = useState([]) // Moved stockData state here
  const [isConnected, setIsConnected] = useState(false) // Moved isConnected state here
  const { isSignedIn, registrationComplete } = useAuthFlow()

  // WebSocket connection for real-time data (moved from Dashboard)
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/stock-data")

    ws.onopen = () => {
      setIsConnected(true)
      console.log("WebSocket connected")
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setStockData((prev) => [...prev.slice(-99), data])
    }

    ws.onclose = () => {
      setIsConnected(false)
      console.log("WebSocket disconnected")
    }

    return () => {
      ws.close()
    }
  }, [])

  const handleGetStarted = () => {
    setShowRoleSelection(true)
  }

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    setShowRoleSelection(false)
    setShowLogin(true)
  }

  const handleLoginClose = () => {
    setShowLogin(false)
    setSelectedRole("")
  }

  const handleBackToRoleSelection = () => {
    setShowLogin(false)
    setShowRoleSelection(true)
  }

  const handleRoleSelectionClose = () => {
    setShowRoleSelection(false)
  }

  const handleNavigateToDashboardTab = (tabKey) => {
    if (tabKey === "charts") {
      // If "Live Charts" is clicked, show standalone chart
      setShowStandaloneChart(true)
      setActiveDashboardTab("charts") // Still set for consistency if they go back to dashboard
    } else {
      // For other tabs, show dashboard and set the active tab
      setShowStandaloneChart(false)
      setActiveDashboardTab(tabKey)
    }

    if (!isSignedIn || !registrationComplete) {
      handleGetStarted() // Prompt login/registration if not signed in
    }
  }

  const handleBackToDashboard = () => {
    setShowStandaloneChart(false)
    setActiveDashboardTab("overview") // Default to overview when returning to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      <Header onLoginOpen={handleGetStarted} onNavigateToDashboardTab={handleNavigateToDashboardTab} />

      {isSignedIn && registrationComplete ? (
        showStandaloneChart ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Button
              variant="ghost"
              onClick={handleBackToDashboard}
              className="mb-4 flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
            </Button>
            <CandlestickChart data={stockData} />
          </div>
        ) : (
          <Dashboard initialActiveTab={activeDashboardTab} stockData={stockData} isConnected={isConnected} />
        )
      ) : (
        <>
          {/* Hero Section */}
          <section id="hero" className="py-20 px-4">
            <div className="container mx-auto text-center">
              <div className="max-w-4xl mx-auto">
                <Badge className="mb-6 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800">
                  <Bot className="w-3 h-3 mr-1" />
                  Powered by 6 AI Agents
                </Badge>

                <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                  Multi-Agentic
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {" "}
                    Stock Market{" "}
                  </span>
                  Intelligence
                </h2>

                <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                  Harness the power of 6 specialized AI agents providing real-time analysis, predictions, and
                  comprehensive market insights for investors, brokers, and companies. Make smarter decisions with
                  AI-driven intelligence.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                  <Button
                    size="lg"
                    onClick={handleGetStarted}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-lg px-8 py-3"
                  >
                    Start Trading Now
                    <BarChart3 className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 py-3 border-gray-300 dark:border-gray-600 bg-transparent"
                  >
                    Watch Demo
                    <MessageSquare className="ml-2 h-5 w-5" />
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">6</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">AI Agents</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">99.9%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">Real-time</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Data</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">24/7</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Analysis</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Grid */}
          <section id="features" className="py-16 bg-white dark:bg-slate-800 transition-colors duration-300">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Platform Features</h3>
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Comprehensive suite of AI-powered tools designed to give you the edge in financial markets
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Card className="group hover:shadow-xl transition-all duration-300 border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900">
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-gray-900 dark:text-white">Real-time Analytics</CardTitle>
                    <CardDescription className="dark:text-gray-400">
                      Live candlestick charts, OHLCV data, and advanced technical indicators powered by WebSocket
                      connections
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="group hover:shadow-xl transition-all duration-300 border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900">
                  <CardHeader>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-gray-900 dark:text-white">AI-Generated Reports</CardTitle>
                    <CardDescription className="dark:text-gray-400">
                      Comprehensive analysis reports generated by 6 specialized CrewAI agents with actionable insights
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="group hover:shadow-xl transition-all duration-300 border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900">
                  <CardHeader>
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <CardTitle className="text-gray-900 dark:text-white">Agentic RAG Chatbot</CardTitle>
                    <CardDescription className="dark:text-gray-400">
                      Intelligent conversational AI for market queries, analysis, and personalized investment guidance
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="group hover:shadow-xl transition-all duration-300 border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900">
                  <CardHeader>
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Brain className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <CardTitle className="text-gray-900 dark:text-white">Price Predictions</CardTitle>
                    <CardDescription className="dark:text-gray-400">
                      ML-powered OHLCV forecasting with confidence intervals and risk assessment models
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="group hover:shadow-xl transition-all duration-300 border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900">
                  <CardHeader>
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <CardTitle className="text-gray-900 dark:text-white">Risk Management</CardTitle>
                    <CardDescription className="dark:text-gray-400">
                      Advanced risk metrics, portfolio optimization, and stress testing for informed decision making
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="group hover:shadow-xl transition-all duration-300 border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900">
                  <CardHeader>
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Globe className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <CardTitle className="text-gray-900 dark:text-white">Market Intelligence</CardTitle>
                    <CardDescription className="dark:text-gray-400">
                      Real-time news analysis, sentiment tracking, and market-moving events detection
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </section>

          {/* AI Agents Section */}
          <section
            id="agents"
            className="py-16 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300"
          >
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Meet Our 6 AI Agents</h3>
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Each agent specializes in a specific aspect of market analysis, working together to provide
                  comprehensive insights
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    name: "Market Analyst",
                    description: "Technical analysis and trend identification",
                    icon: <BarChart3 className="h-5 w-5" />,
                    color: "blue",
                  },
                  {
                    name: "Fundamental Analyst",
                    description: "Financial statements and company valuation",
                    icon: <FileText className="h-5 w-5" />,
                    color: "green",
                  },
                  {
                    name: "Sentiment Analyst",
                    description: "News and social media sentiment tracking",
                    icon: <MessageSquare className="h-5 w-5" />,
                    color: "purple",
                  },
                  {
                    name: "Risk Analyst",
                    description: "Portfolio risk assessment and management",
                    icon: <Shield className="h-5 w-5" />,
                    color: "red",
                  },
                  {
                    name: "Price Predictor",
                    description: "ML-powered price forecasting models",
                    icon: <Brain className="h-5 w-5" />,
                    color: "orange",
                  },
                  {
                    name: "Portfolio Optimizer",
                    description: "Asset allocation and diversification strategies",
                    icon: <Zap className="h-5 w-5" />,
                    color: "indigo",
                  },
                ].map((agent, index) => (
                  <Card
                    key={index}
                    className="text-center hover:shadow-lg transition-all duration-300 border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900"
                  >
                    <CardContent className="p-6">
                      <div
                        className={`w-16 h-16 bg-${agent.color}-100 dark:bg-${agent.color}-900 rounded-full flex items-center justify-center mx-auto mb-4`}
                      >
                        <div className={`text-${agent.color}-600 dark:text-${agent.color}-400`}>{agent.icon}</div>
                      </div>
                      <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">{agent.name}</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{agent.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* User Roles */}
          <section id="roles" className="py-16 bg-white dark:bg-slate-800 transition-colors duration-300">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Choose Your Role</h3>
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Tailored experiences designed for different market participants with role-specific insights and tools
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <Card
                  className="hover:shadow-xl transition-all duration-300 cursor-pointer group border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900"
                  onClick={handleGetStarted}
                >
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-xl text-gray-900 dark:text-white">Investor</CardTitle>
                    <CardDescription className="dark:text-gray-400">
                      Access portfolio analytics, market predictions, and investment recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      {[
                        "Portfolio tracking & analysis",
                        "Risk assessment tools",
                        "Market forecasts & predictions",
                        "News sentiment analysis",
                        "Investment recommendations",
                      ].map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                      Get Started as Investor
                    </Button>
                  </CardContent>
                </Card>

                <Card
                  className="hover:shadow-xl transition-all duration-300 cursor-pointer group border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900"
                  onClick={handleGetStarted}
                >
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <BarChart3 className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-xl text-gray-900 dark:text-white">Broker</CardTitle>
                    <CardDescription className="dark:text-gray-400">
                      Advanced trading tools, client management, and comprehensive market analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      {[
                        "Client portfolio management",
                        "Advanced trading tools",
                        "Market research reports",
                        "Risk assessment for clients",
                        "Real-time market data",
                      ].map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full mt-6 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600">
                      Get Started as Broker
                    </Button>
                  </CardContent>
                </Card>

                <Card
                  className="hover:shadow-xl transition-all duration-300 cursor-pointer group border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900"
                  onClick={handleGetStarted}
                >
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Building2 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <CardTitle className="text-xl text-gray-900 dark:text-white">Company</CardTitle>
                    <CardDescription className="dark:text-gray-400">
                      Financial analysis, investor relations, and strategic market positioning insights
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      {[
                        "Financial ratio analysis",
                        "Competitor benchmarking",
                        "Investor sentiment tracking",
                        "Market positioning insights",
                        "Strategic recommendations",
                      ].map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full mt-6 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600">
                      Get Started as Company
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="py-16 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Trusted by Market Leaders</h3>
                <p className="text-gray-600 dark:text-gray-300">See what our users are saying about StockMarket AI</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    name: "Sarah Chen",
                    role: "Portfolio Manager",
                    company: "Goldman Sachs",
                    content:
                      "The AI agents provide insights that would take our team hours to compile. The accuracy is remarkable.",
                    rating: 5,
                  },
                  {
                    name: "Michael Rodriguez",
                    role: "Individual Investor",
                    company: "Retail Trader",
                    content:
                      "Finally, institutional-grade analysis accessible to individual investors. Game-changing platform.",
                    rating: 5,
                  },
                  {
                    name: "Emily Watson",
                    role: "CFO",
                    company: "TechCorp Inc.",
                    content:
                      "The company analytics help us understand our market position better than any other tool we've used.",
                    rating: 5,
                  },
                ].map((testimonial, index) => (
                  <Card key={index} className="border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900">
                    <CardContent className="p-6">
                      <div className="flex mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-4 italic">"{testimonial.content}"</p>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{testimonial.company}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800">
            <div className="container mx-auto px-4 text-center">
              <h3 className="text-4xl font-bold text-white mb-6">Ready to Transform Your Trading?</h3>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Join thousands of traders, investors, and companies already using AI to make smarter financial
                decisions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-3 bg-transparent"
                >
                  Schedule Demo
                </Button>
              </div>
            </div>
          </section>
        </>
      )}

      <Footer />

      {/* Modals */}
      <RoleSelection isOpen={showRoleSelection} onClose={handleRoleSelectionClose} onRoleSelect={handleRoleSelect} />
      <Login
        isOpen={showLogin}
        onClose={handleLoginClose}
        selectedRole={selectedRole}
        onBack={handleBackToRoleSelection}
      />
    </div>
  )
}
