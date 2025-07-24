"use client"

import { TrendingUp, Github, Twitter, Linkedin, Mail, ArrowUp } from "lucide-react"
import { Button } from "./UI/button"

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const footerSections = {
    platform: {
      title: "Platform",
      links: [
        { name: "Features", href: "#features" },
        { name: "AI Agents", href: "#agents" },
        { name: "Live Charts", href: "#charts" },
        { name: "Predictions", href: "#predictions" },
        { name: "API Access", href: "#api" },
        { name: "Pricing", href: "#pricing" },
      ],
    },
    solutions: {
      title: "Solutions",
      links: [
        { name: "For Investors", href: "#investors" },
        { name: "For Brokers", href: "#brokers" },
        { name: "For Companies", href: "#companies" },
        { name: "Enterprise", href: "#enterprise" },
        { name: "White Label", href: "#white-label" },
        { name: "Integrations", href: "#integrations" },
      ],
    },
    resources: {
      title: "Resources",
      links: [
        { name: "Documentation", href: "#docs" },
        { name: "API Reference", href: "#api-docs" },
        { name: "Tutorials", href: "#tutorials" },
        { name: "Blog", href: "#blog" },
        { name: "Case Studies", href: "#case-studies" },
        { name: "Webinars", href: "#webinars" },
      ],
    },
    support: {
      title: "Support",
      links: [
        { name: "Help Center", href: "#help" },
        { name: "Contact Us", href: "#contact" },
        { name: "Community", href: "#community" },
        { name: "Status Page", href: "#status" },
        { name: "Bug Reports", href: "#bugs" },
        { name: "Feature Requests", href: "#features" },
      ],
    },
    company: {
      title: "Company",
      links: [
        { name: "About Us", href: "#about" },
        { name: "Careers", href: "#careers" },
        { name: "Press Kit", href: "#press" },
        { name: "Partners", href: "#partners" },
        { name: "Privacy Policy", href: "#privacy" },
        { name: "Terms of Service", href: "#terms" },
      ],
    },
  }

  const socialLinks = [
    { name: "Twitter", icon: <Twitter className="h-5 w-5" />, href: "#twitter" },
    { name: "LinkedIn", icon: <Linkedin className="h-5 w-5" />, href: "#linkedin" },
    { name: "GitHub", icon: <Github className="h-5 w-5" />, href: "#github" },
    { name: "Email", icon: <Mail className="h-5 w-5" />, href: "#email" },
  ]

  return (
    <footer className="bg-slate-900 dark:bg-slate-950 text-white transition-colors duration-300">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="relative">
                <TrendingUp className="h-8 w-8 text-blue-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <span className="text-2xl font-bold">StockMarket AI</span>
                <p className="text-sm text-gray-400">Multi-Agentic Intelligence</p>
              </div>
            </div>

            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Empowering traders, investors, and companies with AI-driven market intelligence. Our 6 specialized agents
              provide real-time analysis, predictions, and comprehensive insights for smarter financial decisions.
            </p>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="w-10 h-10 bg-slate-800 dark:bg-slate-900 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-blue-600 transition-all duration-200"
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {Object.entries(footerSections).map(([key, section]) => (
            <div key={key}>
              <h4 className="font-semibold text-white mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="max-w-md">
            <h4 className="font-semibold text-white mb-2">Stay Updated</h4>
            <p className="text-gray-400 text-sm mb-4">
              Get the latest market insights and platform updates delivered to your inbox.
            </p>
            <div className="flex space-x-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-slate-800 dark:bg-slate-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Button className="bg-blue-600 hover:bg-blue-700 px-6">Subscribe</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm text-gray-400">
              <p>&copy; 2024 StockMarket AI. All rights reserved.</p>
              <div className="flex space-x-4">
                <a href="#privacy" className="hover:text-white transition-colors">
                  Privacy
                </a>
                <a href="#terms" className="hover:text-white transition-colors">
                  Terms
                </a>
                <a href="#cookies" className="hover:text-white transition-colors">
                  Cookies
                </a>
              </div>
            </div>

            {/* Back to Top */}
            <Button
              variant="ghost"
              size="sm"
              onClick={scrollToTop}
              className="text-gray-400 hover:text-white hover:bg-slate-800 dark:hover:bg-slate-900"
            >
              <ArrowUp className="h-4 w-4 mr-2" />
              Back to Top
            </Button>
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="bg-slate-800 dark:bg-slate-900 border-t border-gray-700">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-center space-x-6 text-xs text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>All Systems Operational</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>6 AI Agents Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Real-time Data Streaming</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>99.9% Uptime</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
