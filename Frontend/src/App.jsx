// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Register from "./components/Register";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import HomePage from "./components/Home";
import CandlestickChart from "./components/CandlestickChart";
import CompanyDetails from "./components/StockInsightsPanel";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/live-chart" element={<CandlestickChart />} />
      <Route path="/financial-details" element={<CompanyDetails />} />
    </Routes>
  );
}

export default App;
