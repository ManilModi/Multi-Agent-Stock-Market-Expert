"use client"

import { useState } from "react"
import { SignIn, useAuth } from "@clerk/clerk-react"
import { Button } from "./UI/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./UI/card"
import { Users, Building2, BarChart3, ArrowLeft, CheckCircle, X } from "lucide-react"

const RoleSelection = ({ isOpen, onClose, onRoleSelect }) => {
  const [selectedRole, setSelectedRole] = useState("")
  const [showLogin, setShowLogin] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const { isSignedIn, getToken } = useAuth()

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
    setShowLogin(true)
    localStorage.setItem("selectedRole", roleId)
  }

  const handleBackToRoles = () => {
    setShowLogin(false)
    setSelectedRole("")
  }

  // Register user with backend after Clerk authentication
  const registerUserWithBackend = async (role) => {
    try {
      setIsRegistering(true)
      const token = await getToken()

      const response = await fetch("http://127.0.0.1:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      })

      const data = await response.json()

      if (response.ok) {
        console.log("User registered successfully:", data)
        // Clear localStorage and close modal
        localStorage.removeItem("selectedRole")
        onClose()
        // Redirect to dashboard or trigger success callback
        if (onRoleSelect) {
          onRoleSelect(role)
        }
      } else {
        console.error("Registration failed:", data.error)
        // Handle registration error (user might already exist)
        if (response.status === 409) {
          // User already exists, just proceed
          localStorage.removeItem("selectedRole")
          onClose()
          if (onRoleSelect) {
            onRoleSelect(role)
          }
        }
      }
    } catch (error) {
      console.error("Registration error:", error)
    } finally {
      setIsRegistering(false)
    }
  }

  // Handle successful Clerk authentication
  const handleClerkSuccess = () => {
    const storedRole = localStorage.getItem("selectedRole") || selectedRole
    if (storedRole && isSignedIn) {
      registerUserWithBackend(storedRole)
    }
  }

  const selectedRoleData = roles.find((role) => role.id === selectedRole)

  // If showing login, render the login view
  if (showLogin && selectedRoleData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md">
          {/* Header */}
          <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToRoles}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  disabled={isRegistering}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              </div>
              <button
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                onClick={onClose}
                disabled={isRegistering}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 text-center">
              <div
                className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-${selectedRoleData.color}-100 dark:bg-${selectedRoleData.color}-900/30 text-${selectedRoleData.color}-800 dark:text-${selectedRoleData.color}-200 text-sm font-medium mb-3`}
              >
                <span>{selectedRoleData.icon}</span>
                <span>Signing in as {selectedRoleData.title}</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome to StockMarket AI</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                Sign in to access your personalized {selectedRoleData.title} dashboard
              </p>
            </div>
          </div>

          {/* Login Content */}
          <div className="p-6">
            {isRegistering ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Setting up your account...</p>
              </div>
            ) : (
              <SignIn
                appearance={{
                  elements: {
                    rootBox: "mx-auto",
                    card: "shadow-none border-0 bg-transparent",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton:
                      "w-full justify-center mb-4 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors",
                    formButtonPrimary: `w-full bg-${selectedRoleData.color}-600 hover:bg-${selectedRoleData.color}-700 text-white py-2 px-4 rounded-lg font-medium transition-colors`,
                    footerActionLink: `text-${selectedRoleData.color}-600 hover:text-${selectedRoleData.color}-700`,
                    formFieldInput:
                      "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white",
                    formFieldLabel: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                    dividerLine: "bg-gray-300 dark:bg-gray-600",
                    dividerText: "text-gray-500 dark:text-gray-400 text-sm",
                  },
                  variables: {
                    colorPrimary:
                      selectedRoleData.color === "blue"
                        ? "#2563eb"
                        : selectedRoleData.color === "green"
                          ? "#16a34a"
                          : selectedRoleData.color === "purple"
                            ? "#9333ea"
                            : "#6b7280",
                  },
                }}
                
              />
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6">
            <div className="text-center text-xs text-gray-500 dark:text-gray-400">
              By signing in, you agree to our{" "}
              <a
                href="#"
                className={`text-${selectedRoleData.color}-600 hover:text-${selectedRoleData.color}-700 underline`}
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="#"
                className={`text-${selectedRoleData.color}-600 hover:text-${selectedRoleData.color}-700 underline`}
              >
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Default role selection view
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
                className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:bg-gray-50 dark:hover:bg-slate-800 border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900"
                onClick={() => handleRoleSelect(role.id)}
              >
                <CardHeader className="text-center pb-4">
                  <div
                    className={`w-16 h-16 bg-${role.color}-100 dark:bg-${role.color}-900 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform hover:scale-110`}
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

                  <Button
                    className={`w-full mt-4 bg-${role.color}-600 hover:bg-${role.color}-700 dark:bg-${role.color}-500 dark:hover:bg-${role.color}-600 text-white`}
                  >
                    Sign in as {role.title}
                  </Button>
                </CardContent>
              </Card>
            ))}
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
