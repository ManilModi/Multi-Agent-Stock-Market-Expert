// src/components/Dashboard.jsx
import React from "react";
import { useUser } from "@clerk/clerk-react";
import LogoutButton from "./Logout";

const Dashboard = () => {
  const { isLoaded, user } = useUser();

  if (!isLoaded) {
    return <div className="text-center mt-10 text-gray-600">Loading...</div>;
  }

  return (
    <div className="p-10">
      <h1 className="text-2xl font-semibold">Welcome, {user.fullName}!</h1>
      <p className="text-gray-700 mt-2">Your email: {user.primaryEmailAddress.emailAddress}</p>
        <div className="mt-5">
            <LogoutButton />
            </div>
    </div>
  );
};

export default Dashboard;
