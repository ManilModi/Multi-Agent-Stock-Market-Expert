"use client"

import { useUser } from "@clerk/clerk-react"
import { useEffect } from "react"

export const useUserData = () => {
  const { user, isSignedIn } = useUser()

  useEffect(() => {
    if (isSignedIn && user) {
      // Get the selected role from localStorage
      const selectedRole = localStorage.getItem("selectedRole")

      // Prepare user data for backend
      const userData = {
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        role: selectedRole || "investor", // fallback to investor
        username: user.username,
        imageUrl: user.imageUrl,
        createdAt: user.createdAt,
        lastSignInAt: user.lastSignInAt,
      }

      // Send to your backend
      sendUserDataToBackend(userData)

      // Clean up localStorage
      localStorage.removeItem("selectedRole")
    }
  }, [isSignedIn, user])

  const sendUserDataToBackend = async (userData) => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        throw new Error("Failed to save user data")
      }

      const result = await response.json()
      console.log("User data saved:", result)
    } catch (error) {
      console.error("Error saving user data:", error)
    }
  }

  return { user, isSignedIn }
}
