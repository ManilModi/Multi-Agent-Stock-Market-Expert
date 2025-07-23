// src/components/LogoutButton.jsx
import React from "react";
import { useClerk } from "@clerk/clerk-react";

const LogoutButton = () => {
  const { signOut } = useClerk();

  const handleLogout = () => {
    signOut();
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
    >
      Log Out
    </button>
  );
};

export default LogoutButton;
