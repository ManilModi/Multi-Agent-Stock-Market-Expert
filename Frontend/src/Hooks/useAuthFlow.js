"use client"

import { useAuth, useUser } from "@clerk/clerk-react"
import { useEffect, useState, useCallback, useRef } from "react"

const API_URL = "http://127.0.0.1:5000"

export const useAuthFlow = () => {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth()
  const { user } = useUser()
  const [isRegistering, setIsRegistering] = useState(false)
  const triedRegistration = useRef(false)

  // registrationComplete is derived from Clerk metadata
  const registrationComplete =
    isLoaded && isSignedIn && user?.publicMetadata?.role != null

  const registerUserWithBackend = useCallback(
    async (role) => {
      if (!isLoaded || !isSignedIn || !user) {
        return { success: false, error: "User not authenticated or Clerk not loaded." }
      }

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

        if (!response.ok) {
          if (response.status === 403 || response.status === 400) {
            await signOut()
            localStorage.removeItem("selectedRole")
            window.location.href = "/" // or use navigate("/")
          }
          return { success: false, error: data.message || "Registration failed." }
        }

        // Optimistic update
        user.publicMetadata = { ...user.publicMetadata, role }
        localStorage.removeItem("selectedRole")
        return { success: true, data }
      } catch (error) {
        return { success: false, error: error.message }
      } finally {
        setIsRegistering(false)
      }
    },
    [isLoaded, isSignedIn, user, getToken, signOut],
  )

  useEffect(() => {
    if (
      isLoaded &&
      isSignedIn &&
      user &&
      user.publicMetadata?.role == null &&
      !triedRegistration.current
    ) {
      triedRegistration.current = true
      const storedRole = localStorage.getItem("selectedRole")
      if (storedRole) {
        registerUserWithBackend(storedRole)
      }
    }
  }, [isLoaded, isSignedIn, user, registerUserWithBackend])

  return {
    isLoaded,
    isSignedIn,
    user,
    isRegistering,
    registrationComplete,
    registerUserWithBackend,
    signOut,
  }
}
