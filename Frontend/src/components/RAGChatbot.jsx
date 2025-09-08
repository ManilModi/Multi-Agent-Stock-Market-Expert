"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "./UI/button"
import { Badge } from "./UI/badge"
import axios from "axios"
import { Loader2, ArrowUp } from "lucide-react"
import Header from "./Header"
import Footer from "./Footer"
import { useTheme } from "../Hooks/useTheme"

export default function RAGChatbot() {
  const { theme } = useTheme()
  const [messages, setMessages] = useState([
    {
      role: "system",
      content:
        "Hello! I'm your AI financial assistant. Ask me anything about companies, stocks, news, or reports.",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Format RAG output into structured lines
  const formatRAGOutput = (text) => {
    if (!text) return []
    const lines = text.split(/\n|\*|\d\./g).filter(Boolean)
    return lines.map((line) => line.trim()).filter(Boolean)
  }

  const handleSend = async () => {
    if (!input.trim()) return
    const userMessage = { role: "user", content: input }
    setMessages([...messages, userMessage])
    setInput("")
    setLoading(true)

    try {
      const response = await axios.post("http://localhost:8000/rag/ask", {
        query: input,
      })

      const formattedContent = formatRAGOutput(response.data.answer)

      const aiMessage = {
        role: "assistant",
        content: response.data.answer,
        formattedContent,
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      const errorMessage = {
        role: "assistant",
        content: "❌ Something went wrong. Please try again.",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={`${theme === "dark" ? "dark" : ""} flex flex-col min-h-screen bg-white dark:bg-slate-900`}>
      {/* Header */}
      <Header onNavigateToDashboardTab={() => {}} onLoginOpen={() => {}} />

      {/* Full-width Chat Container */}
      <main className="flex-1 w-full p-4">
        <div className="flex flex-col w-full h-full border rounded-lg shadow-lg
                        bg-white dark:bg-slate-900">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700
                          bg-gray-50 dark:bg-slate-800">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">AI Assistant</h2>
            <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Financial Insights
            </Badge>
          </div>

          {/* Chat Body */}
          <div
            ref={scrollRef}
            className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-xl shadow-sm break-words
                    ${msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-900 dark:bg-slate-700 dark:text-gray-100 rounded-bl-none"
                    }`}
                >
                  {msg.formattedContent ? (
                    <div className="space-y-2 text-sm">
                      {msg.formattedContent.map((line, index) => {
                        const lowerLine = line.toLowerCase()
                        const isBullish = lowerLine.includes("bullish")
                        const isBearish = lowerLine.includes("bearish")

                        return (
                          <p
                            key={index}
                            className={`${
                              isBullish
                                ? "text-green-600 dark:text-green-400 font-semibold"
                                : isBearish
                                ? "text-red-600 dark:text-red-400 font-semibold"
                                : "text-gray-900 dark:text-gray-100"
                            }`}
                          >
                            {line}
                          </p>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start space-x-2 items-center text-gray-400 dark:text-gray-300 animate-pulse">
                <Loader2 className="h-5 w-5" />
                <span>AI Assistant is analyzing...</span>
              </div>
            )}
          </div>


            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center space-x-2">
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Ask about stocks, ratios, reports..."
                className="flex-1 resize-none p-2 rounded-lg border border-gray-300 dark:border-gray-600
                        focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-gray-100"
            />
            <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
                <ArrowUp className="h-5 w-5 text-white" />
            </button>
            </div>

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
