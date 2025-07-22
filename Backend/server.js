// server.js
import express from 'express';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.route.js';
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(express.json());

app.use(cors({
    origin: 'http://localhost:5173',  // frontend origin
    credentials: true
  }));

// Clerk middleware
app.use(ClerkExpressWithAuth());

// API routes
app.use('/api/auth', authRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
  // Start server after DB is connected
  app.listen(5000, () => {
    console.log('Server running on http://127.0.0.1:5000');
  });
}).catch(err => {
  console.error('DB connection error:', err);
});
