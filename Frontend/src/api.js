// src/lib/api.js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Optional: only if you're using cookies/auth
});

export default api;
