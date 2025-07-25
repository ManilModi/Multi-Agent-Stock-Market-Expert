"use client"

import { useAuth, useUser } from "@clerk/clerk-react"
import { useEffect, useState } from "react"

export const useAuthFlow = () => {
  const { isSignedIn, getToken } = useAuth()
  const { user } = useUser()
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationComplete, setRegistrationComplete] = useState(false)

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

      if (response.ok || response.status === 409) {
        // Success or user already exists
        console.log("Registration completed:", data)
        localStorage.removeItem("selectedRole")
        setRegistrationComplete(true)
        return { success: true, data }
      } else {
        console.error("Registration failed:", data.error)
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error("Registration error:", error)
      return { success: false, error: error.message }
    } finally {
      setIsRegistering(false)
    }
  }

  useEffect(() => {
    const handleRegistration = async () => {
      if (isSignedIn && user && !registrationComplete) {
        // Ensure we explicitly get the role from localStorage
        const selectedRoleFromStorage = localStorage.getItem("selectedRole")
        if (selectedRoleFromStorage) {
          await registerUserWithBackend(selectedRoleFromStorage)
        }
      }
    }
    handleRegistration()
  }, [isSignedIn, user, registrationComplete])

  console.log("Running useEffect", { isSignedIn, user, registrationComplete });


  return {
    isSignedIn,
    user,
    isRegistering,
    registrationComplete,
    registerUserWithBackend,
  }
}
