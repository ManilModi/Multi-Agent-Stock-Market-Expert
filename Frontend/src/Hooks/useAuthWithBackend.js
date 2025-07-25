"use client"

import { useAuth, useUser } from "@clerk/clerk-react"
import { useState, useEffect } from "react"

export const useAuthWithBackend = () => {
  const { isSignedIn, getToken, signOut } = useAuth()
  const { user } = useUser()
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [backendUser, setBackendUser] = useState(null)

  // Check if user is registered in backend
  useEffect(() => {
    const checkBackendRegistration = async () => {
      if (isSignedIn && user && !registrationComplete) {
        try {
          const token = await getToken()
          const response = await fetch("http://127.0.0.1:5000/api/auth/profile", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (response.ok) {
            const userData = await response.json()
            setBackendUser(userData)
            setUserRole(userData.role)
            setRegistrationComplete(true)
          } else if (response.status === 404) {
            // User not found in backend, needs registration
            setRegistrationComplete(false)
          }
        } catch (error) {
          console.error("Error checking backend registration:", error)
        }
      }
    }

    checkBackendRegistration()
  }, [isSignedIn, user])

  const registerWithBackend = async (role) => {
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
        setBackendUser(data.user || data)
        setUserRole(role)
        setRegistrationComplete(true)
        return { success: true, user: data.user || data }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error("Registration error:", error)
      return { success: false, error: error.message }
    } finally {
      setIsRegistering(false)
    }
  }

  const logout = async () => {
    await signOut()
    setRegistrationComplete(false)
    setUserRole(null)
    setBackendUser(null)
  }

  return {
    // Clerk auth state
    isSignedIn,
    user,

    // Backend registration state
    isRegistering,
    registrationComplete,
    userRole,
    backendUser,

    // Actions
    registerWithBackend,
    logout,
  }
}
