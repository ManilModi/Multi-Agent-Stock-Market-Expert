// server.js
import express from 'express';
import connectDB from './DB/db.js';
import cors from 'cors';
import dotenv from 'dotenv';
// import stockRoutes from './routes/stockRoutes.js';

dotenv.config();
const app = express();

connectDB();
app.use(cors());
app.use(express.json());

// app.use('/api', stockRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
