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
    const params = JSON.parse(message);

    try {
      // Step 1: Get CSV link from FastAPI
      const response = await axios.post('http://127.0.0.1:8000/candlesticks', params, {
        timeout: 45000  // in case FastAPI takes time
      });
      const csvUrl = response.data.message;
      console.log('CSV URL:', csvUrl);

      // Step 2: Continuously fetch CSV every 10 seconds
      const fetchAndSend = async () => {
        try {
          const csvRes = await axios.get(csvUrl);
          const records = csvParse.parse(csvRes.data, { columns: true });
          ws.send(JSON.stringify({ data: records }));
        } catch (err) {
          console.error('CSV Fetch Error:', err.message);
          ws.send(JSON.stringify({ error: 'Error fetching CSV data.' }));
        }
      };

      // Fetch once and set interval
      await fetchAndSend();
      const interval = setInterval(fetchAndSend, 10000); // every 10 sec

      // Clear interval on disconnect
      ws.on('close', () => {
        clearInterval(interval);
        console.log('Client disconnected');
      });

    } catch (err) {
      console.error('Error in WebSocket handler:', err.message);
      ws.send(JSON.stringify({ error: err.message }));
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
