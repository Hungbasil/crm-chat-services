import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db';
import authRoutes from './Routes/auth';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);



app.listen(port, () => {
  console.log(` Server đang chạy tại: http://localhost:${port}`);
});