"use client"

import { useState } from "react"
import { Button } from "./UI/button"
import { Card, CardContent } from "./UI/card"

export default function AuthModal({ isOpen, onClose, onLogin }) {
  const [selectedRole, setSelectedRole] = useState("")
  const [name, setName] = useState("")

  if (!isOpen) return null

  const roles = [
    {
      id: "investor",
      title: "Investor",
      description: "Access investment recommendations and portfolio analysis",
      icon: "📈",
    },
    {
      id: "broker",
      title: "Broker",
      description: "Manage client portfolios and execute trades",
      icon: "🏦",
    },
    {
      id: "company",
      title: "Company",
      description: "Monitor company performance and market sentiment",
      icon: "🏢",
    },
  ]

  const handleLogin = () => {
    if (selectedRole && name.trim()) {
      onLogin({
        name: name.trim(),
        role: selectedRole,
        id: Date.now(),
      })
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome to StockMarket AI</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Enter your name</label>
              <input
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Choose your role
              </label>
              <div className="grid gap-4">
                {roles.map((role) => (
                  <Card
                    key={role.id}
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedRole === role.id
                        ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-slate-800"
                    }`}
                    onClick={() => setSelectedRole(role.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{role.icon}</div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{role.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{role.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Button
              onClick={handleLogin}
              disabled={!selectedRole || !name.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Enter Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
