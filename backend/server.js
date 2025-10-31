import cors from "cors";
import "dotenv/config";
import express from "express";

import connectDB from "./config/db.js";
import companyRoutes from "./routes/companyRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { updateApplicationScore } from "./controllers/userController.js";
import cookieParser from "cookie-parser";

// Initialize Express
const app = express();

// Connect to Database
await connectDB();

// Middlewares
app.use(cors({
  origin: ["http://localhost:5173", "https://lambda.amazonaws.com"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));
app.use(express.json());
app.use(cookieParser());


// Allow Lambda function calls without CORS restrictions
app.use('/api/users/update-application-score', cors({ origin: true }));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/jobs", jobRoutes);

//Port
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}...`));
