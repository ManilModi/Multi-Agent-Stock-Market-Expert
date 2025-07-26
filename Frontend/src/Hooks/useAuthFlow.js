//frontend custom hook
"use client"

import { useAuth, useUser, useClerk } from "@clerk/clerk-react"
import { useEffect, useState } from "react"

export const useAuthFlow = () => {
  const { isSignedIn, getToken, signOut } = useAuth()
  const { user } = useUser()
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationComplete, setRegistrationComplete] = useState(false)

  const registerUserWithBackend = async (role) => {
    try {
      setIsRegistering(true);
      const token = await getToken();

      const response = await fetch("http://127.0.0.1:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });

      const data = await response.json();
      console.log("Backend response:", response.status, data);

      if (!response.ok) {

        if (response.status === 403 || response.status === 400) {
            console.log("Backend response:", response.status, data);
            await signOut();
            window.location.href = "/";
            localStorage.removeItem("selectedRole");
        }

        return;
      }

      if (response.ok) {
        console.log("Registration completed:", data);
        localStorage.removeItem("selectedRole");
        setRegistrationComplete(true);
        return { success: true, data };
      }
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: error.message };
    } finally {
      setIsRegistering(false);
    }
  };

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
