// server.js
import express from 'express';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.route.js';
import csvRoute from "./routes/csv.route.js";
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import dotenv from 'dotenv';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import axios from 'axios';
import * as csvParse from 'csv-parse/sync';

dotenv.config();

const app = express();
app.use(express.json());

app.use(cors({
  origin: 'http://localhost:5173',  // frontend origin
  credentials: true
}));

// Middleware
app.use(ClerkExpressWithAuth());
app.use("/api", csvRoute);
app.use('/api/auth', authRoutes);

// Start HTTP server
const PORT = 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});

// WebSocket server on top of HTTP
const wss = new WebSocketServer({ server });  // Attach to existing Express server

wss.on('connection', async (ws) => {
  console.log('Frontend connected to WebSocket');

  ws.on('message', async (message) => {
    const params = JSON.parse(message);  // Company/stock names

    try {
      // Call FastAPI backend to get CSV URL
      const response = await axios.post('http://127.0.0.1:8000/candlesticks/', params);
      const csvUrl = response.data.message;

      const fetchAndSend = async () => {
        try {
          const csvRes = await axios.get(csvUrl);
          const records = csvParse.parse(csvRes.data, { columns: true });
      
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ data: records }));
          }
        } catch (err) {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ error: 'Error fetching CSV data' }));
          }
        }
      };
      

      // Fetch once + set interval
      await fetchAndSend();
      const interval = setInterval(fetchAndSend, 60000);

      // 🔁 Clean up on close
      ws.on('close', () => {
        clearInterval(interval);
        console.log("Client disconnected");
      });

    } catch (err) {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ error: 'Error fetching CSV data' }));
      } else {
        console.log("WebSocket closed, not sending error");
      }
    }
    
  });
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('DB connection error:', err);
});
