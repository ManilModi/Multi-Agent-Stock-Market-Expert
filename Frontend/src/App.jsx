// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Register from "./components/Register";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import HomePage from "./components/Home";
import CandlestickChart from "./components/CandlestickChart";
import CompanyDetails from "./components/StockInsightsPanel";
import AIReports from "./components/AIReport";
import ForecastDashboard from "./components/ForecastDashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/live-chart" element={<CandlestickChart />} />
      <Route path="/financial-details" element={<CompanyDetails />} />
      <Route path="/ai-reports" element={<AIReports />} />
      <Route path="/forecast" element={<ForecastDashboard />} />
    </Routes>
  );
}

export default App;
