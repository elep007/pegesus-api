import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dbConnect from './config/db';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import getStatusRoutes from './routes/getstatus';

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:4200';

// Middleware
app.use(cors({
  origin: "*",
  credentials: true,
}));

// Configure CORS options to only allow requests from the specified origin
// const corsOptions = {
//   //origin: API_URL,
//   origin: "*",
//   credentials: true, // Allow credentials (cookies) to be sent
//   // allowedHeaders: ["Content-Type", "Authorization", "x-access-token"],
//   // optionsSuccessStatus: 200,
// };
// app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

// Connect to database
dbConnect().catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/getstatus', getStatusRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

