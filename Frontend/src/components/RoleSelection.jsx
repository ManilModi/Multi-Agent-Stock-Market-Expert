"use client"

import { useState } from "react"
import { Button } from "./UI/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./UI/card"
import { Users, Building2, BarChart3, ArrowRight, CheckCircle, X } from "lucide-react"

const RoleSelection = ({ isOpen, onClose, onRoleSelect }) => {
  const [selectedRole, setSelectedRole] = useState("")

  if (!isOpen) return null

  const roles = [
    {
      id: "investor",
      title: "Investor",
      description: "Access portfolio analytics, market predictions, and investment recommendations",
      icon: "📈",
      iconComponent: <Users className="h-8 w-8" />,
      color: "blue",
      features: [
        "Portfolio tracking & analysis",
        "Risk assessment tools",
        "Market forecasts & predictions",
        "News sentiment analysis",
        "Investment recommendations",
        "AI-powered insights",
      ],
    },
    {
      id: "broker",
      title: "Broker",
      description: "Advanced trading tools, client management, and comprehensive market analysis",
      icon: "🏦",
      iconComponent: <BarChart3 className="h-8 w-8" />,
      color: "green",
      features: [
        "Client portfolio management",
        "Advanced trading tools",
        "Market research reports",
        "Risk assessment for clients",
        "Real-time market data",
        "Institutional-grade analytics",
      ],
    },
    {
      id: "company",
      title: "Company",
      description: "Financial analysis, investor relations, and strategic market positioning insights",
      icon: "🏢",
      iconComponent: <Building2 className="h-8 w-8" />,
      color: "purple",
      features: [
        "Financial ratio analysis",
        "Competitor benchmarking",
        "Investor sentiment tracking",
        "Market positioning insights",
        "Strategic recommendations",
        "Performance monitoring",
      ],
    },
  ]

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId)

    setTimeout(() => {
      onRoleSelect(roleId)
    }, 300)
  }

  const selectedRoleData = roles.find((role) => role.id === selectedRole)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Choose Your Role</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Select your role to get a personalized experience tailored to your needs
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Role Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {roles.map((role) => (
              <Card
                key={role.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  selectedRole === role.id
                    ? `ring-2 ring-${role.color}-500 bg-${role.color}-50 dark:bg-${role.color}-900/20 shadow-lg`
                    : "hover:bg-gray-50 dark:hover:bg-slate-800 border-gray-200 dark:border-gray-700"
                } bg-white dark:bg-slate-900`}
                onClick={() => handleRoleSelect(role.id)}
              >
                <CardHeader className="text-center pb-4">
                  <div
                    className={`w-16 h-16 bg-${role.color}-100 dark:bg-${role.color}-900 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform ${
                      selectedRole === role.id ? "scale-110" : ""
                    }`}
                  >
                    <div className={`text-${role.color}-600 dark:text-${role.color}-400`}>{role.iconComponent}</div>
                  </div>
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <CardTitle className="text-xl text-gray-900 dark:text-white">{role.title}</CardTitle>
                    <span className="text-2xl">{role.icon}</span>
                  </div>
                  <CardDescription className="dark:text-gray-400 text-sm">{role.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    {role.features.slice(0, 4).map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                    {role.features.length > 4 && (
                      <li className="text-xs text-gray-500 dark:text-gray-400 italic">
                        +{role.features.length - 4} more features...
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Selected Role Details */}
          {selectedRoleData && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center space-x-3 mb-3">
                <div
                  className={`w-8 h-8 bg-${selectedRoleData.color}-100 dark:bg-${selectedRoleData.color}-900 rounded-full flex items-center justify-center`}
                >
                  <div
                    className={`text-${selectedRoleData.color}-600 dark:text-${selectedRoleData.color}-400 scale-75`}
                  >
                    {selectedRoleData.iconComponent}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Selected: {selectedRoleData.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    You'll get access to {selectedRoleData.title.toLowerCase()}-specific features and insights
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                {selectedRoleData.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose} className="border-gray-300 dark:border-gray-600 bg-transparent">
              Cancel
            </Button>
            
          </div>

          {/* Benefits Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">6</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">AI Agents</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">Real-time</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Data</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">24/7</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Analysis</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">99.9%</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoleSelection
