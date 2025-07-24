"use client"

import { useState } from "react"
import { Button } from "./UI/button"
import { Badge } from "./UI/badge"
import { TrendingUp, Moon, Sun, ArrowRight, Menu, X, BarChart3, Users, Building2, FileText, Bot } from "lucide-react"
import { useTheme } from "../Hooks/useTheme"
import Logout from "./Logout"
import { useUser } from "@clerk/clerk-react"

export default function Header({ onLoginOpen }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { isSignedIn, user } = useUser()


  const navigation = [
    {
      name: "Features",
      href: "#features",
      icon: <BarChart3 className="h-4 w-4" />,
      description: "Explore our AI-powered tools",
    },
    {
      name: "AI Agents",
      href: "#agents",
      icon: <Bot className="h-4 w-4" />,
      description: "Meet our 6 specialized agents",
    },
    {
      name: "For Investors",
      href: "#investors",
      icon: <Users className="h-4 w-4" />,
      description: "Portfolio analytics & insights",
    },
    {
      name: "For Brokers",
      href: "#brokers",
      icon: <TrendingUp className="h-4 w-4" />,
      description: "Advanced trading tools",
    },
    {
      name: "For Companies",
      href: "#companies",
      icon: <Building2 className="h-4 w-4" />,
      description: "Financial analysis & benchmarking",
    },
    {
      name: "Resources",
      href: "#resources",
      icon: <FileText className="h-4 w-4" />,
      description: "Documentation & tutorials",
    },
  ]

  const scrollToSection = (href) => {
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50 transition-colors duration-300">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">StockMarket AI</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Multi-Agentic Intelligence</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => scrollToSection(item.href)}
                className="group flex items-center space-x-1 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
              >
                {item.icon}
                <span className="text-sm font-medium">{item.name}</span>
              </button>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Live Status Badge */}
            <Badge className="hidden sm:flex bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              Live Data
            </Badge>

            {/* Theme Toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 text-slate-600" />
              )}
            </Button>

            {/* Login/Logout Button */}
            {isSignedIn ? (
              <div className="hidden sm:flex items-center space-x-3">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Welcome, {user?.firstName || user?.username || "User"}
                </div>
                <Logout size="sm" />
              </div>
            ) : (
              <Button
                onClick={onLoginOpen}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 hidden sm:flex"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-gray-200 dark:border-gray-700">
            <div className="pt-4 space-y-3">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(item.href)}
                  className="flex items-center space-x-3 w-full text-left px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                >
                  {item.icon}
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
                  </div>
                </button>
              ))}

              {/* Mobile Login/Logout Button */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                {isSignedIn ? (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600 dark:text-gray-300 text-center">
                      Welcome, {user?.firstName || user?.username || "User"}
                    </div>
                    <Logout className="w-full" />
                  </div>
                ) : (
                  <Button
                    onClick={onLoginOpen}
                    className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
