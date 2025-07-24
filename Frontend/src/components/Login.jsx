"use client"

import { SignIn } from "@clerk/clerk-react"
import { X, ArrowLeft } from "lucide-react"
import { Button } from "./UI/button"

const Login = ({ isOpen, onClose, selectedRole, onBack }) => {
  if (!isOpen) return null

  const roleInfo = {
    investor: { title: "Investor", icon: "📈", color: "blue" },
    broker: { title: "Broker", icon: "🏦", color: "green" },
    company: { title: "Company", icon: "🏢", color: "purple" },
  }

  const currentRole = roleInfo[selectedRole] || { title: "User", icon: "👤", color: "gray" }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            </div>
            <button
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 text-center">
            <div
              className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-${currentRole.color}-100 dark:bg-${currentRole.color}-900/30 text-${currentRole.color}-800 dark:text-${currentRole.color}-200 text-sm font-medium mb-3`}
            >
              <span>{currentRole.icon}</span>
              <span>Signing in as {currentRole.title}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome to StockMarket AI</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
              Sign in to access your personalized {currentRole.title.toLowerCase()} dashboard
            </p>
          </div>
        </div>

        {/* Clerk SignIn Component */}
        <div className="p-6">
          <SignIn
            path="/login"
            routing="path"
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-none border-0 bg-transparent",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "w-full justify-center",
                formButtonPrimary: `bg-${currentRole.color}-600 hover:bg-${currentRole.color}-700 text-white`,
                footerActionLink: `text-${currentRole.color}-600 hover:text-${currentRole.color}-700`,
              },
              variables: {
                colorPrimary:
                  currentRole.color === "blue"
                    ? "#2563eb"
                    : currentRole.color === "green"
                      ? "#16a34a"
                      : currentRole.color === "purple"
                        ? "#9333ea"
                        : "#6b7280",
              },
            }}
            afterSignInUrl="/dashboard"
            afterSignUpUrl="/dashboard"
          />
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            By signing in, you agree to our{" "}
            <a href="#" className={`text-${currentRole.color}-600 hover:text-${currentRole.color}-700 underline`}>
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className={`text-${currentRole.color}-600 hover:text-${currentRole.color}-700 underline`}>
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
