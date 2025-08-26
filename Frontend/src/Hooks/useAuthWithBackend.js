"use client"

import { useAuth, useUser } from "@clerk/clerk-react"
import { useState, useEffect } from "react"

const API_URL = "http://127.0.0.1:5000"

export const useAuthWithBackend = () => {
  const { isSignedIn, getToken, signOut } = useAuth()
  const { user } = useUser()

  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [backendUser, setBackendUser] = useState(null)
  const [error, setError] = useState(null)

  // Check if user is registered in backend
  useEffect(() => {
    const checkBackendRegistration = async () => {
      if (isSignedIn && user && !registrationComplete) {
        try {
          const token = await getToken()
          const response = await fetch(`${API_URL}/api/auth/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (response.ok) {
            const userData = await response.json()
            setBackendUser(userData)
            setUserRole(userData.role)
            setRegistrationComplete(true)
            setError(null)
          } else if (response.status === 404) {
            setRegistrationComplete(false) // Not registered yet
          } else {
            setError(`Backend error: ${response.status}`)
          }
        } catch (err) {
          console.error("Error checking backend registration:", err)
          setError(err.message)
        }
      }
    }

    checkBackendRegistration()
  }, [isSignedIn, user, registrationComplete, getToken])

  const registerWithBackend = async (role) => {
    try {
      setIsRegistering(true)
      const token = await getToken()

      const response = await fetch(`${API_URL}/api/auth/register`, {
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
        setUserRole(data.user?.role || role)
        setRegistrationComplete(true)
        setError(null)
        return { success: true, user: data.user || data }
      } else {
        setError(data.error || "Registration failed")
        return { success: false, error: data.error }
      }
    } catch (err) {
      console.error("Registration error:", err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsRegistering(false)
    }
  }

  const logout = async () => {
    await signOut()
    setRegistrationComplete(false)
    setUserRole(null)
    setBackendUser(null)
    setError(null)
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
    error,

    // Actions
    registerWithBackend,
    logout,
  }
}
