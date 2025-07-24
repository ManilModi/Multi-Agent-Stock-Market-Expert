"use client"
import { useClerk } from "@clerk/clerk-react"
import { Button } from "./UI/button"
import { LogOut } from "lucide-react"

const Logout = ({ variant = "default", size = "default", showIcon = true, className = "" }) => {
  const { signOut } = useClerk()

  const handleLogout = () => {
    signOut()
  }

  return (
    <Button
      onClick={handleLogout}
      variant={variant}
      size={size}
      className={`bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white transition-colors ${className}`}
    >
      {showIcon && <LogOut className="h-4 w-4 mr-2" />}
      Log Out
    </Button>
  )
}

export default Logout
