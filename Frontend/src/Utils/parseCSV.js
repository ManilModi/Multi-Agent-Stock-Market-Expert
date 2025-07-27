// src/utils/parseCSV.js

export default function parseCSV(text) {
    const rows = text.trim().split("\n");
    const headers = rows[0].split(",");
    return rows.slice(1).map((row) => {
      const cols = row.split(",");
      return {
        time: cols[0],
        open: parseFloat(cols[1]),
        high: parseFloat(cols[2]),
        low: parseFloat(cols[3]),
        close: parseFloat(cols[4]),
        volume: parseInt(cols[5]),
      };
    });
  }
  