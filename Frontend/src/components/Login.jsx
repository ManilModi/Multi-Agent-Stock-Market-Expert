// src/pages/Login.jsx
import { SignIn } from "@clerk/clerk-react";

const Login = () => (
  <div className="flex justify-center items-center min-h-screen bg-gray-100">
    <SignIn path="/login" routing="path" />
  </div>
);

export default Login;
