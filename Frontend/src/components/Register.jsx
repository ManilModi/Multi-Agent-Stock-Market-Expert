// src/pages/Register.jsx
import { SignUp } from "@clerk/clerk-react";

const Register = () => (
  <div className="flex justify-center items-center min-h-screen bg-gray-100">
    <SignUp path="/register" routing="path" />
  </div>
);

export default Register;
