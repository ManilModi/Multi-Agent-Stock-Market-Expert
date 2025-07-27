"use client"

import { useAuth, useUser } from "@clerk/clerk-react"
import { useEffect, useState, useCallback } from "react"

export const useAuthFlow = () => {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth()
  const { user } = useUser()
  const [isRegistering, setIsRegistering] = useState(false)

  // registrationComplete is now derived from user.publicMetadata.role
  // This ensures it's always in sync with Clerk's user object.
  const registrationComplete = isLoaded && isSignedIn && user?.publicMetadata?.role != null

  const registerUserWithBackend = useCallback(
    async (role) => {
      if (!isLoaded || !isSignedIn || !user) {
        console.warn("Attempted to register user before Clerk is loaded or user is signed in.")
        return { success: false, error: "User not authenticated or Clerk not loaded." }
      }

      try {
        setIsRegistering(true)
        const token = await getToken()
        console.log("Attempting to register user with backend. Role:", role)
        const response = await fetch("http://127.0.0.1:5000/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role }),
        })
        const data = await response.json()
        console.log("Backend registration response status:", response.status, "data:", data)

        if (!response.ok) {
          if (response.status === 403 || response.status === 400) {
            console.error("Backend registration failed with 403/400. Signing out.")
            await signOut()
            window.location.href = "/" // Redirect to home after sign out
            localStorage.removeItem("selectedRole")
          }
          return { success: false, error: data.message || "Backend registration failed." }
        }

        // If backend registration is successful, Clerk's user object should eventually update
        // with the new publicMetadata.role, which will then automatically update `registrationComplete`.
        console.log("Backend registration successful. User public metadata should update soon.")
        localStorage.removeItem("selectedRole")
        return { success: true, data }
      } catch (error) {
        console.error("Registration error:", error)
        return { success: false, error: error.message }
      } finally {
        setIsRegistering(false)
      }
    },
    [isLoaded, isSignedIn, user, getToken, signOut],
  ) // Dependencies for useCallback

  useEffect(() => {
    const handleInitialRegistrationCheck = async () => {
      // Only attempt registration if Clerk is loaded, user is signed in,
      // and user's publicMetadata.role is NOT yet set (meaning registration is not complete).
      if (isLoaded && isSignedIn && user && user.publicMetadata?.role == null) {
        const selectedRoleFromStorage = localStorage.getItem("selectedRole")
        if (selectedRoleFromStorage) {
          console.log(
            "User signed in, but publicMetadata.role is null. Attempting to complete registration with role from localStorage:",
            selectedRoleFromStorage,
          )
          await registerUserWithBackend(selectedRoleFromStorage)
        } else {
          console.log(
            "User signed in, but publicMetadata.role is null and no selected role in localStorage. User needs to select a role.",
          )
        }
      } else if (isLoaded) {
        console.log(
          "Clerk loaded. isSignedIn:",
          isSignedIn,
          "registrationComplete:",
          registrationComplete,
          "user publicMetadata role:",
          user?.publicMetadata?.role,
        )
      }
    }

    handleInitialRegistrationCheck()
  }, [isLoaded, isSignedIn, user, registrationComplete, registerUserWithBackend])

  console.log("Current useAuthFlow state:", { isLoaded, isSignedIn, user, registrationComplete, isRegistering })

  return {
    isLoaded, // Expose Clerk's loading state
    isSignedIn,
    user,
    isRegistering,
    registrationComplete,
    registerUserWithBackend,
    signOut, // Expose Clerk's signOut
  }
}
