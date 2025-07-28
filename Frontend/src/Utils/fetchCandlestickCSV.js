// src/utils/fetchCandlestickCSV.js
import parseCSV from "./parseCSV.js";

export const fetchCandlestickCSV = async (publicId) => {
  const response = await fetch(`/api/csv/${publicId}`);
  const csvText = await response.text();
  return parseCSV(csvText);
};
