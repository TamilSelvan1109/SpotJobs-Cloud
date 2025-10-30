import cors from "cors";
import "dotenv/config";
import express from "express";

import connectDB from "./config/db.js";
import "./config/instrument.js";
import companyRoutes from "./routes/companyRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import cookieParser from "cookie-parser";

// Initialize Express
const app = express();

// Connect to Database
await connectDB();

// Middlewares
app.use(cors({
  origin: ["http://localhost:5173"],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Routes
app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});

app.use("/api/users", userRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/jobs", jobRoutes);

//Port
const PORT = process.env.PORT || 5000;

app.listen(5000, "0.0.0.0", () => console.log("Server running..."));
